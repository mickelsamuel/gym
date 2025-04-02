// src/screens/WorkoutLogModal.js
import React, { useState, useEffect } from 'react';
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
  TextInput
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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
  }, [initialData, visible]);

  const handleSave = () => {
    if (!weight || !reps) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    if (isNaN(weightNum) || isNaN(repsNum)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers');
      return;
    }
    const setData = {
      date: formatDateTime(selectedDate),
      weight: weightNum,
      reps: repsNum,
      notes
    };
    onSave(setData);
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  {initialData ? `Edit ${exerciseName} Set` : `Log ${exerciseName}`}
                </Text>
                {/* Date & Time Picker */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: darkMode ? '#ccc' : '#666' }]}>
                    Date & Time
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      { borderColor: darkMode ? '#555' : '#E0E0E0', backgroundColor: cardColor }
                    ]}
                    onPress={() => setDatePickerVisibility(true)}
                  >
                    <Text style={{ color: textColor }}>
                      {formatDateTime(selectedDate)}
                    </Text>
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
                          borderColor: darkMode ? '#555' : '#E0E0E0',
                          backgroundColor: cardColor
                        }
                      ]}
                      value={reps}
                      onChangeText={setReps}
                      placeholder="0"
                      placeholderTextColor={darkMode ? '#888' : '#999'}
                      keyboardType="number-pad"
                    />
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
                          borderColor: darkMode ? '#555' : '#E0E0E0',
                          backgroundColor: cardColor
                        }
                      ]}
                      value={weight}
                      onChangeText={setWeight}
                      placeholder="0.0"
                      placeholderTextColor={darkMode ? '#888' : '#999'}
                      keyboardType="decimal-pad"
                    />
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
                        backgroundColor: cardColor
                      }
                    ]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add notes..."
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
                    onPress={onClose}
                  >
                    <Text style={[styles.cancelButtonText, { color: darkMode ? '#FFF' : '#333' }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#007AFF' }]}
                    onPress={handleSave}
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
                  }}
                  onCancel={() => setDatePickerVisibility(false)}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    padding: 16
  },
  modalContent: {
    borderRadius: 20,
    padding: 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    marginBottom: 6
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  setRepsWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  smallFormGroup: {
    flex: 1,
    marginRight: 8
  },
  smallFormGroupNoMargin: {
    flex: 1
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default WorkoutLogModal;