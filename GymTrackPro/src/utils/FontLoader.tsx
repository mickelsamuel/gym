import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import * as Font from 'expo-font';
import { Theme } from '../constants/Theme';
// Loading all Inter font weights
const loadFonts = () => {
  return Font.loadAsync({
    'Inter-Thin': require('../../assets/fonts/Inter/Inter-Thin.ttf'),
    'Inter-ExtraLight': require('../../assets/fonts/Inter/Inter-ExtraLight.ttf'),
    'Inter-Light': require('../../assets/fonts/Inter/Inter-Light.ttf'),
    'Inter': require('../../assets/fonts/Inter/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('../../assets/fonts/Inter/Inter-ExtraBold.ttf'),
    'Inter-Black': require('../../assets/fonts/Inter/Inter-Black.ttf'),
    // Also load italic versions
    'Inter-ThinItalic': require('../../assets/fonts/Inter/Inter-ThinItalic.ttf'),
    'Inter-ExtraLightItalic': require('../../assets/fonts/Inter/Inter-ExtraLightItalic.ttf'),
    'Inter-LightItalic': require('../../assets/fonts/Inter/Inter-LightItalic.ttf'),
    'Inter-Italic': require('../../assets/fonts/Inter/Inter-Italic.ttf'),
    'Inter-MediumItalic': require('../../assets/fonts/Inter/Inter-MediumItalic.ttf'),
    'Inter-SemiBoldItalic': require('../../assets/fonts/Inter/Inter-SemiBoldItalic.ttf'),
    'Inter-BoldItalic': require('../../assets/fonts/Inter/Inter-BoldItalic.ttf'),
    'Inter-ExtraBoldItalic': require('../../assets/fonts/Inter/Inter-ExtraBoldItalic.ttf'),
    'Inter-BlackItalic': require('../../assets/fonts/Inter/Inter-BlackItalic.ttf'),
  });
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
        await loadFonts();
        setFontsLoaded(true);
      } catch (e) {
        console.error('Error loading fonts:', e);
        setError(e as Error);
        // Continue with the app even if fonts fail to load
        setFontsLoaded(true);
      }
    }
    loadApp();
  }, []);
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Theme.light.primary} />
        <Text style={styles.loadingText}>Loading fonts...</Text>
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
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
export default FontLoader; 