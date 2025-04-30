import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography, BorderRadius, createShadow } from '../../constants/Theme';
import Text from './Text';

const { width } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

/**
 * Custom TabBar component for the bottom navigation
 * Follows the neumorphic design with frosted glass effect
 */
export default function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Handle tab press with haptic feedback
  const handleTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };
  
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.tabBar,
        ...createShadow(8, colors.shadow),
      }
    ]}>
      {/* Frosted glass effect for iOS */}
      {Platform.OS === 'ios' && (
        <BlurView
          tint={darkMode ? 'dark' : 'light'}
          intensity={90}
          style={StyleSheet.absoluteFill}
        />
      )}
      
      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;
          
          // Define icons for each tab
          let iconName: string;
          switch (route.name) {
            case 'Home':
              iconName = isFocused ? 'home' : 'home-outline';
              break;
            case 'Exercises':
              iconName = isFocused ? 'fitness' : 'fitness-outline';
              break;
            case 'Workout':
              iconName = isFocused ? 'barbell' : 'barbell-outline';
              break;
            case 'Social':
              iconName = isFocused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = isFocused ? 'person' : 'person-outline';
              break;
            default:
              iconName = isFocused ? 'ellipse' : 'ellipse-outline';
          }
          
          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => handleTabPress(route, isFocused)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {/* Pill-shaped indicator for selected tab */}
              {isFocused && (
                <View style={[
                  styles.activeIndicator,
                  { 
                    backgroundColor: darkMode ? 'rgba(10, 108, 255, 0.15)' : 'rgba(10, 108, 255, 0.08)',
                    borderRadius: 20,  // Make it more pill-shaped
                  }
                ]} />
              )}
              
              <View 
                style={[
                  styles.iconContainer,
                  isFocused && { transform: [{ scale: 1.1 }] } // Subtle scale on focus
                ]}
              >
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color={isFocused ? colors.primary : colors.tabBarInactive}
                  style={styles.icon}
                />
              </View>
              
              <Text
                variant="small"
                style={{
                  color: isFocused ? colors.primary : colors.tabBarInactive,
                  fontWeight: isFocused ? '600' : '400',
                  marginTop: 4,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    height: '100%',
    width,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    width: '70%',  // Narrower for more pill-like appearance
    height: '80%',
    borderRadius: BorderRadius.xl, // More rounded corners
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 2,
  },
}); 