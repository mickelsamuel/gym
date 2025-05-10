import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import * as Font from 'expo-font';
import { Theme } from '../constants/Theme';

// Define a valid Inter font type
type InterFontVariant = 
  | 'Inter'
  | 'Inter-Medium'
  | 'Inter-Bold'
  | 'Inter-Light' 
  | 'Inter-SemiBold' 
  | 'Inter-ExtraBold'
  | 'Inter-Black'
  | 'Inter-Thin'
  | 'Inter-ExtraLight'
  | 'Inter-Italic'
  | 'Inter-MediumItalic'
  | 'Inter-BoldItalic';

// Attempt to load Inter font family - handle potential missing files gracefully
const loadFonts = async () => {
  try {
    // Base font mapping with error handling
    const fonts: Partial<Record<InterFontVariant, any>> = {
      'Inter': require('../../assets/fonts/Inter/inter-latin-400-normal.woff'),
      'Inter-Medium': require('../../assets/fonts/Inter/inter-latin-500-normal.woff'),
      'Inter-Bold': require('../../assets/fonts/Inter/inter-latin-700-normal.woff'),
    };

    // Use any available font files for additional weights
    try {
      fonts['Inter-Light'] = require('../../assets/fonts/Inter/inter-latin-300-normal.woff');
    } catch (_e) {
      console.warn('Light font variant not available, will use system fallback');
    }

    try {
      fonts['Inter-SemiBold'] = require('../../assets/fonts/Inter/inter-latin-600-normal.woff');
    } catch (_e) {
      console.warn('SemiBold font variant not available, will use system fallback');
    }

    try {
      fonts['Inter-ExtraBold'] = require('../../assets/fonts/Inter/inter-latin-800-normal.woff');
    } catch (_e) {
      console.warn('ExtraBold font variant not available, will use system fallback');
    }

    try {
      fonts['Inter-Black'] = require('../../assets/fonts/Inter/inter-latin-900-normal.woff');
    } catch (_e) {
      console.warn('Black font variant not available, will use system fallback');
    }

    try {
      fonts['Inter-Thin'] = require('../../assets/fonts/Inter/inter-latin-100-normal.woff');
    } catch (_e) {
      console.warn('Thin font variant not available, will use system fallback');
    }

    try {
      fonts['Inter-ExtraLight'] = require('../../assets/fonts/Inter/inter-latin-200-normal.woff');
    } catch (_e) {
      console.warn('ExtraLight font variant not available, will use system fallback');
    }

    // Also try to load italic versions
    try {
      fonts['Inter-Italic'] = require('../../assets/fonts/Inter/inter-latin-400-italic.woff');
    } catch (_e) {
      console.warn('Italic font variant not available, will use system fallback');
    }

    try {
      fonts['Inter-MediumItalic'] = require('../../assets/fonts/Inter/inter-latin-500-italic.woff');
    } catch (_e) {
      console.warn('MediumItalic font variant not available, will use system fallback');
    }

    try {
      fonts['Inter-BoldItalic'] = require('../../assets/fonts/Inter/inter-latin-700-italic.woff');
    } catch (_e) {
      console.warn('BoldItalic font variant not available, will use system fallback');
    }

    // Load all successfully imported fonts
    await Font.loadAsync(fonts);
    return true;
  } catch (e) {
    console.error('Error loading fonts:', e);
    return false;
  }
};

interface FontLoaderProps {
  children: React.ReactNode;
}

const FontLoader: React.FC<FontLoaderProps> = ({ children }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadApp() {
      try {
        const success = await loadFonts();
        if (!success) {
          throw new Error('Failed to load fonts');
        }
        setFontsLoaded(true);
      } catch (e) {
        console.error('Error in font loading process:', e);
        setError(e as Error);
        // Continue with the app even if fonts fail to load
        // System fonts will be used as fallback
        setFontsLoaded(true);
      }
    }
    loadApp();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Theme.light.primary} />
        <Text style={styles.loadingText}>Loading GymTrackPro...</Text>
      </View>
    );
  }

  if (error) {
    console.warn('Font loading error, continuing with system fonts:', error);
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.light.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Theme.light.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default FontLoader; 