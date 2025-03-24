// SetupScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';

export default function SetupScreen({ navigation }) {
  const { darkMode } = useContext(ExerciseContext);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const textColor = darkMode ? '#FFFFFF' : '#333';
  const cardColor = darkMode ? '#2C2C2E' : '#FFFFFF';
  const borderColor = darkMode ? '#555555' : '#E0E0E0';
  const placeholderColor = darkMode ? '#888888' : '#666';

  const handleFinishSetup = async () => {
    if (!name || !goal) {
      Alert.alert('Incomplete', 'Please enter your name and fitness goal.');
      return;
    }
    try {
      await DatabaseService.saveProfile({
        name,
        age: 0,
        weight: 0,
        height: 0,
        goal,
        experience: 'beginner'
      });
      await AsyncStorage.setItem('alreadyLaunched', 'true');
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', 'Could not complete setup.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Welcome to GymTrackPro</Text>
      <Text style={[styles.subtitle, { color: darkMode ? '#ccc' : '#666' }]}>
        Let's get some basic info to tailor your experience.
      </Text>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: darkMode ? '#ccc' : '#666' }]}>Your Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cardColor,
              borderColor,
              color: textColor
            }
          ]}
          placeholder="e.g. John Doe"
          placeholderTextColor={placeholderColor}
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: darkMode ? '#ccc' : '#666' }]}>Main Fitness Goal</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cardColor,
              borderColor,
              color: textColor
            }
          ]}
          placeholder="e.g. strength, hypertrophy, endurance, tone"
          placeholderTextColor={placeholderColor}
          value={goal}
          onChangeText={setGoal}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleFinishSetup}>
        <Text style={styles.buttonText}>Finish Setup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  inputContainer: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  }
});