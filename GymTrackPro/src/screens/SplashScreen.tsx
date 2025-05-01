import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Platform,
  StatusBar,
  TextStyle
} from 'react-native';
import { Text } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '../context/ExerciseContext';
import { Theme } from '../constants/Theme';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

// Keep splash screen visible until we manually hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

/**
 * Animated splash screen component
 */
export default function AnimatedSplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Start animations sequence
    Animated.sequence([
      // Wait a bit to ensure all resources are ready
      Animated.delay(300),
      
      // Fade in logo with spring scaling
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 10,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Fade in text slightly later
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          tension: 30,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      
      // Hold for a moment
      Animated.delay(800),
      
      // Fade out everything
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      // Hide the native splash screen
      await SplashScreen.hideAsync();
      
      // Notify parent when complete
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeOut,
          backgroundColor: colors.background,
        }
      ]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Background gradient */}
      <LinearGradient
        colors={[
          darkMode ? '#1A1E2D' : '#F0F4FF',
          colors.background
        ]}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }
          ]}
        >
          <View style={[
            styles.logoWrapper,
            { backgroundColor: colors.primary }
          ]}>
            <Ionicons name="barbell" size={60} color="#FFFFFF" />
          </View>
        </Animated.View>
        
        {/* App Name */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            }
          ]}
        >
          <Text 
            variant="heading1" 
            style={{
              fontWeight: '800',
              letterSpacing: -0.5,
              color: colors.text
            } as TextStyle}
          >
            GymTrackPro
          </Text>
          <Text
            variant="subtitle"
            style={{
              marginTop: 8,
              color: colors.textSecondary
            } as TextStyle}
          >
            Your Fitness Journey, Elevated
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 100, // Offset to look better visually
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 8,
  },
}); 