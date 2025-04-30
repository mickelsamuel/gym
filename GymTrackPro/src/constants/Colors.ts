/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { ColorSchemeName } from 'react-native';

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

const Colors = {
  light: {
    text: '#000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    background: '#fff',
    backgroundSecondary: '#F8F9FA',
    tint: tintColorLight,
    icon: '#888',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: '#007AFF',
    secondary: '#5856D6',
    card: '#FFFFFF',
    border: '#E0E0E0',
    notification: '#FF3B30',
    success: '#28A745',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#5AC8FA',
    shadow: 'rgba(0,0,0,0.1)',
  },
  dark: {
    text: '#fff',
    textSecondary: '#AAAAAA',
    textTertiary: '#888888',
    background: '#000',
    backgroundSecondary: '#1C1C1E',
    tint: tintColorDark,
    icon: '#fff',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    card: '#2C2C2E',
    border: '#555555',
    notification: '#FF453A',
    success: '#33CF4D',
    warning: '#FF9F0A',
    danger: '#FF453A',
    info: '#64D2FF',
    shadow: 'rgba(0,0,0,0.3)',
  },
};

export function getColors(colorScheme: ColorSchemeName) {
  return Colors[colorScheme || 'light'];
}

export default Colors;
