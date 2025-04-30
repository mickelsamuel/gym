// screens/SignUpScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Image,
  ScrollView
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
import { Colors, Theme, Typography, Spacing, BorderRadius } from '../constants/Theme';

function SignUpScreen({ navigation }) {
  const { register, error, clearError } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const isDarkMode = false; // We'll use light mode for signup regardless of system setting
  const theme = isDarkMode ? Theme.dark : Theme.light;
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  // Step 1: Basic info
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Step 2: Fitness details
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  
  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Clear errors when component unmounts
  useEffect(() => {
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
  
  const validateStep1 = () => {
    let errors = {};
    
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
  
  const validateStep2 = () => {
    let errors = {};
    
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
  
  const handleContinue = () => {
    Keyboard.dismiss();
    
    if (validateStep1()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(2);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  const handleBack = () => {
    Haptics.selectionAsync();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };
  
  const handleSignUp = async () => {
    Keyboard.dismiss();
    
    if (!validateStep2()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await register({ 
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
      });
      
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
  
  const handleLoginPress = () => {
    Haptics.selectionAsync();
    navigation.navigate('Login');
  };
  
  // Render progress steps
  const renderProgressSteps = () => {
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
        
        <View style={styles.progressLine} />
        
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
  const renderStep1 = () => {
    return (
      <SlideIn direction="right" duration={300}>
        <View style={styles.formStep}>
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            leftIcon="person-outline"
            error={formErrors.username}
            style={styles.input}
            autoCorrect={false}
          />
          
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
          
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            error={formErrors.password}
            style={styles.input}
          />
          
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            error={formErrors.confirmPassword}
            style={styles.input}
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
        </View>
      </SlideIn>
    );
  };
  
  // Render step 2 form
  const renderStep2 = () => {
    return (
      <SlideIn direction="left" duration={300}>
        <View style={styles.formStep}>
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
                  color={gender === 'male' ? Colors.primaryBlue : Colors.secondaryTextLight} 
                />
                <Text 
                  variant="body" 
                  style={[
                    styles.optionText,
                    gender === 'male' && styles.selectedOptionText
                  ]}
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
                  color={gender === 'female' ? Colors.primaryBlue : Colors.secondaryTextLight} 
                />
                <Text 
                  variant="body" 
                  style={[
                    styles.optionText,
                    gender === 'female' && styles.selectedOptionText
                  ]}
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
                  color={gender === 'other' ? Colors.primaryBlue : Colors.secondaryTextLight} 
                />
                <Text 
                  variant="body" 
                  style={[
                    styles.optionText,
                    gender === 'other' && styles.selectedOptionText
                  ]}
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
              leftIcon="calendar-outline"
              error={formErrors.age}
              style={[styles.input, styles.halfInput]}
            />
            
            <Input
              label="Height"
              value={height}
              onChangeText={setHeight}
              placeholder="cm"
              keyboardType="decimal-pad"
              leftIcon="resize-outline"
              error={formErrors.height}
              style={[styles.input, styles.halfInput]}
            />
          </View>
          
          <Input
            label="Weight"
            value={weight}
            onChangeText={setWeight}
            placeholder="kg"
            keyboardType="decimal-pad"
            leftIcon="fitness-outline"
            error={formErrors.weight}
            style={styles.input}
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
                    style={[
                      styles.goalText,
                      goal === option && styles.selectedGoalText
                    ]}
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
        </View>
      </SlideIn>
    );
  };
  
  // Render success animation
  const renderSuccess = () => {
    return (
      <FadeIn>
        <View style={styles.successContainer}>
          <LottieView
            source={require('../../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.successAnimation}
          />
          <Text variant="cardTitle" style={styles.successTitle}>
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
          colors={[Colors.primaryBlue, Colors.primaryDarkBlue]}
          style={StyleSheet.absoluteFill}
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
            
            <Text style={styles.title} variant="pageTitle">
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
                  <Text variant="caption" style={styles.serverError}>
                    {formErrors.server}
                  </Text>
                )}
                
                {/* Form Steps */}
                {currentStep === 1 ? renderStep1() : renderStep2()}
                
                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text variant="body">
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={handleLoginPress} activeOpacity={0.7}>
                    <Text variant="body" style={styles.loginLink}>
                      Log In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          ) : renderSuccess()}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

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
  },
  title: {
    color: '#FFFFFF',
    fontWeight: Typography.bold,
  },
  blurContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  formContainer: {
    padding: Spacing.lg,
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
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: Colors.secondaryTextLight,
    marginHorizontal: Spacing.md,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
    fontWeight: Typography.bold,
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
  measurementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  serverError: {
    color: Colors.accentDanger,
    marginBottom: Spacing.md,
    textAlign: 'center',
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
    marginTop: Spacing.lg,
  },
  loginLink: {
    color: Colors.primaryBlue,
    fontWeight: Typography.semibold,
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
  },
  selectedOption: {
    borderColor: Colors.primaryBlue,
    backgroundColor: 'rgba(10, 108, 255, 0.05)',
  },
  optionText: {
    marginTop: 4,
    color: Colors.secondaryTextLight,
  },
  selectedOptionText: {
    color: Colors.primaryBlue,
    fontWeight: Typography.medium,
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
  },
  selectedGoal: {
    borderColor: Colors.primaryBlue,
    backgroundColor: 'rgba(10, 108, 255, 0.05)',
  },
  goalText: {
    color: Colors.secondaryTextLight,
  },
  selectedGoalText: {
    color: Colors.primaryBlue,
    fontWeight: Typography.medium,
  },
  successContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successAnimation: {
    width: 200,
    height: 200,
  },
  successTitle: {
    color: '#FFFFFF',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  successText: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});

export default SignUpScreen;