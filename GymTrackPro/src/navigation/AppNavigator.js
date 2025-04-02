import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Context
import { AuthContext } from '../context/AuthContext';

// Screens for Auth
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Main App Navigation
import MainTabNavigator from './MainTabNavigator';

// Additional screens for Social and Details
import FriendRequestsScreen from '../screens/FriendRequestsScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import CustomWorkoutDetailScreen from '../screens/CustomWorkoutDetailScreen';
import AddExerciseScreen from '../screens/AddExerciseScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // If logged in, show main app and additional screens
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="CustomWorkoutDetailScreen" component={CustomWorkoutDetailScreen} />
            <Stack.Screen name="AddExerciseScreen" component={AddExerciseScreen} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
            <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
          </>
        ) : (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}