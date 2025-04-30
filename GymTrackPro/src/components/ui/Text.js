import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

/**
 * Typography component for consistent text styling
 */
export default function Text({
  children,
  style,
  variant = 'body',
  color,
  weight,
  dark = false,
  align,
  numberOfLines,
  ...props
}) {
  // Initialize a default colors object in case the import fails
  const defaultColors = {
    light: {
      text: '#333333',
      textSecondary: '#666666',
    },
    dark: {
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = dark ? colorScheme.dark : colorScheme.light;
  
  const getDefaultTextColor = () => {
    switch (variant) {
      case 'title':
      case 'heading':
      case 'subheading':
      case 'body':
        return colors.text;
      case 'caption':
      case 'label':
        return colors.textSecondary;
      default:
        return colors.text;
    }
  };
  
  const getFontWeight = () => {
    if (weight) return weight;
    
    switch (variant) {
      case 'title': return '800';
      case 'heading': return '700';
      case 'subheading': return '600';
      case 'body': return '400';
      case 'caption': return '400';
      case 'label': return '500';
      default: return '400';
    }
  };
  
  const getFontSize = () => {
    switch (variant) {
      case 'title': return 28;
      case 'heading': return 22;
      case 'subheading': return 18;
      case 'body': return 16;
      case 'caption': return 14;
      case 'label': return 14;
      default: return 16;
    }
  };
  
  return (
    <RNText
      style={[
        {
          color: color || getDefaultTextColor(),
          fontSize: getFontSize(),
          fontWeight: getFontWeight(),
          textAlign: align,
          letterSpacing: variant === 'title' || variant === 'heading' ? -0.5 : 0,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Define common usage pattern exports
export const Title = props => <Text variant="title" {...props} />;
export const Heading = props => <Text variant="heading" {...props} />;
export const Subheading = props => <Text variant="subheading" {...props} />;
export const Body = props => <Text variant="body" {...props} />;
export const Caption = props => <Text variant="caption" {...props} />;
export const Label = props => <Text variant="label" {...props} />; 