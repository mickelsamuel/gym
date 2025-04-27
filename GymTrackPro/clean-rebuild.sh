#!/bin/bash
# Clean and rebuild script for GymTrackPro

# Clear watchman watches
echo "Clearing watchman watches..."
watchman watch-del-all

# Clear Metro bundler cache
echo "Clearing Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clear Expo cache
echo "Clearing Expo cache..."
expo r -c

# Clear npm cache and node_modules
echo "Cleaning npm cache and reinstalling dependencies..."
rm -rf node_modules
npm cache clean --force
npm install

# Reinstall pods if ios directory exists
if [ -d "ios" ]; then
  echo "Reinstalling iOS pods..."
  cd ios
  pod install
  cd ..
fi

# Generate native code
echo "Generating native code with Expo prebuild..."
npx expo prebuild --clean

# Start the project
echo "Starting project..."
npx expo start --clear 