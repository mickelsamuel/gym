// screens/LoginScreen.tsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { 
  Button, 
  Text, 
  Container, 
  Card,
  Input
} from '../components/ui';
import {Theme, Spacing, BorderRadius, createElevation} from '../constants/Theme';
import { StackNavigationProp } from '@react-navigation/stack';
;
interface FormErrors {
  email?: string;
  password?: string;
  server?: string;
}
type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  EmailVerification: undefined;
};
type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};
const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, error, clearError, user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.9)).current;
  // State
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);
  // Get theme colors (always use light theme for login)
  const isDarkMode = false;
  const colors = isDarkMode ? Theme.dark : Theme.light;
  // Helper function to check for email verification related errors
  const isEmailVerificationError = (err: any): boolean => {
    return err && (err.message && (err.message.includes('email not verified') || 
           err.message.includes('verify your email')) || err.includes('email not verified') || 
           err.includes('verify your email'))
  };
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
    return () => {
      if (clearError) {
        clearError();
      }
      setFormErrors({});
      setNeedsVerification(false);
    };
  }, []);
  useEffect(() => {
    if (error) {
      setFormErrors({ server: error });
      if (isEmailVerificationError(error)) {
        setNeedsVerification(true);
      } else {
        setNeedsVerification(false);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsLoading(false);
    }
  }, [error]);
  const validateForm = (): boolean => {
    let errors: FormErrors = {};
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
  const handleLogin = async (): Promise<void> => {
    Keyboard.dismiss();
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await login(email, password);
      // Login success is handled by the auth context
    } catch (error) {
      setIsLoading(false);
    }
  };
  const handleSignUpPress = (): void => {
    Haptics.selectionAsync();
    navigation.navigate('SignUp');
  };
  const handleForgotPasswordPress = (): void => {
    Haptics.selectionAsync();
    navigation.navigate('ForgotPassword');
  };
  const handleVerifyEmailPress = (): void => {
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
  const toggleRememberMe = (): void => {
    Haptics.selectionAsync();
    setRememberMe(!rememberMe);
  };
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Container fullWidth>
          {/* Gradient Background */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <ScrollView 
            contentContainerStyle={[
              styles.content,
              { 
                paddingTop: insets.top + Spacing.xxl, 
                paddingBottom: insets.bottom + Spacing.xl,
                paddingHorizontal: Spacing.lg
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <Animated.View 
              style={[
                styles.logoContainer, 
                { marginBottom: Spacing.xxl },
                { 
                  opacity: fadeAnim, 
                  transform: [{ scale: logoScaleAnim }]
                }
              ]}
            >
              <View style={styles.logoCircle}>
                <Ionicons name="barbell" size={60} color="#FFFFFF" />
              </View>
              <Text 
                variant="heading1"
                style={{ 
                  color: '#FFFFFF',
                  fontWeight: '800',
                  marginTop: Spacing.md,
                  textAlign: 'center'
                }}
              >
                GymTrackPro
              </Text>
              <Text
                variant="subtitle"
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center',
                  marginTop: Spacing.xs
                }}
              >
                Your Fitness Journey, Elevated
              </Text>
            </Animated.View>
            {/* Login Form Card */}
            <Animated.View style={{ 
              width: '100%',
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}>
              <Card
                style={styles.formCard}
                elevation={3}
              >
                <Text 
                  variant="heading3"
                  style={{ 
                    marginBottom: Spacing.lg,
                    fontWeight: '700',
                    textAlign: 'center'
                  }}
                >
                  Welcome Back
                </Text>
                {/* Email Input */}
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  iconLeft="mail-outline"
                  error={formErrors.email}
                  touched={email.length > 0}
                  containerStyle={{ marginBottom: Spacing.md }}
                  autoCorrect={false}
                />
                {/* Password Input */}
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  iconLeft="lock-closed-outline"
                  iconRight={showPassword ? "eye-off-outline" : "eye-outline"}
                  onIconRightPress={() => setShowPassword(!showPassword)}
                  error={formErrors.password}
                  touched={password.length > 0}
                  containerStyle={{ marginBottom: Spacing.md }}
                />
                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity 
                    style={styles.rememberMeContainer} 
                    onPress={toggleRememberMe}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkbox,
                      rememberMe && { 
                        backgroundColor: colors.primary, 
                        borderColor: colors.primary 
                      }
                    ]}>
                      {rememberMe && (
                        <Ionicons 
                          name="checkmark" 
                          size={12} 
                          color="#FFF" 
                        />
                      )}
                    </View>
                    <Text 
                      variant="caption"
                      style={{ 
                        marginLeft: Spacing.xs,
                        color: colors.textSecondary 
                      }}
                    >
                      Remember Me
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleForgotPasswordPress}
                    activeOpacity={0.7}
                    style={{ padding: Spacing.xs }}
                  >
                    <Text 
                      variant="caption"
                      style={{ color: colors.primary, fontWeight: '600' }}
                    >
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Error Messages */}
                {formErrors.server && (
                  <View style={styles.errorContainer}>
                    <Ionicons 
                      name="alert-circle-outline" 
                      size={16} 
                      color={colors.danger}
                      style={{ marginRight: Spacing.xs }}
                    />
                    <Text 
                      variant="caption"
                      style={{ color: colors.danger, flex: 1 }}
                    >
                      {formErrors.server}
                    </Text>
                  </View>
                )}
                {/* Email Verification Message */}
                {needsVerification && (
                  <View style={styles.verificationContainer}>
                    <Text 
                      variant="caption"
                      style={{ color: colors.warning, flex: 1 }}
                    >
                      Your email address requires verification.
                    </Text>
                    <TouchableOpacity onPress={handleVerifyEmailPress}>
                      <Text 
                        variant="caption"
                        style={{ 
                          color: colors.primary, 
                          fontWeight: '600',
                          marginLeft: Spacing.xs
                        }}
                      >
                        Verify now
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {/* Login Button */}
                <Button
                  title="Log In"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  size="large"
                  fullWidth
                  style={{ marginTop: Spacing.lg }}
                />
                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text 
                    variant="bodySmall"
                    style={{ color: colors.textSecondary }}
                  >
                    Don&apos;t have an account?
                  </Text>
                  <Button
                    title="Sign Up"
                    onPress={handleSignUpPress}
                    type="tertiary"
                    size="small"
                  />
                </View>
              </Card>
            </Animated.View>
          </ScrollView>
        </Container>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...createElevation(2),
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
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
    width: 18,
    height: 18,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 90, 95, 0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 196, 61, 0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
});
export default LoginScreen; 