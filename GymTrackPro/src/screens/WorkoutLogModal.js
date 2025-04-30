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
  Dimensions
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Colors as ThemeColors, Typography, Spacing, BorderRadius, createNeumorphism } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
  initialData
}) => {
  const [selectedDate, setSelectedDate] = useState(initialData ? new Date(initialData.date) : new Date());
  const [weight, setWeight] = useState(initialData ? String(initialData.weight) : '');
  const [reps, setReps] = useState(initialData ? String(initialData.reps) : '');
  const [notes, setNotes] = useState(initialData ? initialData.notes : '');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [errors, setErrors] = useState({});

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Theme
  const theme = darkMode ? ThemeColors.dark : ThemeColors.light;
  const neumorphism = createNeumorphism(darkMode);

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
    
    // Success haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    onSave(setData);
  };

  const handleCancel = () => {
    // Animate out before closing
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      animationType="none" // We're handling our own animations
      transparent
      visible={visible}
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View 
                style={[
                  styles.modalContent, 
                  neumorphism,
                  { 
                    backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground,
                    opacity: fadeAnim,
                    transform: [
                      { scale: scaleAnim },
                      { 
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        }) 
                      }
                    ] 
                  }
                ]}
              >
                {/* Timer Display */}
                <View style={styles.headerSection}>
                  <LinearGradient
                    colors={[ThemeColors.primaryBlue, ThemeColors.primaryDarkBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                  >
                    <Text style={styles.modalTitle}>Log Workout</Text>
                    <Text style={styles.exerciseName}>{exerciseName}</Text>
                  </LinearGradient>
                </View>
                
                {/* Current Exercise Section */}
                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }]}>
                      Date & Time
                    </Text>
                    <TouchableOpacity 
                      style={[
                        styles.datePickerButton,
                        { backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground }
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDatePickerVisibility(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={20} color={darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight} />
                      <Text style={[styles.dateText, { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }]}>
                        {selectedDate.toLocaleString()}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={[styles.inputLabel, { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }]}>
                        Weight
                      </Text>
                      <View style={styles.inputWithButtons}>
                        <TouchableOpacity
                          style={styles.inputButton}
                          onPress={() => {
                            const currentValue = parseFloat(weight) || 0;
                            if (currentValue > 0) {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setWeight((currentValue - 2.5).toString());
                            }
                          }}
                        >
                          <Ionicons name="remove" size={18} color={ThemeColors.primaryBlue} />
                        </TouchableOpacity>
                        
                        <TextInput
                          style={[
                            styles.input,
                            { 
                              borderColor: errors.weight ? ThemeColors.accentDanger : darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
                            }
                          ]}
                          placeholder="0"
                          placeholderTextColor={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight}
                          keyboardType="numeric"
                          value={weight}
                          onChangeText={(value) => handleInputChange('weight', value)}
                        />
                        
                        <TouchableOpacity
                          style={styles.inputButton}
                          onPress={() => {
                            const currentValue = parseFloat(weight) || 0;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setWeight((currentValue + 2.5).toString());
                          }}
                        >
                          <Ionicons name="add" size={18} color={ThemeColors.primaryBlue} />
                        </TouchableOpacity>
                      </View>
                      {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }]}>
                        Reps
                      </Text>
                      <View style={styles.inputWithButtons}>
                        <TouchableOpacity
                          style={styles.inputButton}
                          onPress={() => {
                            const currentValue = parseInt(reps) || 0;
                            if (currentValue > 1) {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setReps((currentValue - 1).toString());
                            }
                          }}
                        >
                          <Ionicons name="remove" size={18} color={ThemeColors.primaryBlue} />
                        </TouchableOpacity>
                        
                        <TextInput
                          style={[
                            styles.input,
                            { 
                              borderColor: errors.reps ? ThemeColors.accentDanger : darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
                            }
                          ]}
                          placeholder="0"
                          placeholderTextColor={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight}
                          keyboardType="numeric"
                          value={reps}
                          onChangeText={(value) => handleInputChange('reps', value)}
                        />
                        
                        <TouchableOpacity
                          style={styles.inputButton}
                          onPress={() => {
                            const currentValue = parseInt(reps) || 0;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setReps((currentValue + 1).toString());
                          }}
                        >
                          <Ionicons name="add" size={18} color={ThemeColors.primaryBlue} />
                        </TouchableOpacity>
                      </View>
                      {errors.reps && <Text style={styles.errorText}>{errors.reps}</Text>}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }]}>
                      Notes (optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        { 
                          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight,
                          backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
                        }
                      ]}
                      placeholder="Add notes about this set..."
                      placeholderTextColor={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight}
                      multiline={true}
                      numberOfLines={3}
                      textAlignVertical="top"
                      value={notes}
                      onChangeText={(value) => handleInputChange('notes', value)}
                    />
                  </View>
                </View>

                {/* Log Form Section */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <LinearGradient
                      colors={[ThemeColors.primaryBlue, ThemeColors.primaryDarkBlue]}
                      style={styles.saveButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.saveButtonText}>Save Set</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Date Picker Modal */}
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="datetime"
                  date={selectedDate}
                  onConfirm={(date) => {
                    setDatePickerVisibility(false);
                    setSelectedDate(date);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                  onCancel={() => {
                    setDatePickerVisibility(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  themeVariant={darkMode ? 'dark' : 'light'}
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  modalContent: {
    width: width - 40,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  headerSection: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.bold,
    color: '#FFF',
    marginBottom: Spacing.xs,
  },
  exerciseName: {
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formSection: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.body,
    textAlign: 'center',
  },
  inputWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
    marginHorizontal: 4,
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  dateText: {
    flex: 1,
    fontSize: Typography.body,
    marginLeft: Spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cancelButton: {
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    color: ThemeColors.secondaryTextLight,
    fontSize: Typography.button,
    fontWeight: Typography.medium,
  },
  saveButton: {
    marginLeft: Spacing.sm,
  },
  saveButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: Typography.button,
    fontWeight: Typography.bold,
  },
  errorText: {
    color: ThemeColors.accentDanger,
    fontSize: Typography.small,
    marginTop: 4,
  },
});

export default WorkoutLogModal;