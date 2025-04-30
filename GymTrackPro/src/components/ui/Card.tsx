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
import { Colors, Theme, BorderRadius, createNeumorphism, createShadow } from '../../constants/Theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  category?: 'workout' | 'achievement' | 'default';
  compact?: boolean;
  neumorphic?: boolean;
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
  compact = false,
  neumorphic = true,
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
          borderLeftWidth: 4,
          borderLeftColor: accentColor || colors.primary,
        };
      case 'achievement':
        return {
          ...baseStyles,
          borderRadius: BorderRadius.lg,
          shadowColor: accentColor || colors.primary,
          shadowOpacity: darkMode ? 0.4 : 0.15,
        };
      default:
        return baseStyles;
    }
  };
  
  // Get padding based on compact prop
  const getPadding = () => {
    return compact ? 16 : 20;
  };
  
  // Apply neumorphic styles or regular shadow
  const getShadowStyles = () => {
    if (!neumorphic) {
      return createShadow(4, colors.shadow);
    }
    
    return createNeumorphism(darkMode ? false : true, 4);
  };
  
  const cardStyles = [
    styles.card,
    {
      backgroundColor: category === 'achievement' && gradientColors ? 'transparent' : colors.card,
      borderRadius: BorderRadius.lg,
      padding: getPadding(),
    },
    getShadowStyles(),
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
            style={StyleSheet.absoluteFillObject}
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
        activeOpacity={0.9}
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
    // Add more prominent shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
}); 