// App.js
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { ExerciseProvider } from './src/context/ExerciseContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ExerciseProvider>
        <AppNavigator />
      </ExerciseProvider>
    </AuthProvider>
  );
}