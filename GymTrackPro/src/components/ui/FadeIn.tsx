import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: any;
}

/**
 * FadeIn component - creates a simple fade-in animation for its children
 */
const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 500,
  style = {},
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View style={{ ...style, opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
};

export default FadeIn; 