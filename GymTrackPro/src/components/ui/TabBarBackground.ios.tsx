import React from 'react';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
interface TabBarBackgroundProps {
  darkMode: boolean;
}
const TabBarBackground: React.FC<TabBarBackgroundProps> = ({ darkMode }) => {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint={darkMode ? 'dark' : 'light'}
      intensity={darkMode ? 60 : 80}
      style={StyleSheet.absoluteFill}
    />
  );
};
export default TabBarBackground;
export function useBottomTabOverflow(): number {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
