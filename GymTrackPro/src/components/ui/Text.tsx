import React, { ReactNode } from 'react';
import {
  Text as RNText,
  TextStyle,
  StyleSheet,
  TextProps as RNTextProps,
  Platform,
} from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography } from '../../constants/Theme';

export type TextVariant = 
  | 'title'       // Page Title: 28px / Bold
  | 'sectionHeader' // Section Header: 22px / Semibold
  | 'cardTitle'   // Card Title: 18px / Semibold
  | 'body'        // Body Text: 16px / Regular
  | 'button'      // Button Text: 16px / Medium
  | 'caption'     // Caption: 14px / Regular
  | 'small';      // Small Text: 12px / Regular

export interface TextProps extends RNTextProps {
  children: ReactNode;
  variant?: TextVariant;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  centered?: boolean;
  style?: TextStyle;
  animated?: boolean;
}

/**
 * Text component following the GymTrackPro design system
 */
const Text = ({
  children,
  variant = 'body',
  weight,
  color,
  centered = false,
  style,
  ...props
}: TextProps) => {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Get font size based on variant
  const getFontSize = () => {
    switch (variant) {
      case 'title': return Typography.title;
      case 'sectionHeader': return Typography.sectionHeader;
      case 'cardTitle': return Typography.cardTitle;
      case 'body': return Typography.body;
      case 'button': return Typography.button;
      case 'caption': return Typography.caption;
      case 'small': return Typography.small;
      default: return Typography.body;
    }
  };
  
  // Get font weight based on variant and weight prop
  const getFontWeight = (): TextStyle['fontWeight'] => {
    // Weight prop overrides default variant weight
    if (weight) {
      switch (weight) {
        case 'regular': return '400';
        case 'medium': return '500';
        case 'semibold': return '600';
        case 'bold': return '700';
      }
    }
    
    // Default weights for variants
    switch (variant) {
      case 'title': return '700';
      case 'sectionHeader':
      case 'cardTitle': return '600';
      case 'button': return '500';
      default: return '400';
    }
  };
  
  // Get font family
  const getFontFamily = () => {
    // Use rounded fonts for buttons on iOS
    if (variant === 'button' && Platform.OS === 'ios') {
      return 'SF Pro Rounded';
    }
    
    return Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto';
  };
  
  return (
    <RNText
      style={[
        styles.text,
        {
          color: color || colors.text,
          fontSize: getFontSize(),
          fontWeight: getFontWeight(),
          fontFamily: getFontFamily(),
          textAlign: centered ? 'center' : 'left',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  text: {
    letterSpacing: 0.1,
  },
});

export default Text; 