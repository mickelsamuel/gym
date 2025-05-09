import React, { ReactNode, useEffect, useRef } from 'react';
import {ViewStyle, Animated as RNAnimated, Easing} from 'react-native';
import { Animation } from '../../constants/Theme';
import { useExercise } from '../../context/ExerciseContext';

interface FadeInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  initialOpacity?: number;
  finalOpacity?: number;
}
/**
 * FadeIn animation component for smooth entrance animations
 * Using React Native's Animated API instead of Reanimated
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = Animation.medium,
  delay = 0,
  style,
  initialOpacity = 0,
  finalOpacity = 1,
}) => {
  const { reducedMotion } = useExercise();
  const opacity = useRef(new RNAnimated.Value(initialOpacity)).current;
  
  useEffect(() => {
    // If reduced motion is enabled, set opacity immediately without animation
    if (reducedMotion) {
      opacity.setValue(finalOpacity);
      return;
    }
    
    // Otherwise, animate with the specified duration and delay
    RNAnimated.timing(opacity, {
      toValue: finalOpacity,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [opacity, duration, delay, finalOpacity, reducedMotion]);
  
  return (
    <RNAnimated.View style={[{ opacity }, style]}>
      {children}
    </RNAnimated.View>
  );
}

interface SlideInProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}
/**
 * SlideIn animation for smooth entrance animations with directional slide
 */
export function SlideIn({
  children,
  direction = 'up',
  distance = 20,
  duration = Animation.medium,
  delay = 0,
  style,
}: SlideInProps) {
  const { reducedMotion } = useExercise();
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const translateValue = useRef(new RNAnimated.Value(
    direction === 'up' ? distance :
    direction === 'down' ? -distance :
    direction === 'left' ? distance :
    -distance
  )).current;
  
  useEffect(() => {
    // If reduced motion is enabled, set position immediately without animation
    if (reducedMotion) {
      opacity.setValue(1);
      translateValue.setValue(0);
      return;
    }
    
    // Otherwise, animate with parallel animations
    const animations = RNAnimated.parallel([
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      RNAnimated.timing(translateValue, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      })
    ]);
    
    animations.start();
    return () => {
      animations.stop();
    };
  }, [opacity, translateValue, duration, delay, direction, distance, reducedMotion]);
  
  const animatedStyle = {
    opacity,
    transform: [
      direction === 'left' || direction === 'right'
        ? { translateX: translateValue }
        : { translateY: translateValue }
    ]
  } as any; // Type assertion to avoid TS errors with animated transforms
  
  return (
    <RNAnimated.View style={[animatedStyle, style]}>
      {children}
    </RNAnimated.View>
  );
}

interface PulseProps {
  children: ReactNode;
  intensity?: number;
  duration?: number;
  style?: ViewStyle;
  repeat?: boolean;
}
/**
 * Pulse animation for attention-grabbing elements
 */
export function Pulse({
  children,
  intensity = 1.05,
  duration = 1000,
  style,
  repeat = true,
}: PulseProps) {
  const { reducedMotion } = useExercise();
  const scale = useRef(new RNAnimated.Value(1)).current;
  
  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      return;
    }
    
    const pulseAnimation = () => {
      RNAnimated.sequence([
        RNAnimated.timing(scale, {
          toValue: intensity,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(scale, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ]).start(({ finished }) => {
        if (finished && repeat) {
          pulseAnimation();
        }
      });
    };
    
    pulseAnimation();
    
    return () => {
      // No need for explicit cleanup as animations are automatically stopped
    };
  }, [scale, intensity, duration, repeat, reducedMotion]);
  
  return (
    <RNAnimated.View style={[{ transform: [{ scale }] } as any, style]}>
      {children}
    </RNAnimated.View>
  );
}

interface ScaleProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  initialScale?: number;
  finalScale?: number;
}
/**
 * Scale animation for interactive elements
 */
export function Scale({
  children,
  duration = Animation.medium,
  delay = 0,
  style,
  initialScale = 0.9,
  finalScale = 1,
}: ScaleProps) {
  const { reducedMotion } = useExercise();
  const scaleValue = useRef(new RNAnimated.Value(initialScale)).current;
  
  useEffect(() => {
    // If reduced motion is enabled, set scale immediately without animation
    if (reducedMotion) {
      scaleValue.setValue(finalScale);
      return;
    }
    
    // Otherwise, animate with the specified duration and delay
    RNAnimated.timing(scaleValue, {
      toValue: finalScale,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scaleValue, duration, delay, initialScale, finalScale, reducedMotion]);
  
  return (
    <RNAnimated.View style={[{ transform: [{ scale: scaleValue }] } as any, style]}>
      {children}
    </RNAnimated.View>
  );
}

// Animation helper that conditionally applies animations based on reduced motion setting
export const conditionalAnimation = (
  animatedStyle: any,
  staticStyle: any,
  shouldReduceMotion: boolean
) => {
  return shouldReduceMotion ? staticStyle : animatedStyle;
};

export default {
  FadeIn,
  SlideIn,
  Pulse,
  Scale,
  conditionalAnimation,
}; 