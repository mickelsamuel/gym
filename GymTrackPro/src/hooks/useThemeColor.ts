/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import Colors from '../constants/Colors';
import { useColorScheme as nativeUseColorScheme } from 'react-native';

// Use the native hook directly to avoid circular dependencies with 'useColorScheme.ts'
export const useColorScheme = nativeUseColorScheme;

// Make the color scheme type more explicit
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

// Fallback colors in case Colors is undefined or tests don't have Colors properly mocked
const fallbackColors: ColorScheme = {
  light: {
    text: '#1A202C',
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
  
  // Safe check if Colors exists and has the expected structure
  const colorScheme = (typeof Colors === 'object' && Colors !== null 
    && 'light' in Colors && 'dark' in Colors) 
      ? Colors as ColorScheme 
      : fallbackColors;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Check if the colorName exists in the theme
    return colorScheme[theme][colorName] || fallbackColors[theme][colorName];
  }
}
