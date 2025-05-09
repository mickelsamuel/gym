import React, { useState, useRef, useEffect, useContext } from 'react';
import {View, StyleSheet, TouchableOpacity, StatusBar, Alert, SafeAreaView, Animated} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { sendEmailVerification } from 'firebase/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { 
  Text, 
  Button, 
  Card 
} from '../components/ui';
import {Colors, Theme, Spacing, BorderRadius, createElevation} from '../constants/Theme';
type AuthStackParamList = {
  Login: undefined;
  EmailVerification: { email?: string };
  Main: undefined;
};
type EmailVerificationScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'EmailVerification'>;
};
const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    // Run entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  // Handle countdown for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);
  const handleResendVerification = async (): Promise<void> => {
    if (resendCooldown > 0 || !user) return;
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
  const handleContinueToLogin = (): void => {
    Haptics.selectionAsync();
    logout();
    navigation.navigate('Login');
  };
  const handleRefreshStatus = async (): Promise<void> => {
    if (!user) return;
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
  // Get theme colors
  const theme = Theme.light; // Always use light theme for auth screens
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDarkBlue} />
      <LinearGradient
        colors={[Colors.primaryDarkBlue, Colors.primaryBlue]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20)
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={80} color="#FFF" />
        </View>
        <Text 
          variant="heading2" 
          style={{ 
            color: '#FFF',
            marginBottom: Spacing.sm,
            textAlign: 'center',
          }}
        >
          Verify Your Email
        </Text>
        <Text 
          variant="body"
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            marginBottom: Spacing.md,
          }}
        >
          We've sent a verification email to{'\n'}
          <Text
            variant="body"
            style={{
              fontWeight: '700',
              color: '#FFF',
            }}
          >
            {user?.email}
          </Text>
        </Text>
        <Text
          variant="caption"
          style={{
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            marginBottom: Spacing.xl,
            lineHeight: 20,
            maxWidth: 320,
          }}
        >
          Please check your inbox and follow the link to verify your email address.
          You need to verify your email before you can use all features of the app.
        </Text>
        <View style={styles.cardContainer}>
          <Card
            style={styles.card}
            elevation={2}
          >
            <View style={styles.statusSection}>
              <View style={[styles.statusIndicator, {
                backgroundColor: 'rgba(255, 170, 43, 0.2)',
                borderColor: theme.warning
              }]}>
                <Ionicons name="time-outline" size={24} color={theme.warning} />
              </View>
              <Text 
                variant="heading3" 
                style={{ 
                  marginBottom: Spacing.xs,
                }}
              >
                Pending Verification
              </Text>
              <Text 
                variant="caption" 
                style={{ 
                  color: theme.textSecondary,
                  textAlign: 'center',
                  marginBottom: Spacing.sm,
                }}
              >
                Your email verification is pending. Check your inbox or spam folder.
              </Text>
            </View>
            <Button
              title="Check Verification Status"
              icon="refresh"
              onPress={handleRefreshStatus}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={{ marginBottom: Spacing.lg }}
            />
            <View style={styles.divider} />
            <View style={styles.actionSection}>
              <Text 
                variant="body" 
                style={{ 
                  fontWeight: '500',
                  color: theme.textSecondary,
                  marginBottom: Spacing.md,
                }}
              >
                Didn't receive the email?
              </Text>
              <Button
                title={resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                icon="mail-outline"
                onPress={handleResendVerification}
                loading={isLoading}
                disabled={resendCooldown > 0 || isLoading}
                type="secondary"
                fullWidth
                style={{ marginBottom: Spacing.md }}
              />
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleContinueToLogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text 
                  variant="caption" 
                  style={{ 
                    color: theme.textSecondary,
                    fontWeight: '500',
                  }}
                >
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
        <View style={styles.helpContainer}>
          <Text 
            variant="tiny" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            If you're having trouble with verification, contact our support team for assistance.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};
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
    ...createElevation(2),
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    width: '100%',
    padding: Spacing.lg,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    width: '100%',
  },
  helpContainer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 'auto',
  },
});
export default EmailVerificationScreen; 