import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LogBox } from 'react-native';

// Fix Reanimated related warnings
LogBox.ignoreLogs([
  "[Reanimated] Native part of Reanimated doesn't seem to be initialized",
]);

// Context
import { AuthContext } from '../context/AuthContext';

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

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading, emailVerified } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
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