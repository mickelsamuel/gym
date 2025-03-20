// App.js (in the project root)
import React from 'react';
import { ExerciseProvider } from './src/context/ExerciseContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ExerciseProvider>
      <AppNavigator />
    </ExerciseProvider>
  );
}