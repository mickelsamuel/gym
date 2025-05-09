import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import {Theme, BorderRadius, Spacing} from '../../constants/Theme';
import Text from './Text';
interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
  animate?: boolean;
  duration?: number;
  showPercentage?: boolean;
  label?: string;
}
/**
 * ProgressBar component
 * 
 * A customizable progress bar with animation support
 * following the design specification.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
  style,
  animate = true,
  duration = 500,
  showPercentage = false,
  label,
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  // Normalize progress to 0-1 range
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  // Animation setup
  const animatedProgress = useRef(new Animated.Value(0)).current;
  // Set default colors based on theme
  const defaultBackgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const defaultProgressColor = theme.primary;
  // Use provided colors or defaults
  const bgColor = backgroundColor || defaultBackgroundColor;
  const pgColor = progressColor || defaultProgressColor;
  // Calculate percentage for display
  const percentage = Math.round(normalizedProgress * 100);
  // Set border radius based on height
  const borderRadius = Math.min(height / 2, BorderRadius.sm);
  useEffect(() => {
    if (animate) {
      Animated.timing(animatedProgress, {
        toValue: normalizedProgress,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(normalizedProgress);
    }
  }, [normalizedProgress, animate, duration, animatedProgress]);
  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text variant="caption" style={styles.label}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text variant="caption" color={theme.textSecondary}>
              {`${percentage}%`}
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.progressBackground,
          {
            backgroundColor: bgColor,
            height,
            borderRadius,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: pgColor,
              width,
              height: '100%',
              borderRadius,
            },
          ]}
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    fontWeight: '500',
  },
  progressBackground: {
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {},
});
export default ProgressBar; 