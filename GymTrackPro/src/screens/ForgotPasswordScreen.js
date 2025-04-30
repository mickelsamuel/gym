// screens/ForgotPasswordScreen.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Platform,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors as ThemeColors, Typography, Spacing, BorderRadius, createNeumorphism } from '../constants/Theme';

function ForgotPasswordScreen({ navigation }) {
  const { resetPassword } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  // State
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Run entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Run success animation when email is sent
  useEffect(() => {
    if (emailSent) {
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [emailSent]);
  
  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };
  
  const handleResetPassword = async () => {
    Keyboard.dismiss();
    
    if (!validateEmail()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await resetPassword(email);
      setEmailSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = () => {
    Haptics.selectionAsync();
    navigation.navigate('Login');
  };
  
  const handleTryAgain = () => {
    Haptics.selectionAsync();
    setEmailSent(false);
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={ThemeColors.primaryDarkBlue} />
      
      <LinearGradient
        colors={[ThemeColors.primaryDarkBlue, ThemeColors.primaryBlue]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password
            </Text>
          </View>
          
          {!emailSent ? (
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={[styles.card, createNeumorphism(false, 8)]}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color={ThemeColors.accentDanger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[
                    styles.inputContainer,
                    error && styles.inputError
                  ]}>
                    <Ionicons name="mail-outline" size={20} color={ThemeColors.secondaryTextLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address"
                      placeholderTextColor={ThemeColors.secondaryTextLight}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (error) setError('');
                      }}
                      returnKeyType="send"
                      onSubmitEditing={handleResetPassword}
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    isLoading && styles.buttonDisabled
                  ]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[ThemeColors.primaryBlue, ThemeColors.primaryDarkBlue]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.resetButtonText}>Send Reset Link</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.loginLink}
                onPress={handleLogin}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.loginLinkText}>Back to Login</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.successContainer,
                {
                  opacity: successAnim,
                  transform: [
                    { 
                      translateY: successAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      }) 
                    }
                  ]
                }
              ]}
            >
              <View style={[styles.card, createNeumorphism(false, 8)]}>
                <View style={styles.successIconContainer}>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark" size={36} color={ThemeColors.accentSuccess} />
                  </View>
                </View>
                
                <Text style={styles.successTitle}>Check Your Email</Text>
                
                <Text style={styles.successMessage}>
                  We've sent a password reset link to:
                </Text>
                
                <Text style={styles.emailSentTo}>{email}</Text>
                
                <Text style={styles.successInstructions}>
                  Follow the instructions in the email to reset your password. If you don't see the email, check your spam folder.
                </Text>
                
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={handleTryAgain}
                  activeOpacity={0.8}
                >
                  <Text style={styles.tryAgainText}>Need to try again?</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.backToLoginButton}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[ThemeColors.primaryBlue, ThemeColors.primaryDarkBlue]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.backToLoginText}>Back to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.primaryBlue,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  headerContainer: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: Typography.bold,
    color: '#FFF',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 78, 100, 0.1)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: ThemeColors.accentDanger,
    fontSize: Typography.caption,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    color: ThemeColors.primaryTextLight,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    overflow: 'hidden',
  },
  inputError: {
    borderColor: ThemeColors.accentDanger,
  },
  inputIcon: {
    padding: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: Typography.body,
    color: ThemeColors.primaryTextLight,
    paddingHorizontal: Spacing.sm,
  },
  resetButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  buttonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: Typography.button,
    fontWeight: Typography.semibold,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  loginLinkText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    marginLeft: Spacing.xs,
  },
  successContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(46, 203, 112, 0.15)',
    borderWidth: 2,
    borderColor: ThemeColors.accentSuccess,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.semibold,
    color: ThemeColors.primaryTextLight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successMessage: {
    fontSize: Typography.body,
    color: ThemeColors.secondaryTextLight,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emailSentTo: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: ThemeColors.primaryTextLight,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successInstructions: {
    fontSize: Typography.caption,
    color: ThemeColors.secondaryTextLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  tryAgainButton: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tryAgainText: {
    color: ThemeColors.primaryBlue,
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
  backToLoginButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  backToLoginText: {
    color: '#FFF',
    fontSize: Typography.button,
    fontWeight: Typography.semibold,
  },
});

export default ForgotPasswordScreen;