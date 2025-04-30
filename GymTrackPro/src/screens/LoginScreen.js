// screens/LoginScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Switch,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { AuthContext } from '../context/AuthContext';
import { 
  Button, 
  Text, 
  Container, 
  Card,
  Input,
  FadeIn,
  SlideIn
} from '../components/ui';
import { Colors, Theme, Typography, Spacing, BorderRadius } from '../constants/Theme';

function LoginScreen({ navigation }) {
  const { login, error, clearError, user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const isDarkMode = false; // We'll use light mode for login regardless of system setting
  const theme = isDarkMode ? Theme.dark : Theme.light;
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [needsVerification, setNeedsVerification] = useState(false);
  
  useEffect(() => {
    return () => {
      if (clearError) clearError();
    };
  }, []);
  
  useEffect(() => {
    if (error) {
      setFormErrors({ server: error });
      
      // Check if the error is related to email verification
      if (error.includes('email not verified') || error.includes('verify your email')) {
        setNeedsVerification(true);
      } else {
        setNeedsVerification(false);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsLoading(false);
    }
  }, [error]);
  
  const validateForm = () => {
    let errors = {};
    
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleLogin = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await login(email, password, rememberMe);
      // Navigation handled by AuthContext
    } catch (error) {
      // Check if the error is related to email verification
      if (error.message && (error.message.includes('email not verified') || 
          error.message.includes('verify your email'))) {
        setNeedsVerification(true);
      }
      // Error handled by AuthContext via error
      setIsLoading(false);
    }
  };
  
  const handleSignUpPress = () => {
    Haptics.selectionAsync();
    navigation.navigate('SignUp');
  };
  
  const handleForgotPasswordPress = () => {
    Haptics.selectionAsync();
    navigation.navigate('ForgotPassword');
  };
  
  const handleVerifyEmailPress = () => {
    Haptics.selectionAsync();
    if (user) {
      navigation.navigate('EmailVerification');
    } else {
      Alert.alert(
        'Login Required',
        'Please log in first to access email verification.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const toggleRememberMe = () => {
    Haptics.selectionAsync();
    setRememberMe(!rememberMe);
  };
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Gradient Background */}
        <LinearGradient
          colors={[Colors.primaryBlue, Colors.primaryDarkBlue]}
          style={StyleSheet.absoluteFill}
        />
        
        <View 
          style={[
            styles.content,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }
          ]}
        >
          {/* Logo Section with Animations */}
          <FadeIn delay={100} duration={800}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="barbell" size={50} color="#FFFFFF" />
              </View>
              
              <Text style={styles.title} variant="pageTitle">
                GymTrackPro
              </Text>
            </View>
          </FadeIn>
          
          {/* Form Card with Frosted Glass Effect */}
          <SlideIn direction="up" delay={400} duration={600}>
            <BlurView intensity={80} tint="light" style={styles.blurContainer}>
              <View style={styles.formContainer}>
                <Text variant="cardTitle" style={styles.formTitle}>
                  Log in to your account
                </Text>
                
                {/* Email Input */}
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  error={formErrors.email}
                  style={styles.input}
                  autoCorrect={false}
                />
                
                {/* Password Input */}
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  leftIcon="lock-closed-outline"
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={formErrors.password}
                  style={styles.input}
                />
                
                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity 
                    style={styles.rememberMeContainer} 
                    onPress={toggleRememberMe}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.checkbox,
                      rememberMe && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}>
                      {rememberMe && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <Text variant="body" style={styles.rememberMeText}>Remember Me</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleForgotPasswordPress}
                    activeOpacity={0.7}
                  >
                    <Text variant="body" style={styles.forgotPassword}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Server Error Message */}
                {formErrors.server && (
                  <Text variant="caption" style={styles.errorText}>
                    {formErrors.server}
                  </Text>
                )}
                
                {/* Email Verification Message */}
                {needsVerification && (
                  <View style={styles.verificationContainer}>
                    <Text variant="caption" style={styles.verificationText}>
                      Your email address requires verification.
                    </Text>
                    <TouchableOpacity onPress={handleVerifyEmailPress}>
                      <Text variant="caption" style={styles.verifyLink}>
                        Verify now
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Login Button */}
                <Button
                  title="Log In"
                  onPress={handleLogin}
                  type="primary"
                  loading={isLoading}
                  fullWidth
                  style={styles.loginButton}
                />
                
                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text variant="body">
                    Don't have an account?
                  </Text>
                  <Button
                    title="Create Account"
                    onPress={handleSignUpPress}
                    type="secondary"
                    style={styles.signupButton}
                  />
                </View>
              </View>
            </BlurView>
          </SlideIn>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.title + 8, // Larger than standard title
    fontWeight: Typography.bold,
  },
  blurContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  formContainer: {
    padding: Spacing.lg,
  },
  formTitle: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.secondaryTextLight,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberMeText: {
    color: Colors.primaryTextLight,
  },
  forgotPassword: {
    color: Colors.primaryBlue,
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  errorText: {
    color: Colors.accentDanger,
    marginBottom: Spacing.md,
  },
  verificationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  verificationText: {
    color: Colors.accentWarning,
    marginRight: 4,
  },
  verifyLink: {
    color: Colors.primaryBlue,
    fontWeight: Typography.semibold,
  },
  signupContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  signupButton: {
    marginTop: Spacing.sm,
  },
});

export default LoginScreen;