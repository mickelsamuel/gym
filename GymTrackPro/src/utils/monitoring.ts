/**
 * Production Monitoring and Logging Utilities
 * Comprehensive system for tracking app performance and issues
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from '../services/firebase';
import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
// Constants
const LOG_STORAGE_KEY = 'app_error_logs';
const PERFORMANCE_LOG_KEY = 'app_performance_logs';
const MAX_STORED_LOGS = 50;
const LOG_UPLOAD_INTERVAL = 60 * 60 * 1000; // 1 hour
// Initialize Sentry if not in development
if (!__DEV__) {
  Sentry.init({
    dsn: "https://your-sentry-dsn@o123456.ingest.sentry.io/1234567", // Replace with your actual DSN
    enableAutoSessionTracking: true,
    // Performance monitoring
    tracesSampleRate: 0.2, // Capture 20% of transactions for performance monitoring
    // Enable debug in dev mode only
    debug: __DEV__,
    // Only send errors in production
    environment: __DEV__ ? 'development' : 'production',
  });
}
// Log severity levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}
// Log entry interface
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  category: string;
  data?: any;
  deviceInfo: {
    platform: string;
    version: string;
    appVersion: string;
    memoryUsage?: number;
    batteryLevel?: number;
    networkType?: string;
  };
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
}
// Performance metric interface
export interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: string;
  data?: any;
}
/**
 * Monitoring service for handling logging and performance tracking
 */
class MonitoringService {
  private errorLogs: LogEntry[];
  private performanceMetrics: Record<string, PerformanceMetric>;
  private uploadTimer: ReturnType<typeof setInterval> | null;
  private appVersion: string;
  private isInitialized: boolean;
  private analytics: any | null;
  private currentUser: any | null;
  constructor() {
    this.errorLogs = [];
    this.performanceMetrics = {};
    this.uploadTimer = null;
    this.appVersion = Constants.expoConfig?.version || '1.0.0';
    this.isInitialized = false;
    this.analytics = null;
    this.currentUser = null;
    // Initialize service
    this.initialize();
  }
  /**
   * Initialize the monitoring service
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      // Load existing logs from storage
      await this.loadLogs();
      // Initialize analytics if available
      try {
        this.analytics = getAnalytics(app);
      } catch (error) {
        console.warn('Analytics not available:', error);
      }
      // Set up automatic log upload
      this.uploadTimer = setInterval(() => {
        this.uploadLogs();
      }, LOG_UPLOAD_INTERVAL);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
    }
  }
  /**
   * Set the current user for logging context
   * @param user Current user information
   */
  public setUser(user: { id: string; email?: string; username?: string }): void {
    this.currentUser = user;
    // Also set user in Sentry for error tracking context
    if (!__DEV__ && user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username
      });
    }
  }
  /**
   * Clear current user information
   */
  public clearUser(): void {
    this.currentUser = null;
    // Also clear user in Sentry
    if (!__DEV__) {
      Sentry.setUser(null);
    }
  }
  /**
   * Set the application version
   * @param version Application version string
   */
  public setAppVersion(version: string): void {
    this.appVersion = version;
  }
  /**
   * Log a message with the specified level
   * @param level Log severity level
   * @param message Log message
   * @param category Log category
   * @param data Additional contextual data
   */
  public log(level: LogLevel, message: string, category: string, data?: any): void {
    // Create device info
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version ? Platform.Version.toString() : 'unknown',
      appVersion: this.appVersion,
      memoryUsage: this.getMemoryUsage(),
    };
    // Create log entry
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      data,
      deviceInfo,
      user: this.currentUser || undefined
    };
    // Add to logs
    this.errorLogs.push(logEntry);
    // Trim logs if they exceed maximum
    if (this.errorLogs.length > MAX_STORED_LOGS) {
      this.errorLogs = this.errorLogs.slice(-MAX_STORED_LOGS);
    }
    // Save logs
    this.saveLogs();
    // If production and error/critical, send to Sentry
    if (!__DEV__ && (level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
      if (data instanceof Error) {
        Sentry.captureException(data);
      } else {
        Sentry.captureMessage(message, 
          level === LogLevel.CRITICAL ? Sentry.Severity.Fatal : Sentry.Severity.Error
        );
        // Add context
        Sentry.setContext(category, data || {});
      }
    }
    // If critical error, try to upload immediately
    if (level === LogLevel.CRITICAL) {
      this.uploadLogs();
    }
    // Log to console in development
    if (__DEV__) {
      switch(level) {
        case LogLevel.DEBUG:
          console.debug(`[${category}] ${message}`, data);
          break;
        case LogLevel.INFO:
          console.info(`[${category}] ${message}`, data);
          break;
        case LogLevel.WARNING:
          console.warn(`[${category}] ${message}`, data);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(`[${category}] ${message}`, data);
          break;
      }
    }
  }
  /**
   * Log a debug message
   * @param message Debug message
   * @param category Log category
   * @param data Additional contextual data
   */
  public debug(message: string, category: string = 'app', data?: any): void {
    this.log(LogLevel.DEBUG, message, category, data);
    // Add breadcrumb for context in error reports
    if (!__DEV__) {
      Sentry.addBreadcrumb({
        category,
        message,
        level: Sentry.Severity.Debug,
        data
      });
    }
  }
  /**
   * Log an info message
   * @param message Info message
   * @param category Log category
   * @param data Additional contextual data
   */
  public info(message: string, category: string = 'app', data?: any): void {
    this.log(LogLevel.INFO, message, category, data);
    // Add breadcrumb for context in error reports
    if (!__DEV__) {
      Sentry.addBreadcrumb({
        category,
        message,
        level: Sentry.Severity.Info,
        data
      });
    }
  }
  /**
   * Log a warning message
   * @param message Warning message
   * @param category Log category
   * @param data Additional contextual data
   */
  public warning(message: string, category: string = 'app', data?: any): void {
    this.log(LogLevel.WARNING, message, category, data);
    // Add breadcrumb and capture message
    if (!__DEV__) {
      Sentry.addBreadcrumb({
        category,
        message,
        level: Sentry.Severity.Warning,
        data
      });
      // For warnings, we'll add as a message but with lower severity
      Sentry.captureMessage(message, Sentry.Severity.Warning);
    }
  }
  /**
   * Log an error message
   * @param message Error message
   * @param category Log category
   * @param error Error object
   * @param data Additional contextual data
   */
  public error(message: string, category: string = 'app', error?: Error, data?: any): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...data
    } : data;
    this.log(LogLevel.ERROR, message, category, errorData);
    // In production, send additional context to Sentry
    if (!__DEV__) {
      Sentry.setContext(category, data || {});
      if (error) {
        Sentry.captureException(error);
      }
    }
  }
  /**
   * Log a critical error message
   * @param message Critical error message
   * @param category Log category
   * @param error Error object
   * @param data Additional contextual data
   */
  public critical(message: string, category: string = 'app', error?: Error, data?: any): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...data
    } : data;
    this.log(LogLevel.CRITICAL, message, category, errorData);
    // In production, send to Sentry with fatal level
    if (!__DEV__) {
      Sentry.setContext(category, data || {});
      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, Sentry.Severity.Fatal);
      }
    }
  }
  /**
   * Start a performance metric measurement
   * @param name Metric name
   * @param category Metric category
   * @param data Additional contextual data
   * @returns Metric ID
   */
  public startPerformanceMetric(name: string, category: string = 'performance', data?: any): string {
    const id = `metric_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.performanceMetrics[id] = {
      id,
      name,
      startTime: Date.now(),
      category,
      data
    };
    // Start Sentry performance transaction if available
    if (!__DEV__) {
      try {
        const transaction = Sentry.startTransaction({
          name,
          op: category
        });
        // Store transaction ID in the data
        if (transaction) {
          this.performanceMetrics[id].data = {
            ...data,
            sentryTransactionId: transaction.traceId
          };
        }
      } catch (e) {
        // Sentry performance monitoring might not be available
        console.warn('Could not start Sentry transaction:', e);
      }
    }
    return id;
  }
  /**
   * End a performance metric measurement
   * @param id Metric ID
   * @param additionalData Additional data to include
   * @returns Duration in milliseconds or undefined if metric not found
   */
  public endPerformanceMetric(id: string, additionalData?: any): number | undefined {
    const metric = this.performanceMetrics[id];
    if (!metric) {
      return undefined;
    }
    const now = Date.now();
    const duration = now - metric.startTime;
    this.performanceMetrics[id] = {
      ...metric,
      endTime: now,
      duration,
      data: {
        ...metric.data,
        ...additionalData
      }
    };
    // Save completed metrics
    this.savePerformanceMetrics();
    // Finish Sentry transaction for performance monitoring
    if (!__DEV__ && metric.data?.sentryTransactionId) {
      try {
        const scope = Sentry.getCurrentHub().getScope();
        const transaction = scope?.getTransaction();
        if (transaction && transaction.traceId === metric.data.sentryTransactionId) {
          if (additionalData?.error) {
            transaction.setStatus('internal_error');
          }
          transaction.finish();
        }
      } catch (e) {
        // Sentry performance monitoring might not be available
        console.warn('Could not finish Sentry transaction:', e);
      }
    }
    // Log slow operations
    if (duration > 1000) {
      this.warning(`Slow operation: ${metric.name} took ${duration}ms`, 'performance', {
        category: metric.category,
        ...additionalData
      });
    }
    return duration;
  }
  /**
   * Track an analytics event
   * @param eventName Event name
   * @param params Event parameters
   */
  public trackEvent(eventName: string, params?: Record<string, any>): void {
    // Log the event
    this.info(`Event: ${eventName}`, 'analytics', params);
    // Send to Firebase Analytics if available
    if (this.analytics && typeof logEvent === 'function') {
      try {
        logEvent(this.analytics, eventName, params);
      } catch (error) {
        this.error('Analytics event error', 'analytics', error as Error);
      }
    }
    // Add breadcrumb in Sentry
    if (!__DEV__) {
      Sentry.addBreadcrumb({
        category: 'analytics',
        message: `Event: ${eventName}`,
        level: Sentry.Severity.Info,
        data: params
      });
    }
  }
  /**
   * Get current memory usage if available
   * @returns Memory usage in MB or undefined
   */
  private getMemoryUsage(): number | undefined {
    try {
      // Use type assertion to handle the 'memory' property which may not be in the type definition
      const perfMemory = (global.performance as any)?.memory;
      if (perfMemory && typeof perfMemory.usedJSHeapSize === 'number') {
        return Math.round(perfMemory.usedJSHeapSize / (1024 * 1024));
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
  /**
   * Load logs from persistent storage
   */
  private async loadLogs(): Promise<void> {
    try {
      const storedLogs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
      if (storedLogs) {
        this.errorLogs = JSON.parse(storedLogs);
      }
      const storedMetrics = await AsyncStorage.getItem(PERFORMANCE_LOG_KEY);
      if (storedMetrics) {
        const metrics = JSON.parse(storedMetrics) as Record<string, PerformanceMetric>;
        this.performanceMetrics = {};
        // Only keep completed metrics
        Object.entries(metrics).forEach(([id, metric]) => {
          if (metric.duration !== undefined) {
            this.performanceMetrics[id] = metric;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }
  /**
   * Save logs to persistent storage
   */
  private async saveLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.errorLogs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }
  /**
   * Save performance metrics to persistent storage
   */
  private async savePerformanceMetrics(): Promise<void> {
    try {
      // Only save completed metrics
      const completedMetrics: Record<string, PerformanceMetric> = {};
      Object.values(this.performanceMetrics).forEach(metric => {
        if (metric.duration !== undefined) {
          completedMetrics[metric.id] = metric;
        }
      });
      await AsyncStorage.setItem(PERFORMANCE_LOG_KEY, JSON.stringify(completedMetrics));
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }
  /**
   * Upload logs to backend/analytics
   */
  private async uploadLogs(): Promise<void> {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        // Skip upload if offline
        return;
      }
      // In production, upload any error logs to Sentry that may not have been sent
      if (!__DEV__ && this.errorLogs.length > 0) {
        const errorsToUpload = this.errorLogs.filter(
          log => log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL
        );
        if (errorsToUpload.length > 0) {
          // Set current session data
          Sentry.setContext('bulk_upload', {
            count: errorsToUpload.length,
            oldest: errorsToUpload[0].timestamp,
            newest: errorsToUpload[errorsToUpload.length - 1].timestamp
          });
          // Send each error
          for (const log of errorsToUpload) {
            Sentry.captureMessage(
              log.message,
              log.level === LogLevel.CRITICAL ? Sentry.Severity.Fatal : Sentry.Severity.Error
            );
          }
          // After successful upload, clear only the error logs
          this.errorLogs = this.errorLogs.filter(
            log => log.level !== LogLevel.ERROR && log.level !== LogLevel.CRITICAL
          );
          await this.saveLogs();
        }
      }
    } catch (error) {
      console.error('Failed to upload logs:', error);
    }
  }
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
    }
    // Save any unsaved logs before destruction
    this.saveLogs();
    this.savePerformanceMetrics();
    // Close Sentry transaction if active
    if (!__DEV__) {
      try {
        const scope = Sentry.getCurrentHub().getScope();
        const transaction = scope?.getTransaction();
        if (transaction) {
          transaction.finish();
        }
      } catch (e) {
        // Sentry transaction API might not be available
        console.warn('Could not finish Sentry transaction:', e);
      }
    }
  }
}
// Export singleton instance
export const monitoring = new MonitoringService();
// Helper functions for global use
/**
 * Log a debug message
 * @param message Debug message
 * @param category Log category
 * @param data Additional contextual data
 */
export const logDebug = (message: string, category?: string, data?: any): void => {
  monitoring.debug(message, category, data);
};
/**
 * Log an info message
 * @param message Info message
 * @param category Log category
 * @param data Additional contextual data
 */
export const logInfo = (message: string, category?: string, data?: any): void => {
  monitoring.info(message, category, data);
};
/**
 * Log a warning message
 * @param message Warning message
 * @param category Log category
 * @param data Additional contextual data
 */
export const logWarning = (message: string, category?: string, data?: any): void => {
  monitoring.warning(message, category, data);
};
/**
 * Log an error message
 * @param message Error message
 * @param category Log category
 * @param error Error object or additional contextual data
 */
export const logError = (message: string, category?: string, error?: Error | any): void => {
  if (error instanceof Error) {
    monitoring.error(message, category, error);
  } else {
    monitoring.error(message, category, undefined, error);
  }
};
/**
 * Time a function execution
 * @param name Metric name
 * @param fn Function to time
 * @param category Metric category
 * @returns Function result
 */
export const timeFunction = async <T>(
  name: string, 
  fn: () => Promise<T>, 
  category?: string
): Promise<T> => {
  const metricId = monitoring.startPerformanceMetric(name, category);
  try {
    const result = await fn();
    monitoring.endPerformanceMetric(metricId);
    return result;
  } catch (error) {
    monitoring.endPerformanceMetric(metricId, { error: true });
    throw error;
  }
};
/**
 * Track an analytics event
 * @param eventName Event name
 * @param params Event parameters
 */
export const trackEvent = (eventName: string, params?: Record<string, any>): void => {
  monitoring.trackEvent(eventName, params);
}; 