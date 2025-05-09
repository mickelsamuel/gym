import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { useExercise } from '../context/ExerciseContext';

interface AnimationConfig {
  toValue: number;
  duration?: number;
  delay?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
}

/**
 * Custom hook for creating and animating Animated.Value with respect to reducedMotion setting
 * 
 * @param initialValue The initial value for the Animated.Value
 * @param skipAnimation Optional boolean to force skip animation regardless of reducedMotion setting
 * @returns The animated value and functions to control it
 */
export function useAnimatedValue(initialValue: number, skipAnimation: boolean = false) {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const { reducedMotion } = useExercise();
  
  // Get whether animations should be skipped
  const shouldSkipAnimation = reducedMotion || skipAnimation;
  
  /**
   * Start animation with config (or immediately set value if reducedMotion is true)
   * @param config Animation configuration
   * @returns Animation object
   */
  const animate = (config: AnimationConfig): Animated.CompositeAnimation => {
    const { toValue, duration = 300, delay = 0, easing = Easing.ease, useNativeDriver = true } = config;
    
    if (shouldSkipAnimation) {
      // Immediately set to target value if reduced motion is enabled
      animatedValue.setValue(toValue);
      // Return a dummy animation object
      return {
        start: (callback?: (result: { finished: boolean }) => void) => {
          if (callback) callback({ finished: true });
        },
        stop: () => {},
        reset: () => {}
      };
    }
    
    // Otherwise create and return normal animation
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      delay,
      easing,
      useNativeDriver,
    });
  };
  
  /**
   * Immediately sets the value
   * @param value Value to set
   */
  const setValue = (value: number) => {
    animatedValue.setValue(value);
  };
  
  /**
   * Interpolate the animated value
   * @param config Interpolation configuration
   * @returns Interpolated Animated.Value
   */
  const interpolate = (config: Animated.InterpolationConfigType) => {
    return animatedValue.interpolate(config);
  };
  
  /**
   * Create sequence animation that respects reduced motion setting
   * @param animations Array of animation configs
   */
  const sequence = (animations: AnimationConfig[]) => {
    if (shouldSkipAnimation) {
      // If reduced motion is enabled, just set to the final value of the last animation
      const lastAnimation = animations[animations.length - 1];
      animatedValue.setValue(lastAnimation.toValue);
      // Return a dummy animation object
      return {
        start: (callback?: (result: { finished: boolean }) => void) => {
          if (callback) callback({ finished: true });
        },
        stop: () => {},
        reset: () => {}
      };
    }
    
    // Otherwise create normal sequence
    return Animated.sequence(
      animations.map(config => 
        Animated.timing(animatedValue, {
          toValue: config.toValue,
          duration: config.duration || 300,
          delay: config.delay || 0,
          easing: config.easing || Easing.ease,
          useNativeDriver: config.useNativeDriver !== undefined ? config.useNativeDriver : true,
        })
      )
    );
  };
  
  /**
   * Create loop animation that respects reduced motion setting
   * @param animation Animation config
   * @param iterations Number of iterations (default: -1, infinite)
   */
  const loop = (animation: AnimationConfig, iterations: number = -1) => {
    if (shouldSkipAnimation) {
      // If reduced motion is enabled, just set to the target value
      animatedValue.setValue(animation.toValue);
      // Return a dummy animation object
      return {
        start: (callback?: (result: { finished: boolean }) => void) => {
          if (callback) callback({ finished: true });
        },
        stop: () => {},
        reset: () => {}
      };
    }
    
    // Otherwise create normal loop
    const animationObj = Animated.timing(animatedValue, {
      toValue: animation.toValue,
      duration: animation.duration || 300,
      delay: animation.delay || 0,
      easing: animation.easing || Easing.ease,
      useNativeDriver: animation.useNativeDriver !== undefined ? animation.useNativeDriver : true,
    });
    
    return Animated.loop(animationObj, { iterations });
  };
  
  return {
    value: animatedValue,
    animate,
    setValue,
    interpolate,
    sequence,
    loop,
    shouldSkipAnimation,
  };
}

export default useAnimatedValue; 