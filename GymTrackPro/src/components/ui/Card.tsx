import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useExercise } from '../../context/ExerciseContext';
import { Colors, Theme, BorderRadius, createElevation } from '../../constants/Theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  category?: 'workout' | 'achievement' | 'social' | 'stats' | 'default';
  elevation?: 0 | 1 | 2 | 3 | 4;
  compact?: boolean;
  accentColor?: string;
  gradientColors?: [string, string];  // Fixed to expect exactly two colors
}

/**
 * Card component following the GymTrackPro design system
 */
export default function Card({
  children,
  style,
  onPress,
  disabled = false,
  testID,
  category = 'default',
  elevation = 2,
  compact = false,
  accentColor,
  gradientColors,
}: CardProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Apply styles based on card category
  const getCategoryStyles = () => {
    const baseStyles: ViewStyle = {};
    
    switch (category) {
      case 'workout':
        return {
          ...baseStyles,
          borderLeftWidth: 3,
          borderLeftColor: accentColor || colors.primary,
        };
      case 'achievement':
        return {
          ...baseStyles,
          borderRadius: BorderRadius.lg,
        };
      case 'social':
        return {
          ...baseStyles,
          borderRadius: BorderRadius.md,
          borderColor: colors.border,
          borderWidth: darkMode ? 1 : 0,
        };
      case 'stats':
        return {
          ...baseStyles,
          borderRadius: BorderRadius.lg,
          borderColor: colors.border,
          borderWidth: 1,
          backgroundColor: darkMode ? 'rgba(30, 34, 53, 0.5)' : 'rgba(255, 255, 255, 0.8)',
        };
      default:
        return baseStyles;
    }
  };
  
  // Get padding based on compact prop
  const getPadding = () => {
    return compact ? 12 : 16;
  };
  
  // Apply elevation styles based on level
  const getElevationStyles = () => {
    if (category === 'stats') {
      return {};
    }
    
    return createElevation(elevation, darkMode);
  };
  
  const cardBackground = category === 'achievement' && gradientColors 
    ? 'transparent' 
    : (category === 'stats' 
      ? (darkMode ? 'rgba(30, 34, 53, 0.5)' : 'rgba(255, 255, 255, 0.8)') 
      : colors.card);
  
  const cardStyles = [
    styles.card,
    {
      backgroundColor: cardBackground,
      borderRadius: BorderRadius.lg,
      padding: getPadding(),
    },
    getElevationStyles(),
    getCategoryStyles(),
    style,
  ];

  const renderCardContent = () => {
    if (category === 'achievement' && gradientColors) {
      return (
        <>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]}
          />
          {children}
        </>
      );
    }
    
    return children;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        style={cardStyles as any}
      >
        {renderCardContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={cardStyles as any}>
      {renderCardContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginVertical: 8,
    overflow: 'hidden',
  },
}); 