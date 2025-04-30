/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

// Define a type for our color scheme
type ColorScheme = {
  light: {
    text: string;
    background: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
    primary?: string;
    secondary?: string;
  };
  dark: {
    text: string;
    background: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
    primary?: string;
    secondary?: string;
  };
};

// Fallback colors in case Colors is undefined
const fallbackColors: ColorScheme = {
  light: {
    text: '#333333',
    background: '#F8F9FA',
    primary: '#007AFF',
    secondary: '#5AC8FA',
    icon: '#333333',
    tint: '#007AFF',
    tabIconDefault: '#C4C4C6',
    tabIconSelected: '#007AFF',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1C1C1E',
    primary: '#0A84FF',
    secondary: '#64D2FF',
    icon: '#FFFFFF',
    tint: '#0A84FF',
    tabIconDefault: '#515154',
    tabIconSelected: '#0A84FF',
  }
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ColorScheme['light']
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];
  
  // Type assertion to ensure Colors has the right shape
  const colorScheme = Colors as ColorScheme || fallbackColors;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Check if the colorName exists in the theme
    return colorScheme[theme][colorName] || fallbackColors[theme][colorName];
  }
}
