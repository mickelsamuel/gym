/**
 * Logging utility functions for the application
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
// Maximum number of logs to keep in local storage
const MAX_LOG_ENTRIES = 100;
// Storage key for logs
const LOG_STORAGE_KEY = 'app_error_logs';
/**
 * Interface for log entry
 */
interface LogEntry {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}
/**
 * Log an error to the console and to local storage
 * @param type Type or category of the error
 * @param error The error object or message
 * @param additionalData Any additional context about the error
 */
export const logError = async (type: string, error: any, additionalData?: any): Promise<void> => {
  try {
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack;
    const logEntry: LogEntry = {
      id: generateLogId(),
      type,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      stack: errorStack,
      data: additionalData || error?.data || {}
    };
    // Log to console
    console.error(`[${type}] ${errorMessage}`, logEntry);
    // Save to local storage
    await saveLog(logEntry);
  } catch (loggingError) {
    // Fallback to just console logging if storage fails
    console.error('Error in logging system:', loggingError);
    console.error('Original error:', error);
  }
};
/**
 * Generate a unique ID for a log entry
 */
const generateLogId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};
/**
 * Save a log entry to local storage
 * @param logEntry The log entry to save
 */
const saveLog = async (logEntry: LogEntry): Promise<void> => {
  try {
    // Get existing logs
    const logsJson = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    let logs: LogEntry[] = logsJson ? JSON.parse(logsJson) : [];
    // Add new log
    logs.unshift(logEntry);
    // Limit the number of logs
    if (logs.length > MAX_LOG_ENTRIES) {
      logs = logs.slice(0, MAX_LOG_ENTRIES);
    }
    // Save back to storage
    await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save log entry:', error);
  }
};
/**
 * Get all stored log entries
 * @returns Array of log entries
 */
export const getLogs = async (): Promise<LogEntry[]> => {
  try {
    const logsJson = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.error('Failed to retrieve logs:', error);
    return [];
  }
};
/**
 * Clear all stored logs
 */
export const clearLogs = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOG_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
};
/**
 * Log an info message (non-error)
 * @param type Type or category of the info
 * @param message The message to log
 * @param data Any additional data to include
 */
export const logInfo = (type: string, message: string, data?: any): void => {
  console.log(`[${type}] ${message}`, data || '');
}; 