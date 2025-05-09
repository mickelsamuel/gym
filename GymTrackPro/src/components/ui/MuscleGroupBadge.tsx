import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useExercise } from '../../context/ExerciseContext';
import {Theme, BorderRadius, Spacing, Colors} from '../../constants/Theme';
import Text from './Text';
interface MuscleGroupBadgeProps {
  muscleGroup: string;
  label?: string;
  style?: ViewStyle;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  count?: number;
  testID?: string;
}
/**
 * MuscleGroupBadge component
 * 
 * A gradient badge specifically designed for muscle groups
 * Uses the color coding from the design specification
 */
const MuscleGroupBadge: React.FC<MuscleGroupBadgeProps> = ({
  muscleGroup,
  label,
  style,
  onPress,
  size = 'medium',
  selected = false,
  count,
  testID,
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  // Get the muscle group color
  const getMuscleGroupColor = (muscleId: string): string => {
    const muscleColors: Record<string, string> = {
      chest: Colors.muscleChest,
      back: Colors.muscleBack,
      legs: Colors.muscleLegs,
      shoulders: Colors.muscleShoulders,
      arms: Colors.muscleArms,
      core: Colors.muscleCore,
      fullBody: Colors.muscleFullBody,
      cardio: Colors.muscleCardio,
    };
    return muscleColors[muscleId.toLowerCase()] || theme.primary;
  };
  // Get badge dimensions based on size
  const getBadgeDimensions = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: Spacing.tiny,
          paddingHorizontal: Spacing.sm,
          borderRadius: BorderRadius.sm,
        };
      case 'large':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.md,
        };
      default:
        return {
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.sm,
          borderRadius: BorderRadius.sm,
        };
    }
  };
  // Get text size based on badge size
  const getTextVariant = () => {
    switch (size) {
      case 'small': return 'caption';
      case 'large': return 'bodySmall';
      default: return 'caption';
    }
  };
  // Get base color for the badge
  const baseColor = getMuscleGroupColor(muscleGroup);
  // Create gradient colors
  const gradientColors = [
    baseColor,
    Platform.select({
      ios: baseColor, // On iOS, we'll use opacity in the style
      android: `${baseColor}99`, // On Android, we'll use a slightly transparent end color
    }) || baseColor, // Add fallback value
  ] as readonly [string, string];
  // Badge content
  const displayText = label || muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1);
  // Badge component
  const BadgeComponent = onPress ? TouchableOpacity : View;
  return (
    <BadgeComponent
      style={[style]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          getBadgeDimensions(),
          {
            opacity: selected ? 1 : 0.85,
            shadowColor: baseColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: selected ? 0.5 : 0.2,
            shadowRadius: 4,
            elevation: selected ? 3 : 1,
          },
        ]}
      >
        <Text 
          variant={getTextVariant()} 
          weight="medium" 
          color="#FFFFFF"
          style={styles.text}
        >
          {displayText}
          {count !== undefined && ` (${count})`}
        </Text>
      </LinearGradient>
    </BadgeComponent>
  );
};
const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
export default MuscleGroupBadge; 