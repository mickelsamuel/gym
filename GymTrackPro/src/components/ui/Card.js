import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Colors from '../../constants/Colors';

/**
 * Modern card component with shadow and various style options
 */
export default function Card({
  children,
  style,
  onPress,
  dark = false,
  elevation = 2,
  bordered = false,
  compact = false,
  disabled = false,
  ...props
}) {
  // Initialize a default colors object in case the import fails
  const defaultColors = {
    light: {
      card: '#FFFFFF',
      border: '#E0E0E0',
      shadow: 'rgba(0,0,0,0.1)',
    },
    dark: {
      card: '#2C2C2E',
      border: '#555555',
      shadow: 'rgba(0,0,0,0.3)',
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = dark ? colorScheme.dark : colorScheme.light;
  
  const containerStyles = [
    styles.container,
    {
      backgroundColor: colors.card,
      borderColor: bordered ? colors.border : 'transparent',
      padding: compact ? 12 : 16,
      opacity: disabled ? 0.7 : 1,
      // Platform-specific shadows
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: elevation },
          shadowOpacity: 0.15,
          shadowRadius: elevation * 2,
        },
        android: {
          elevation: elevation,
        },
      }),
    },
    style,
  ];
  
  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={disabled ? null : onPress}
        activeOpacity={0.8}
        disabled={disabled}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={containerStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
}); 