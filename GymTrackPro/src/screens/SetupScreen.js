// src/screens/SetupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService from '../services/DatabaseService';

const SetupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  const handleFinishSetup = async () => {
    if (!name || !goal) {
      Alert.alert('Incomplete', 'Please enter your name and fitness goal.');
      return;
    }
    try {
      // Save minimal profile to the database (AsyncStorage-based)
      await DatabaseService.saveProfile({
        name,
        age: 0,
        weight: 0,
        height: 0,
        goal,
        experience: 'beginner',
      });

      // Mark that setup is done
      await AsyncStorage.setItem('alreadyLaunched', 'true');
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', 'Could not complete setup.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to GymTrackPro</Text>
      <Text style={styles.subtitle}>Let's get some basic info to tailor your experience.</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Doe"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Main Fitness Goal</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. strength, hypertrophy, endurance, tone"
          value={goal}
          onChangeText={setGoal}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleFinishSetup}>
        <Text style={styles.buttonText}>Finish Setup</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});