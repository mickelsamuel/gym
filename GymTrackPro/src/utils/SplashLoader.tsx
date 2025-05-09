import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Theme } from '../constants/Theme';
import { useExercise } from '../context/ExerciseContext';

// Keep the splash screen visible until we explicitly hide it
SplashScreen.preventAutoHideAsync();

interface SplashLoaderProps {
  children: React.ReactNode;
  onFinish?: () => void;
}

/**
 * SplashLoader component for handling splash screen transitions
 * Displays a nice fade animation from splash to app content
 */
const SplashLoader: React.FC<SplashLoaderProps> = ({ children, onFinish }) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;

  // Animation values
  const fadeIn = new Animated.Value(0);
  const scale = new Animated.Value(1.1);

  useEffect(() => {
    // Once the component mounts, mark the app as ready
    setIsAppReady(true);
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // When app is ready, run a sequence of animations
      Animated.sequence([
        // Wait a bit
        Animated.delay(500),
        // Run parallel animations for fade and scale
        Animated.parallel([
          Animated.timing(fadeIn, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        // Wait for a bit more to show the logo
        Animated.delay(800),
      ]).start(async () => {
        // Hide the splash screen when animation is complete
        try {
          await SplashScreen.hideAsync();
          // Animation is done
          setIsSplashAnimationComplete(true);
          if (onFinish) onFinish();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
      });
    }
  }, [isAppReady]);

  if (!isAppReady || !isSplashAnimationComplete) {
    return (
      <View style={[styles.container, { backgroundColor: theme.primary }]}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeIn,
              transform: [{ scale }],
            },
          ]}
        >
          <Image 
            source={require('../../assets/images/splash-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return <>{children}</>;
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
});

export default SplashLoader; 