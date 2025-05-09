// App.js - This file is for compatibility with the old navigation system
// For expo-router, the _layout.js file is used instead
import React from 'react';
import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';

export default function App() {
  return <Redirect href="/" />;
}