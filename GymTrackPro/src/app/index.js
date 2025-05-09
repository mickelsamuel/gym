import React from 'react';
import { Redirect } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ExerciseProvider } from '../context/ExerciseContext';
import NetworkProvider from '../context/NetworkContext';
import { Theme } from '../constants/Theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FontLoader from '../utils/FontLoader';
import SplashLoader from '../utils/SplashLoader';
import AppErrorBoundary from '../components/AppErrorBoundary';

export default function Index() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <FontLoader>
          <NetworkProvider>
            <AuthProvider>
              <ExerciseProvider>
                <SplashLoader>
                  {/* Redirect to the main app entry point */}
                  <Redirect href="/main" />
                </SplashLoader>
              </ExerciseProvider>
            </AuthProvider>
          </NetworkProvider>
        </FontLoader>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
} 