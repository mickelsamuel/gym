/**
 * GymTrackPro Theme System
 * A comprehensive theme design system with a modern fitness aesthetic.
 */
import { Platform } from 'react-native';
// Color Palette
export const Colors = {
  // Primary Colors
  primaryBlue: '#3772FF', // Primary Blue
  primaryDarkBlue: '#2B5EF0',
  secondaryGreen: '#36B37E', // Secondary Green for success states and progress
  // Accent Colors
  accentOrange: '#FF9F5A', // Accent Orange for highlights and warnings
  accentPurple: '#A66EFC', // Accent Purple for special features
  accentSuccess: '#36B37E', // Success accent color
  accentDanger: '#E53935', // Danger accent color
  // Background Colors
  lightBackground: '#F5F7FA', // Light mode background
  darkBackground: '#1C1C1E', // Dark mode background
  lightCardBackground: '#FFFFFF',
  darkCardBackground: '#2C2C2E',
  // Text Colors
  primaryTextLight: '#202020', // Primary text in light mode
  secondaryTextLight: '#616161', // Secondary text in light mode
  tertiaryTextLight: '#9095A0', // Tertiary text/inactive in light mode
  primaryTextDark: '#FFFFFF', // Primary text in dark mode
  secondaryTextDark: '#B8B8B8', // Secondary text in dark mode
  tertiaryTextDark: '#9095A0', // Tertiary text in dark mode
  // Functional Colors
  success: '#36B37E', // Success Green
  warning: '#FFAB00', // Warning Yellow
  danger: '#E53935', // Error Red
  info: '#2196F3', // Info Blue
  // Light Blue for secondary backgrounds
  lightBlue: '#EEF3FF',
  // Muscle Group Colors
  muscleChest: '#FF5252', // Red
  muscleBack: '#448AFF', // Blue
  muscleLegs: '#7C4DFF', // Purple
  muscleShoulders: '#FFD740', // Yellow
  muscleArms: '#FF6E40', // Orange
  muscleCore: '#69F0AE', // Green
  muscleFullBody: '#40C4FF', // Light Blue
  muscleCardio: '#FF4081', // Pink
};
// Define the theme interface
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent1: string;
  accent2: string;
  background: string;
  card: string;
  cardElevated: string;
  success: string;
  warning: string;
  danger: string;
  error: string;
  info: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  shadow: string;
  overlay: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  inputBackground: string;
}
// Theme configuration
export const Theme: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    // Primary colors
    primary: Colors.primaryBlue,
    primaryDark: Colors.primaryDarkBlue,
    secondary: Colors.secondaryGreen,
    // Accent colors
    accent1: Colors.accentPurple,
    accent2: Colors.accentOrange,
    // Backgrounds
    background: Colors.lightBackground,
    card: Colors.lightCardBackground,
    cardElevated: '#FFFFFF',
    // Accents
    success: Colors.success,
    warning: Colors.warning,
    danger: Colors.danger,
    error: Colors.danger,
    info: Colors.info,
    // Text
    text: Colors.primaryTextLight,
    textSecondary: Colors.secondaryTextLight,
    textTertiary: Colors.tertiaryTextLight,
    // UI Elements
    border: 'rgba(0, 0, 0, 0.08)',
    shadow: 'rgba(15, 34, 67, 0.1)',
    overlay: 'rgba(15, 23, 42, 0.4)',
    // Navigation
    tabBar: Colors.lightCardBackground,
    tabBarInactive: Colors.tertiaryTextLight,
    tabBarActive: Colors.primaryBlue,
    // Inputs
    inputBackground: '#F8F9FB',
  },
  dark: {
    // Primary colors
    primary: Colors.primaryBlue,
    primaryDark: Colors.primaryDarkBlue,
    secondary: Colors.secondaryGreen,
    // Accent colors
    accent1: Colors.accentPurple,
    accent2: Colors.accentOrange,
    // Backgrounds
    background: Colors.darkBackground,
    card: Colors.darkCardBackground,
    cardElevated: '#252A3F',
    // Accents
    success: Colors.success,
    warning: Colors.warning,
    danger: Colors.danger,
    error: Colors.danger,
    info: Colors.info,
    // Text
    text: Colors.primaryTextDark,
    textSecondary: Colors.secondaryTextDark,
    textTertiary: Colors.tertiaryTextDark,
    // UI Elements
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.25)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    // Navigation
    tabBar: 'rgba(30, 34, 53, 0.95)',
    tabBarInactive: Colors.tertiaryTextDark,
    tabBarActive: Colors.primaryBlue,
    // Inputs
    inputBackground: 'rgba(255, 255, 255, 0.05)',
  }
};
// Typography
export const Typography = {
  // Font Families
  fontFamily: 'Inter',
  fontFamilyFallback: Platform?.OS === 'ios' ? 'San Francisco' : 'Roboto',
  // Font Sizes
  display: { fontSize: 36, fontWeight: '700', fontFamily: 'Inter-Bold' },
  heading1: { fontSize: 32, fontWeight: '700', fontFamily: 'Inter-Bold' },
  title: { fontSize: 32, fontWeight: '700', fontFamily: 'Inter-Bold' },
  heading2: { fontSize: 28, fontWeight: '700', fontFamily: 'Inter-Bold' },
  heading3: { fontSize: 24, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  subtitle: { fontSize: 20, fontWeight: '500', fontFamily: 'Inter-Medium' },
  bodyLarge: { fontSize: 18, fontWeight: '400', fontFamily: 'Inter' },
  body: { fontSize: 16, fontWeight: '400', fontFamily: 'Inter' },
  bodySmall: { fontSize: 14, fontWeight: '400', fontFamily: 'Inter' },
  caption: { fontSize: 12, fontWeight: '500', fontFamily: 'Inter-Medium' },
  micro: { fontSize: 10, fontWeight: '500', fontFamily: 'Inter-Medium' },
  tiny: { fontSize: 10, fontWeight: '400', fontFamily: 'Inter' },
  // Font Weights
  bold: '700',
  medium: '500',
  regular: '400',
  light: '300',
};
// Spacing
export const Spacing = {
  tiny: 4,    // Minimum spacing, icon padding
  xs: 8,      // Tight spacing, between related elements
  sm: 12,     // Standard spacing, within components
  md: 16,     // Default spacing, between components
  lg: 24,     // Section spacing, generous component spacing
  xl: 32,     // Screen padding, major section separation
  xxl: 48,    // Dramatic separation, major screen divisions
};
// Border Radius
export const BorderRadius = {
  xs: 4,
  sm: 8,      // Input radius
  md: 12,     // Button radius
  lg: 16,     // Card radius
  xl: 24,
  pill: 100,  // Chip radius (full rounded)
  circle: 9999,
};
// Animation Timing
export const Animation = {
  fast: 150,   // Button presses, toggle switches
  normal: 250, // Normal animations (same as medium)
  medium: 250, // Page transitions, expandable elements
  slow: 400,   // Major transitions, loading states
};
// Animation Curves
export const AnimationCurves = {
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard (ease-in-out)
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // Decelerate (ease-out)
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)', // Accelerate (ease-in)
};
// Shadows
export const createShadow = (elevation: number, color = 'rgba(15, 34, 67, 0.12)') => {
  return {
    shadowColor: color,
    shadowOffset: {
      width: 0,
      height: elevation / 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: elevation,
    elevation: elevation,
  };
};
// Elevation helper (combines shadow with elevation)
export const createElevation = (level: number, isDark = false) => {
  const shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 34, 67, 0.12)';
  switch (level) {
    case 0:
      return {};
    case 1:
      return {
        shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.4 : 0.2,
        shadowRadius: 2,
        elevation: 2,
      };
    case 2:
      return {
        shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.5 : 0.23,
        shadowRadius: 4,
        elevation: 4,
      };
    case 3:
      return {
        shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.6 : 0.3,
        shadowRadius: 8,
        elevation: 8,
      };
    default:
      return {
        shadowColor,
        shadowOffset: { width: 0, height: level },
        shadowOpacity: isDark ? 0.6 : 0.3,
        shadowRadius: level * 2,
        elevation: level * 2,
      };
  }
};
// Muscle Group Color Mapping
export const MuscleGroupColors = {
  chest: Colors.muscleChest,
  back: Colors.muscleBack,
  legs: Colors.muscleLegs,
  shoulders: Colors.muscleShoulders,
  arms: Colors.muscleArms,
  core: Colors.muscleCore,
  fullBody: Colors.muscleFullBody,
  cardio: Colors.muscleCardio,
};
// Default export of the full theme
export default {
  Colors,
  Theme,
  Typography,
  Spacing,
  BorderRadius,
  Animation,
  AnimationCurves,
  createShadow,
  createElevation,
  MuscleGroupColors
}; 