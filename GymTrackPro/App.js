// App.js
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, LogBox } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ExerciseProvider, useExercise } from './src/context/ExerciseContext';
import AppNavigator from './src/navigation/AppNavigator';
import Colors from './constants/Colors';

// Prevent cyclic navigation warnings
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  'Non-serializable values were found in the navigation state',
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ExerciseProvider>
          <AppContent />
        </ExerciseProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { loading: authLoading } = useAuth();
  const { darkMode } = useExercise();
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Initialize a default colors object in case the import fails
  const defaultColors = {
    light: {
      primary: '#007AFF',
      background: '#F8F9FA',
      backgroundSecondary: '#FFFFFF',
      text: '#333333',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#E0E0E0'
    },
    dark: {
      primary: '#0A84FF',
      background: '#1C1C1E',
      backgroundSecondary: '#2C2C2E',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
      textTertiary: '#888888',
      border: '#555555'
    }
  };

  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = darkMode ? colorScheme.dark : colorScheme.light;

  useEffect(() => {
    async function prepare() {
      try {
        // Add any async resource loading here
        // e.g. Font.loadAsync(), Asset.loadAsync(), etc.
        
        // Artificially delay for a smoother splash screen experience
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error loading assets:', e);
        setError(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    // Hide splash screen once auth state is determined and app is ready
    if (appIsReady && !authLoading) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [appIsReady, authLoading]);

  if (!appIsReady) {
    return null;
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Something went wrong!
        </Text>
        <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
          Please restart the application.
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
});