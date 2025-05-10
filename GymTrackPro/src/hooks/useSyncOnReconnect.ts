import { useEffect, useState } from 'react';
import { useNetworkState } from './useNetworkState';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Storage key for pending sync operations
const PENDING_SYNC_STORAGE_KEY = 'GYMTRACKPRO_PENDING_SYNC';
// Types for sync operations
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
}
interface SyncOptions {
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}
/**
 * Custom hook for handling data synchronization when network reconnects
 * @param syncFn Function to execute for syncing data
 * @param options Configuration options
 */
export const useSyncOnReconnect = (
  syncFn: (operations: SyncOperation[]) => Promise<void>,
  options?: SyncOptions
) => {
  const { isConnected, isInternetReachable } = useNetworkState();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>([]);
  // Load pending operations from AsyncStorage
  const loadPendingOperations = async () => {
    try {
      const storedOperations = await AsyncStorage.getItem(PENDING_SYNC_STORAGE_KEY);
      if (storedOperations) {
        setPendingOperations(JSON.parse(storedOperations));
      }
    } catch (error) {
      console.error('Failed to load pending sync operations:', error);
    }
  };
  // Save pending operations to AsyncStorage
  const savePendingOperations = async (operations: SyncOperation[]) => {
    try {
      await AsyncStorage.setItem(PENDING_SYNC_STORAGE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save pending sync operations:', error);
    }
  };
  // Add a new operation to the pending queue
  const addOperation = async (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => {
    const newOperation: SyncOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    const updatedOperations = [...pendingOperations, newOperation];
    setPendingOperations(updatedOperations);
    await savePendingOperations(updatedOperations);
    // Try to sync immediately if we're online
    if (isConnected && isInternetReachable) {
      syncPendingOperations();
    }
    return newOperation.id;
  };
  // Sync pending operations with the server
  const syncPendingOperations = async () => {
    if (isSyncing || pendingOperations.length === 0) return;
    try {
      setIsSyncing(true);
      options?.onSyncStart?.();
      await syncFn(pendingOperations);
      // Clear pending operations after successful sync
      setPendingOperations([]);
      await savePendingOperations([]);
      setLastSynced(new Date());
      options?.onSyncComplete?.();
    } catch (error) {
      console.error('Error syncing pending operations:', error);
      options?.onSyncError?.(error as Error);
    } finally {
      setIsSyncing(false);
    }
  };
  // Load pending operations on mount
  useEffect(() => {
    loadPendingOperations();
  }, []);
  // Trigger sync when connection is restored
  useEffect(() => {
    if (isConnected && isInternetReachable && pendingOperations.length > 0) {
      syncPendingOperations();
    }
  }, [isConnected, isInternetReachable, pendingOperations, syncPendingOperations]);
  return {
    addOperation,
    pendingOperations,
    isSyncing,
    lastSynced,
    syncNow: syncPendingOperations,
  };
};
export default useSyncOnReconnect; 