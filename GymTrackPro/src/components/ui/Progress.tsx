import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Circle, G, LinearGradient as SvgLinearGradient, Stop, Defs } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Animation, createShadow } from '../../constants/Theme';
import Text from './Text';

interface CircleProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  customLabel?: string;
  animate?: boolean;
  animationDuration?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: [string, string];
}

interface LinearProgressProps {
  progress: number; // 0 to 1
  height?: number;
  animate?: boolean;
  animationDuration?: number;
  style?: ViewStyle;
  gradientColors?: [string, string];
  showLabel?: boolean;
}

/**
 * Circular progress indicator with animation and percentage display
 * Follows the Neumorphic Fitness design approach
 */
export const CircleProgress = ({
  progress,
  size = 120,
  strokeWidth = 10,
  showPercentage = true,
  customLabel,
  animate = true,
  animationDuration = 1000,
  style,
  textStyle,
  gradientColors,
}: CircleProgressProps) => {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Use default gradient colors if not provided
  const defaultGradientColors: [string, string] = gradientColors || [colors.primary, colors.secondary];
  
  // Animation value
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const animatedProgress = React.useRef(new Animated.Value(0)).current;
  
  // Calculate SVG properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;
  
  // Run animation on mount and when progress changes
  useEffect(() => {
    if (animate) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animate, animationDuration]);
  
  // Interpolate the stroke-dashoffset based on progress
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });
  
  // Format the percentage text
  const getPercentageText = () => {
    if (customLabel) return customLabel;
    return `${Math.round(progress * 100)}%`;
  };
  
  return (
    <View style={[styles.circleContainer, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={defaultGradientColors[0]} />
            <Stop offset="1" stopColor={defaultGradientColors[1]} />
          </SvgLinearGradient>
        </Defs>
        
        {/* Track Circle - subtle background */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        
        {/* Progress Circle with clean rounded line caps */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#grad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
          />
        </G>
      </Svg>
      
      {/* Percentage Text */}
      {showPercentage && (
        <View style={styles.percentageContainer}>
          <Text
            variant="cardTitle"
            weight="semibold"
            centered
            style={{
              color: colors.text,
              ...textStyle as object
            }}
          >
            {getPercentageText()}
          </Text>
        </View>
      )}
    </View>
  );
};

// Animated component for the circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Linear progress bar with animation and gradient
 * Follows the Neumorphic Fitness design approach
 */
export const LinearProgress = ({
  progress,
  height = 8,
  animate = true,
  animationDuration = 500,
  style,
  gradientColors,
  showLabel = false,
}: LinearProgressProps) => {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Use default gradient colors if not provided
  const defaultGradientColors: [string, string] = gradientColors || [colors.primary, colors.secondary];
  
  // Animation value
  const animatedWidth = React.useRef(new Animated.Value(0)).current;
  
  // Run animation on mount and when progress changes
  useEffect(() => {
    if (animate) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: animationDuration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animate, animationDuration]);
  
  // Width style based on progress
  const progressStyle = {
    width: animatedWidth.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
      extrapolate: 'clamp',
    }),
  };
  
  // Calculate the percentage for the label
  const percentage = Math.round(progress * 100);
  
  return (
    <View style={{ width: '100%' }}>
      <View
        style={[
          styles.linearContainer,
          { 
            height, 
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: height / 2  // More rounded corners
          },
          style,
        ]}
      >
        <Animated.View
          style={[
            styles.linearProgress,
            progressStyle,
            { 
              height,
              borderRadius: height / 2  // Match container radius
            },
            Platform.OS === 'ios' ? {
              shadowColor: defaultGradientColors[0],
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            } : {
              elevation: 2,
            },
          ]}
        >
          <LinearGradient
            colors={defaultGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>
      
      {/* Optional percentage label */}
      {showLabel && (
        <Text
          variant="caption"
          style={{
            textAlign: 'right',
            marginTop: 4,
            marginRight: 4,
            color: colors.textSecondary
          }}
        >
          {`${percentage}%`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  percentageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  linearContainer: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  linearProgress: {
    borderRadius: 4,
    overflow: 'hidden',
  },
}); 