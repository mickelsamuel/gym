// screens/LoginScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ImageBackground,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInDown
} from 'react-native-reanimated';

function LoginScreen({ navigation }) {
  const { login, error, clearError, user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [needsVerification, setNeedsVerification] = useState(false);
  
  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  
  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }]
    };
  });
  
  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: formTranslateY.value }]
    };
  });
  
  useEffect(() => {
    // Run entrance animations safely on JS thread
    requestAnimationFrame(() => {
      logoScale.value = withTiming(1, { duration: 800 });
      logoOpacity.value = withTiming(1, { duration: 800 });
      
      // Delay the form animation until the logo is visible
      formOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
      formTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));
    });
    
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
      await login(email, password);
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
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0062CC" />
      
      <LinearGradient
        colors={['#0062CC', '#0096FF']}
        style={styles.gradient}
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
            <Animated.Image
              source={require('../../assets/images/icon.png')}
              style={[styles.logo, logoAnimatedStyle]}
              resizeMode="contain"
            />
            
            <Animated.Text
              style={[styles.title, logoAnimatedStyle]}
            >
              GymTrackPro
            </Animated.Text>
            
            <Animated.Text
              style={[styles.subtitle, logoAnimatedStyle]}
            >
              Elevate your fitness journey
            </Animated.Text>
          </View>
          
          <Animated.View
            style={[styles.formContainer, formAnimatedStyle]}
            entering={FadeIn.duration(600).delay(400)}
          >
            {(formErrors.server || error) && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#FF3B30" />
                <Text style={styles.errorMessage}>{formErrors.server || error}</Text>
                
                {needsVerification && (
                  <TouchableOpacity
                    style={styles.verifyEmailButton}
                    onPress={handleVerifyEmailPress}
                  >
                    <Text style={styles.verifyEmailText}>Verify Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[
                styles.inputContainer,
                formErrors.email && styles.inputError
              ]}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: null }));
                    }
                    if (formErrors.server) {
                      if (clearError) clearError();
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {formErrors.email && (
                <Text style={styles.fieldErrorText}>{formErrors.email}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.inputContainer,
                formErrors.password && styles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (formErrors.password) {
                      setFormErrors(prev => ({ ...prev, password: null }));
                    }
                    if (formErrors.server) {
                      if (clearError) clearError();
                    }
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowPassword(!showPassword);
                  }}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              {formErrors.password && (
                <Text style={styles.fieldErrorText}>{formErrors.password}</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={handleForgotPasswordPress}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Implement Google sign-in
                }}
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Implement Apple sign-in
                }}
              >
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account?</Text>
              <TouchableOpacity onPress={handleSignUpPress}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    height: '100%',
  },
  fieldErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  showPasswordButton: {
    padding: 5,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  buttonDisabled: {
    backgroundColor: '#97C1F7',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 10,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '48%',
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  signUpText: {
    fontSize: 15,
    color: '#666',
  },
  signUpLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 5,
  },
  verifyEmailButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  verifyEmailText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;