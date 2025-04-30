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
import { Colors as ThemeColors, Typography, Spacing, BorderRadius, createNeumorphism } from '../constants/Theme';

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
      <StatusBar barStyle="light-content" backgroundColor={ThemeColors.primaryDarkBlue} />
      
      <LinearGradient
        colors={[ThemeColors.primaryDarkBlue, ThemeColors.primaryBlue]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
        
        <View style={styles.cardContainer}>
          <View style={[styles.card, createNeumorphism(false, 8)]}>
            <View style={styles.statusSection}>
              <View style={[styles.statusIndicator, {
                backgroundColor: 'rgba(255, 170, 43, 0.2)',
                borderColor: ThemeColors.accentWarning
              }]}>
                <Ionicons name="time-outline" size={24} color={ThemeColors.accentWarning} />
              </View>
              <Text style={styles.statusTitle}>Pending Verification</Text>
              <Text style={styles.statusMessage}>
                Your email verification is pending. Check your inbox or spam folder.
              </Text>
            </View>
            
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
                  <Ionicons name="refresh" size={22} color="#FFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Check Verification Status</Text>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <View style={styles.actionSection}>
              <Text style={styles.actionTitle}>Didn't receive the email?</Text>
              
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  resendCooldown > 0 && { opacity: 0.6 }
                ]}
                onPress={handleResendVerification}
                activeOpacity={resendCooldown > 0 ? 0.6 : 0.8}
                disabled={resendCooldown > 0 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={ThemeColors.primaryBlue} size="small" />
                ) : (
                  <>
                    <Ionicons name="mail-outline" size={20} color={ThemeColors.primaryBlue} style={styles.buttonIcon} />
                    <Text style={styles.resendButtonText}>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleContinueToLogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            If you're having trouble with verification, contact our support team for assistance.
          </Text>
        </View>
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
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: Typography.bold,
    color: '#FFF',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emailText: {
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  instructions: {
    fontSize: Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
    maxWidth: 320,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
  },
  statusTitle: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.semibold,
    color: ThemeColors.primaryTextLight,
    marginBottom: Spacing.xs,
  },
  statusMessage: {
    fontSize: Typography.caption,
    color: ThemeColors.secondaryTextLight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primaryBlue,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    width: '100%',
  },
  buttonText: {
    color: '#FFF',
    fontSize: Typography.button,
    fontWeight: Typography.semibold,
  },
  buttonIcon: {
    marginRight: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    width: '100%',
    marginVertical: Spacing.lg,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    color: ThemeColors.secondaryTextLight,
    marginBottom: Spacing.md,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.md,
  },
  resendButtonText: {
    color: ThemeColors.primaryBlue,
    fontSize: Typography.button,
    fontWeight: Typography.semibold,
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    width: '100%',
  },
  loginButtonText: {
    color: ThemeColors.secondaryTextLight,
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
  },
  helpContainer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 'auto',
  },
  helpText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EmailVerificationScreen; 