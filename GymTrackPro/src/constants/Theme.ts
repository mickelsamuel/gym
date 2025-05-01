/**
 * GymTrackPro Theme System
 * A comprehensive theme design system with a modern fitness aesthetic.
 */

import { Platform, PlatformIOSStatic } from 'react-native';

// Color Palette
export const Colors = {
  // Primary Colors
  primaryBlue: '#3772FF', // Brighter, more vibrant blue
  primaryDarkBlue: '#2B5EF0',
  secondaryGreen: '#38D9A9', // More turquoise-like green
  
  // Background Colors
  lightBackground: '#F7F9FC', // Slightly cooler tone
  darkBackground: '#121420', // Deeper, richer dark mode
  
  // UI Element Colors
  lightCardBackground: '#FFFFFF',
  darkCardBackground: '#1E2235',
  accentSuccess: '#38D9A9',
  accentWarning: '#FFC43D', // Warmer, more visible yellow
  accentDanger: '#FF5A5F', // More coral-like red
  accentPurple: '#A66EFC', // New accent color for variety
  accentOrange: '#FF9F5A', // New accent color for energy
  
  // Text Colors
  primaryTextLight: '#1A202C', // Darker for better contrast
  secondaryTextLight: '#4A5568', // Better mid-gray
  tertiaryTextLight: '#718096', // Lighter text for less important elements
  primaryTextDark: '#F0F4FD',
  secondaryTextDark: '#CBD5E0',
  tertiaryTextDark: '#A0AEC0',
};

// Theme configuration
export const Theme = {
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
    success: Colors.accentSuccess,
    warning: Colors.accentWarning,
    danger: Colors.accentDanger,
    
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
    tabBarInactive: Colors.secondaryTextLight,
    tabBarActive: Colors.primaryBlue,
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
    success: Colors.accentSuccess,
    warning: Colors.accentWarning,
    danger: Colors.accentDanger,
    
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
    tabBarInactive: Colors.secondaryTextDark,
    tabBarActive: Colors.primaryBlue,
  }
};

// Typography
export const Typography = {
  // Font Families
  fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  fontFamilyRounded: Platform.OS === 'ios' ? 'SF Pro Rounded' : 'Product Sans',
  
  // Font Sizes
  heading1: 32,
  heading2: 28,
  heading3: 24,
  title: 20,
  subtitle: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,
  
  // Font Weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 100,
  circle: 9999,
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

// Modern Card Elevation
export const createElevation = (level: number, isDark = false) => {
  const color = isDark ? '#000' : 'rgba(15, 34, 67, 0.12)';
  const opacity = isDark ? 0.5 : 0.15;
  
  switch (level) {
    case 0:
      return {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0
      };
    case 1:
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: opacity,
        shadowRadius: 2,
        elevation: 2
      };
    case 2:
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: opacity,
        shadowRadius: 4,
        elevation: 4
      };
    case 3:
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: opacity,
        shadowRadius: 8,
        elevation: 8
      };
    case 4:
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: opacity,
        shadowRadius: 16,
        elevation: 16
      };
    default:
      return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: opacity,
        shadowRadius: 4,
        elevation: 4
      };
  }
};

// Animation Timing
export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Default export of the full theme
export default {
  Colors,
  Theme,
  Typography,
  Spacing,
  BorderRadius,
  createShadow,
  createElevation,
  Animation,
}; 