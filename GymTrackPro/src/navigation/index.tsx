import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
// Screens
import HomeScreen from '../screens/HomeScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import SocialScreen from '../screens/SocialScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import CustomWorkoutDetailScreen from '../screens/CustomWorkoutDetailScreen';
import AddExerciseScreen from '../screens/AddExerciseScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import FriendRequestsScreen from '../screens/FriendRequestsScreen';
import WorkoutLogModal from '../screens/WorkoutLogModal';
// Types
import { RootStackParamList, MainTabParamList } from './NavigationTypes';
// Context
import { useAuth } from '../hooks/useAuth';
import { useExercise } from '../context/ExerciseContext';
import { Theme } from '../constants/Theme';
// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
// Tab Navigator
function MainTabNavigator() {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  return (
    <Tab.Navigator
      {...{id: "MainTab"} as any}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Exercises') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Workout') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Social') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
// Root Navigator
export default function Navigation() {
  const { currentUser } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator 
        {...{id: "RootStack"} as any}
        screenOptions={{ headerShown: false }}
      >
        {currentUser ? (
          // User is logged in
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
            <Stack.Screen name="CustomWorkoutDetailScreen" component={CustomWorkoutDetailScreen} />
            <Stack.Screen name="AddExerciseScreen" component={AddExerciseScreen} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
            <Stack.Screen name="WorkoutLogModal" component={WorkoutLogModal} />
          </>
        ) : (
          // User is not logged in
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 