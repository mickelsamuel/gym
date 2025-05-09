import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ExerciseProvider } from '../context/ExerciseContext';
import NetworkProvider from '../context/NetworkContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FontLoader from '../utils/FontLoader';
import SplashLoader from '../utils/SplashLoader';
import AppErrorBoundary from '../components/AppErrorBoundary';

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <FontLoader>
          <NetworkProvider>
            <AuthProvider>
              <ExerciseProvider>
                <SplashLoader>
                  <Stack screenOptions={{ headerShown: false }} />
                </SplashLoader>
              </ExerciseProvider>
            </AuthProvider>
          </NetworkProvider>
        </FontLoader>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
} 