import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  Text as RNText,
  Platform,
} from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, BorderRadius, Typography, createElevation } from '../../constants/Theme';
import Svg, { Circle, G, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './Text';

// Common props for progress components
interface CommonProgressProps {
  progress: number; // 0 to 1
  color?: string;
  style?: ViewStyle;
  testID?: string;
  showAnimation?: boolean;
  animationDuration?: number;
}

// Props specific to circle progress
interface CircleProgressProps extends CommonProgressProps {
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  valueFormat?: 'percent' | 'number' | 'none';
  valuePrefix?: string;
  valueSuffix?: string;
  maxValue?: number;
  label?: string;
  valueStyle?: TextStyle;
  animateOnMount?: boolean;
}

// Props specific to linear progress
interface LinearProgressProps extends CommonProgressProps {
  height?: number;
  backgroundColor?: string;
  label?: string;
  showLabel?: boolean;
  showValue?: boolean;
  valueFormat?: 'percent' | 'number' | 'none';
  rounded?: boolean;
  withShadow?: boolean;
  maxValue?: number;
  valueSuffix?: string;
}

/**
 * CircleProgress component - displays a circular progress indicator
 */
export function CircleProgress({
  progress,
  size = 100,
  strokeWidth = 10,
  color,
  style,
  testID,
  showValue = true,
  valueFormat = 'percent',
  valuePrefix = '',
  valueSuffix = '',
  maxValue = 100,
  label,
  valueStyle,
  showAnimation = true,
  animationDuration = 1000,
  animateOnMount = true,
}: CircleProgressProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  const progressColor = color || colors.primary;
  
  // Animation value
  const animatedProgress = useRef(new Animated.Value(0)).current;
  
  // Calculate dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const halfSize = size / 2;
  
  // Ensure progress is between 0 and 1
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Animate progress on mount
  useEffect(() => {
    if (showAnimation) {
      Animated.timing(animatedProgress, {
        toValue: normalizedProgress,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(normalizedProgress);
    }
  }, [normalizedProgress, showAnimation, animationDuration]);
  
  // Format value display
  const formatValue = () => {
    if (valueFormat === 'none') return '';
    
    if (valueFormat === 'percent') {
      return `${valuePrefix}${Math.round(normalizedProgress * 100)}${valueSuffix || '%'}`;
    }
    
    return `${valuePrefix}${Math.round(normalizedProgress * maxValue)}${valueSuffix}`;
  };
  
  // Map animated value to stroke dashoffset
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  // Combine text styles
  const combinedValueStyle: TextStyle = {
    fontWeight: '700',
    color: progressColor,
    textAlign: 'center',
    ...(valueStyle || {}),
  };
  
  return (
    <View style={[styles.circleContainer, style]} testID={testID}>
      <Svg height={size} width={size} style={styles.svg}>
        <G rotation="-90" origin={`${halfSize}, ${halfSize}`}>
          {/* Background Circle */}
          <Circle
            cx={halfSize}
            cy={halfSize}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
            fill="none"
          />
          
          {/* Progress Circle */}
          <AnimatedCircle
            cx={halfSize}
            cy={halfSize}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={progressColor}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>
      
      {/* Value display */}
      {showValue && (
        <View style={styles.valueContainer}>
          <Text
            variant="body"
            style={combinedValueStyle}
          >
            {formatValue()}
          </Text>
          
          {label && (
            <Text
              variant="caption"
              style={{ 
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: 2,
              } as TextStyle}
            >
              {label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * LinearProgress component - displays a horizontal progress bar
 */
export function LinearProgress({
  progress,
  color,
  height = 8,
  backgroundColor,
  style,
  testID,
  label,
  showLabel = false,
  showValue = false,
  valueFormat = 'percent',
  rounded = true,
  withShadow = false,
  maxValue = 100,
  valueSuffix = '',
}: LinearProgressProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  const progressColor = color || colors.primary;
  const bgColor = backgroundColor || (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)');
  
  // Animation value
  const animatedWidth = useRef(new Animated.Value(0)).current;
  
  // Ensure progress is between 0 and 1
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Format value display
  const formatValue = () => {
    if (valueFormat === 'none') return '';
    
    if (valueFormat === 'percent') {
      return `${Math.round(normalizedProgress * 100)}${valueSuffix || '%'}`;
    }
    
    return `${Math.round(normalizedProgress * maxValue)}${valueSuffix}`;
  };
  
  // Animate progress on mount
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: normalizedProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [normalizedProgress]);
  
  // Calculate border radius based on height and rounded prop
  const borderRadius = rounded ? height / 2 : BorderRadius.xs;
  
  return (
    <View style={[styles.linearContainer, style]} testID={testID}>
      {(showLabel && label) && (
        <View style={styles.labelContainer}>
          <Text
            variant="caption"
            style={{ color: colors.text } as TextStyle}
          >
            {label}
          </Text>
          {showValue && (
            <Text
              variant="caption"
              style={{ color: colors.textSecondary } as TextStyle}
            >
              {formatValue()}
            </Text>
          )}
        </View>
      )}
      
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: bgColor,
            borderRadius,
          },
          withShadow && createElevation(1, darkMode),
        ]}
      >
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: progressColor,
              borderRadius,
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Circle Progress styles
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotateZ: '90deg' }],
  },
  valueContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Linear Progress styles
  linearContainer: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  bar: {
    height: '100%',
  },
}); 