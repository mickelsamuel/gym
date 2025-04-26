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
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
            { opacity: fadeAnim }
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
                  { 
                    backgroundColor: cardColor,
                    transform: [
                      { translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        })
                      },
                      { scale: scaleAnim }
                    ]
                  }
                ]}
              >
                <View style={styles.headerContainer}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>
                    {initialData ? `Edit ${exerciseName} Set` : `Log ${exerciseName}`}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={handleCancel}
                    hitSlop={{top: 20, right: 20, bottom: 20, left: 20}}
                  >
                    <FontAwesome name="times" size={20} color={textColor} />
                  </TouchableOpacity>
                </View>
                
                {/* Date & Time Picker */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: darkMode ? '#ccc' : '#666' }]}>
                    Date & Time
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      { borderColor: darkMode ? '#555' : '#E0E0E0', backgroundColor: darkMode ? 'rgba(70,70,70,0.2)' : 'rgba(240,240,240,0.5)' }
                    ]}
                    onPress={() => {
                      setDatePickerVisibility(true);
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <View style={styles.datePickerButtonContent}>
                      <FontAwesome name="calendar" size={16} color={darkMode ? '#ccc' : '#666'} />
                      <Text style={[styles.dateText, { color: textColor }]}>
                        {formatDateTime(selectedDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                
                {/* Reps & Weight */}
                <View style={styles.setRepsWeightRow}>
                  <View style={styles.smallFormGroup}>
                    <Text style={[styles.label, { color: darkMode ? '#ccc' : '#666' }]}>
                      Reps
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: textColor,
                          borderColor: errors.reps ? '#FF6B6B' : darkMode ? '#555' : '#E0E0E0',
                          backgroundColor: darkMode ? 'rgba(70,70,70,0.2)' : 'rgba(240,240,240,0.5)'
                        }
                      ]}
                      value={reps}
                      onChangeText={(value) => handleInputChange('reps', value)}
                      placeholder="0"
                      placeholderTextColor={darkMode ? '#888' : '#999'}
                      keyboardType="number-pad"
                    />
                    {errors.reps && (
                      <Text style={styles.errorText}>{errors.reps}</Text>
                    )}
                  </View>
                  <View style={styles.smallFormGroupNoMargin}>
                    <Text style={[styles.label, { color: darkMode ? '#ccc' : '#666' }]}>
                      Weight
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: textColor,
                          borderColor: errors.weight ? '#FF6B6B' : darkMode ? '#555' : '#E0E0E0',
                          backgroundColor: darkMode ? 'rgba(70,70,70,0.2)' : 'rgba(240,240,240,0.5)'
                        }
                      ]}
                      value={weight}
                      onChangeText={(value) => handleInputChange('weight', value)}
                      placeholder="0.0"
                      placeholderTextColor={darkMode ? '#888' : '#999'}
                      keyboardType="decimal-pad"
                    />
                    {errors.weight && (
                      <Text style={styles.errorText}>{errors.weight}</Text>
                    )}
                  </View>
                </View>
                
                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: darkMode ? '#ccc' : '#666' }]}>
                    Notes
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.notesInput,
                      {
                        color: textColor,
                        borderColor: darkMode ? '#555' : '#E0E0E0',
                        backgroundColor: darkMode ? 'rgba(70,70,70,0.2)' : 'rgba(240,240,240,0.5)'
                      }
                    ]}
                    value={notes}
                    onChangeText={(value) => handleInputChange('notes', value)}
                    placeholder="Add notes about this set..."
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    multiline
                  />
                </View>
                
                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: darkMode ? '#444' : '#F0F0F0' }
                    ]}
                    onPress={handleCancel}
                  >
                    <Text style={[styles.cancelButtonText, { color: darkMode ? '#FFF' : '#333' }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { 
                      backgroundColor: '#007AFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 2,
                    }]}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveButtonText}>
                      {initialData ? 'Update' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="datetime"
                  date={selectedDate}
                  onConfirm={(date) => {
                    setSelectedDate(date);
                    setDatePickerVisibility(false);
                    if (Platform.OS === 'ios') {
                      Haptics.selectionAsync();
                    }
                  }}
                  onCancel={() => setDatePickerVisibility(false)}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    padding: 16
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1
  },
  closeButton: {
    padding: 5
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '500'
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  datePickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top'
  },
  setRepsWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  smallFormGroup: {
    flex: 1,
    marginRight: 12
  },
  smallFormGroupNoMargin: {
    flex: 1
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 6
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  }
});

export default WorkoutLogModal;