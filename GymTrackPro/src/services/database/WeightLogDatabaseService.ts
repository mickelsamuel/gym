import {serverTimestamp} from 'firebase/firestore';
import { BaseDatabaseService } from './BaseDatabaseService';
import {FIREBASE_PATHS, firebaseFirestore} from '../firebase';
import { WeightLogEntry, ApiResponse } from '../../types/mergedTypes';
import { StorageKeys } from '../../constants';
import { validateNumber, isValidDate, validateWeightLogEntry } from '../../utils/sanitize';
import { logError } from '../../utils/logging';
;
/**
 * Service for weight log related database operations
 */
export class WeightLogDatabaseService extends BaseDatabaseService {
  // Cache key for weight log
  private readonly WEIGHT_LOG_CACHE_KEY = 'weightLog';
  /**
   * Add a new weight log entry
   * @param entry Weight log entry data
   * @param isOnline Current online status
   * @returns API response with the saved entry and updated log
   */
  async logWeight(entry: Partial<WeightLogEntry>, isOnline: boolean): Promise<ApiResponse<WeightLogEntry[]>> {
    return this.executeOperation(
      async () => {
        // Validate entry
        if (!entry.userId) {
          throw new Error('User ID is required');
        }
        if (!entry.date || !isValidDate(entry.date)) {
          throw new Error('Valid date is required');
        }
        const weight = validateNumber(entry.weight, 0);
        if (weight === null) {
          throw new Error('Weight must be a positive number');
        }
        // Create valid entry
        const newEntry: WeightLogEntry = {
          userId: entry.userId,
          weight,
          date: entry.date,
          notes: entry.notes || '',
          ...(entry.id && { id: entry.id })
        };
        // Validate the entry
        const validationErrors = validateWeightLogEntry(newEntry);
        if (validationErrors.length > 0) {
          throw new Error(`Weight log entry validation failed: ${validationErrors.join(', ')}`);
        }
        // Update local storage
        const localLogs = await this.updateLocalWeightLog(newEntry);
        // Sync with Firestore if online
        if (isOnline && this.isFirebaseAvailable) {
          try {
            this.checkOnlineStatus(isOnline);
            // Create a subcollection path
            const subcollectionPath = `${FIREBASE_PATHS.USERS}/${entry.userId}/${FIREBASE_PATHS.USER_SUBCOLLECTIONS.WEIGHT_LOG}`;
            // Format date to use as document ID if needed
            const formattedDate = entry.date.replace(/[^0-9]/g, '');
            // If entry has ID, use it, otherwise use the formatted date
            const docId = entry.id || formattedDate;
            // Prepare entry data without userId (stored in path)
            const { userId, ...entryData } = newEntry;
            // Add timestamps
            const docData: any = {
              ...entryData,
              updatedAt: serverTimestamp()
            };
            // Only add createdAt for new entries
            if (!entry.id) {
              docData.createdAt = serverTimestamp();
            }
            // Save to Firestore
            await firebaseFirestore.setDocument(subcollectionPath, docId, docData);
            // If it's a new entry, update the entry with the new ID
            if (!entry.id) {
              const updatedEntry = { ...newEntry, id: docId };
              await this.updateLocalWeightLog(updatedEntry);
            }
          } catch (error) {
            console.error('Failed to save weight log to Firestore:', error);
            logError('sync_weight_log_error', { entry, error });
            // Continue with local storage only
          }
        }
        // Invalidate cache
        this.invalidateCache(`${this.WEIGHT_LOG_CACHE_KEY}:${entry.userId}`);
        return localLogs;
      },
      'log_weight_error',
      'Failed to save weight log entry'
    );
  }
  /**
   * Get all weight log entries for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with weight log entries
   */
  async getWeightLog(userId: string, isOnline: boolean): Promise<ApiResponse<WeightLogEntry[]>> {
    return this.executeOperation(
      async () => {
        if (!userId) {
          throw new Error('User ID is required');
        }
        const cacheKey = `${this.WEIGHT_LOG_CACHE_KEY}:${userId}`;
        // Try to get from cache first
        const cachedLogs = this.getFromCache<WeightLogEntry[]>(cacheKey);
        if (cachedLogs) {
          return cachedLogs;
        }
        // Get local logs
        const localLogs = await this.getFromStorage<WeightLogEntry[]>(StorageKeys.DAILY_WEIGHT_LOG) || [];
        const userLocalLogs = localLogs.filter(log => log.userId === userId);
        // If online, try to get from Firestore
        if (isOnline && this.isFirebaseAvailable) {
          try {
            const subcollectionPath = `${FIREBASE_PATHS.USERS}/${userId}/${FIREBASE_PATHS.USER_SUBCOLLECTIONS.WEIGHT_LOG}`;
            const remoteLogs = await firebaseFirestore.getCollection<WeightLogEntry>(subcollectionPath);
            // Merge with local logs and save locally
            const mergedLogs = this.mergeWeightLogs(userLocalLogs, remoteLogs);
            // Update local storage with all logs
            const otherUserLogs = localLogs.filter(log => log.userId !== userId);
            await this.saveToStorage(StorageKeys.DAILY_WEIGHT_LOG, [...otherUserLogs, ...mergedLogs]);
            // Cache the logs
            this.addToCache(cacheKey, mergedLogs);
            return mergedLogs;
          } catch (error) {
            console.error('Error fetching weight logs from Firestore:', error);
            logError('fetch_weight_log_error', { userId, error });
            // Continue with local storage
          }
        }
        // Cache the logs
        this.addToCache(cacheKey, userLocalLogs);
        // Return local logs
        return userLocalLogs;
      },
      'get_weight_log_error',
      'Failed to retrieve weight log entries'
    );
  }
  /**
   * Update a weight log entry
   * @param entryId Entry ID
   * @param userId User ID
   * @param data Updated weight log data
   * @param isOnline Current online status
   * @returns API response with updated entry
   */
  async updateWeightLogEntry(
    entryId: string, 
    userId: string,
    data: Partial<WeightLogEntry>,
    isOnline: boolean
  ): Promise<ApiResponse<WeightLogEntry>> {
    return this.executeOperation(
      async () => {
        if (!entryId || !userId) {
          throw new Error('Entry ID and user ID are required');
        }
        // Get current entries
        const logsResponse = await this.getWeightLog(userId, isOnline);
        if (!logsResponse.success || !logsResponse.data) {
          throw new Error('Failed to retrieve weight log entries');
        }
        // Find the entry to update
        const currentEntry = logsResponse.data.find(entry => entry.id === entryId);
        if (!currentEntry) {
          throw new Error(`Weight log entry with ID ${entryId} not found`);
        }
        // Create updated entry
        const updatedEntry: WeightLogEntry = {
          ...currentEntry,
          ...data,
          userId, // Ensure userId is preserved
          id: entryId // Ensure ID is preserved
        };
        // Validate
        const validationErrors = validateWeightLogEntry(updatedEntry);
        if (validationErrors.length > 0) {
          throw new Error(`Weight log entry validation failed: ${validationErrors.join(', ')}`);
        }
        // Update locally
        await this.updateLocalWeightLog(updatedEntry);
        // Update in Firestore if online
        if (isOnline && this.isFirebaseAvailable) {
          try {
            this.checkOnlineStatus(isOnline);
            const subcollectionPath = `${FIREBASE_PATHS.USERS}/${userId}/${FIREBASE_PATHS.USER_SUBCOLLECTIONS.WEIGHT_LOG}`;
            // Prepare entry data without userId (stored in path)
            const { userId: uid, id, ...entryData } = updatedEntry;
            // Add updated timestamp
            const updateData = {
              ...entryData,
              updatedAt: serverTimestamp()
            };
            // Update in Firestore
            await firebaseFirestore.updateDocument(subcollectionPath, entryId, updateData);
          } catch (error) {
            console.error('Failed to update weight log in Firestore:', error);
            logError('update_weight_log_error', { entryId, userId, error });
            // Continue with local storage only
          }
        }
        // Invalidate cache
        this.invalidateCache(`${this.WEIGHT_LOG_CACHE_KEY}:${userId}`);
        return updatedEntry;
      },
      'update_weight_log_error',
      'Failed to update weight log entry'
    );
  }
  /**
   * Delete a weight log entry
   * @param entryId Entry ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async deleteWeightLogEntry(
    entryId: string,
    userId: string,
    isOnline: boolean
  ): Promise<ApiResponse<boolean>> {
    return this.executeOperation(
      async () => {
        if (!entryId || !userId) {
          throw new Error('Entry ID and user ID are required');
        }
        // Get current entries
        const logs = await this.getFromStorage<WeightLogEntry[]>(StorageKeys.DAILY_WEIGHT_LOG) || [];
        // Find the entry index
        const entryIndex = logs.findIndex(entry => entry.id === entryId && entry.userId === userId);
        if (entryIndex === -1) {
          throw new Error(`Weight log entry with ID ${entryId} not found`);
        }
        // Remove from local storage
        logs.splice(entryIndex, 1);
        await this.saveToStorage(StorageKeys.DAILY_WEIGHT_LOG, logs);
        // Delete from Firestore if online
        if (isOnline && this.isFirebaseAvailable) {
          try {
            this.checkOnlineStatus(isOnline);
            const subcollectionPath = `${FIREBASE_PATHS.USERS}/${userId}/${FIREBASE_PATHS.USER_SUBCOLLECTIONS.WEIGHT_LOG}`;
            // Delete from Firestore
            await firebaseFirestore.deleteDocument(subcollectionPath, entryId);
          } catch (error) {
            console.error('Failed to delete weight log from Firestore:', error);
            logError('delete_weight_log_error', { entryId, userId, error });
            // Continue with local storage only
          }
        }
        // Invalidate cache
        this.invalidateCache(`${this.WEIGHT_LOG_CACHE_KEY}:${userId}`);
        return true;
      },
      'delete_weight_log_error',
      'Failed to delete weight log entry'
    );
  }
  /**
   * Synchronize weight log data for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns True if synchronization was successful
   */
  async syncWeightLogData(userId: string, isOnline: boolean): Promise<boolean> {
    try {
      if (!userId || !isOnline || !this.isFirebaseAvailable) {
        return false;
      }
      console.log("Starting weight log sync for user:", userId);
      // Get local logs
      const localLogs = await this.getFromStorage<WeightLogEntry[]>(StorageKeys.DAILY_WEIGHT_LOG) || [];
      const userLocalLogs = localLogs.filter(log => log.userId === userId);
      console.log("Local weight logs to sync:", userLocalLogs);
      // Get remote logs
      const subcollectionPath = `${FIREBASE_PATHS.USERS}/${userId}/${FIREBASE_PATHS.USER_SUBCOLLECTIONS.WEIGHT_LOG}`;
      console.log("Syncing to path:", subcollectionPath);
      let remoteLogs: WeightLogEntry[] = [];
      try {
        remoteLogs = await firebaseFirestore.getCollection<WeightLogEntry>(subcollectionPath);
        console.log("Remote logs:", remoteLogs);
      } catch (error) {
        console.error("Error fetching remote logs:", error);
        // Continue with empty remote logs
      }
      // Merge logs
      const mergedLogs = this.mergeWeightLogs(userLocalLogs, remoteLogs);
      console.log("Merged logs:", mergedLogs);
      // Update local storage
      const otherUserLogs = localLogs.filter(log => log.userId !== userId);
      await this.saveToStorage(StorageKeys.DAILY_WEIGHT_LOG, [...otherUserLogs, ...mergedLogs]);
      // Push all local logs that don't exist remotely
      for (const log of userLocalLogs) {
        // Ensure the log has an ID
        const docId = log.id || log.date.replace(/[^0-9]/g, '');
        try {
          // Prepare log data without userId
          const { userId: uid, ...logData } = log;
          // Add timestamps
          const docData: any = {
            ...logData,
            id: docId, // Ensure ID is included
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          console.log(`Saving weight log to Firestore: ${subcollectionPath}/${docId}`, docData);
          // Save to Firestore
          await firebaseFirestore.setDocument(subcollectionPath, docId, docData);
        } catch (error) {
          console.error(`Error syncing weight log ${docId}:`, error);
        }
      }
      // Invalidate cache
      this.invalidateCache(`${this.WEIGHT_LOG_CACHE_KEY}:${userId}`);
      return true;
    } catch (error) {
      console.error('Error syncing weight log data:', error);
      logError('sync_weight_log_data_error', { userId, error });
      return false;
    }
  }
  /**
   * Update local weight log with new entry
   * @param entry New weight log entry
   * @returns Updated weight log entries
   */
  private async updateLocalWeightLog(entry: WeightLogEntry): Promise<WeightLogEntry[]> {
    try {
      // Get existing logs
      const logs = await this.getFromStorage<WeightLogEntry[]>(StorageKeys.DAILY_WEIGHT_LOG) || [];
      // Find if there's an existing entry for the same date and user
      const existingIndex = logs.findIndex(log => 
        log.date === entry.date && log.userId === entry.userId
      );
      // Calculate weight change if possible
      const userLogs = logs.filter(log => log.userId === entry.userId);
      userLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      // Find the most recent log before the current entry date
      const previousLog = userLogs.find(log => 
        new Date(log.date).getTime() < new Date(entry.date).getTime()
      );
      if (previousLog) {
        entry.change = entry.weight - previousLog.weight;
      }
      // Update or add new entry
      if (existingIndex >= 0) {
        logs[existingIndex] = { ...logs[existingIndex], ...entry };
      } else {
        logs.push(entry);
      }
      // Sort by date (newest first)
      logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      // Save to storage
      await this.saveToStorage(StorageKeys.DAILY_WEIGHT_LOG, logs);
      // Return only the user's logs
      return logs.filter(log => log.userId === entry.userId);
    } catch (error) {
      console.error('Error updating local weight log:', error);
      throw error;
    }
  }
  /**
   * Merge local and remote weight logs
   * @param localLogs Local weight log entries
   * @param remoteLogs Remote weight log entries
   * @returns Merged weight log entries
   */
  private mergeWeightLogs(localLogs: WeightLogEntry[], remoteLogs: WeightLogEntry[]): WeightLogEntry[] {
    // Create a map of date to entry for faster lookups
    const logMap = new Map<string, WeightLogEntry>();
    // Add all remote logs first (they take precedence)
    remoteLogs.forEach(log => {
      logMap.set(log.date, log);
    });
    // Add local logs if no remote entry exists for the date
    localLogs.forEach(log => {
      if (!logMap.has(log.date)) {
        logMap.set(log.date, log);
      }
    });
    // Convert map back to array and sort
    const mergedLogs = Array.from(logMap.values());
    mergedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return mergedLogs;
  }
} 