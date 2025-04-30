import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export const SkeletonItem = ({ style, children }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const backgroundColor = colorScheme === 'dark' ? '#3A3A3C' : '#E1E9EE';
  
  return (
    <View style={[styles.skeletonBase, { backgroundColor }, style]}>
      {children}
    </View>
  );
};

export default function CustomSkeletonLoader({ children }) {
  const colorScheme = useColorScheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    startShimmerAnimation();
  }, []);
  
  const startShimmerAnimation = () => {
    shimmerAnim.setValue(0);
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  };
  
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width * 1.5]
  });
  
  const highlightColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)';
  
  return (
    <View style={styles.container}>
      {children}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: highlightColor,
            transform: [{ translateX: shimmerTranslateX }],
          },
          styles.shimmer,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    width: width * 1.5,
    height: '100%',
  },
  skeletonBase: {
    borderRadius: 4,
    overflow: 'hidden',
  },
}); 