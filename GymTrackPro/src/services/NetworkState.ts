import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkConnection as checkFirebaseConnection } from './firebase';
import { logError } from '../utils/logging';
import { NetworkStatus } from '../types/global';

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
}

// Export a singleton instance
export const NetworkState = new NetworkStateService();

/**
 * React hook for using network state in components
 * @returns The current network state
 */
export const useNetworkState = (): NetworkStatus => {
  const [networkState, setNetworkState] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    lastChecked: new Date().toISOString()
  });
  
  useEffect(() => {
    // Initialize if needed
    NetworkState.init();
    
    // Listen for changes
    const listener = NetworkState.addListener(state => {
      setNetworkState(state);
    });
    
    return () => {
      listener.remove();
    };
  }, []);
  
  return networkState;
}; 