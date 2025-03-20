// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import DatabaseService from '../services/DatabaseService';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    experience: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedProfile = await DatabaseService.getProfile();
        if (storedProfile) {
          setProfile({
            name: storedProfile.name || '',
            age: storedProfile.age ? storedProfile.age.toString() : '',
            weight: storedProfile.weight ? storedProfile.weight.toString() : '',
            height: storedProfile.height ? storedProfile.height.toString() : '',
            goal: storedProfile.goal || '',
            experience: storedProfile.experience || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile.name || !profile.goal) {
      Alert.alert('Incomplete', 'Please fill in at least your name and goal.');
      return;
    }
    try {
      await DatabaseService.saveProfile({
        name: profile.name,
        age: parseInt(profile.age) || 0,
        weight: parseFloat(profile.weight) || 0,
        height: parseFloat(profile.height) || 0,
        goal: profile.goal,
        experience: profile.experience,
      });
      Alert.alert('Profile Saved', 'Your profile has been updated successfully.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={profile.age}
          onChangeText={(text) => setProfile({ ...profile, age: text })}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          value={profile.weight}
          onChangeText={(text) => setProfile({ ...profile, weight: text })}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Height (inches)</Text>
        <TextInput
          style={styles.input}
          value={profile.height}
          onChangeText={(text) => setProfile({ ...profile, height: text })}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Goal</Text>
        <TextInput
          style={styles.input}
          value={profile.goal}
          onChangeText={(text) => setProfile({ ...profile, goal: text })}
          placeholder="e.g. strength, hypertrophy, endurance, tone"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Experience Level</Text>
        <TextInput
          style={styles.input}
          value={profile.experience}
          onChangeText={(text) => setProfile({ ...profile, experience: text })}
          placeholder="e.g. beginner, intermediate, advanced"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});