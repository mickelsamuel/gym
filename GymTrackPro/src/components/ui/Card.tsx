import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  TouchableOpacity, 
  Pressable, 
  Platform 
} from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Colors, createElevation, BorderRadius, Spacing } from '../../constants/Theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: string;
  pressable?: boolean;
  noPadding?: boolean;
  transparent?: boolean;
  testID?: string;
  category?: string;
  gradientColors?: [string, string];
  compact?: boolean;
  accentColor?: string;
}

/**
 * Card component
 * 
 * A versatile card component that follows the design specification for
 * surface elements. Supports different elevations, border radii, and
 * can be pressable if needed.
 */
const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = 1,
  borderRadius = 'md',
  background,
  pressable = false,
  noPadding = false,
  transparent = false,
  testID,
  category,
  gradientColors,
  compact = false,
  accentColor,
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  
  // Determine border radius value
  const borderRadiusValue = BorderRadius[borderRadius];
  
  // Get elevation shadow style
  const shadowStyle = createElevation(elevation);
  
  // Default padding based on card size
  const padding = noPadding ? 0 : Spacing.md;
  
  // Base card styles
  const cardStyle: ViewStyle = {
    borderRadius: borderRadiusValue,
    backgroundColor: transparent 
      ? 'transparent' 
      : background || theme.card,
    padding,
    ...shadowStyle,
  };
  
  // Combined style
  const combinedStyle = [cardStyle, style];
  
  // If pressable or onPress provided, return TouchableOpacity
  if (pressable || onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          combinedStyle,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: false }}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }
  
  // Otherwise return a regular View
  return (
    <View style={combinedStyle} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: Platform.OS === 'ios' ? 0.7 : 1,
  },
});

export default Card; 