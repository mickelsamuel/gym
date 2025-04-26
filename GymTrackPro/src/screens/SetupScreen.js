// SetupScreen.js
import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';

const SetupScreen = ({ navigation }) => {
  const { darkMode } = useContext(ExerciseContext);
  const insets = useSafeAreaInsets();
  
  // State
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Goals options
  const goals = [
    { id: 'strength', label: 'Strength', icon: 'barbell-outline' },
    { id: 'hypertrophy', label: 'Hypertrophy', icon: 'body-outline' },
    { id: 'endurance', label: 'Endurance', icon: 'refresh-outline' },
    { id: 'tone', label: 'Toning', icon: 'fitness-outline' }
  ];
  
  useEffect(() => {
    // Run entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleGoalSelect = (goalId) => {
    Haptics.selectionAsync();
    setSelectedGoal(goalId);
    setGoal(goalId);
  };
  
  const handleFinishSetup = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return;
    }
    
    if (!selectedGoal) {
      Alert.alert('Missing Information', 'Please select a fitness goal.');
      return;
    }
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await DatabaseService.saveProfile({
        name: name.trim(),
        age: 0,
        weight: 0,
        height: 0,
        goal: selectedGoal,
        experience: 'beginner'
      });
      await AsyncStorage.setItem('alreadyLaunched', 'true');
      navigation.replace('Main');
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      Alert.alert('Error', 'Could not complete setup. Please try again.');
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
            <Text style={styles.title}>Welcome to GymTrackPro</Text>
            <Text style={styles.subtitle}>
              Let's get some basic info to tailor your experience and workouts
            </Text>
          </View>
          
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
            
            <View style={styles.goalsContainer}>
              <Text style={styles.inputLabel}>Select Your Main Fitness Goal</Text>
              <View style={styles.goalOptions}>
                {goals.map((goalItem) => (
                  <TouchableOpacity
                    key={goalItem.id}
                    style={[
                      styles.goalOption,
                      selectedGoal === goalItem.id && styles.selectedGoal
                    ]}
                    onPress={() => handleGoalSelect(goalItem.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={goalItem.icon} 
                      size={32} 
                      color={selectedGoal === goalItem.id ? '#FFF' : '#007AFF'} 
                      style={styles.goalIcon}
                    />
                    <Text 
                      style={[
                        styles.goalText,
                        selectedGoal === goalItem.id && styles.selectedGoalText
                      ]}
                    >
                      {goalItem.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.button,
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleFinishSetup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '40%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    paddingVertical: 2,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16,
  },
  goalsContainer: {
    marginBottom: 32,
  },
  goalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalOption: {
    width: '48%',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedGoal: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  goalIcon: {
    marginBottom: 8,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  selectedGoalText: {
    color: '#FFF',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#97C1F7',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default SetupScreen;