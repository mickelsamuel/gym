/**
 * Mock implementation of the uuid module for testing
 */

// Simple implementation that returns a predictable uuid for testing
const v4 = () => 'test-uuid-1234-5678-9012';

// Export the mocked methods
module.exports = {
  v4
}; 