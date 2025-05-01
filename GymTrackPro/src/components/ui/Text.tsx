import React from 'react';
import { Text as RNText, TextStyle, StyleSheet, Platform } from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography } from '../../constants/Theme';

export type TextVariant = 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'title' 
  | 'subtitle' 
  | 'body' 
  | 'bodySmall' 
  | 'caption' 
  | 'tiny';

export interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  style?: TextStyle;
  color?: string;
  centered?: boolean;
  numberOfLines?: number;
  selectable?: boolean;
  testID?: string;
  onPress?: () => void;
}

/**
 * Text component following the GymTrackPro design system
 */
export default function Text({
  children,
  variant = 'body',
  style,
  color,
  centered = false,
  numberOfLines,
  selectable = false,
  testID,
  onPress,
}: TextProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Get style based on variant
  const getVariantStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      color: color || colors.text,
      textAlign: centered ? 'center' : undefined,
    };
    
    switch (variant) {
      case 'heading1':
        return {
          ...baseStyle,
          fontSize: Typography.heading1,
          fontWeight: '700',
          letterSpacing: -0.5,
          lineHeight: Typography.heading1 * 1.2,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
        };
      case 'heading2':
        return {
          ...baseStyle,
          fontSize: Typography.heading2,
          fontWeight: '700',
          letterSpacing: -0.3,
          lineHeight: Typography.heading2 * 1.2,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
        };
      case 'heading3':
        return {
          ...baseStyle,
          fontSize: Typography.heading3,
          fontWeight: '600',
          letterSpacing: -0.2,
          lineHeight: Typography.heading3 * 1.2,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
        };
      case 'title':
        return {
          ...baseStyle,
          fontSize: Typography.title,
          fontWeight: '600',
          letterSpacing: -0.1,
          lineHeight: Typography.title * 1.3,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif-medium',
        };
      case 'subtitle':
        return {
          ...baseStyle,
          fontSize: Typography.subtitle,
          fontWeight: '500',
          lineHeight: Typography.subtitle * 1.3,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif-medium',
        };
      case 'body':
        return {
          ...baseStyle,
          fontSize: Typography.body,
          fontWeight: '400',
          lineHeight: Typography.body * 1.5,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
        };
      case 'bodySmall':
        return {
          ...baseStyle,
          fontSize: Typography.bodySmall,
          fontWeight: '400',
          lineHeight: Typography.bodySmall * 1.5,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
        };
      case 'caption':
        return {
          ...baseStyle,
          fontSize: Typography.caption,
          fontWeight: '500',
          lineHeight: Typography.caption * 1.4,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
          color: color || colors.textSecondary,
        };
      case 'tiny':
        return {
          ...baseStyle,
          fontSize: Typography.tiny,
          fontWeight: '500',
          lineHeight: Typography.tiny * 1.3,
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
          color: color || colors.textTertiary,
          letterSpacing: 0.2,
        };
      default:
        return baseStyle;
    }
  };
  
  return (
    <RNText
      style={[getVariantStyle(), style]}
      numberOfLines={numberOfLines}
      selectable={selectable}
      testID={testID}
      onPress={onPress}
    >
      {children}
    </RNText>
  );
}

/**
 * Title component - Convenience wrapper for Text with 'heading1' variant
 */
export function Title(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="heading1" />;
}

/**
 * Heading component - Convenience wrapper for Text with 'heading2' variant
 */
export function Heading(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="heading2" />;
}

/**
 * Subheading component - Convenience wrapper for Text with 'heading3' variant
 */
export function Subheading(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="heading3" />;
}

/**
 * Body component - Convenience wrapper for Text with 'body' variant
 */
export function Body(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="body" />;
}

/**
 * Caption component - Convenience wrapper for Text with 'caption' variant
 */
export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="caption" />;
} 