import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, firebaseFirestore, FIREBASE_PATHS } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { StorageKeys, FIREBASE_COLLECTIONS } from '../../constants';
import { ApiResponse, FirebaseTimestamp } from '../../types/global';
import { CacheEntry, DataCache } from '../../types/data';
import { checkConnection } from '../firebase';
import { logError } from '../../utils/logging';
import { sanitizeFirestoreData } from '../../utils/sanitize';

// Cache expiration time in milliseconds (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Maximum number of attempts for operations
const MAX_RETRY_ATTEMPTS = 3;

/**
 * BaseDatabaseService - foundational service class with shared database functionality
 */
export class BaseDatabaseService {
  protected isFirebaseAvailable: boolean;
  protected cache: DataCache;
  
  constructor() {
    this.isFirebaseAvailable = false;
    this.cache = {};
    this.initDatabase();
  }

  /**
   * Initialize the database connection
   */
  protected async initDatabase(): Promise<void> {
    try {
      // Initialize local storage
      await this.initializeStorage();
      
      // Check Firebase connection
      this.isFirebaseAvailable = await this.testFirebaseConnection();
    } catch (error) {
      console.error('Error initializing database:', error);
      logError('database_init_error', error);
      this.isFirebaseAvailable = false;
    }
  }

  /**
   * Initialize AsyncStorage with default values if needed
   */
  protected async initializeStorage(): Promise<void> {
    try {
      const keys = [
        StorageKeys.PROFILE, 
        StorageKeys.DAILY_WEIGHT_LOG, 
        StorageKeys.WORKOUT_HISTORY, 
        StorageKeys.WORKOUT_PLANS,
        StorageKeys.CACHE_METADATA
      ];
      
      const initPromises = keys.map(async (key) => {
        try {
          const value = await AsyncStorage.getItem(key);
          if (!value) {
            await AsyncStorage.setItem(key, JSON.stringify(key === StorageKeys.PROFILE ? {} : []));
          }
        } catch (error) {
          console.error(`Error initializing ${key}:`, error);
          logError('storage_init_error', { key, error });
        }
      });
      
      await Promise.all(initPromises);
    } catch (error) {
      console.error('Error in initializeStorage:', error);
      logError('storage_init_error', error);
    }
  }

  /**
   * Test the connection to Firebase
   * @returns True if Firebase is available
   */
  protected async testFirebaseConnection(): Promise<boolean> {
    try {
      return await checkConnection();
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      logError('firebase_connection_test_failed', error);
      return false;
    }
  }

  /**
   * Generic response creator with success status
   * @param data The data to include in the response
   * @returns A formatted API response with data
   */
  protected createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      success: true
    };
  }

  /**
   * Generic response creator with error status
   * @param code Error code
   * @param message Error message
   * @param details Additional error details (optional)
   * @returns A formatted API response with error
   */
  protected createErrorResponse<T>(code: string, message: string, details?: any): ApiResponse<T> {
    return {
      error: {
        code,
        message,
        details
      },
      success: false
    };
  }

  /**
   * Check online status before making a network request
   * @param online Current online status
   * @throws Error if offline
   */
  protected checkOnlineStatus(online: boolean): void {
    if (!online || !this.isFirebaseAvailable) {
      throw new Error('Offline: Cannot perform write operations offline.');
    }
  }

  /**
   * Safely store data in AsyncStorage
   * @param key Storage key
   * @param data Data to store
   */
  protected async saveToStorage<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to AsyncStorage (key: ${key}):`, error);
      logError('save_to_storage_error', { key, error });
      throw error;
    }
  }

  /**
   * Safely retrieve data from AsyncStorage
   * @param key Storage key
   * @returns Retrieved data or null if not found
   */
  protected async getFromStorage<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting from AsyncStorage (key: ${key}):`, error);
      logError('get_from_storage_error', { key, error });
      return null;
    }
  }

  /**
   * Merge local and remote data, with remote data taking precedence
   * @param local Local data
   * @param remote Remote data
   * @returns Merged data
   */
  protected mergeData<T>(local: T, remote: T): T {
    if (!remote) return local;
    if (!local) return remote;
    
    return {
      ...local,
      ...remote
    };
  }
  
  /**
   * Add data to the in-memory cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (defaults to CACHE_EXPIRATION)
   */
  protected addToCache<T>(key: string, data: T, ttl: number = CACHE_EXPIRATION): void {
    const now = Date.now();
    this.cache[key] = {
      data,
      timestamp: now,
      expires: now + ttl
    };
    
    // Schedule cache cleanup
    this.scheduleCacheCleanup();
  }
  
  /**
   * Get data from the in-memory cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  protected getFromCache<T>(key: string): T | null {
    const entry = this.cache[key] as CacheEntry<T>;
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.expires) {
      // Cache entry has expired
      delete this.cache[key];
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Invalidate a specific cache entry
   * @param key Cache key to invalidate
   */
  protected invalidateCache(key: string): void {
    delete this.cache[key];
  }
  
  /**
   * Invalidate all cache entries
   */
  protected invalidateAllCache(): void {
    this.cache = {};
  }
  
  /**
   * Schedule a background task to clean up expired cache entries
   */
  private scheduleCacheCleanup(): void {
    setTimeout(() => {
      this.cleanupCache();
    }, 60000); // Run cache cleanup every minute
  }
  
  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const key in this.cache) {
      if (this.cache[key].expires < now) {
        delete this.cache[key];
      }
    }
  }
  
  /**
   * Execute an operation with retry logic
   * @param operation Function to execute
   * @param retries Number of retries (default is MAX_RETRY_ATTEMPTS)
   * @returns Result of the operation
   */
  protected async withRetry<T>(operation: () => Promise<T>, retries: number = MAX_RETRY_ATTEMPTS): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        console.warn(`Operation failed (attempt ${attempt}/${retries}):`, error);
        lastError = error;
        
        // Only retry on network-related errors
        if (error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR') {
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
          continue;
        }
        
        // Other errors should fail immediately
        throw error;
      }
    }
    
    // If we've exhausted all retries
    throw lastError;
  }
  
  /**
   * Format any Firebase timestamp objects into ISO strings
   * @param data Data containing potential Firebase timestamp objects
   * @returns Same data with timestamps converted to strings
   */
  protected formatTimestamps<T>(data: T): T {
    if (!data) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.formatTimestamps(item)) as unknown as T;
    }
    
    if (typeof data === 'object' && data !== null) {
      const formatted: any = { ...data };
      
      for (const key in formatted) {
        const value = formatted[key];
        
        // Check if this is a Firebase Timestamp
        if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
          formatted[key] = value.toDate().toISOString();
        } else if (typeof value === 'object' && value !== null) {
          formatted[key] = this.formatTimestamps(value);
        }
      }
      
      return formatted;
    }
    
    return data;
  }
  
  /**
   * Safely execute a database operation with proper error handling
   * @param operation Database operation function
   * @param errorCode Error code for failures
   * @param errorMessage Error message for failures
   * @returns API response with result or error
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    errorCode: string,
    errorMessage: string
  ): Promise<ApiResponse<T>> {
    try {
      const result = await this.withRetry(operation);
      return this.createSuccessResponse(result);
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      logError(errorCode, error);
      return this.createErrorResponse<T>(errorCode, errorMessage, error);
    }
  }
  
  /**
   * Get data with caching strategy
   * @param cacheKey Cache key
   * @param fetchRemoteData Function to fetch remote data
   * @param fetchLocalData Function to fetch local data
   * @param mergeFunction Function to merge local and remote data
   * @param isOnline Current online status
   * @returns The data from cache, remote, or local source
   */
  protected async getDataWithCache<T>(
    cacheKey: string,
    fetchRemoteData: () => Promise<T>,
    fetchLocalData: () => Promise<T | null>,
    mergeFunction: (local: T, remote: T) => T,
    isOnline: boolean
  ): Promise<T> {
    // Check in-memory cache first
    const cachedData = this.getFromCache<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Try to get data from remote if online
    if (isOnline && this.isFirebaseAvailable) {
      try {
        const remoteData = await fetchRemoteData();
        
        // Sanitize data to prevent injection attacks
        const sanitizedData = sanitizeFirestoreData(remoteData as any) as T;
        
        // Format any Firebase timestamps
        const formattedData = this.formatTimestamps(sanitizedData);
        
        // Cache the remote data
        this.addToCache(cacheKey, formattedData);
        
        // Also update local storage
        const localData = await fetchLocalData();
        if (localData) {
          const mergedData = mergeFunction(localData, formattedData);
          await this.saveLocalData(cacheKey, mergedData);
        } else {
          await this.saveLocalData(cacheKey, formattedData);
        }
        
        return formattedData;
      } catch (error) {
        console.warn('Failed to fetch remote data, falling back to local:', error);
        logError('remote_data_fetch_error', { cacheKey, error });
      }
    }
    
    // Fall back to local storage
    const localData = await fetchLocalData();
    if (localData) {
      // Cache the local data
      this.addToCache(cacheKey, localData);
      return localData;
    }
    
    // No data available
    return null as unknown as T;
  }
  
  /**
   * Save data to local storage with key mapping
   * @param cacheKey Cache key
   * @param data Data to save
   */
  private async saveLocalData<T>(cacheKey: string, data: T): Promise<void> {
    // Map cache keys to storage keys
    const storageKeyMap: Record<string, string> = {
      'profile': StorageKeys.PROFILE,
      'weightLog': StorageKeys.DAILY_WEIGHT_LOG,
      'workouts': StorageKeys.WORKOUT_HISTORY,
      'plans': StorageKeys.WORKOUT_PLANS
    };
    
    // Extract the base key (remove user ID if present)
    const baseKey = cacheKey.split(':')[0];
    const storageKey = storageKeyMap[baseKey];
    
    if (storageKey) {
      await this.saveToStorage(storageKey, data);
    }
  }
}

export default BaseDatabaseService; 