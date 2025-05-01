import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Platform,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput as RNTextInput
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { 
  Text, 
  Button, 
  Input, 
  Card,
  Container
} from '../components/ui';
import { Colors, Theme, Typography, Spacing, BorderRadius, createElevation } from '../constants/Theme';

type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { resetPassword } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  // State
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
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
  
  const validateEmail = (): boolean => {
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
  
  const handleResetPassword = async (): Promise<void> => {
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
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = (): void => {
    Haptics.selectionAsync();
    navigation.navigate('Login');
  };
  
  const handleTryAgain = (): void => {
    Haptics.selectionAsync();
    setEmailSent(false);
  };
  
  // Get theme colors
  const theme = Theme.light; // Always use light theme for authentication screens
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDarkBlue} />
      
      <LinearGradient
        colors={[Colors.primaryDarkBlue, Colors.primaryBlue]}
        style={StyleSheet.absoluteFill}
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
            
            <Text 
              variant="heading3" 
              style={{ 
                color: '#FFF',
                marginBottom: Spacing.sm,
              }}
            >
              Forgot Password
            </Text>
            
            <Text 
              variant="body"
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 22,
              }}
            >
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
              <Card
                style={styles.card}
                elevation={2}
              >
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color={theme.danger} />
                    <Text 
                      variant="caption" 
                      style={{ 
                        color: theme.danger,
                        marginLeft: Spacing.xs,
                        flex: 1,
                      }}
                    >
                      {error}
                    </Text>
                  </View>
                ) : null}
                
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  iconLeft="mail-outline"
                  error={error}
                  touched={email.length > 0}
                  containerStyle={{ marginBottom: Spacing.lg }}
                />
                
                <Button
                  title="Send Reset Link"
                  onPress={handleResetPassword}
                  loading={isLoading}
                  disabled={isLoading}
                  size="large"
                  fullWidth
                />
              </Card>
              
              <TouchableOpacity
                style={styles.loginLink}
                onPress={handleLogin}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text 
                  variant="body" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '500',
                    marginLeft: Spacing.xs,
                  }}
                >
                  Back to Login
                </Text>
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
              <Card
                style={styles.card}
                elevation={2}
              >
                <View style={styles.successIconContainer}>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark" size={36} color={theme.success} />
                  </View>
                </View>
                
                <Text 
                  variant="heading3" 
                  style={{ 
                    textAlign: 'center',
                    marginBottom: Spacing.sm,
                  }}
                >
                  Check Your Email
                </Text>
                
                <Text 
                  variant="body" 
                  style={{ 
                    color: theme.textSecondary,
                    textAlign: 'center',
                    marginBottom: Spacing.xs,
                  }}
                >
                  We've sent a password reset link to:
                </Text>
                
                <Text 
                  variant="body" 
                  style={{ 
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: Spacing.md,
                  }}
                >
                  {email}
                </Text>
                
                <Text 
                  variant="caption" 
                  style={{ 
                    color: theme.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                    marginBottom: Spacing.lg,
                  }}
                >
                  Follow the instructions in the email to reset your password. If you don't see the email, check your spam folder.
                </Text>
                
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={handleTryAgain}
                  activeOpacity={0.8}
                >
                  <Text 
                    variant="caption" 
                    style={{ 
                      color: theme.primary,
                      fontWeight: '500',
                      textAlign: 'center',
                    }}
                  >
                    Need to try again?
                  </Text>
                </TouchableOpacity>
                
                <Button
                  title="Back to Login"
                  onPress={handleLogin}
                  type="primary"
                  size="large"
                  fullWidth
                />
              </Card>
            </Animated.View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 90, 95, 0.1)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.sm,
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
    backgroundColor: 'rgba(56, 217, 169, 0.15)',
    borderWidth: 2,
    borderColor: Colors.accentSuccess,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tryAgainButton: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
});

export default ForgotPasswordScreen; 