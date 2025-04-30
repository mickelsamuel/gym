// navigation/MainTabNavigator.js
import React, { useContext } from 'react';
import { Platform, LogBox } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';

// Suppress Reanimated warnings
LogBox.ignoreLogs([
  "[Reanimated] Native part of Reanimated doesn't seem to be initialized",
]);

// Screens
import HomeScreen from '../screens/HomeScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialScreen from '../screens/SocialScreen';

// Custom components
import { TabBar } from '../components/ui';

// Context and theme
import { ExerciseContext } from '../context/ExerciseContext';
import { Theme } from '../constants/Theme';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { darkMode } = useContext(ExerciseContext);
  
  // Get theme colors based on dark mode
  const colors = darkMode ? Theme.dark : Theme.light;
  
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Home'
        }}
      />
      <Tab.Screen 
        name="Exercises" 
        component={ExercisesScreen} 
        options={{
          title: 'Exercises'
        }}
      />
      <Tab.Screen 
        name="Workout" 
        component={WorkoutScreen} 
        options={{
          title: 'Workouts'
        }}
      />
      <Tab.Screen 
        name="Social" 
        component={SocialScreen} 
        options={{
          title: 'Social'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
}