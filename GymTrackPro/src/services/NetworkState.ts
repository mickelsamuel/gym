import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkConnection as checkFirebaseConnection } from './firebase';
import { logError } from '../utils/logging';
import { NetworkStatus } from '../types/globalTypes';

const NETWORK_STATUS_STORAGE_KEY = 'network_status';
const CONNECTION_TEST_INTERVAL = 60000; // 1 minute

/**
 * A service for monitoring network connectivity state
 */
class NetworkStateService {
  private listeners: Array<(state: NetworkStatus) => void>;
  private isConnected: boolean;
  private isInternetReachable: boolean | null;
  private lastChecked: string;
  private unsubscribe: (() => void) | null;
  private connectionTestTimeout: ReturnType<typeof setTimeout> | null;
  private connectionTesting: boolean;

  constructor() {
    this.listeners = [];
    this.isConnected = true;
    this.isInternetReachable = true;
    this.lastChecked = new Date().toISOString();
    this.unsubscribe = null;
    this.connectionTestTimeout = null;
    this.connectionTesting = false;
    this.loadNetworkStatus();
  }

  /**
   * Load last known network status from storage
   */
  private async loadNetworkStatus(): Promise<void> {
    try {
      const storedStatus = await AsyncStorage.getItem(NETWORK_STATUS_STORAGE_KEY);
      if (storedStatus) {
        const status = JSON.parse(storedStatus) as NetworkStatus;
        this.isConnected = status.isConnected;
        this.isInternetReachable = status.isInternetReachable;
        this.lastChecked = status.lastChecked;
      }
    } catch (error) {
      console.warn('Failed to load network status:', error);
    }
  }

  /**
   * Save current network status to storage
   */
  private async saveNetworkStatus(): Promise<void> {
    try {
      const status: NetworkStatus = this.getState();
      await AsyncStorage.setItem(NETWORK_STATUS_STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.warn('Failed to save network status:', error);
    }
  }

  /**
   * Initialize the network monitoring
   */
  public init(): void {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = NetInfo.addEventListener(state => {
      const previousConnected = this.isConnected;
      const previousReachable = this.isInternetReachable;
      
      this.isConnected = !!state.isConnected;
      this.isInternetReachable = !!state.isInternetReachable;
      this.lastChecked = new Date().toISOString();

      // Notify listeners if connection state changed
      if (previousConnected !== this.isConnected || previousReachable !== this.isInternetReachable) {
        this.notifyListeners();
        this.saveNetworkStatus();
        
        // If we're now connected, schedule an active connection test
        if (this.isConnected && !previousConnected) {
          this.scheduleConnectionTest();
        }
      }
    });
    
    // Begin testing connection periodically
    this.scheduleConnectionTest();
  }

  /**
   * Schedule a connection test
   */
  private scheduleConnectionTest(): void {
    // Clear any existing timeout
    if (this.connectionTestTimeout) {
      clearTimeout(this.connectionTestTimeout);
    }
    
    // Schedule a new test
    this.connectionTestTimeout = setTimeout(() => {
      this.testConnection();
    }, CONNECTION_TEST_INTERVAL);
  }

  /**
   * Actively test the connection to verify internet connectivity
   */
  private async testConnection(): Promise<void> {
    // Prevent multiple tests from running simultaneously
    if (this.connectionTesting) return;
    
    this.connectionTesting = true;
    
    try {
      const netInfoState = await NetInfo.fetch();
      
      // Only proceed with further tests if netinfo says we're connected
      if (netInfoState.isConnected) {
        // First check if Firebase is reachable
        const firebaseReachable = await checkFirebaseConnection();
        
        // Update state and notify if changed
        const previousReachable = this.isInternetReachable;
        this.isConnected = true;
        this.isInternetReachable = firebaseReachable;
        this.lastChecked = new Date().toISOString();
        
        if (previousReachable !== this.isInternetReachable) {
          this.notifyListeners();
          this.saveNetworkStatus();
        }
      } else {
        // Update if NetInfo says we're not connected
        if (this.isConnected !== netInfoState.isConnected) {
          this.isConnected = false;
          this.isInternetReachable = false;
          this.lastChecked = new Date().toISOString();
          this.notifyListeners();
          this.saveNetworkStatus();
        }
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      logError('connection_test_error', error);
      
      // Assume no connection if the test fails
      if (this.isInternetReachable) {
        this.isInternetReachable = false;
        this.lastChecked = new Date().toISOString();
        this.notifyListeners();
        this.saveNetworkStatus();
      }
    } finally {
      this.connectionTesting = false;
      this.scheduleConnectionTest();
    }
  }

  /**
   * Get the current network state
   * @returns The current network state
   */
  public getState(): NetworkStatus {
    return {
      isConnected: this.isConnected,
      isInternetReachable: !!this.isInternetReachable,
      lastChecked: this.lastChecked
    };
  }

  /**
   * Add a listener for network state changes
   * @param listener The listener function to call when network state changes
   * @returns An object with a remove method to remove the listener
   */
  public addListener(listener: (state: NetworkStatus) => void): { remove: () => void } {
    this.listeners.push(listener);
    // Immediately notify with current state
    listener(this.getState());
    
    return {
      remove: () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      }
    };
  }

  /**
   * Notify all listeners of network state changes
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in network state listener:', error);
        logError('network_listener_error', error);
      }
    });
  }

  /**
   * Check if the device is currently connected to the internet
   * @returns A promise that resolves to true if connected
   */
  public async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return !!state.isConnected && !!state.isInternetReachable;
    } catch (error) {
      console.error('Error checking connection:', error);
      logError('connection_check_error', error);
      return false;
    }
  }

  /**
   * Force a check of the active internet connection
   * This can be called when an operation fails to verify if it was due to connectivity
   */
  public async forceConnectionCheck(): Promise<NetworkStatus> {
    // Cancel any pending test
    if (this.connectionTestTimeout) {
      clearTimeout(this.connectionTestTimeout);
    }
    
    // Test connection immediately
    await this.testConnection();
    
    return this.getState();
  }

  /**
   * Clean up the network monitoring
   */
  public cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    if (this.connectionTestTimeout) {
      clearTimeout(this.connectionTestTimeout);
      this.connectionTestTimeout = null;
    }
    
    this.listeners = [];
  }

  /**
   * Add a network reconnection listener
   * This will trigger the provided action when the network becomes available
   * @param action Function to execute when network is restored
   * @returns An object with a remove method to remove the listener
   */
  public addReconnectionListener(
    action: () => Promise<void>,
    label: string = 'generic'
  ): { remove: () => void } {
    // Create a unique identifier for this listener
    const id = `reconnect_${label}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Define the network change listener
    const listener = async (state: NetworkStatus) => {
      try {
        // If we're now connected but were previously disconnected
        if (state.isConnected && state.isInternetReachable) {
          console.log(`Network reconnection detected for ${label}`);
          
          // Execute the action
          await action();
        }
      } catch (error) {
        console.error(`Error in reconnection listener ${label}:`, error);
        logError(`reconnection_listener_${label}_error`, error);
      }
    };
    
    // Add the listener
    this.listeners.push(listener);
    
    // Return a handle to remove the listener
    return {
      remove: () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      }
    };
  }
  
  /**
   * Schedule a task to execute when online
   * If online, executes immediately, otherwise queues for when connection is restored
   * @param task Function to execute
   * @param taskName Name of the task for logging
   * @returns Promise that resolves when the task is executed
   */
  public async executeWhenOnline<T>(
    task: () => Promise<T>,
    taskName: string = 'generic_task'
  ): Promise<T | null> {
    // Check if we're currently online
    const state = this.getState();
    
    if (state.isConnected && state.isInternetReachable) {
      try {
        // Execute immediately if online
        return await task();
      } catch (error) {
        console.error(`Error executing online task ${taskName}:`, error);
        logError(`execute_online_task_${taskName}_error`, error);
        return null;
      }
    } else {
      // Queue for later execution when online
      console.log(`Queueing task ${taskName} for execution when online`);
      
      // Return a promise that will resolve when the network becomes available
      return new Promise<T | null>((resolve) => {
        // Add a one-time listener that will be removed after execution
        const listener = this.addReconnectionListener(async () => {
          try {
            // Execute the task
            const result = await task();
            
            // Resolve the promise with the result
            resolve(result);
            
            // Remove this listener
            listener.remove();
          } catch (error) {
            console.error(`Error executing queued task ${taskName}:`, error);
            logError(`execute_queued_task_${taskName}_error`, error);
            
            // Resolve with null on error
            resolve(null);
            
            // Remove this listener
            listener.remove();
          }
        }, taskName);
      });
    }
  }
}

// Export a singleton instance
export const NetworkState = new NetworkStateService();

// React hook moved to hooks/useNetworkState.ts 