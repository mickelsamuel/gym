import { useState, useEffect } from 'react';
import { NetworkStatus } from '../types/globalTypes';
import { NetworkState } from '../services/NetworkState';

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