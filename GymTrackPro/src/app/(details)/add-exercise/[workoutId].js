import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import AddExerciseScreen from '../../../screens/AddExerciseScreen';

export default function AddExercise() {
  const { workoutId } = useLocalSearchParams();
  
  return <AddExerciseScreen workoutId={workoutId} />;
} 