/**
 * Mock for the useColorScheme hook to use in tests
 */
// Create a mock for the useColorScheme hook
export const useColorScheme = jest.fn(() => 'light');
// Helper to set a different color scheme for tests
export const setColorScheme = (scheme: 'light' | 'dark' | null) => {
  useColorScheme.mockReturnValue(scheme as 'light' | 'dark');
}; 