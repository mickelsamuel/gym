import React from 'react';
import { Text as RNText, StyleSheet, TextStyle, TextProps as RNTextProps, StyleProp } from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography } from '../../constants/Theme';

// Define a type for typography variants
type TypographyVariant = {
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
};

interface TextProps extends RNTextProps {
  children: React.ReactNode;
  variant?: 
    | 'display' 
    | 'heading1' 
    | 'heading2' 
    | 'heading3' 
    | 'title'
    | 'subtitle' 
    | 'bodyLarge' 
    | 'body' 
    | 'bodySmall' 
    | 'caption' 
    | 'micro'
    | 'tiny';
  style?: StyleProp<TextStyle>;
  color?: string;
  weight?: 'bold' | 'medium' | 'regular' | 'light';
  align?: 'left' | 'center' | 'right' | 'justify';
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
 * With fallbacks to system fonts when custom fonts fail to load
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
  const typographyStyle = Typography[variant as keyof typeof Typography] || Typography.body;
  
  // Get font family based on weight and variant
  const getFontFamily = () => {
    // Primary font family with system fallbacks
    const primaryFontFamily = (fontName: string): string => {
      return fontName; // No longer return array
    };
    
    // If weight is explicitly provided, use that to determine font family
    if (weight) {
      switch (weight) {
        case 'bold': return primaryFontFamily('Inter-Bold');
        case 'medium': return primaryFontFamily('Inter-Medium');
        case 'light': return primaryFontFamily('Inter-Light');
        case 'regular': return primaryFontFamily('Inter');
        default: return primaryFontFamily('Inter');
      }
    }
    
    // Otherwise determine based on the typographyStyle fontWeight
    const fontStyleWeight = typeof typographyStyle === 'object' && 'fontWeight' in typographyStyle 
      ? typographyStyle.fontWeight 
      : '400';
    
    switch (fontStyleWeight) {
      case '700': return primaryFontFamily('Inter-Bold');
      case '800': return primaryFontFamily('Inter-ExtraBold');
      case '900': return primaryFontFamily('Inter-Black');
      case '600': return primaryFontFamily('Inter-SemiBold');
      case '500': return primaryFontFamily('Inter-Medium');
      case '300': return primaryFontFamily('Inter-Light');
      case '200': return primaryFontFamily('Inter-ExtraLight');
      case '100': return primaryFontFamily('Inter-Thin');
      default: return primaryFontFamily('Inter');
    }
  };
  
  // Handle color with fallbacks
  const finalColor = color || theme.text;
  
  // Create a valid style object
  const variantStyle: TextStyle = typeof typographyStyle === 'object' 
    ? typographyStyle as TextStyle 
    : {};
  
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
    fontSize: 16,
    lineHeight: 24,
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