import React, { createContext, useState, useEffect } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
;
interface NetworkContextValue {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  networkType: NetInfoStateType | null;
  isWifi: boolean;
  isCellular: boolean;
  lastCheckTime: string;
  checkNetwork: () => Promise<void>;
}
export const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  isInternetReachable: true,
  networkType: null,
  isWifi: false,
  isCellular: false,
  lastCheckTime: new Date().toISOString(),
  checkNetwork: async () => {},
});
export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetInfoState>({
    isConnected: true,
    isInternetReachable: true,
    type: NetInfoStateType.none,
    details: null
  });
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toISOString());
  // Check network status on demand
  const checkNetwork = async (): Promise<void> => {
    try {
      const state = await NetInfo.fetch();
      setNetworkState(state);
      setLastCheckTime(new Date().toISOString());
    } catch (error) {
      console.error('Failed to check network status:', error);
    }
  };
  // Subscribe to network info updates
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState(state);
      setLastCheckTime(new Date().toISOString());
    });
    // Initial network check
    checkNetwork();
    return () => {
      unsubscribe();
    };
  }, []);
  // Determine specific network types
  const isWifi = networkState.type === 'wifi';
  const isCellular = networkState.type === 'cellular';
  return (
    <NetworkContext.Provider
      value={{
        isOnline: networkState.isConnected ?? true,
        isInternetReachable: networkState.isInternetReachable,
        networkType: networkState.type,
        isWifi,
        isCellular,
        lastCheckTime,
        checkNetwork,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};
export default NetworkProvider; 