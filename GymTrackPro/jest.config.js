module.exports = {
  preset: 'react-native',
  setupFiles: [
    '<rootDir>/jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-*|uuid|@firebase|firebase)/)',
  ],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/test/mocks/uuid.mock.js',
    '^react-test-renderer$': '<rootDir>/src/test/mocks/react-test-renderer.mock.js'
  },
  testEnvironment: 'node',
  verbose: true,
}; 