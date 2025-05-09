import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ExerciseContext } from '../context/ExerciseContext';
import { Stack, Redirect } from 'expo-router';
import { Theme } from '../constants/Theme';

export default function MainScreen() {
  const { darkMode } = useContext(ExerciseContext);
  
  // Get theme colors based on dark mode
  const colors = darkMode ? Theme.dark : Theme.light;

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Redirect href="/(tabs)" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 