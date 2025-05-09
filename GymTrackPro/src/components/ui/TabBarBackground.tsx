import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Colors } from '../../constants/Theme';

interface TabBarBackgroundProps {
  height?: number;
  darkMode?: boolean;
}

/**
 * TabBarBackground component
 * 
 * Provides a modern, platform-specific background for the tab bar
 * Uses BlurView on iOS and a semi-transparent background on Android
 */
const TabBarBackground: React.FC<TabBarBackgroundProps> = ({ 
  height = Platform.OS === 'ios' ? 64 : 56,
  darkMode: propDarkMode,
}) => {
  const { darkMode: contextDarkMode } = useExercise();
  const darkMode = propDarkMode !== undefined ? propDarkMode : contextDarkMode;
  const theme = darkMode ? Theme.dark : Theme.light;
  
  // Get screen dimensions
  const { width } = Dimensions.get('window');
  
  // Determine blur intensity and tint
  const blurIntensity = darkMode ? 80 : 45;
  const blurTint = darkMode ? 'dark' : 'light';
  
  // Android-specific background opacity
  const androidBackgroundOpacity = darkMode ? 0.9 : 0.85;
  
  return Platform.OS === 'ios' ? (
    // iOS uses BlurView for a more native feel
    <BlurView
      intensity={blurIntensity}
      tint={blurTint}
      style={[
        styles.container,
        { 
          height,
          width
        }
      ]}
    />
  ) : (
    // Android uses a semi-transparent background
    <View 
      style={[
        styles.container, 
        { 
          height,
          width,
          backgroundColor: darkMode 
            ? `rgba(28, 28, 30, ${androidBackgroundOpacity})` 
            : `rgba(255, 255, 255, ${androidBackgroundOpacity})`,
          borderTopColor: darkMode 
            ? 'rgba(60, 60, 67, 0.29)' 
            : 'rgba(60, 60, 67, 0.1)',
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
  },
});

export default TabBarBackground;

export function useBottomTabOverflow(): number {
  return 0;
}
