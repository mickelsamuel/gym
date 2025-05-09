import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CustomWorkoutDetailScreen from '../../../screens/CustomWorkoutDetailScreen';

export default function WorkoutDetail() {
  const { workoutId } = useLocalSearchParams();
  
  return <CustomWorkoutDetailScreen workoutId={workoutId} />;
} 