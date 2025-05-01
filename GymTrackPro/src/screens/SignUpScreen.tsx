import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  TextStyle,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { AuthContext } from '../context/AuthContext';
import { 
  Button, 
  Text, 
  Container, 
  Input,
  Card,
  FadeIn,
  SlideIn
} from '../components/ui';
import { Colors, Theme, Typography, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { StackNavigationProp } from '@react-navigation/stack';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  gender?: string;
  age?: string;
  height?: string;
  weight?: string;
  goal?: string;
  server?: string;
}

interface UserProfile {
  gender: string;
  age: number;
  height: number;
  weight: number;
  goal: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  profile: UserProfile;
}

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  EmailVerification: { email: string };
};

type SignUpScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'SignUp'>;
};

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { register, error, clearError } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const isDarkMode = false; // We'll use light mode for signup regardless of system setting
  const theme = isDarkMode ? Theme.dark : Theme.light;
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);
  
  // Step 1: Basic info
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  // Step 2: Fitness details
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  
  // Form state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Clear errors when component unmounts
  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
    
    return () => {
      if (clearError) clearError();
    };
  }, []);
  
  // Update errors from server
  useEffect(() => {
    if (error) {
      setFormErrors({ server: error });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsLoading(false);
    }
  }, [error]);
  
  // Update progress animation when step changes
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(progressAnim, {
        toValue: currentStep === 1 ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [currentStep]);
  
  const validateStep1 = (): boolean => {
    let errors: FormErrors = {};
    
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
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
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateStep2 = (): boolean => {
    let errors: FormErrors = {};
    
    if (!gender) {
      errors.gender = 'Please select your gender';
    }
    
    if (!age) {
      errors.age = 'Age is required';
    } else if (isNaN(parseInt(age)) || parseInt(age) < 13 || parseInt(age) > 100) {
      errors.age = 'Please enter a valid age (13-100)';
    }
    
    if (!height) {
      errors.height = 'Height is required';
    } else if (isNaN(parseFloat(height)) || parseFloat(height) <= 0) {
      errors.height = 'Please enter a valid height';
    }
    
    if (!weight) {
      errors.weight = 'Weight is required';
    } else if (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
      errors.weight = 'Please enter a valid weight';
    }
    
    if (!goal) {
      errors.goal = 'Please select your primary fitness goal';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleContinue = (): void => {
    Keyboard.dismiss();
    
    if (validateStep1()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(2);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  const handleBack = (): void => {
    Haptics.selectionAsync();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };
  
  const handleSignUp = async (): Promise<void> => {
    Keyboard.dismiss();
    
    if (!validateStep2()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const registerData: RegisterData = { 
        email, 
        password, 
        username,
        profile: {
          gender,
          age: parseInt(age),
          height: parseFloat(height),
          weight: parseFloat(weight),
          goal
        }
      };
      
      await register(registerData);
      
      // Show success animation before redirecting
      setRegistrationComplete(true);
      
      // Navigation handled by AuthContext after animation
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'EmailVerification', params: { email } }],
        });
      }, 2500);
      
    } catch (error) {
      // Error handled by AuthContext via error
      setIsLoading(false);
    }
  };
  
  const handleLoginPress = (): void => {
    Haptics.selectionAsync();
    navigation.navigate('Login');
  };
  
  // Render progress steps
  const renderProgressSteps = (): JSX.Element => {
    // Calculate progress width
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[
            styles.stepIndicator, 
            currentStep >= 1 ? styles.activeStep : styles.inactiveStep
          ]}>
            {currentStep > 1 ? (
              <Ionicons name="checkmark" size={16} color="#FFF" />
            ) : (
              <Text style={styles.stepNumber}>1</Text>
            )}
          </View>
          <Text variant="caption" style={styles.stepLabel}>Basic Info</Text>
        </View>
        
        <View style={styles.progressLineContainer}>
          <View style={styles.progressLine} />
          <Animated.View 
            style={[
              styles.progressLineFill, 
              { width: progressWidth }
            ]} 
          />
        </View>
        
        <View style={styles.progressStep}>
          <View style={[
            styles.stepIndicator, 
            currentStep >= 2 ? styles.activeStep : styles.inactiveStep
          ]}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text variant="caption" style={styles.stepLabel}>Fitness Details</Text>
        </View>
      </View>
    );
  };
  
  // Render step 1 form
  const renderStep1 = (): JSX.Element => {
    return (
      <Animated.View style={[
        styles.formStep,
        { opacity: fadeAnim }
      ]}>
        <Input
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username"
          iconLeft="person-outline"
          error={formErrors.username}
          containerStyle={styles.input}
          autoCorrect={false}
          touched={username.length > 0}
        />
        
        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          iconLeft="mail-outline"
          error={formErrors.email}
          containerStyle={styles.input}
          autoCorrect={false}
          touched={email.length > 0}
        />
        
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          secureTextEntry={!showPassword}
          iconLeft="lock-closed-outline"
          iconRight={showPassword ? "eye-off-outline" : "eye-outline"}
          onIconRightPress={() => setShowPassword(!showPassword)}
          error={formErrors.password}
          containerStyle={styles.input}
          touched={password.length > 0}
        />
        
        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          secureTextEntry={!showConfirmPassword}
          iconLeft="lock-closed-outline"
          iconRight={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
          onIconRightPress={() => setShowConfirmPassword(!showConfirmPassword)}
          error={formErrors.confirmPassword}
          containerStyle={styles.input}
          touched={confirmPassword.length > 0}
        />
        
        <Button
          title="Continue"
          onPress={handleContinue}
          type="primary"
          fullWidth
          style={styles.continueButton}
          icon="arrow-forward"
          iconPosition="right"
        />
      </Animated.View>
    );
  };
  
  // Render step 2 form
  const renderStep2 = (): JSX.Element => {
    return (
      <Animated.View style={[
        styles.formStep,
        { opacity: fadeAnim }
      ]}>
        <View style={styles.genderSelection}>
          <Text variant="body" style={styles.selectionLabel}>Gender</Text>
          <View style={styles.selectionOptions}>
            <TouchableOpacity 
              style={[
                styles.genderOption, 
                gender === 'male' && styles.selectedOption
              ]}
              onPress={() => setGender('male')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="male" 
                size={24} 
                color={gender === 'male' ? theme.primary : theme.textSecondary} 
              />
              <Text 
                variant="body" 
                style={
                  gender === 'male' 
                    ? { ...styles.optionText, ...styles.selectedOptionText }
                    : styles.optionText
                }
              >
                Male
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.genderOption, 
                gender === 'female' && styles.selectedOption
              ]}
              onPress={() => setGender('female')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="female" 
                size={24} 
                color={gender === 'female' ? theme.primary : theme.textSecondary} 
              />
              <Text 
                variant="body" 
                style={
                  gender === 'female' 
                    ? { ...styles.optionText, ...styles.selectedOptionText }
                    : styles.optionText
                }
              >
                Female
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.genderOption, 
                gender === 'other' && styles.selectedOption
              ]}
              onPress={() => setGender('other')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="person" 
                size={24} 
                color={gender === 'other' ? theme.primary : theme.textSecondary} 
              />
              <Text 
                variant="body" 
                style={
                  gender === 'other' 
                    ? { ...styles.optionText, ...styles.selectedOptionText }
                    : styles.optionText
                }
              >
                Other
              </Text>
            </TouchableOpacity>
          </View>
          {formErrors.gender && (
            <Text variant="caption" style={styles.errorText}>
              {formErrors.gender}
            </Text>
          )}
        </View>
        
        <View style={styles.measurementsRow}>
          <Input
            label="Age"
            value={age}
            onChangeText={setAge}
            placeholder="Years"
            keyboardType="number-pad"
            iconLeft="calendar-outline"
            error={formErrors.age}
            containerStyle={styles.inputHalf}
            touched={age.length > 0}
          />
          
          <Input
            label="Height"
            value={height}
            onChangeText={setHeight}
            placeholder="cm"
            keyboardType="decimal-pad"
            iconLeft="resize-outline"
            error={formErrors.height}
            containerStyle={styles.inputHalf}
            touched={height.length > 0}
          />
        </View>
        
        <Input
          label="Weight"
          value={weight}
          onChangeText={setWeight}
          placeholder="kg"
          keyboardType="decimal-pad"
          iconLeft="fitness-outline"
          error={formErrors.weight}
          containerStyle={styles.input}
          touched={weight.length > 0}
        />
        
        <View style={styles.goalSelection}>
          <Text variant="body" style={styles.selectionLabel}>Primary Goal</Text>
          <View style={styles.goalOptions}>
            {['Lose Weight', 'Build Muscle', 'Improve Fitness', 'Maintain'].map((option) => (
              <TouchableOpacity 
                key={option}
                style={[
                  styles.goalOption, 
                  goal === option && styles.selectedGoal
                ]}
                onPress={() => setGoal(option)}
                activeOpacity={0.7}
              >
                <Text 
                  variant="body" 
                  style={
                    goal === option 
                      ? { ...styles.goalText, ...styles.selectedGoalText }
                      : styles.goalText
                  }
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {formErrors.goal && (
            <Text variant="caption" style={styles.errorText}>
              {formErrors.goal}
            </Text>
          )}
        </View>
        
        <Button
          title="Create Account"
          onPress={handleSignUp}
          type="primary"
          loading={isLoading}
          fullWidth
          style={styles.signupButton}
        />
      </Animated.View>
    );
  };
  
  // Render success animation
  const renderSuccess = (): JSX.Element => {
    return (
      <FadeIn>
        <View style={styles.successContainer}>
          <LottieView
            source={require('../../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.successAnimation}
          />
          <Text variant="heading3" style={styles.successTitle}>
            Congratulations!
          </Text>
          <Text variant="body" style={styles.successText}>
            Your account has been created successfully. Please verify your email to continue.
          </Text>
        </View>
      </FadeIn>
    );
  };
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Gradient Background */}
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: insets.top + 20, 
              paddingBottom: Math.max(insets.bottom, 20) 
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.title} variant="heading3">
              Create Account
            </Text>
          </View>
          
          {/* Form Card with Frosted Glass Effect */}
          {!registrationComplete ? (
            <BlurView intensity={80} tint="light" style={styles.blurContainer}>
              <View style={styles.formContainer}>
                {/* Progress Steps */}
                {renderProgressSteps()}
                
                {/* Server Error Message */}
                {formErrors.server && (
                  <View style={styles.errorContainer}>
                    <Ionicons 
                      name="alert-circle-outline" 
                      size={16} 
                      color={theme.danger}
                      style={{ marginRight: Spacing.xs }}
                    />
                    <Text variant="caption" style={styles.serverError}>
                      {formErrors.server}
                    </Text>
                  </View>
                )}
                
                {/* Form Steps */}
                {currentStep === 1 ? renderStep1() : renderStep2()}
                
                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                    Already have an account?
                  </Text>
                  <Button
                    title="Log In"
                    onPress={handleLoginPress}
                    type="tertiary"
                    size="small"
                  />
                </View>
              </View>
            </BlurView>
          ) : renderSuccess()}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  blurContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  formContainer: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressLineContainer: {
    position: 'relative',
    width: 80,
    marginHorizontal: Spacing.md,
  },
  progressLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressLineFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: Colors.primaryBlue,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...createElevation(1),
  },
  activeStep: {
    backgroundColor: Colors.primaryBlue,
  },
  inactiveStep: {
    backgroundColor: Colors.secondaryTextLight,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  stepLabel: {
    color: Colors.primaryTextLight,
  },
  formStep: {
    marginTop: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  inputHalf: {
    marginBottom: Spacing.md,
    width: '48%',
  },
  measurementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 90, 95, 0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  serverError: {
    color: Colors.accentDanger,
    flex: 1,
  },
  continueButton: {
    marginTop: Spacing.md,
  },
  signupButton: {
    marginTop: Spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  loginLink: {
    color: Colors.primaryBlue,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorText: {
    color: Colors.accentDanger,
    marginTop: 2,
  },
  genderSelection: {
    marginBottom: Spacing.md,
  },
  selectionLabel: {
    color: Colors.primaryTextLight,
    marginBottom: Spacing.sm,
  },
  selectionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    borderWidth: 1,
    borderColor: Colors.secondaryTextLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '30%',
    alignItems: 'center',
    ...createElevation(1),
  },
  selectedOption: {
    borderColor: Colors.primaryBlue,
    backgroundColor: 'rgba(55, 114, 255, 0.05)',
  },
  optionText: {
    marginTop: 4,
    color: Colors.secondaryTextLight,
  },
  selectedOptionText: {
    color: Colors.primaryBlue,
    fontWeight: '500',
  },
  goalSelection: {
    marginBottom: Spacing.lg,
  },
  goalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  goalOption: {
    borderWidth: 1,
    borderColor: Colors.secondaryTextLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    ...createElevation(1),
  },
  selectedGoal: {
    borderColor: Colors.primaryBlue,
    backgroundColor: 'rgba(55, 114, 255, 0.05)',
  },
  goalText: {
    color: Colors.secondaryTextLight,
  },
  selectedGoalText: {
    color: Colors.primaryBlue,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
  },
  successAnimation: {
    width: 200,
    height: 200,
  },
  successTitle: {
    color: Colors.primaryTextLight,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  successText: {
    color: Colors.secondaryTextLight,
    textAlign: 'center',
  },
});

export default SignUpScreen; 