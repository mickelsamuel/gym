/**
 * GymTrackPro Color System
 * This file is maintained for backward compatibility but imports from Theme.ts
 */

import { ColorSchemeName } from 'react-native';
import { Colors as ThemeColors, Theme } from './Theme';

// Backward compatibility for existing color references
const Colors = {
  light: {
    text: ThemeColors.primaryTextLight,
    textSecondary: ThemeColors.secondaryTextLight,
    textTertiary: '#999999',
    background: ThemeColors.lightBackground,
    backgroundSecondary: ThemeColors.lightCardBackground,
    tint: ThemeColors.primaryBlue,
    icon: ThemeColors.secondaryTextLight,
    tabIconDefault: '#ccc',
    tabIconSelected: ThemeColors.primaryBlue,
    primary: ThemeColors.primaryBlue,
    secondary: ThemeColors.primaryDarkBlue,
    card: ThemeColors.lightCardBackground,
    border: 'rgba(0, 0, 0, 0.1)',
    notification: ThemeColors.accentDanger,
    success: ThemeColors.accentSuccess,
    warning: ThemeColors.accentWarning,
    danger: ThemeColors.accentDanger,
    info: '#5AC8FA',
    shadow: 'rgba(0,0,0,0.08)',
  },
  dark: {
    text: ThemeColors.primaryTextDark,
    textSecondary: ThemeColors.secondaryTextDark,
    textTertiary: '#888888',
    background: ThemeColors.darkBackground,
    backgroundSecondary: ThemeColors.darkCardBackground,
    tint: ThemeColors.primaryBlue,
    icon: ThemeColors.primaryTextDark,
    tabIconDefault: '#515154',
    tabIconSelected: ThemeColors.primaryBlue,
    primary: ThemeColors.primaryBlue,
    secondary: ThemeColors.primaryDarkBlue,
    card: ThemeColors.darkCardBackground,
    border: 'rgba(255, 255, 255, 0.15)',
    notification: ThemeColors.accentDanger,
    success: ThemeColors.accentSuccess,
    warning: ThemeColors.accentWarning,
    danger: ThemeColors.accentDanger,
    info: '#64D2FF',
    shadow: 'rgba(0,0,0,0.3)',
  },
};

export function getColors(colorScheme: ColorSchemeName) {
  return Colors[colorScheme || 'light'];
}

export default Colors;
