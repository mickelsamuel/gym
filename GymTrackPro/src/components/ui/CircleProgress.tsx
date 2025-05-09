import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useExercise } from '../../context/ExerciseContext';
import {Theme, Spacing} from '../../constants/Theme';
import Text from './Text';
interface CircleProgressProps {
  size?: number;
  thickness?: number;
  progress: number; // 0 to 1
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  textSize?: number;
  icon?: React.ReactNode;
  label?: string;
  animate?: boolean;
  animationDuration?: number;
}
/**
 * CircleProgress - A circular progress indicator
 * 
 * According to design specifications, this component provides a circular gauge
 * showing progress percentage for workouts, goals, etc.
 */
const CircleProgress: React.FC<CircleProgressProps> = ({
  size = 120,
  thickness = 10,
  progress = 0,
  showPercentage = true,
  color,
  backgroundColor,
  style,
  textStyle,
  textSize,
  icon,
  label,
  animate = true,
  animationDuration = 600,
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  // Default colors
  const progressColor = color || theme.primary;
  const bgColor = backgroundColor || (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)');
  // Ensure progress is between 0 and 1
  const normalizedProgress = Math.min(1, Math.max(0, progress));
  // Calculate SVG values
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference * (1 - normalizedProgress);
  // Format percentage text
  const percentage = Math.round(normalizedProgress * 100);
  const percentageText = `${percentage}%`;
  // Calculate text size based on circle size
  const calculatedTextSize = textSize || Math.max(size / 5, 14);
  // Circle center point
  const center = size / 2;
  return (
    <View style={[styles.container, style]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={styles.svg}
      >
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={thickness}
          fill="none"
        />
        {/* Progress Circle */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={progressColor}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? strokeDashoffset : 0}
          />
        </G>
      </Svg>
      {/* Center Content */}
      <View style={styles.center}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        {showPercentage && (
          <Text
            style={[
              styles.percentageText,
              { fontSize: calculatedTextSize, fontFamily: 'Inter-Bold' },
              textStyle
            ]}
          >
            {percentageText}
          </Text>
        )}
        {label && (
          <Text
            style={[
              styles.label,
              { color: theme.textSecondary, fontFamily: 'Inter' }
            ]}
            variant="caption"
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotateZ: '-90deg' }],
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  label: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  iconContainer: {
    marginBottom: Spacing.xs,
  },
});
export default CircleProgress; 