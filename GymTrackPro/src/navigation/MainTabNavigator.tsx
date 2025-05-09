// navigation/MainTabNavigator.tsx
import React from 'react';
import { Platform, LogBox } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
// Screens
import HomeScreen from '../screens/HomeScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialScreen from '../screens/SocialScreen';
// Custom components
import { TabBar } from '../components/ui';
// Context and theme
import { useExercise } from '../context/ExerciseContext';
import { Theme } from '../constants/Theme';
// Suppress Reanimated warnings
LogBox.ignoreLogs([
  "[Reanimated] Native part of Reanimated doesn't seem to be initialized",
]);
// Define the parameter list for the tab navigator
export type MainTabParamList = {
  Home: undefined;
  Exercises: undefined;
  Workout: undefined;
  Social: undefined;
  Profile: undefined;
};
const Tab = createBottomTabNavigator<MainTabParamList>();
export default function MainTabNavigator() {
  const { darkMode } = useExercise();
  // Get theme colors based on dark mode
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Define props to avoid TypeScript errors with id prop
  const navigatorProps = {
    tabBar: (props: any) => <TabBar {...props as any} />,
    screenOptions: {
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        position: 'absolute',
        elevation: 0,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
    }
  };
  
  return (
    // @ts-ignore - There's a type mismatch with the Navigator component in react-navigation
    <Tab.Navigator {...navigatorProps}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab'
        }}
        listeners={{
          tabPress: () => {
            // Provide haptic feedback on tab press
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }}
      />
      <Tab.Screen 
        name="Exercises" 
        component={ExercisesScreen} 
        options={{
          title: 'Exercises',
          tabBarAccessibilityLabel: 'Exercises tab'
        }}
        listeners={{
          tabPress: () => {
            // Provide haptic feedback on tab press
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }}
      />
      <Tab.Screen 
        name="Workout" 
        component={WorkoutScreen} 
        options={{
          title: 'Workouts',
          tabBarAccessibilityLabel: 'Workouts tab'
        }}
        listeners={{
          tabPress: () => {
            // Provide haptic feedback on tab press
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }}
      />
      <Tab.Screen 
        name="Social" 
        component={SocialScreen} 
        options={{
          title: 'Social',
          tabBarAccessibilityLabel: 'Social tab'
        }}
        listeners={{
          tabPress: () => {
            // Provide haptic feedback on tab press
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab'
        }}
        listeners={{
          tabPress: () => {
            // Provide haptic feedback on tab press
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }}
      />
    </Tab.Navigator>
  );
}