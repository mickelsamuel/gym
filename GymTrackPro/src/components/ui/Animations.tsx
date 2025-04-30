import React, { ReactNode, useEffect, useRef } from 'react';
import { ViewStyle, Animated as RNAnimated, Easing as RNEasing } from 'react-native';
import { Animation } from '../../constants/Theme';

interface FadeInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
}

/**
 * FadeIn animation component for smooth entrance animations
 * Using React Native's Animated API instead of Reanimated
 */
export function FadeIn({
  children,
  duration = Animation.normal,
  delay = 0,
  style,
  onAnimationComplete,
}: FadeInProps) {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  
  useEffect(() => {
    const animation = RNAnimated.timing(opacity, {
      toValue: 1,
      duration: duration,
      delay: delay,
      easing: RNEasing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    });
    
    animation.start(({ finished }) => {
      if (finished && onAnimationComplete) {
        onAnimationComplete();
      }
    });
    
    return () => {
      animation.stop();
    };
  }, []);
  
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
 * SlideIn animation component for smooth entrance animations
 * Using React Native's Animated API instead of Reanimated
 */
export function SlideIn({
  children,
  direction = 'up',
  distance = 20,
  duration = Animation.normal,
  delay = 0,
  style,
}: SlideInProps) {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const translateValue = useRef(new RNAnimated.Value(
    direction === 'up' ? distance : 
    direction === 'down' ? -distance : 
    direction === 'left' ? distance : 
    -distance
  )).current;
  
  useEffect(() => {
    const animations = RNAnimated.parallel([
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration: duration,
        delay: delay,
        easing: RNEasing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      RNAnimated.timing(translateValue, {
        toValue: 0,
        duration: duration,
        delay: delay,
        easing: RNEasing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      })
    ]);
    
    animations.start();
    
    return () => {
      animations.stop();
    };
  }, []);
  
  const animatedStyle = {
    opacity,
    transform: [
      direction === 'up' || direction === 'down' 
        ? { translateY: translateValue } 
        : { translateX: translateValue }
    ]
  };
  
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
  isActive?: boolean;
}

/**
 * Pulse animation component for skeleton loading states
 * Using React Native's Animated API instead of Reanimated
 */
export function Pulse({
  children,
  intensity = 0.2,
  duration = 1000,
  style,
  isActive = true,
}: PulseProps) {
  const opacity = useRef(new RNAnimated.Value(1)).current;
  
  useEffect(() => {
    if (!isActive) {
      opacity.setValue(1);
      return;
    }
    
    const animation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 1 - intensity,
          duration: duration / 2,
          easing: RNEasing.ease,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          easing: RNEasing.ease,
          useNativeDriver: true,
        })
      ])
    );
    
    animation.start();
    
    return () => {
      animation.stop();
    };
  }, [isActive]);
  
  return (
    <RNAnimated.View style={[{ opacity }, style]}>
      {children}
    </RNAnimated.View>
  );
}

interface ScaleProps {
  children: ReactNode;
  scale?: number;
  duration?: number;
  style?: ViewStyle;
  isActive?: boolean;
}

/**
 * Scale animation component for micro-interactions
 * Using React Native's Animated API instead of Reanimated
 */
export function Scale({
  children,
  scale = 0.95,
  duration = Animation.fast,
  style,
  isActive = false,
}: ScaleProps) {
  const scaleValue = useRef(new RNAnimated.Value(1)).current;
  
  useEffect(() => {
    RNAnimated.spring(scaleValue, {
      toValue: isActive ? scale : 1,
      friction: 7,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [isActive]);
  
  return (
    <RNAnimated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      {children}
    </RNAnimated.View>
  );
}

export default {
  FadeIn,
  SlideIn,
  Pulse,
  Scale,
}; 