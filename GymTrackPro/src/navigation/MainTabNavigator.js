// navigation/MainTabNavigator.js
import React, { useContext } from 'react';
import { Platform, View, StyleSheet, LogBox } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
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

// Icons and styling
import { Ionicons } from '@expo/vector-icons';
import { ExerciseContext } from '../context/ExerciseContext';
import Colors from '../constants/Colors';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { darkMode } = useContext(ExerciseContext);
  
  // Initialize a default colors object in case the import fails
  const defaultColors = {
    light: {
      primary: '#007AFF',
      background: '#F8F9FA',
      backgroundSecondary: '#FFFFFF',
      text: '#333333',
      textSecondary: '#666666',
      tabIconDefault: '#C4C4C6',
      tabIconSelected: '#007AFF',
      shadow: 'rgba(0,0,0,0.1)'
    },
    dark: {
      primary: '#0A84FF',
      background: '#1C1C1E',
      backgroundSecondary: '#2C2C2E',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
      tabIconDefault: '#515154',
      tabIconSelected: '#0A84FF',
      shadow: 'rgba(0,0,0,0.3)'
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = darkMode ? colorScheme.dark : colorScheme.light;
  
  const handleTabPress = () => {
    // Provide haptic feedback on tab press for iOS devices
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Exercises') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Workout') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Social') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          backgroundColor: Platform.OS === 'ios' 
            ? 'transparent' 
            : colors.backgroundSecondary,
          ...Platform.select({
            ios: {
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarBackground: () => 
          Platform.OS === 'ios' ? (
            <BlurView
              tint={darkMode ? "dark" : "light"}
              intensity={90}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        listeners={{
          tabPress: handleTabPress
        }}
      />
      <Tab.Screen 
        name="Exercises" 
        component={ExercisesScreen} 
        listeners={{
          tabPress: handleTabPress
        }}
      />
      <Tab.Screen 
        name="Workout" 
        component={WorkoutScreen} 
        listeners={{
          tabPress: handleTabPress
        }}
        options={{
          tabBarLabel: 'Workouts'
        }}
      />
      <Tab.Screen 
        name="Social" 
        component={SocialScreen} 
        listeners={{
          tabPress: handleTabPress
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        listeners={{
          tabPress: handleTabPress
        }}
      />
    </Tab.Navigator>
  );
}