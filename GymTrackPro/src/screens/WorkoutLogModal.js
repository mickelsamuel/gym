// src/screens/WorkoutLogModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  TextInput,
  Animated,
  Vibration,
  Dimensions,
  StatusBar
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Colors as ThemeColors, Typography, Spacing, BorderRadius, createNeumorphism, createShadow } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

// Import custom UI components
import { Button, CircleProgress } from '../components/ui';

const { width, height } = Dimensions.get('window');

const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  const hours = (`0${date.getHours()}`).slice(-2);
  const minutes = (`0${date.getMinutes()}`).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const WorkoutLogModal = ({
  visible,
  onClose,
  onSave,
  exerciseName,
  darkMode,
  cardColor,
  textColor,
  initialData,
  previousPerformance
}) => {
  const [selectedDate, setSelectedDate] = useState(initialData ? new Date(initialData.date) : new Date());
  const [weight, setWeight] = useState(initialData ? String(initialData.weight) : '');
  const [reps, setReps] = useState(initialData ? String(initialData.reps) : '');
  const [notes, setNotes] = useState(initialData ? initialData.notes : '');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const completionAnimation = useRef(null);

  // Theme
  const theme = darkMode ? ThemeColors.dark : ThemeColors.light;
  const neumorphism = createNeumorphism(!darkMode, 8);

  useEffect(() => {
    if (initialData) {
      setSelectedDate(new Date(initialData.date));
      setWeight(String(initialData.weight));
      setReps(String(initialData.reps));
      setNotes(initialData.notes);
    } else {
      setSelectedDate(new Date());
      setWeight('');
      setReps('');
      setNotes('');
    }
    setErrors({});
  }, [initialData, visible]);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset animations when closed
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
      scaleAnim.setValue(0.95);
      setShowCompletionAnimation(false);
    }
  }, [visible]);

  const validateInput = (field, value) => {
    if (field === 'weight') {
      if (!value.trim()) {
        return 'Weight is required';
      }
      if (isNaN(parseFloat(value))) {
        return 'Enter a valid number';
      }
    }
    if (field === 'reps') {
      if (!value.trim()) {
        return 'Reps are required';
      }
      if (isNaN(parseInt(value)) || parseInt(value) <= 0) {
        return 'Enter a valid number';
      }
    }
    return null;
  };

  const handleInputChange = (field, value) => {
    // Clear error when user starts typing
    setErrors(prev => ({...prev, [field]: null}));
    
    // Provide haptic feedback
    Haptics.selectionAsync();
    
    if (field === 'weight') {
      setWeight(value);
    } else if (field === 'reps') {
      setReps(value);
    } else if (field === 'notes') {
      setNotes(value);
    }
  };

  const checkIfNewRecord = () => {
    if (!previousPerformance || !previousPerformance.length) return false;
    
    const currentWeight = parseFloat(weight);
    const currentReps = parseInt(reps);
    const currentVolume = currentWeight * currentReps;
    
    const previousMax = previousPerformance.reduce((max, set) => {
      const setVolume = set.weight * set.reps;
      return setVolume > max ? setVolume : max;
    }, 0);
    
    return currentVolume > previousMax;
  };

  const handleSave = () => {
    // Validate all fields
    const weightError = validateInput('weight', weight);
    const repsError = validateInput('reps', reps);
    
    if (weightError || repsError) {
      setErrors({
        weight: weightError,
        reps: repsError
      });
      
      // Provide haptic feedback for error
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate(100);
      }
      
      return;
    }
    
    const setData = {
      date: formatDateTime(selectedDate),
      weight: parseFloat(weight),
      reps: parseInt(reps),
      notes
    };
    
    // Check if this is a new record
    const isRecord = checkIfNewRecord();
    setIsNewRecord(isRecord);
    
    // Show completion animation
    setShowCompletionAnimation(true);
    
    // Success haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(
        isRecord 
          ? Haptics.NotificationFeedbackType.Success 
          : Haptics.NotificationFeedbackType.Success
      );
      
      if (isRecord) {
        // Double haptic for a record
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 300);
      }
    }
    
    // Delay closing to show animation
    setTimeout(() => {
      onSave(setData);
      setShowCompletionAnimation(false);
    }, isRecord ? 1800 : 1200);
  };

  const handleCancel = () => {
    // Animate out before closing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  const toggleDatePicker = () => {
    setDatePickerVisibility(!isDatePickerVisible);
  };

  const handleDateConfirm = (date) => {
    setSelectedDate(date);
    toggleDatePicker();
  };

  // Render completion animation overlay
  const renderCompletionAnimation = () => {
    if (!showCompletionAnimation) return null;
    
    return (
      <View style={styles.completionOverlay}>
        {isNewRecord ? (
          <>
            <LottieView
              ref={completionAnimation}
              source={require('../../assets/animations/confetti.json')}
              autoPlay
              loop={false}
              style={styles.confettiAnimation}
            />
            <Text style={styles.newRecordText}>NEW RECORD!</Text>
          </>
        ) : (
          <LottieView
            ref={completionAnimation}
            source={require('../../assets/animations/checkmark.json')}
            autoPlay
            loop={false}
            style={styles.checkmarkAnimation}
          />
        )}
      </View>
    );
  };

  return (
    <Modal
      animationType="none" // We're handling our own animations
      transparent
      visible={visible}
      onRequestClose={handleCancel}
    >
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <TouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View 
                style={[
                  styles.modalContent,
                  neumorphism,
                  { 
                    backgroundColor: theme.card,
                    borderRadius: BorderRadius.lg,
                    transform: [
                      { translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [200, 0]
                        })
                      },
                      { scale: scaleAnim }
                    ]
                  }
                ]}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.dragHandle} />
                  
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Log {exerciseName}
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleCancel}
                    hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Previous Performance */}
                {previousPerformance && previousPerformance.length > 0 && (
                  <View style={styles.previousPerformance}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                      Previous Performance
                    </Text>
                    
                    <View style={styles.previousStatsContainer}>
                      <View style={styles.previousStat}>
                        <Text style={[styles.previousStatValue, { color: theme.primary }]}>
                          {previousPerformance[0].weight} kg
                        </Text>
                        <Text style={[styles.previousStatLabel, { color: theme.textSecondary }]}>
                          Last Weight
                        </Text>
                      </View>
                      
                      <View style={styles.previousStat}>
                        <Text style={[styles.previousStatValue, { color: theme.primary }]}>
                          {previousPerformance[0].reps}
                        </Text>
                        <Text style={[styles.previousStatLabel, { color: theme.textSecondary }]}>
                          Last Reps
                        </Text>
                      </View>
                      
                      <View style={styles.previousStat}>
                        <Text style={[styles.previousStatValue, { color: theme.primary }]}>
                          {Math.max(...previousPerformance.map(p => p.weight))} kg
                        </Text>
                        <Text style={[styles.previousStatLabel, { color: theme.textSecondary }]}>
                          Best Weight
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                
                <View style={styles.inputSection}>
                  {/* Date Picker */}
                  <View style={styles.formGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Date & Time</Text>
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton,
                        { 
                          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        }
                      ]}
                      onPress={toggleDatePicker}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <Text style={[styles.dateText, { color: theme.text }]}>
                        {selectedDate.toLocaleString()}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Weight & Reps Inputs */}
                  <View style={styles.inputRow}>
                    <View style={[styles.formGroup, styles.halfWidth]}>
                      <Text style={[styles.inputLabel, { color: theme.text }]}>
                        Weight (kg)
                      </Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            { 
                              color: theme.text,
                              backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                              borderColor: errors.weight 
                                ? theme.danger
                                : darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                            }
                          ]}
                          value={weight}
                          onChangeText={(text) => handleInputChange('weight', text)}
                          keyboardType="numeric"
                          placeholder="Weight"
                          placeholderTextColor={theme.textSecondary}
                        />
                        {errors.weight ? (
                          <Text style={[styles.errorText, { color: theme.danger }]}>
                            {errors.weight}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    
                    <View style={[styles.formGroup, styles.halfWidth]}>
                      <Text style={[styles.inputLabel, { color: theme.text }]}>
                        Reps
                      </Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            { 
                              color: theme.text,
                              backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                              borderColor: errors.reps 
                                ? theme.danger 
                                : darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                            }
                          ]}
                          value={reps}
                          onChangeText={(text) => handleInputChange('reps', text)}
                          keyboardType="numeric"
                          placeholder="Reps"
                          placeholderTextColor={theme.textSecondary}
                        />
                        {errors.reps ? (
                          <Text style={[styles.errorText, { color: theme.danger }]}>
                            {errors.reps}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                  
                  {/* Notes Input */}
                  <View style={styles.formGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>
                      Notes (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        { 
                          color: theme.text,
                          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        }
                      ]}
                      value={notes}
                      onChangeText={(text) => handleInputChange('notes', text)}
                      placeholder="Add notes about this set..."
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <Button
                    title="Cancel"
                    onPress={handleCancel}
                    type="secondary"
                    style={styles.actionButton}
                  />
                  
                  <Button
                    title="Save Set"
                    onPress={handleSave}
                    type="primary"
                    style={styles.actionButton}
                  />
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
          
          {/* Date Picker */}
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            onConfirm={handleDateConfirm}
            onCancel={toggleDatePicker}
            date={selectedDate}
            themeVariant={darkMode ? 'dark' : 'light'}
          />
          
          {/* Completion Animation */}
          {renderCompletionAnimation()}
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.3)',
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: Typography.sectionHeader,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 12,
    zIndex: 10,
  },
  previousPerformance: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: Typography.caption,
    marginBottom: 10,
  },
  previousStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previousStat: {
    alignItems: 'center',
    flex: 1,
  },
  previousStatValue: {
    fontSize: Typography.cardTitle,
    fontWeight: '600',
    marginBottom: 4,
  },
  previousStatLabel: {
    fontSize: Typography.small,
  },
  inputSection: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    fontSize: Typography.caption,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    fontSize: Typography.body,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: Typography.body,
    minHeight: 100,
  },
  errorText: {
    fontSize: Typography.small,
    marginTop: 4,
    marginLeft: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: 50,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: Typography.body,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9999,
  },
  confettiAnimation: {
    width: width,
    height: height,
    position: 'absolute',
  },
  checkmarkAnimation: {
    width: 150,
    height: 150,
  },
  newRecordText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 150,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default WorkoutLogModal;