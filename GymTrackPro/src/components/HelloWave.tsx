import { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Text } from '../components/ui';

export function HelloWave() {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Create a sequence of animations for the wave effect
    const waveSequence = Animated.sequence([
      Animated.timing(rotationAnim, {
        toValue: 25,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]);
    // Repeat the sequence 4 times
    Animated.loop(waveSequence, { iterations: 4 }).start();
    return () => {
      rotationAnim.stopAnimation();
    };
  }, [rotationAnim]);
  
  const animatedStyle = {
    transform: [{ rotate: rotationAnim.interpolate({
      inputRange: [0, 25],
      outputRange: ['0deg', '25deg']
    }) }]
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <Text style={styles.text}>👋</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
