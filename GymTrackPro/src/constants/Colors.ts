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
    notification: ThemeColors.danger,
    success: ThemeColors.success,
    warning: ThemeColors.warning,
    danger: ThemeColors.danger,
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
    notification: ThemeColors.danger,
    success: ThemeColors.success,
    warning: ThemeColors.warning,
    danger: ThemeColors.danger,
    info: '#64D2FF',
    shadow: 'rgba(0,0,0,0.3)',
  },
};
// Muscle Group Colors (added as per design specification)
export const muscleChest = '#FF5252';     // Red
export const muscleBack = '#448AFF';      // Blue
export const muscleLegs = '#7C4DFF';      // Purple
export const muscleShoulders = '#FFD740'; // Yellow
export const muscleArms = '#FF6E40';      // Orange
export const muscleCore = '#69F0AE';      // Green
export const muscleFullBody = '#40C4FF';  // Light Blue
export const muscleCardio = '#FF4081';    // Pink
// Functional Colors
export const success = '#36B37E';
export const error = '#E53935';
export const warning = '#FFAB00';
export const info = '#2196F3';
export function getColors(colorScheme: ColorSchemeName) {
  return Colors[colorScheme || 'light'];
}
export default Colors;
