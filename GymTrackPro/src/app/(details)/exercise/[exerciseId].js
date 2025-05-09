import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ExerciseDetailScreen from '../../../screens/ExerciseDetailScreen';

export default function ExerciseDetail() {
  const { exerciseId } = useLocalSearchParams();
  
  return <ExerciseDetailScreen exerciseId={exerciseId} />;
} 