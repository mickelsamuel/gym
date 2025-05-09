import React from 'react';
import {View, TouchableOpacity, StyleSheet, Platform, ViewStyle, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '../../context/ExerciseContext';
import {Theme, createElevation} from '../../constants/Theme';
import Text from './Text';
import TabBarBackground from './TabBarBackground';
;
type TabBarIconName = 
  | 'home' 
  | 'home-outline'
  | 'barbell' 
  | 'barbell-outline'
  | 'calendar' 
  | 'calendar-outline'
  | 'people' 
  | 'people-outline'
  | 'person-circle' 
  | 'person-circle-outline';
interface TabBarIconProps {
  name: TabBarIconName;
  color: string;
  size: number;
}
interface TabRoute {
  key: string;
  name: string;
}
export interface TabBarProps {
  state: {
    routes: TabRoute[];
    index: number;
  };
  descriptors: {
    [key: string]: {
      options: {
        title?: string;
      };
    };
  };
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  style?: ViewStyle;
}
const TabBarIcon = ({ name, color, size }: TabBarIconProps) => {
  return <Ionicons name={name} size={size} color={color} />;
};
export const TabBar = ({ state, descriptors, navigation, style }: TabBarProps) => {
  const { darkMode } = useExercise();
  const insets = useSafeAreaInsets();
  const theme = darkMode ? Theme.dark : Theme.light;
  // Set the height based on platform according to the design specification
  const tabBarHeight = Platform.OS === 'ios' ? 64 : 56;
  // Get the icon name based on route name and focus state
  const getIconName = (routeName: string, isFocused: boolean): TabBarIconName => {
    switch (routeName) {
      case 'Home':
        return isFocused ? 'home' : 'home-outline';
      case 'Exercises':
        return isFocused ? 'barbell' : 'barbell-outline';
      case 'Workout':
        return isFocused ? 'calendar' : 'calendar-outline';
      case 'Social':
        return isFocused ? 'people' : 'people-outline';
      case 'Profile':
        return isFocused ? 'person-circle' : 'person-circle-outline';
      default:
        return 'home-outline';
    }
  };
  return (
    <View style={[
      styles.container,
      {
        height: tabBarHeight + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: 'transparent',
      },
      style
    ]}>
      <TabBarBackground darkMode={darkMode} />
      <View style={styles.content}>
        {state.routes.map((route: TabRoute, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;
          const iconName = getIconName(route.name, isFocused);
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              // Provide haptic feedback on tab press
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name);
            }
          };
          const onLongPress = () => {
            // Provide haptic feedback on long press
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };
          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={`${label} tab`}
              testID={`${label}-tab`}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {isFocused && (
                <View style={[
                  styles.indicator,
                  { backgroundColor: theme.primary }
                ]} />
              )}
              <TabBarIcon
                name={iconName}
                color={isFocused ? theme.tabBarActive : theme.tabBarInactive}
                size={24}
              />
              <Text
                style={[
                  styles.label,
                  { 
                    color: isFocused ? theme.tabBarActive : theme.tabBarInactive,
                    marginTop: 4,
                    fontFamily: isFocused ? 'Inter-Medium' : 'Inter',
                  }
                ]}
                variant="caption"
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...createElevation(2),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: Platform.OS === 'ios' ? 64 : 56,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    height: '100%',
  },
  indicator: {
    position: 'absolute',
    top: 8,
    width: '60%',
    height: 32,
    borderRadius: 16,
    opacity: 0.15,
  },
  label: {
    textAlign: 'center',
    fontSize: 12,
  },
}); 