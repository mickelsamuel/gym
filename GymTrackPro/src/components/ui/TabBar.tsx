import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, ViewStyle, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, createElevation, Animation, Spacing, BorderRadius } from '../../constants/Theme';
import Text from './Text';
import TabBarBackground from './TabBarBackground';

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

interface TabItemProps {
  route: {
    key: string;
    name: string;
  };
  isFocused: boolean;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  theme: any;
  reducedMotion: boolean;
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

// Individual tab item with proper animation hooks
const TabItem: React.FC<TabItemProps> = ({ 
  route, 
  isFocused, 
  label, 
  onPress, 
  onLongPress, 
  theme,
  reducedMotion 
}) => {
  const iconName = getIconName(route.name, isFocused);
  // Icon animation
  const iconScale = useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;
  
  // Update icon scale when focus changes
  useEffect(() => {
    if (!reducedMotion) {
      Animated.spring(iconScale, {
        toValue: isFocused ? 1.1 : 1,
        friction: 10,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      iconScale.setValue(isFocused ? 1.1 : 1);
    }
  }, [isFocused, reducedMotion]);
  
  return (
    <TouchableOpacity
      accessibilityRole="tab"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={`${label} tab`}
      accessibilityHint={`Switches to ${label} tab`}
      testID={`${label}-tab`}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
      activeOpacity={0.7}
    >
      <Animated.View
        style={{
          transform: [{ scale: iconScale }]
        }}
      >
        <TabBarIcon
          name={iconName}
          color={isFocused ? theme.tabBarActive : theme.tabBarInactive}
          size={24}
        />
      </Animated.View>
      
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
};

export const TabBar = ({ state, descriptors, navigation, style }: TabBarProps) => {
  const { darkMode, reducedMotion } = useExercise();
  const insets = useSafeAreaInsets();
  const theme = darkMode ? Theme.dark : Theme.light;
  
  // Animation value for pill indicator
  const indicatorPosition = useRef(new Animated.Value(state.index)).current;
  
  // Update indicator position when tab changes
  useEffect(() => {
    if (!reducedMotion) {
      Animated.spring(indicatorPosition, {
        toValue: state.index,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      // Immediate transition for reduced motion
      indicatorPosition.setValue(state.index);
    }
  }, [state.index, reducedMotion]);
  
  // Set the height based on platform according to the design specification
  const tabBarHeight = Platform.OS === 'ios' ? 64 : 56;
  
  // Calculate the animated left position of the indicator
  const translateX = indicatorPosition.interpolate({
    inputRange: [0, state.routes.length - 1],
    outputRange: [0, (state.routes.length - 1) * 100],
    extrapolate: 'clamp',
  });
  
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
      
      {/* Pill indicator */}
      <Animated.View 
        style={[
          styles.pillIndicator,
          { 
            backgroundColor: theme.primary + '20', // 20% opacity
            transform: [{ 
              translateX: Animated.divide(
                translateX, 
                new Animated.Value(state.routes.length)
              )
            }],
            width: `${100 / state.routes.length}%`
          }
        ]}
        accessibilityLabel="Active tab indicator"
      />
      
      <View style={styles.content}>
        {state.routes.map((route: TabRoute, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;
          
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
            Haptics.impactAsync(
              Platform.OS === 'ios' 
                ? Haptics.ImpactFeedbackStyle.Medium 
                : Haptics.ImpactFeedbackStyle.Heavy
            );
            
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };
          
          return (
            <TabItem
              key={index}
              route={route}
              isFocused={isFocused}
              label={label}
              onPress={onPress}
              onLongPress={onLongPress}
              theme={theme}
              reducedMotion={reducedMotion}
            />
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
    ...createElevation(3),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
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
    position: 'relative',
    minWidth: 44, // Minimum accessibility touch target
    minHeight: 44, // Minimum accessibility touch target
  },
  pillIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    height: 36,
    borderRadius: BorderRadius.pill,
    zIndex: -1,
  },
  label: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
}); 