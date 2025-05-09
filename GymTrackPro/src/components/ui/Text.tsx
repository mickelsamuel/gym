import React from 'react';
import { Text as RNText, StyleSheet, TextStyle, StyleProp, TextProps as RNTextProps } from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography } from '../../constants/Theme';
export type TextVariant = 
  | 'display'
  | 'title'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'subtitle'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'micro'
  | 'tiny';
export interface TextProps extends RNTextProps {
  children?: React.ReactNode;
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
  color?: string;
  weight?: 'bold' | 'medium' | 'regular' | 'light';
  align?: 'left' | 'center' | 'right';
  accessibilityLabel?: string;
  testID?: string;
  maxFontSizeMultiplier?: number;
  selectable?: boolean;
}
// Default max font size multiplier
const defaultMaxFontSizeMultiplier = 1.5;
/**
 * Text component following the GymTrackPro design system
 * Uses the Inter font family with appropriate weights and styles
 */
const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  style,
  color,
  weight,
  align = 'left',
  accessibilityLabel,
  testID,
  maxFontSizeMultiplier,
  selectable = false,
  ...rest
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  // Get the variant style from Typography
  const variantStyle = Typography[variant as keyof typeof Typography] || Typography.body;
  // Get font family based on weight and variant
  const getFontFamily = () => {
    // If weight is explicitly provided, use that to determine font family
    if (weight) {
      switch (weight) {
        case 'bold': return 'Inter-Bold';
        case 'medium': return 'Inter-Medium';
        case 'light': return 'Inter-Light';
        case 'regular': return 'Inter';
        default: return 'Inter';
      }
    }
    // Otherwise determine based on the variantStyle fontWeight
    const fontStyleWeight = typeof variantStyle === 'object' && 'fontWeight' in variantStyle 
      ? variantStyle.fontWeight 
      : '400';
    switch (fontStyleWeight) {
      case '700': return 'Inter-Bold';
      case '800': return 'Inter-ExtraBold';
      case '900': return 'Inter-Black';
      case '500': return 'Inter-Medium';
      case '600': return 'Inter-SemiBold';
      case '300': return 'Inter-Light';
      case '200': return 'Inter-ExtraLight';
      case '100': return 'Inter-Thin';
      default: return 'Inter';
    }
  };
  // Handle color with fallbacks
  const finalColor = color || theme.text;
  return (
    <RNText
      style={[
        styles.base,
        variantStyle,
        {
          color: finalColor,
          textAlign: align,
          fontFamily: getFontFamily(),
        },
        style
      ]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      selectable={selectable}
      maxFontSizeMultiplier={maxFontSizeMultiplier || defaultMaxFontSizeMultiplier}
      allowFontScaling={true}
      {...rest}
    >
      {children}
    </RNText>
  );
};
const styles = StyleSheet.create({
  base: {
    // Base text styles
  },
});
export default Text;
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