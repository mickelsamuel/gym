import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: 'unknown' | 'none' | 'wifi' | 'cellular' | 'bluetooth' | 'ethernet' | 'wimax' | 'vpn' | 'other';
  isOffline: boolean;
  details: any;
  lastUpdated: Date;
}
// Storage key for persisting network state
const NETWORK_STATE_STORAGE_KEY = 'GYMTRACKPRO_NETWORK_STATE';
/**
 * Hook to track the network connectivity status
 * @returns NetworkStatus object containing connection information
 */
export const useNetworkState = (): NetworkStatus => {
  const [networkState, setNetworkState] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isOffline: false,
    details: null,
    lastUpdated: new Date(),
  });
  // Store network state in AsyncStorage for persistence
  const persistNetworkState = async (state: NetworkStatus) => {
    try {
      await AsyncStorage.setItem(
        NETWORK_STATE_STORAGE_KEY,
        JSON.stringify({
          ...state,
          lastUpdated: state.lastUpdated.toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to save network state:', error);
    }
  };
  // Load persisted network state
  const loadPersistedNetworkState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(NETWORK_STATE_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setNetworkState({
          ...parsedState,
          lastUpdated: new Date(parsedState.lastUpdated),
        });
      }
    } catch (error) {
      console.error('Failed to load persisted network state:', error);
    }
  };
  // Update network state with new information
  const updateNetworkState = (state: NetInfoState) => {
    const newState: NetworkStatus = {
      isConnected: state.isConnected ?? true,
      isInternetReachable: state.isInternetReachable ?? true,
      type: state.type,
      isOffline: !(state.isConnected && state.isInternetReachable),
      details: state.details,
      lastUpdated: new Date(),
    };
    setNetworkState(newState);
    persistNetworkState(newState);
  };
  useEffect(() => {
    // Load persisted state on mount
    loadPersistedNetworkState();
    // Subscribe to network info updates
    const unsubscribe = NetInfo.addEventListener(updateNetworkState);
    // Initial fetch of network state
    const getNetworkState = async () => {
      try {
        const state = await NetInfo.fetch();
        updateNetworkState(state);
      } catch (error) {
        console.error('Error fetching network state:', error);
      }
    };
    getNetworkState();
    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, []);
  return networkState;
};
export default useNetworkState; 