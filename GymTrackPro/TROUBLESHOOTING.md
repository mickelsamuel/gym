# Troubleshooting Guide for GymTrackPro

## Firebase Issues

### Missing or Insufficient Permissions

If you see this error:
```
[FirebaseError: Missing or insufficient permissions.]
```

#### Solution:
1. Go to the Firebase console: https://console.firebase.google.com/
2. Select your project: "gymtrackpro-73899"
3. Go to Firestore Database
4. Click on the "Rules" tab
5. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users for testing
    // WARNING: For testing only - change to more secure rules later
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
6. Click "Publish"

## React Native Reanimated Issues

If you see this error:
```
[Reanimated] Native part of Reanimated doesn't seem to be initialized
```

#### Solution:
1. Make sure your `babel.config.js` has the Reanimated plugin:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```

2. Run the clean-rebuild script:
```bash
./clean-rebuild.sh
```

3. If the issue persists, try:
```bash
npx expo start --clear --no-dev --minify
```

## Package Version Issues

If you get warnings about package versions not matching:

#### Solution:
1. Update your package.json with the correct versions:
```bash
npm install @react-native-community/netinfo@11.4.1 @react-native-picker/picker@2.9.0 lottie-react-native@7.1.0 react-native-reanimated@~3.16.1
```

2. Clear the Metro cache:
```bash
npx expo start --clear
```

## Metro Bundler Issues

If the app freezes, crashes, or has unexpected behavior:

#### Solution:
1. Stop any running Metro instance with Ctrl+C
2. Run the full clean-rebuild script:
```bash
./clean-rebuild.sh
```

## iOS Specific Issues

For issues specific to iOS:

1. If you're running on a physical device, make sure you've properly set up your development profile

2. Generate native code with:
```bash
npx expo prebuild --platform ios
```

3. Install CocoaPods:
```bash
cd ios && pod install && cd ..
```

## Android Specific Issues

For issues specific to Android:

1. Make sure you have Android SDK installed and environment variables set correctly

2. Generate native code with:
```bash
npx expo prebuild --platform android
```

3. Reset the Android build cache:
```bash
cd android && ./gradlew clean && cd ..
``` 