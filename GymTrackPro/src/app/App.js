// App.js
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, LogBox } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ExerciseProvider, useExercise } from '../context/ExerciseContext';
import AppNavigator from '../navigation/AppNavigator';
import { Theme } from '../constants/Theme';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Prevent warnings and initialization issues
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
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // Get theme colors based on dark mode
  const colors = darkMode ? Theme.dark : Theme.light;

  // Check if Firebase is connected
  useEffect(() => {
    async function checkFirebase() {
      try {
        // Use a test document that should be publicly readable
        const testDocRef = doc(db, 'test', 'connection');
        const testSnap = await getDoc(testDocRef);
        
        // If we reach this line, we connected successfully
        setFirebaseConnected(true);
        console.log('Firebase connection successful!', testSnap.exists() ? 'Document exists' : 'Document does not exist');
      } catch (e) {
        console.warn('Firebase connection test:', e.message);
        // Still set to true to allow the app to continue
        setFirebaseConnected(true);
      }
    }
    
    checkFirebase();
  }, []);

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppNavigator />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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