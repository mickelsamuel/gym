// src/screens/WorkoutScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';

const WorkoutScreen = () => {
  const navigation = useNavigation();
  const { userGoal, getExercisesByGoal } = useContext(ExerciseContext);

  // Get exercises recommended by the user's goal
  const recommendedExercises = getExercisesByGoal(userGoal);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended Workout</Text>
      <Text style={styles.subtitle}>
        Based on your goal: {userGoal || 'No goal set'}
      </Text>

      <ScrollView style={styles.scrollArea}>
        {recommendedExercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={styles.exerciseCard}
            onPress={() =>
              navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })
            }
          >
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseCategory}>{exercise.category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default WorkoutScreen;

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
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  scrollArea: {
    marginTop: 8,
  },
  exerciseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});