import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Colors } from '../../constants/Theme';

export interface CircleProgressProps {
  size?: number;
  progress?: number;
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  indeterminate?: boolean;
  style?: ViewStyle;
}

const CircleProgress: React.FC<CircleProgressProps> = ({
  size = 100,
  progress = 0,
  thickness = 10,
  color,
  backgroundColor,
  indeterminate = false,
  style
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  
  // Animation value for rotation in indeterminate mode
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  // Setup animation for indeterminate mode
  useEffect(() => {
    if (indeterminate) {
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotationAnim.setValue(0);
    }
    
    return () => {
      rotationAnim.stopAnimation();
    };
  }, [indeterminate]);
  
  // Calculate the circle parameters
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const halfCircle = radius + thickness / 2;
  
  // Calculate the rotation for progress
  const rotation = indeterminate
    ? rotationAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      })
    : '0deg';
  
  // Calculate the stroke dash offset for progress
  const strokeDashoffset = circumference - (circumference * Math.min(progress, 1)) / 1;
  
  // Set default colors if not provided
  const progressColor = color || theme.primary;
  const bgColor = backgroundColor || (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)');
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Background Circle */}
      <View style={[
        styles.circleBackground,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: bgColor,
        }
      ]} />
      
      {/* Progress Circle */}
      <Animated.View
        style={[
          styles.circleProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: thickness,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: indeterminate ? progressColor : 'transparent',
            borderLeftColor: progressColor,
            transform: [
              { rotate: rotation },
              { rotateZ: indeterminate ? '45deg' : `${progress * 360}deg` },
            ],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
  },
  circleProgress: {
    position: 'absolute',
    borderStyle: 'solid',
  },
});

export default CircleProgress; 