import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  SafeAreaView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { sendEmailVerification } from 'firebase/auth';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

function EmailVerificationScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const translateY = useSharedValue(30);
  
  // Create animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ translateY: translateY.value }],
    };
  });
  
  useEffect(() => {
    // Run entrance animations using requestAnimationFrame to ensure it's on JS thread
    requestAnimationFrame(() => {
      fadeAnim.value = withTiming(1, { duration: 600 });
      translateY.value = withTiming(0, { duration: 600 });
    });
  }, []);
  
  // Handle countdown for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);
  
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await sendEmailVerification(user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Verification Email Sent',
        'Please check your inbox and follow the link to verify your email address.'
      );
      setResendCooldown(60); // Set 60 second cooldown
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'Failed to send verification email. Please try again later.'
      );
      console.error('Error sending verification email:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinueToLogin = () => {
    Haptics.selectionAsync();
    logout();
    navigation.navigate('Login');
  };
  
  const handleRefreshStatus = async () => {
    Haptics.selectionAsync();
    setIsLoading(true);
    
    try {
      await user.reload();
      
      if (user.emailVerified) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Verification Successful',
          'Your email has been verified. You can now proceed to use the app.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.replace('Main')
            }
          ]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Not Verified',
          'Your email is not verified yet. Please check your inbox and follow the verification link.'
        );
      }
    } catch (error) {
      console.error('Error reloading user:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'Failed to check verification status. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0062CC" />
      
      <LinearGradient
        colors={['#0062CC', '#0096FF']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View
        style={[
          styles.contentContainer,
          animatedStyle,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20)
          }
        ]}
        entering={FadeIn}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={80} color="#FFF" />
        </View>
        
        <Text style={styles.title}>Verify Your Email</Text>
        
        <Text style={styles.message}>
          We've sent a verification email to{'\n'}
          <Text style={styles.emailText}>{user?.email}</Text>
        </Text>
        
        <Text style={styles.instructions}>
          Please check your inbox and follow the link to verify your email address.
          You need to verify your email before you can use all features of the app.
        </Text>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshStatus}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={24} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Check Verification Status</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.resendButton,
            resendCooldown > 0 && { opacity: 0.6 }
          ]}
          onPress={handleResendVerification}
          activeOpacity={resendCooldown > 0 ? 0.6 : 0.8}
          disabled={resendCooldown > 0}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="mail" size={20} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                {resendCooldown > 0 
                  ? `Resend Email (${resendCooldown}s)` 
                  : 'Resend Verification Email'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleContinueToLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Return to Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 36,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
    maxWidth: 320,
  },
  resendButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    width: '100%',
    maxWidth: 320,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 12,
  },
  loginButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default EmailVerificationScreen; 