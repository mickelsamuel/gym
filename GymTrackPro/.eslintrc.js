// https://docs.expo.dev/guides/using-eslint/
// This file is kept as a backup. We're now using eslint.config.js
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*', 'node_modules/*'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_' 
    }],
    'react-hooks/exhaustive-deps': 'warn'
  }
};
