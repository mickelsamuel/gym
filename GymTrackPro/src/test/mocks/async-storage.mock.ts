// async-storage.mock.ts - Mock implementation of AsyncStorage for testing

// Storage implementation
const mockStorage: Record<string, string> = {};

export const mockAsyncStorage = {
  getItem: jest.fn(async (key: string): Promise<string | null> => {
    return mockStorage[key] || null;
  }),
  
  setItem: jest.fn(async (key: string, value: string): Promise<void> => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  
  removeItem: jest.fn(async (key: string): Promise<void> => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  
  clear: jest.fn(async (): Promise<void> => {
    Object.keys(mockStorage).forEach(key => {
      delete mockStorage[key];
    });
    return Promise.resolve();
  }),
  
  getAllKeys: jest.fn(async (): Promise<string[]> => {
    return Object.keys(mockStorage);
  }),
  
  multiGet: jest.fn(async (keys: string[]): Promise<[string, string | null][]> => {
    return keys.map(key => [key, mockStorage[key] || null]);
  }),
  
  multiSet: jest.fn(async (keyValuePairs: [string, string][]): Promise<void> => {
    keyValuePairs.forEach(([key, value]) => {
      mockStorage[key] = value;
    });
    return Promise.resolve();
  }),
  
  multiRemove: jest.fn(async (keys: string[]): Promise<void> => {
    keys.forEach(key => {
      delete mockStorage[key];
    });
    return Promise.resolve();
  }),
  
  // Helper function to inspect current storage state (not part of the real API)
  _getStorageData: () => ({ ...mockStorage }),
  
  // Helper function to reset the mock storage
  _reset: () => {
    Object.keys(mockStorage).forEach(key => {
      delete mockStorage[key];
    });
  }
};

// Mock the AsyncStorage module
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage); 