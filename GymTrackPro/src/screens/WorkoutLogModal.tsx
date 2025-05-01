import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  TextInput,
  Animated,
  Vibration,
  Dimensions,
  StatusBar,
  ViewStyle,
  TextStyle
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Colors, Theme, Typography, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

// Import custom UI components
import { Text, Button, Card, CircleProgress } from '../components/ui';

const { width, height } = Dimensions.get('window');

// Types and interfaces
interface WorkoutLogData {
  date: string;
  weight: number;
  reps: number;
  notes: string;
}

interface WorkoutLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: WorkoutLogData) => void;
  exerciseName: string;
  darkMode: boolean;
  cardColor?: string;
  textColor?: string;
  initialData?: WorkoutLogData;
  previousPerformance?: Array<{
    weight: number;
    reps: number;
  }>;
}

interface FormErrors {
  weight?: string;
  reps?: string;
}

const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  const hours = (`0${date.getHours()}`).slice(-2);
  const minutes = (`0${date.getMinutes()}`).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const WorkoutLogModal: React.FC<WorkoutLogModalProps> = ({
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
  const [selectedDate, setSelectedDate] = useState<Date>(initialData ? new Date(initialData.date) : new Date());
  const [weight, setWeight] = useState<string>(initialData ? String(initialData.weight) : '');
  const [reps, setReps] = useState<string>(initialData ? String(initialData.reps) : '');
  const [notes, setNotes] = useState<string>(initialData ? initialData.notes : '');
  const [isDatePickerVisible, setDatePickerVisibility] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCompletionAnimation, setShowCompletionAnimation] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const completionAnimation = useRef<LottieView>(null);

  // Theme
  const theme = darkMode ? Theme.dark : Theme.light;

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

  const validateInput = (field: 'weight' | 'reps', value: string): string | null => {
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

  const handleInputChange = (field: 'weight' | 'reps' | 'notes', value: string): void => {
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

  const checkIfNewRecord = (): boolean => {
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

  const handleSave = (): void => {
    // Validate all fields
    const weightError = validateInput('weight', weight);
    const repsError = validateInput('reps', reps);
    
    if (weightError || repsError) {
      setErrors({
        weight: weightError || undefined,
        reps: repsError || undefined
      });
      
      // Provide haptic feedback for error
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate(100);
      }
      
      return;
    }
    
    const setData: WorkoutLogData = {
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

  const handleCancel = (): void => {
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

  const toggleDatePicker = (): void => {
    setDatePickerVisibility(!isDatePickerVisible);
    Haptics.selectionAsync();
  };

  const handleDateConfirm = (date: Date): void => {
    setSelectedDate(date);
    toggleDatePicker();
  };

  const renderCompletionAnimation = (): JSX.Element => {
    return (
      <View style={styles.completionAnimationContainer}>
        <View style={[
          styles.recordBadge,
          isNewRecord ? { backgroundColor: Colors.accentSuccess + '20' } : { display: 'none' }
        ]}>
          {isNewRecord && (
            <>
              <Ionicons 
                name="trophy" 
                size={18} 
                color={Colors.accentSuccess} 
                style={{ marginRight: 4 }}
              />
              <Text 
                variant="caption"
                style={{ 
                  color: Colors.accentSuccess,
                  fontWeight: '600' 
                }}
              >
                New Personal Record!
              </Text>
            </>
          )}
        </View>
        
        <LottieView
          ref={completionAnimation}
          source={require('../../assets/animations/checkmark-success.json')}
          style={styles.completionLottie}
          autoPlay
          loop={false}
        />
      </View>
    );
  };

  // Calculate the translate Y value for the modal content
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <TouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View 
          style={[
            styles.modalOverlay,
            { 
              backgroundColor: darkMode 
                ? 'rgba(0, 0, 0, 0.6)' 
                : 'rgba(0, 0, 0, 0.3)',
              opacity: fadeAnim 
            }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View 
                style={[
                  styles.modalContent, 
                  { 
                    backgroundColor: cardColor || theme.card,
                    opacity: fadeAnim,
                    transform: [
                      { translateY },
                      { scale: scaleAnim }
                    ],
                    ...createElevation(darkMode ? 5 : 3)
                  }
                ]}
              >
                {/* Modal Header */}
                <View style={styles.header}>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={handleCancel}
                  >
                    <Ionicons 
                      name="close" 
                      size={24} 
                      color={textColor || theme.textSecondary} 
                    />
                  </TouchableOpacity>
                  
                  <Text 
                    variant="heading3"
                    style={{ 
                      color: textColor || theme.text,
                      textAlign: 'center',
                      flex: 1
                    }}
                  >
                    {initialData ? 'Edit Set' : 'Log Set'}
                  </Text>
                  
                  <View style={styles.placeholderButton} />
                </View>

                {showCompletionAnimation ? (
                  renderCompletionAnimation()
                ) : (
                  <View style={styles.formContainer}>
                    <Text 
                      variant="heading2" 
                      style={{
                        marginBottom: Spacing.md,
                        textAlign: 'center',
                        color: textColor || theme.text
                      }}
                    >
                      {exerciseName}
                    </Text>
                    
                    <View style={styles.inputRow}>
                      {/* Weight Input */}
                      <View style={styles.inputContainer}>
                        <Text 
                          variant="body"
                          style={{
                            fontWeight: '600',
                            marginBottom: Spacing.xs,
                            color: textColor || theme.text
                          }}
                        >
                          Weight (kg)
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            { 
                              backgroundColor: darkMode 
                                ? 'rgba(255, 255, 255, 0.08)' 
                                : 'rgba(0, 0, 0, 0.04)',
                              color: textColor || theme.text,
                              borderColor: errors.weight
                                ? Colors.accentDanger
                                : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
                            }
                          ]}
                          placeholderTextColor={darkMode 
                            ? 'rgba(255, 255, 255, 0.3)' 
                            : 'rgba(0, 0, 0, 0.3)'
                          }
                          value={weight}
                          onChangeText={(text) => handleInputChange('weight', text)}
                          keyboardType="numeric"
                          placeholder="0.0"
                        />
                        {errors.weight && (
                          <Text 
                            variant="tiny"
                            style={{ 
                              color: Colors.accentDanger,
                              marginTop: 2
                            }}
                          >
                            {errors.weight}
                          </Text>
                        )}
                      </View>
                      
                      {/* Reps Input */}
                      <View style={styles.inputContainer}>
                        <Text 
                          variant="body"
                          style={{
                            fontWeight: '600',
                            marginBottom: Spacing.xs,
                            color: textColor || theme.text
                          }}
                        >
                          Reps
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            { 
                              backgroundColor: darkMode 
                                ? 'rgba(255, 255, 255, 0.08)' 
                                : 'rgba(0, 0, 0, 0.04)',
                              color: textColor || theme.text,
                              borderColor: errors.reps
                                ? Colors.accentDanger
                                : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
                            }
                          ]}
                          placeholderTextColor={darkMode 
                            ? 'rgba(255, 255, 255, 0.3)' 
                            : 'rgba(0, 0, 0, 0.3)'
                          }
                          value={reps}
                          onChangeText={(text) => handleInputChange('reps', text)}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                        {errors.reps && (
                          <Text 
                            variant="tiny"
                            style={{ 
                              color: Colors.accentDanger,
                              marginTop: 2
                            }}
                          >
                            {errors.reps}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Date Picker */}
                    <View style={styles.dateContainer}>
                      <Text 
                        variant="body"
                        style={{
                          fontWeight: '600',
                          marginBottom: Spacing.xs,
                          color: textColor || theme.text
                        }}
                      >
                        Date & Time
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.dateButton,
                          { 
                            backgroundColor: darkMode 
                              ? 'rgba(255, 255, 255, 0.08)' 
                              : 'rgba(0, 0, 0, 0.04)'
                          }
                        ]}
                        onPress={toggleDatePicker}
                      >
                        <Ionicons 
                          name="calendar-outline" 
                          size={18}
                          color={textColor || theme.textSecondary}
                          style={{ marginRight: 8 }}
                        />
                        <Text 
                          variant="body"
                          style={{ 
                            color: textColor || theme.text,
                            flex: 1
                          }}
                        >
                          {selectedDate.toLocaleString()}
                        </Text>
                        <Ionicons 
                          name="chevron-down" 
                          size={18}
                          color={textColor || theme.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Notes Input */}
                    <View style={styles.notesContainer}>
                      <Text 
                        variant="body"
                        style={{
                          fontWeight: '600',
                          marginBottom: Spacing.xs,
                          color: textColor || theme.text
                        }}
                      >
                        Notes (Optional)
                      </Text>
                      <TextInput
                        style={[
                          styles.notesInput,
                          { 
                            backgroundColor: darkMode 
                              ? 'rgba(255, 255, 255, 0.08)' 
                              : 'rgba(0, 0, 0, 0.04)',
                            color: textColor || theme.text,
                            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                          }
                        ]}
                        placeholderTextColor={darkMode 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.3)'
                        }
                        value={notes}
                        onChangeText={(text) => handleInputChange('notes', text)}
                        placeholder="Add notes about this set..."
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                    
                    {/* Action Buttons */}
                    <View style={styles.buttonsContainer}>
                      <Button
                        title="Cancel"
                        onPress={handleCancel}
                        type="secondary"
                        style={{ flex: 1, marginRight: Spacing.sm }}
                      />
                      <Button
                        title="Save"
                        onPress={handleSave}
                        type="primary"
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Animated.View>
      </TouchableWithoutFeedback>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleDateConfirm}
        onCancel={toggleDatePicker}
        date={selectedDate}
        isDarkModeEnabled={darkMode}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.lg,
    marginBottom: Platform.OS === 'ios' ? 0 : Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderButton: {
    width: 40,
  },
  formContainer: {
    paddingHorizontal: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    width: '48%',
  },
  input: {
    height: 50,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.body,
    borderWidth: 1,
  },
  dateContainer: {
    marginBottom: Spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  notesContainer: {
    marginBottom: Spacing.xl,
  },
  notesInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body,
    borderWidth: 1,
    minHeight: 100,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completionAnimationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  completionLottie: {
    width: 150,
    height: 150,
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.md,
  }
});

export default WorkoutLogModal; 