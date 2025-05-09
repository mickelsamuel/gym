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
  animated?: boolean;
  animationDuration?: number;
  borderRadius?: number;
  showPercentage?: boolean;
  label?: string;
}
/**
 * ProgressBar component
 * 
 * Displays a horizontal progress bar with customizable colors and animation
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
  style,
  animated = true,
  animationDuration = 300,
  borderRadius,
  showPercentage = false,
  label,
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Set default colors if not provided
  const bgColor = backgroundColor || (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
  const fgColor = progressColor || theme.primary;
  const roundness = borderRadius !== undefined ? borderRadius : BorderRadius.pill;
  
  // Animate progress changes
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated, animationDuration]);
  
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });
  
  // Calculate percentage for display
  const percentage = Math.round(progress * 100);
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          height, 
          backgroundColor: bgColor,
          borderRadius: roundness
        },
        style
      ]}
    >
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
      <Animated.View 
        style={[
          styles.progress, 
          { 
            width: progressWidth,
            backgroundColor: fgColor,
            borderRadius: roundness
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    fontWeight: '500',
  },
  progress: {
    height: '100%',
  },
});

export default ProgressBar; 