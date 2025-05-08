/**
 * Enhanced Cache Service
 * Provides sophisticated caching with selective invalidation and persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../utils/logging';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

export interface CacheOptions {
  ttl?: number;          // Time-to-live in milliseconds
  persist?: boolean;     // Whether to persist in AsyncStorage
  dependencies?: string[]; // Cache keys that this entry depends on
}

const CACHE_STORAGE_KEY = 'app_cache';
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CACHE_PERSIST_INTERVAL = 60 * 1000; // 1 minute

/**
 * Advanced caching service with memory and persistent storage
 */
class CacheService {
  private memoryCache: Record<string, CacheEntry<any>>;
  private dependencies: Record<string, Set<string>>;
  private cleanupTimer: ReturnType<typeof setInterval> | null;
  private persistTimer: ReturnType<typeof setInterval> | null;
  private persistQueue: Set<string>;
  private initialLoadPromise: Promise<void> | null;

  constructor() {
    this.memoryCache = {};
    this.dependencies = {};
    this.cleanupTimer = null;
    this.persistTimer = null;
    this.persistQueue = new Set();
    this.initialLoadPromise = null;
    
    this.initialize();
  }

  /**
   * Initialize the cache service
   */
  private async initialize(): Promise<void> {
    // Only run initialization once
    if (this.initialLoadPromise) {
      return this.initialLoadPromise;
    }
    
    this.initialLoadPromise = this.loadPersistedCache();
    
    try {
      await this.initialLoadPromise;
      
      // Setup cleanup timer
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpiredEntries();
      }, CACHE_CLEANUP_INTERVAL);
      
      // Setup persist timer
      this.persistTimer = setInterval(() => {
        this.persistQueuedEntries();
      }, CACHE_PERSIST_INTERVAL);
      
    } catch (error) {
      logError('cache_init_error', error);
      console.error('Failed to initialize cache:', error);
    }
  }

  /**
   * Load previously persisted cache from AsyncStorage
   */
  private async loadPersistedCache(): Promise<void> {
    try {
      const persistedCache = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
      if (persistedCache) {
        const parsed = JSON.parse(persistedCache) as Record<string, CacheEntry<any>>;
        
        // Filter out expired entries
        const now = Date.now();
        Object.entries(parsed).forEach(([key, entry]) => {
          if (entry.expires > now) {
            this.memoryCache[key] = entry;
          }
        });
      }
    } catch (error) {
      logError('cache_load_error', error);
      console.error('Failed to load persisted cache:', error);
      // Continue with empty cache
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  public get<T>(key: string): T | null {
    const entry = this.memoryCache[key];
    const now = Date.now();
    
    if (entry && entry.expires > now) {
      return entry.data;
    }
    
    // Remove expired entry
    if (entry) {
      this.remove(key);
    }
    
    return null;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param options Caching options
   */
  public set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const ttl = options.ttl ?? DEFAULT_TTL;
    
    this.memoryCache[key] = {
      data,
      timestamp: now,
      expires: now + ttl
    };
    
    // Register dependencies if specified
    if (options.dependencies && options.dependencies.length > 0) {
      options.dependencies.forEach(dep => {
        if (!this.dependencies[dep]) {
          this.dependencies[dep] = new Set();
        }
        this.dependencies[dep].add(key);
      });
    }
    
    // Add to persist queue if needed
    if (options.persist) {
      this.persistQueue.add(key);
    }
  }

  /**
   * Remove a value from the cache
   * @param key Cache key
   */
  public remove(key: string): void {
    delete this.memoryCache[key];
    
    // Remove any dependencies
    if (this.dependencies[key]) {
      // Invalidate dependent caches
      this.dependencies[key].forEach(depKey => {
        delete this.memoryCache[depKey];
      });
      
      // Clean up dependency tracking
      delete this.dependencies[key];
    }
    
    // Remove from persist queue
    this.persistQueue.delete(key);
  }

  /**
   * Clear all cached values
   */
  public clear(): void {
    this.memoryCache = {};
    this.dependencies = {};
    this.persistQueue.clear();
    
    // Also clear persisted cache
    AsyncStorage.removeItem(CACHE_STORAGE_KEY).catch(error => {
      logError('cache_clear_error', error);
      console.error('Failed to clear persisted cache:', error);
    });
  }

  /**
   * Clear cache entries by pattern
   * @param pattern Regex pattern to match against keys
   */
  public clearPattern(pattern: RegExp): void {
    const keys = Object.keys(this.memoryCache).filter(key => pattern.test(key));
    
    keys.forEach(key => {
      this.remove(key);
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys = Object.keys(this.memoryCache).filter(key => 
      this.memoryCache[key].expires <= now
    );
    
    expiredKeys.forEach(key => {
      this.remove(key);
    });
  }

  /**
   * Persist queued cache entries to AsyncStorage
   */
  private async persistQueuedEntries(): Promise<void> {
    if (this.persistQueue.size === 0) {
      return;
    }
    
    try {
      // Create a subset of cache with only the items to persist
      const toPersist: Record<string, CacheEntry<any>> = {};
      
      this.persistQueue.forEach(key => {
        if (this.memoryCache[key]) {
          toPersist[key] = this.memoryCache[key];
        }
      });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(toPersist));
      
      // Clear the queue after successful persist
      this.persistQueue.clear();
    } catch (error) {
      logError('cache_persist_error', error);
      console.error('Failed to persist cache:', error);
      // Keep items in queue to retry next time
    }
  }

  /**
   * Manually trigger persisting the cache
   */
  public async forcePersist(): Promise<void> {
    await this.persistQueuedEntries();
  }

  /**
   * Check if a key exists and is not expired
   * @param key Cache key
   * @returns Whether the key exists and is not expired
   */
  public has(key: string): boolean {
    const entry = this.memoryCache[key];
    return entry !== undefined && entry.expires > Date.now();
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getStats(): { 
    totalEntries: number; 
    memoryUsage: number; 
    persistQueueSize: number;
  } {
    const totalEntries = Object.keys(this.memoryCache).length;
    
    // Estimate memory usage (very rough estimate)
    let memoryUsage = 0;
    Object.values(this.memoryCache).forEach(entry => {
      memoryUsage += JSON.stringify(entry).length * 2; // Unicode chars = 2 bytes
    });
    
    return {
      totalEntries,
      memoryUsage, // in bytes
      persistQueueSize: this.persistQueue.size
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    
    // Force one last persist
    this.forcePersist().catch(error => {
      logError('cache_destroy_error', error);
      console.error('Failed to persist cache during destroy:', error);
    });
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Helper function to create cache key from parts
export const createCacheKey = (baseName: string, ...parts: (string | number | undefined)[]): string => {
  const validParts = parts.filter(part => part !== undefined && part !== null);
  return `${baseName}:${validParts.join(':')}`;
}; 