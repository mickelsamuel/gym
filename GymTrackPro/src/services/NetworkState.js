import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * A service for monitoring network connectivity state
 */
class NetworkStateService {
  constructor() {
    this.listeners = [];
    this.isConnected = true;
    this.isInternetReachable = true;
    this.unsubscribe = null;
  }

  /**
   * Initialize the network monitoring
   */
  init() {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = NetInfo.addEventListener(state => {
      const previousConnected = this.isConnected;
      this.isConnected = state.isConnected;
      this.isInternetReachable = state.isInternetReachable;

      // Notify listeners if connection state changed
      if (previousConnected !== this.isConnected) {
        this.notifyListeners();
      }
    });
  }

  /**
   * Get the current network state
   * @returns {Object} The current network state
   */
  getState() {
    return {
      isConnected: this.isConnected,
      isInternetReachable: this.isInternetReachable
    };
  }

  /**
   * Add a listener for network state changes
   * @param {Function} listener The listener function to call when network state changes
   * @returns {Object} An object with a remove method to remove the listener
   */
  addListener(listener) {
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
  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }

  /**
   * Check if the device is currently connected to the internet
   * @returns {Promise<boolean>} A promise that resolves to true if connected
   */
  async checkConnection() {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  /**
   * Clean up the network monitoring
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

// Export a singleton instance
export const NetworkState = new NetworkStateService();

/**
 * React hook for using network state in components
 * @returns {Object} The current network state
 */
export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isInternetReachable: true
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