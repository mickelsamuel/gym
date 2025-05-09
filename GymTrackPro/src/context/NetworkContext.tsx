import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import NetworkStateIndicator from '../components/NetworkStateIndicator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants';
import DatabaseService from '../services/DatabaseService';

export interface NetworkContextValue {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
  lastOnline: Date | null;
  pendingSyncCount: number;
  isSyncing: boolean;
  checkConnection: () => Promise<boolean>;
  syncPendingData: () => Promise<void>;
}

const defaultContextValue: NetworkContextValue = {
  isOnline: true,
  isInternetReachable: true,
  connectionType: 'unknown',
  lastOnline: null,
  pendingSyncCount: 0,
  isSyncing: false,
  checkConnection: async () => true,
  syncPendingData: async () => {},
};

export const NetworkContext = createContext<NetworkContextValue>(defaultContextValue);

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetInfoState>({
    type: NetInfoStateType.unknown,
    isConnected: true,
    isInternetReachable: null,
    details: null,
  });
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Monitor network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
      
      // Update last online timestamp when connected
      if (state.isConnected && state.isInternetReachable) {
        const now = new Date();
        setLastOnline(now);
        AsyncStorage.setItem(StorageKeys.LAST_ONLINE, now.toISOString());
      }
    });
    
    // Load last online timestamp and pending sync operations on mount
    const loadInitialState = async () => {
      try {
        // Load last online timestamp
        const savedLastOnline = await AsyncStorage.getItem(StorageKeys.LAST_ONLINE);
        if (savedLastOnline) {
          setLastOnline(new Date(savedLastOnline));
        }
        
        // Check for pending sync operations
        await checkPendingSyncOperations();
      } catch (error) {
        console.error('Error loading network state:', error);
      }
    };
    
    loadInitialState();
    
    // Check connection initially
    checkConnection();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Check for pending sync operations
  const checkPendingSyncOperations = async () => {
    try {
      const pendingOperations = await DatabaseService.getPendingSyncOperations();
      setPendingSyncCount(pendingOperations.length);
      return pendingOperations.length;
    } catch (error) {
      console.error('Error checking pending sync operations:', error);
      return 0;
    }
  };
  
  // Actively check connection status (can be called by components)
  const checkConnection = async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      setNetworkState(state);
      
      // Update last online timestamp if connected
      if (state.isConnected && state.isInternetReachable) {
        const now = new Date();
        setLastOnline(now);
        AsyncStorage.setItem(StorageKeys.LAST_ONLINE, now.toISOString());
      }
      
      // Always check for pending operations after connection check
      await checkPendingSyncOperations();
      
      return !!state.isConnected && !!state.isInternetReachable;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  };
  
  // Sync pending data when back online
  const syncPendingData = async (): Promise<void> => {
    // Don't try to sync if offline
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      return;
    }
    
    // Don't start a new sync if one is already in progress
    if (isSyncing) {
      return;
    }
    
    try {
      setIsSyncing(true);
      
      // Get all pending operations
      const pendingOperations = await DatabaseService.getPendingSyncOperations();
      
      if (pendingOperations.length === 0) {
        setIsSyncing(false);
        return;
      }
      
      // Process each pending operation
      for (const operation of pendingOperations) {
        try {
          await DatabaseService.processPendingOperation(operation);
          // Remove from pending queue after successful processing
          await DatabaseService.removePendingOperation(operation.id);
        } catch (error) {
          console.error(`Error processing pending operation ${operation.id}:`, error);
          // Operation remains in queue for retry
        }
      }
      
      // Update pending count after sync attempt
      await checkPendingSyncOperations();
    } catch (error) {
      console.error('Error syncing pending data:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Auto-sync when coming back online
  useEffect(() => {
    if (networkState.isConnected && networkState.isInternetReachable && pendingSyncCount > 0) {
      syncPendingData();
    }
  }, [networkState.isConnected, networkState.isInternetReachable, pendingSyncCount]);
  
  // Context value
  const contextValue: NetworkContextValue = {
    isOnline: !!networkState.isConnected,
    isInternetReachable: !!networkState.isInternetReachable,
    connectionType: networkState.type,
    lastOnline,
    pendingSyncCount,
    isSyncing,
    checkConnection,
    syncPendingData,
  };
  
  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
      <NetworkStateIndicator 
        isOffline={!networkState.isConnected}
        isLimitedConnectivity={!!networkState.isConnected && !networkState.isInternetReachable}
        isConnected={!!networkState.isConnected && !!networkState.isInternetReachable}
        hasPendingSync={pendingSyncCount > 0}
        isSyncing={isSyncing}
        syncCount={pendingSyncCount}
        onRetry={checkConnection}
        onSyncNow={syncPendingData}
      />
    </NetworkContext.Provider>
  );
};

export default NetworkProvider; 