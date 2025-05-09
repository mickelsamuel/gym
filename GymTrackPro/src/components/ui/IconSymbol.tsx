// This file is a fallback for using MaterialIcons on Android and web.
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { BorderRadius } from '../../constants/Theme';
import { useColorScheme } from '../../hooks/useColorScheme';
export interface IconSymbolProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  containerStyle?: ViewStyle;
  circular?: boolean;
  filled?: boolean;
}
export function IconSymbol({
  name,
  size = 24,
  color,
  backgroundColor,
  containerStyle,
  circular = true,
  filled = false,
}: IconSymbolProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  // Default colors based on theme
  const defaultColor = color || theme.text;
  const defaultBgColor = backgroundColor || (filled ? theme.primary : 'transparent');
  return (
    <View
      style={[
        styles.container,
        circular && styles.circular,
        { backgroundColor: defaultBgColor },
        containerStyle,
      ]}
    >
      <Ionicons name={name} size={size} color={defaultColor} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: BorderRadius.sm,
  },
  circular: {
    borderRadius: BorderRadius.circle,
  },
});
