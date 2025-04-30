import React, { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
  Extrapolate,
  WithTimingConfig,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
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
 */
export function FadeIn({
  children,
  duration = Animation.normal,
  delay = 0,
  style,
  onAnimationComplete,
}: FadeInProps) {
  const opacity = useSharedValue(0);
  
  React.useEffect(() => {
    const animationConfig: WithTimingConfig = {
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    };
    
    // Callback function to be called when animation completes
    const callback = () => {
      if (onAnimationComplete) {
        runOnJS(onAnimationComplete)();
      }
    };
    
    // Start animation with delay if specified
    setTimeout(() => {
      opacity.value = withTiming(1, animationConfig, callback);
    }, delay);
    
    return () => {
      cancelAnimation(opacity);
    };
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
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
 */
export function SlideIn({
  children,
  direction = 'up',
  distance = 20,
  duration = Animation.normal,
  delay = 0,
  style,
}: SlideInProps) {
  const opacity = useSharedValue(0);
  const translateValue = useSharedValue(direction === 'up' || direction === 'down' ? 
    (direction === 'up' ? distance : -distance) : 
    (direction === 'left' ? distance : -distance));
  
  React.useEffect(() => {
    const animationConfig: WithTimingConfig = {
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    };
    
    // Start animation with delay if specified
    setTimeout(() => {
      opacity.value = withTiming(1, animationConfig);
      translateValue.value = withTiming(0, animationConfig);
    }, delay);
    
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateValue);
    };
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    const translate = direction === 'up' || direction === 'down' ? 
      { translateY: translateValue.value } : 
      { translateX: translateValue.value };
      
    return {
      opacity: opacity.value,
      transform: [translate],
    };
  });
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
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
 */
export function Pulse({
  children,
  intensity = 0.2,
  duration = 1000,
  style,
  isActive = true,
}: PulseProps) {
  const opacity = useSharedValue(1);
  
  React.useEffect(() => {
    if (isActive) {
      opacity.value = withRepeat(
        withTiming(1 - intensity, { duration: duration / 2 }),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1);
    }
    
    return () => {
      cancelAnimation(opacity);
    };
  }, [isActive]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
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
 */
export function Scale({
  children,
  scale = 0.95,
  duration = Animation.fast,
  style,
  isActive = false,
}: ScaleProps) {
  const scaleValue = useSharedValue(1);
  
  React.useEffect(() => {
    if (isActive) {
      scaleValue.value = withSpring(scale, {
        stiffness: 500,
        damping: 30,
      });
    } else {
      scaleValue.value = withSpring(1, {
        stiffness: 500,
        damping: 30,
      });
    }
    
    return () => {
      cancelAnimation(scaleValue);
    };
  }, [isActive]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

export default {
  FadeIn,
  SlideIn,
  Pulse,
  Scale,
}; 