/**
 * GymTrackPro Theme System
 * A comprehensive theme design system implementing the Neumorphic Fitness design approach.
 */

import { Platform, PlatformIOSStatic } from 'react-native';

// Color Palette
export const Colors = {
  // Primary Colors
  primaryBlue: '#0A6CFF',
  primaryDarkBlue: '#0047AB',
  secondaryGreen: '#2ECB70',
  
  // Background Colors
  lightBackground: '#F9FAFC',
  darkBackground: '#161A23',
  
  // UI Element Colors
  lightCardBackground: '#FFFFFF',
  darkCardBackground: '#222833',
  accentSuccess: '#2ECB70',
  accentWarning: '#FFAA2B',
  accentDanger: '#FF4E64',
  
  // Text Colors
  primaryTextLight: '#14192D',
  secondaryTextLight: '#5D6B8A',
  primaryTextDark: '#F0F2F5',
  secondaryTextDark: '#AAB4CD',
};

// Theme configuration
export const Theme = {
  light: {
    // Primary colors
    primary: Colors.primaryBlue,
    primaryDark: Colors.primaryDarkBlue,
    secondary: Colors.secondaryGreen,
    
    // Backgrounds
    background: Colors.lightBackground,
    card: Colors.lightCardBackground,
    
    // Accents
    success: Colors.accentSuccess,
    warning: Colors.accentWarning,
    danger: Colors.accentDanger,
    
    // Text
    text: Colors.primaryTextLight,
    textSecondary: Colors.secondaryTextLight,
    
    // UI Elements
    border: 'rgba(0, 0, 0, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
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
    
    // Backgrounds
    background: Colors.darkBackground,
    card: Colors.darkCardBackground,
    
    // Accents
    success: Colors.accentSuccess,
    warning: Colors.accentWarning,
    danger: Colors.accentDanger,
    
    // Text
    text: Colors.primaryTextDark,
    textSecondary: Colors.secondaryTextDark,
    
    // UI Elements
    border: 'rgba(255, 255, 255, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Navigation
    tabBar: Colors.darkCardBackground,
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
  title: 28,
  sectionHeader: 22,
  cardTitle: 18,
  body: 16,
  button: 16,
  caption: 14,
  small: 12,
  
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
  circle: 9999,
};

// Shadows
export const createShadow = (elevation: number, color = 'rgba(0, 0, 0, 0.08)') => {
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

// Neumorphic Effects
export const createNeumorphism = (isLight: boolean, elevation = 4) => {
  if (isLight) {
    return {
      backgroundColor: Colors.lightCardBackground,
      shadowColor: Colors.primaryTextLight,
      shadowOffset: {
        width: -elevation,
        height: -elevation,
      },
      shadowOpacity: 0.08,
      shadowRadius: elevation * 1.5,
      elevation: elevation,
    };
  } else {
    return {
      backgroundColor: Colors.darkCardBackground,
      shadowColor: '#000',
      shadowOffset: {
        width: -elevation,
        height: -elevation,
      },
      shadowOpacity: 0.3,
      shadowRadius: elevation * 1.5,
      elevation: elevation,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
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
  createNeumorphism,
  Animation,
}; 