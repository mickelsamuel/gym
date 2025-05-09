import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LogBox } from 'react-native';
// Context
import { useAuth } from '../hooks/useAuth';
// Screens for Auth
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
// Main App Navigation
import MainTabNavigator from './MainTabNavigator';
// Additional screens for Social and Details
import FriendRequestsScreen from '../screens/FriendRequestsScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import CustomWorkoutDetailScreen from '../screens/CustomWorkoutDetailScreen';
import AddExerciseScreen from '../screens/AddExerciseScreen';
// Fix Reanimated related warnings
LogBox.ignoreLogs([
  "[Reanimated] Native part of Reanimated doesn't seem to be initialized",
]);
// Define the parameter list for the root stack navigator
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  EmailVerification: undefined;
  FriendRequests: undefined;
  FriendProfile: { userId: string };
  ExerciseDetail: { exerciseId: string };
  CustomWorkoutDetailScreen: { workoutId: string };
  AddExerciseScreen: { workoutId: string };
};
const Stack = createStackNavigator<RootStackParamList>();
export default function AppNavigator() {
  const { currentUser, loading, emailVerified } = useAuth();
  if (loading) {
    return null;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator 
        {...{id: "RootStack"} as any}
        screenOptions={{ headerShown: false }}
      >
        {currentUser ? (
          // User is logged in
          emailVerified ? (
            // Email is verified - show main app and additional screens
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen name="CustomWorkoutDetailScreen" component={CustomWorkoutDetailScreen} />
              <Stack.Screen name="AddExerciseScreen" component={AddExerciseScreen} />
              <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
              <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
              <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            </>
          ) : (
            // Email not verified - show verification screen
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          )
        ) : (
          // Not logged in - show auth screens
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