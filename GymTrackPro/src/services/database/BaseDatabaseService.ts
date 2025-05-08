import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, firebaseFirestore, FIREBASE_PATHS } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { StorageKeys } from '../../constants';
import { ApiResponse, FirebaseTimestamp } from '../../types/global';
import { CacheEntry, DataCache } from '../../types/data';
import { checkConnection } from '../firebase';
import { logError } from '../../utils/logging';
import { sanitizeFirestoreData } from '../../utils/sanitize';
import { cacheService, createCacheKey } from '../CacheService';
import { timeFunction } from '../../utils/monitoring';
import { ValidationError, getValidator } from '../../utils/validation';

// Cache expiration time in milliseconds (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Maximum number of attempts for operations
const MAX_RETRY_ATTEMPTS = 3;

// Retry delay in milliseconds (exponential backoff)
const RETRY_BASE_DELAY = 500;

/**
 * BaseDatabaseService
 * 
 * This foundational service class provides shared database functionality across all database services.
 * It handles:
 * - Local storage (AsyncStorage) operations
 * - In-memory caching with expiration
 * - Firebase availability checking
 * - Data validation
 * - Error handling and response formatting
 * - Retry logic for network operations
 * - Offline/online sync mechanisms
 */
export class BaseDatabaseService {
  /** Flag indicating if Firebase is currently available */
  protected isFirebaseAvailable: boolean;
  
  /** In-memory cache for faster data access */
  protected cache: DataCache;
  
  /**
   * Creates a new instance of the BaseDatabaseService
   * Initializes local cache and Firebase connection
   */
  constructor() {
    this.isFirebaseAvailable = false;
    this.cache = {};
    this.initDatabase();
  }

  /**
   * Initialize the database connection and local storage
   * 
   * This asynchronous method:
   * 1. Initializes local storage with default values if needed
   * 2. Tests the connection to Firebase
   * 3. Sets up the service for operation
   */
  protected async initDatabase(): Promise<void> {
    try {
      // Initialize local storage first
      await this.initializeStorage();
      
      // Then check Firebase connection
      this.isFirebaseAvailable = await this.testFirebaseConnection();
      
      console.log(`Database service initialized. Firebase available: ${this.isFirebaseAvailable}`);
    } catch (error) {
      console.error('Error initializing database:', error);
      logError('database_init_error', error);
      this.isFirebaseAvailable = false;
    }
  }

  /**
   * Initialize AsyncStorage with default values if needed
   * 
   * This ensures that all required storage keys exist with appropriate
   * default values before any operations are performed
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
      
      // Create an array of promises for parallel execution
      const initPromises = keys.map(async (key) => {
        try {
          const value = await AsyncStorage.getItem(key);
          // If key doesn't exist, initialize with empty value
          if (!value) {
            await AsyncStorage.setItem(key, JSON.stringify(key === StorageKeys.PROFILE ? {} : []));
          }
        } catch (error) {
          console.error(`Error initializing ${key}:`, error);
          logError('storage_init_error', { key, error });
        }
      });
      
      // Execute all initialization promises in parallel
      await Promise.all(initPromises);
    } catch (error) {
      console.error('Error in initializeStorage:', error);
      logError('storage_init_error', error);
    }
  }

  /**
   * Test the connection to Firebase
   * 
   * This method attempts to connect to Firebase and check if
   * the service is available for read/write operations
   * 
   * @returns True if Firebase is available, false otherwise
   */
  protected async testFirebaseConnection(): Promise<boolean> {
    try {
      return await timeFunction('firebase_connection_test', async () => {
        return await checkConnection();
      }, 'database');
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      logError('firebase_connection_test_failed', error);
      return false;
    }
  }

  /**
   * Creates a formatted API response with success status
   * 
   * @template T - The type of data in the response
   * @param data - The data to include in the response
   * @returns A standardized API response object with the data
   */
  protected createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      success: true
    };
  }

  /**
   * Creates a formatted API response with error status
   * 
   * @template T - The type of data that would have been returned
   * @param code - A unique error code
   * @param message - Human-readable error message
   * @param details - Additional error details (optional)
   * @returns A standardized API response object with error information
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
   * Checks if the app is online before making a network request
   * 
   * This method verifies both the provided online status flag and
   * the last known Firebase availability status
   * 
   * @param online - Current online status from NetworkState
   * @throws Error if offline or Firebase is unavailable
   */
  protected checkOnlineStatus(online: boolean): void {
    if (!online || !this.isFirebaseAvailable) {
      throw new Error('Offline: Cannot perform write operations offline.');
    }
  }

  /**
   * Safely store data in AsyncStorage with error handling
   * 
   * @template T - The type of data to store
   * @param key - AsyncStorage key
   * @param data - Data to store
   * @throws Error if storage operation fails
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
   * Safely retrieve data from AsyncStorage with error handling
   * 
   * @template T - The expected type of the retrieved data
   * @param key - AsyncStorage key
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
   * Merge local and remote data intelligently
   * 
   * This method handles data conflicts between local and remote sources
   * It uses the following strategy:
   * 1. If remote data doesn't exist, use local data
   * 2. If local data doesn't exist, use remote data
   * 3. If both exist, merge them with remote data taking precedence for overlapping fields
   * 
   * @template T - The type of data to merge
   * @param local - Local data (from AsyncStorage)
   * @param remote - Remote data (from Firestore)
   * @returns Merged data object
   */
  protected mergeData<T>(local: T, remote: T): T {
    if (!remote) return local;
    if (!local) return remote;
    
    // For complex objects, merge properties
    return {
      ...local,
      ...remote
    };
  }
  
  /**
   * Add data to the cache service with dependency tracking
   * 
   * @template T - Type of data to cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (defaults to CACHE_EXPIRATION)
   * @param dependencies - Other cache keys this entry depends on
   */
  protected addToCache<T>(
    key: string, 
    data: T, 
    ttl: number = CACHE_EXPIRATION,
    dependencies?: string[]
  ): void {
    cacheService.set(key, data, {
      ttl,
      persist: true,
      dependencies
    });
  }
  
  /**
   * Get data from the cache service
   * 
   * @template T - Expected type of cached data
   * @param key - Cache key
   * @returns Cached data or null if not found or expired
   */
  protected getFromCache<T>(key: string): T | null {
    return cacheService.get<T>(key);
  }
  
  /**
   * Invalidate a specific cache entry
   * 
   * @param key - Cache key to invalidate
   */
  protected invalidateCache(key: string): void {
    cacheService.remove(key);
  }
  
  /**
   * Invalidate all cache entries
   * Useful when major data changes occur
   */
  protected invalidateAllCache(): void {
    cacheService.clear();
  }
  
  /**
   * Executes an operation with automatic retries on failure
   * 
   * Uses exponential backoff strategy to retry failed operations:
   * - First retry after 500ms
   * - Second retry after 1500ms
   * - Third retry after 3500ms
   * 
   * @template T - Return type of the operation
   * @param operation - Async function to execute
   * @param retries - Maximum number of retry attempts
   * @returns Result of the operation if successful
   * @throws Last encountered error if all retries fail
   */
  protected async withRetry<T>(operation: () => Promise<T>, retries: number = MAX_RETRY_ATTEMPTS): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry if we've exhausted all attempts
        if (attempt === retries) {
          break;
        }
        
        // Don't retry for validation errors or specific types that won't benefit from retrying
        if (error instanceof ValidationError) {
          throw error;
        }
        
        // Calculate exponential backoff delay: 500ms, 1500ms, 3500ms, etc.
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt) + Math.random() * 500;
        console.log(`Operation failed, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries})`, error);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we've exhausted all retries, throw the last error
    logError('operation_max_retries_exceeded', lastError);
    throw lastError;
  }

  /**
   * Format timestamp fields in data objects
   * 
   * Converts Firebase Timestamp objects to ISO string format
   * for consistent handling across the application
   * 
   * @template T - Type of data containing timestamps
   * @param data - Data object that may contain timestamp fields
   * @returns Data with formatted timestamps
   */
  protected formatTimestamps<T>(data: T): T {
    if (!data) return data;
    
    // Use sanitizeFirestoreData for consistent handling
    return sanitizeFirestoreData<T>(data);
  }
  
  /**
   * Safely execute a database operation with proper error handling
   * 
   * This is a wrapper that:
   * 1. Attempts to execute the provided operation
   * 2. Returns a success response if successful
   * 3. Returns a formatted error response if it fails
   * 4. Logs the error for monitoring
   * 
   * @template T - Expected return type of the operation
   * @param operation - Async database operation to execute
   * @param errorCode - Error code to use if operation fails
   * @param errorMessage - Error message to use if operation fails
   * @returns ApiResponse containing either the data or error information
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    errorCode: string,
    errorMessage: string
  ): Promise<ApiResponse<T>> {
    try {
      const data = await operation();
      return this.createSuccessResponse(data);
    } catch (error) {
      console.error(errorMessage, error);
      logError(errorCode, { error, message: errorMessage });
      
      // Use original error message if available, otherwise use default
      const message = error instanceof Error ? error.message : errorMessage;
      return this.createErrorResponse<T>(errorCode, message, error);
    }
  }
  
  /**
   * Complex data retrieval with cache, local storage, and remote fetching
   * 
   * This method implements a sophisticated data access strategy:
   * 1. Check in-memory cache first for fastest access
   * 2. If online and data not in cache or force refresh:
   *    - Fetch from remote source (Firestore)
   *    - Update local storage
   *    - Update in-memory cache
   * 3. If offline or remote fetch fails:
   *    - Fall back to local storage
   * 4. If both remote and local fail, return null
   * 
   * This ensures data is available offline while staying up-to-date
   * when online, balancing performance and freshness.
   * 
   * @template T - Type of data to retrieve
   * @param cacheKey - Key for cache and dependencies
   * @param fetchRemoteData - Function to fetch data from remote source
   * @param fetchLocalData - Function to fetch data from local storage
   * @param mergeFunction - Function to merge local and remote data
   * @param isOnline - Current online status
   * @returns Retrieved data or null if not found
   */
  protected async getDataWithCache<T>(
    cacheKey: string,
    fetchRemoteData: () => Promise<T>,
    fetchLocalData: () => Promise<T | null>,
    mergeFunction: (local: T, remote: T) => T,
    isOnline: boolean
  ): Promise<T> {
    // Try cache first (fastest)
    let data = this.getFromCache<T>(cacheKey);
    if (data) {
      console.log(`Cache hit for ${cacheKey}`);
      return data;
    }
    
    console.log(`Cache miss for ${cacheKey}, fetching data...`);
    
    // If online, try to fetch remote data
    let remoteData: T | null = null;
    let localData: T | null = null;
    
    if (isOnline && this.isFirebaseAvailable) {
      try {
        // Fetch from remote source
        remoteData = await timeFunction('remote_data_fetch', 
          async () => await this.withRetry(fetchRemoteData),
          'database'
        );
        
        // Save to local storage for offline access
        if (remoteData) {
          this.saveLocalData(cacheKey, remoteData);
        }
      } catch (error) {
        console.warn(`Failed to fetch remote data for ${cacheKey}:`, error);
        logError('remote_data_fetch_error', { cacheKey, error });
        // Continue to try local data
      }
    }
    
    // If remote data not available or offline, use local storage
    if (!remoteData) {
      try {
        localData = await timeFunction('local_data_fetch', 
          async () => await fetchLocalData(),
          'database'
        );
      } catch (error) {
        console.warn(`Failed to fetch local data for ${cacheKey}:`, error);
        logError('local_data_fetch_error', { cacheKey, error });
      }
    }
    
    // Handle different data scenarios
    if (remoteData && localData) {
      // Have both - merge with remote taking precedence
      data = mergeFunction(localData, remoteData);
    } else if (remoteData) {
      // Only have remote data
      data = remoteData;
    } else if (localData) {
      // Only have local data
      data = localData;
    } else {
      // No data available
      return null as unknown as T;
    }
    
    // Cache the result for future use
    if (data) {
      this.addToCache(cacheKey, data);
    }
    
    return data;
  }
  
  /**
   * Save data to local storage and update cache
   * 
   * Helper method that:
   * 1. Determines the appropriate storage key based on data type
   * 2. Saves the data to AsyncStorage
   * 3. Updates the in-memory cache
   * 
   * @template T - Type of data to save
   * @param cacheKey - Key to use for caching
   * @param data - Data to save
   */
  private async saveLocalData<T>(cacheKey: string, data: T): Promise<void> {
    try {
      // Determine storage key from cache key
      const storageKey = this.getStorageKeyFromCacheKey(cacheKey);
      
      if (storageKey) {
        await this.saveToStorage(storageKey, data);
        
        // Also update cache
        this.addToCache(cacheKey, data);
      }
    } catch (error) {
      console.error(`Error saving local data for ${cacheKey}:`, error);
      logError('save_local_data_error', { cacheKey, error });
      // Don't re-throw - this is a background operation
    }
  }
  
  /**
   * Extract storage key from cache key
   * Simple helper to map cache keys to storage keys
   * @param cacheKey Cache key
   * @returns Storage key or undefined
   */
  private getStorageKeyFromCacheKey(cacheKey: string): string | undefined {
    if (cacheKey.includes('profile')) return StorageKeys.PROFILE;
    if (cacheKey.includes('weightLog')) return StorageKeys.DAILY_WEIGHT_LOG;
    if (cacheKey.includes('workout')) return StorageKeys.WORKOUT_HISTORY;
    if (cacheKey.includes('plan')) return StorageKeys.WORKOUT_PLANS;
    return undefined;
  }
  
  /**
   * Validate data using appropriate validator for the data type
   * 
   * Ensures that data meets requirements before storage or transmission
   * 
   * @template T - Type of data to validate
   * @param data - Data to validate
   * @param type - Data type for selecting appropriate validator
   * @returns Validated data if valid
   * @throws ValidationError if validation fails
   */
  protected validateData<T extends Record<string, any>>(
    data: T,
    type: 'profile' | 'workout' | 'weightLog' | 'exercise' | 'plan' | 'friend' | 'friendRequest'
  ): T {
    try {
      // Get the appropriate validator function
      const validator = getValidator(type);
      
      // Validate the data
      return validator(data);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error; // Re-throw validation errors
      }
      
      // For unexpected errors, wrap in ValidationError
      throw new ValidationError(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Execute a write operation with data validation
   * 
   * This method:
   * 1. Validates the data using the appropriate validator
   * 2. Executes the write operation with the validated data
   * 3. Handles any validation errors
   * 
   * @template T - Type of data to validate and write
   * @template R - Return type of the write operation
   * @param data - Data to validate and write
   * @param dataType - Type of data for selecting appropriate validator
   * @param writeOperation - Operation to execute with validated data
   * @returns Result of the write operation
   * @throws ValidationError if validation fails
   */
  protected async executeValidatedWrite<T extends Record<string, any>, R>(
    data: T,
    dataType: 'profile' | 'workout' | 'weightLog' | 'exercise' | 'plan' | 'friend' | 'friendRequest',
    writeOperation: (validatedData: T) => Promise<R>
  ): Promise<R> {
    // Validate data first
    const validatedData = this.validateData(data, dataType);
    
    // Execute write operation with validated data
    return await writeOperation(validatedData);
  }
}

export default BaseDatabaseService; 