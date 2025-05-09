// App.js
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Text } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ExerciseProvider, useExercise } from '../context/ExerciseContext';
import NetworkProvider from '../context/NetworkContext';
import AppNavigator from '../navigation/AppNavigator';
import { Theme } from '../constants/Theme';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore'; // Import getDoc
import { onAuthStateChanged } from "firebase/auth";
import FontLoader from '../utils/FontLoader';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * Main App component
 * @returns {React.ReactNode}
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <FontLoader>
        <NetworkProvider>
          <AuthProvider>
            <ExerciseProvider>
              <AppRoot />
            </ExerciseProvider>
          </AuthProvider>
        </NetworkProvider>
      </FontLoader>
    </SafeAreaProvider>
  );
}

/**
 * Root application component with providers
 * @returns {React.ReactNode}
 */
function AppRoot() {
  const { loading: authLoading } = useAuth();
  const { darkMode } = useExercise();
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // Get theme colors based on dark mode
  const colors = darkMode ? Theme.dark : Theme.light;

  // Check if Firebase is connected
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // Use a test document that should be publicly readable
        const testDocRef = doc(db, 'test', 'connection'); // Updated test document reference
        await getDoc(testDocRef); // Check if the document exists and is readable

        // Check if the user is authenticated
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setFirebaseConnected(true);
                console.log('Firebase connection successful! User is authenticated.');
            } else {
                setFirebaseConnected(false);
                setError(new Error("User is not authenticated."));
                console.warn('Firebase connection error: User is not authenticated.');
            }
        });

      } catch (e) {
        setError(e);
        setFirebaseConnected(false);
        console.warn('Firebase connection error:', e);
      }
    };

    checkFirebase();
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Add any async resource loading here
        // e.g. Font.loadAsync(), Asset.loadAsync(), etc.
      } catch (e) {
        console.warn('Error loading assets:', e);
        setError(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    };
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
          Error: {error.name}
        </Text>
          <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
            {error.message}
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
    // Add more styles if needed
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