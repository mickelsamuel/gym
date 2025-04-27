module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Any other plugins should go here
      'react-native-reanimated/plugin', // Reanimated plugin must be last
    ],
  };
}; 