import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography, BorderRadius, createElevation } from '../../constants/Theme';
import Text from './Text';

const { width } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

/**
 * Custom TabBar component for the bottom navigation
 * Modern design with frosted glass effect
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        ...createElevation(3, darkMode),
      }
    ]}>
      {/* Frosted glass effect for iOS */}
      {Platform.OS === 'ios' && (
        <BlurView
          tint={darkMode ? 'dark' : 'light'}
          intensity={darkMode ? 70 : 80}
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
          
          // Get tab color based on focused state
          let tabColor;
          if (isFocused) {
            switch (index) {
              case 0: // Home
                tabColor = colors.primary;
                break;
              case 1: // Exercises
                tabColor = colors.secondary;
                break;
              case 2: // Workouts
                tabColor = colors.accent1;
                break;
              case 3: // Social
                tabColor = colors.accent2;
                break;
              case 4: // Profile
                tabColor = colors.primary;
                break;
              default:
                tabColor = colors.primary;
            }
          } else {
            tabColor = colors.tabBarInactive;
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
              {/* Indicator for selected tab */}
              {isFocused && (
                <View 
                  style={[
                    styles.activeIndicator,
                    { 
                      backgroundColor: darkMode 
                        ? `${tabColor}30` // 30% opacity version of the color
                        : `${tabColor}15`, // 15% opacity version of the color
                    }
                  ]} 
                />
              )}
              
              <View style={styles.iconContainer}>
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color={tabColor}
                  style={[
                    styles.icon,
                    isFocused && { transform: [{ scale: 1.1 }] }
                  ]}
                />
                
                <Text
                  style={{
                    color: tabColor,
                    fontSize: Typography.caption,
                    fontWeight: isFocused ? '600' : '500',
                    marginTop: 4,
                  }}
                >
                  {label}
                </Text>
              </View>
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
    height: 83,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
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
    paddingVertical: 8,
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    width: '80%',
    height: '85%',
    borderRadius: BorderRadius.pill,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  icon: {
    marginBottom: 2,
  },
}); 