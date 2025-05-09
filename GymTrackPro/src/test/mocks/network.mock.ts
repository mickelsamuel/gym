// network.mock.ts - Mock implementation of NetworkState for testing
import { NetworkStatus } from '../../types/globalTypes';
// Default network status
let mockNetworkStatus: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  lastChecked: new Date().toISOString()
};
let connectionDelay = 0;
let networkListeners: ((state: NetworkStatus) => void)[] = [];
let reconnectionListeners: (() => void)[] = [];
export class MockNetworkState {
  static setOnline(isOnline: boolean) {
    const previousState = { ...mockNetworkStatus };
    mockNetworkStatus = {
      isConnected: isOnline,
      isInternetReachable: isOnline,
      lastChecked: new Date().toISOString()
    };
    // Notify listeners if state changed
    if (previousState.isConnected !== isOnline || previousState.isInternetReachable !== isOnline) {
      this.notifyListeners();
      // If transitioning from offline to online, notify reconnection listeners
      if (!previousState.isConnected && isOnline) {
        this.notifyReconnectionListeners();
      }
    }
  }
  static setConnectionDelay(delay: number) {
    connectionDelay = delay;
  }
  static getState(): NetworkStatus {
    return { ...mockNetworkStatus };
  }
  static addListener(listener: (state: NetworkStatus) => void): { remove: () => void } {
    networkListeners.push(listener);
    // Immediately notify with current state
    listener({ ...mockNetworkStatus });
    return {
      remove: () => {
        networkListeners = networkListeners.filter(l => l !== listener);
      }
    };
  }
  static notifyListeners() {
    const state = { ...mockNetworkStatus };
    networkListeners.forEach(listener => {
      listener(state);
    });
  }
  static async checkConnection(): Promise<boolean> {
    // Simulate network delay if set
    if (connectionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, connectionDelay));
    }
    return mockNetworkStatus.isInternetReachable;
  }
  static notifyReconnectionListeners() {
    reconnectionListeners.forEach(listener => {
      listener();
    });
  }
  static addReconnectionListener(listener: () => void): { remove: () => void } {
    reconnectionListeners.push(listener);
    return {
      remove: () => {
        reconnectionListeners = reconnectionListeners.filter(l => l !== listener);
      }
    };
  }
  static reset() {
    mockNetworkStatus = {
      isConnected: true,
      isInternetReachable: true,
      lastChecked: new Date().toISOString()
    };
    connectionDelay = 0;
    networkListeners = [];
    reconnectionListeners = [];
  }
}
// Create a mock implementation of the NetworkState class
export const createMockNetworkState = () => {
  return {
    isConnected: mockNetworkStatus.isConnected,
    isInternetReachable: mockNetworkStatus.isInternetReachable,
    lastChecked: mockNetworkStatus.lastChecked,
    init: jest.fn(),
    getState: jest.fn(() => ({ ...mockNetworkStatus })),
    addListener: jest.fn((listener) => {
      return MockNetworkState.addListener(listener);
    }),
    checkConnection: jest.fn(async () => {
      return MockNetworkState.checkConnection();
    }),
    forceConnectionCheck: jest.fn(async () => {
      return { ...mockNetworkStatus };
    }),
    cleanup: jest.fn(),
    addReconnectionListener: jest.fn((listener) => {
      return MockNetworkState.addReconnectionListener(listener);
    }),
    executeWhenOnline: jest.fn(async (task) => {
      if (mockNetworkStatus.isInternetReachable) {
        return await task();
      }
      return null;
    })
  };
};
// Mock for NetInfo
export const mockNetInfo = {
  addEventListener: jest.fn((callback) => {
    const listener = (state: NetworkStatus) => {
      callback({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable
      });
    };
    networkListeners.push(listener);
    // Initial call
    listener(mockNetworkStatus);
    // Return unsubscribe function
    return () => {
      networkListeners = networkListeners.filter(l => l !== listener);
    };
  }),
  fetch: jest.fn(async () => {
    // Simulate network delay if set
    if (connectionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, connectionDelay));
    }
    return {
      isConnected: mockNetworkStatus.isConnected,
      isInternetReachable: mockNetworkStatus.isInternetReachable
    };
  })
};
// Mock the NetInfo module
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: mockNetInfo.addEventListener,
  fetch: mockNetInfo.fetch
})); 