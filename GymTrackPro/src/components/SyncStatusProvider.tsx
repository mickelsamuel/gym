import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSyncOnReconnect, SyncOperation } from '../hooks/useSyncOnReconnect';
import NetworkStateIndicator from './NetworkStateIndicator';
import { getFirestore, writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { Alert } from 'react-native';
;
interface SyncContextType {
  isSyncing: boolean;
  lastSynced: Date | null;
  pendingOperations: SyncOperation[];
  addOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => Promise<string>;
  syncNow: () => Promise<void>;
}
const SyncContext = createContext<SyncContextType | undefined>(undefined);
export const useSyncStatus = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncStatus must be used within a SyncStatusProvider');
  }
  return context;
};
interface SyncStatusProviderProps {
  children: ReactNode;
}
export const SyncStatusProvider: React.FC<SyncStatusProviderProps> = ({ children }) => {
  const [syncError, setSyncError] = useState<Error | null>(null);
  // Function to handle the actual syncing of data with Firebase
  const syncWithFirebase = async (operations: SyncOperation[]): Promise<void> => {
    // Get Firestore instance
    const db = getFirestore();
    // Using a batch for atomic updates
    const batch = writeBatch(db);
    try {
      // Process each operation in order
      for (const op of operations) {
        const { type, collection: collectionPath, data } = op;
        const docRef = data.id 
          ? doc(db, collectionPath, data.id)
          : doc(collection(db, collectionPath));
        switch (type) {
          case 'create':
            batch.set(docRef, {
              ...data,
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...data,
              updatedAt: serverTimestamp(),
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }
      // Commit all operations
      await batch.commit();
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      throw error;
    }
  };
  // Use our custom hook for sync management
  const { 
    isSyncing, 
    lastSynced, 
    pendingOperations, 
    addOperation, 
    syncNow 
  } = useSyncOnReconnect(syncWithFirebase, {
    onSyncStart: () => {
      setSyncError(null);
      // Could show a notification here
    },
    onSyncComplete: () => {
      // Could show a success notification
    },
    onSyncError: (error) => {
      setSyncError(error);
      Alert.alert(
        'Sync Error',
        'There was a problem syncing your data. Please try again later.',
        [{ text: 'OK' }]
      );
    },
  });
  // Provide sync status and methods to the app
  const value = {
    isSyncing,
    lastSynced,
    pendingOperations,
    addOperation,
    syncNow,
  };
  return (
    <SyncContext.Provider value={value}>
      {children}
      <NetworkStateIndicator 
        isSyncing={isSyncing} 
        pendingOperations={pendingOperations.length} 
        onSyncNow={syncNow}
      />
    </SyncContext.Provider>
  );
};
export default SyncStatusProvider; 