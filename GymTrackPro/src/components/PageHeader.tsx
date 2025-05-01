import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { useNavigation } from '@react-navigation/native';
import { Theme, Spacing, BorderRadius, createElevation } from '../constants/Theme';

interface PageHeaderAction {
  icon: string;
  onPress: () => void;
  color?: string;
  testID?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  transparent?: boolean;
  elevated?: boolean;
  leftAction?: PageHeaderAction;
  rightActions?: PageHeaderAction[];
  style?: ViewStyle;
  titleStyle?: ViewStyle;
  onBackPress?: () => void;
}

/**
 * PageHeader - Consistent header component for all screens
 */
export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  transparent = false,
  elevated = false,
  leftAction,
  rightActions = [],
  style,
  titleStyle,
  onBackPress,
}: PageHeaderProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  const navigation = useNavigation();
  
  // Handle back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };
  
  // Get background color based on theme and transparent prop
  const getBackgroundColor = () => {
    if (transparent) return 'transparent';
    return colors.background;
  };
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        elevated && !transparent && createElevation(2, darkMode),
        style,
      ]}
    >
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <View style={styles.row}>
        {/* Left side - Back button or custom action */}
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          )}
          
          {!showBack && leftAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={leftAction.onPress}
              activeOpacity={0.7}
              testID={leftAction.testID}
            >
              <Ionicons
                name={leftAction.icon as any}
                size={24}
                color={leftAction.color || colors.text}
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Center - Title and subtitle */}
        <View style={[styles.titleContainer, titleStyle]}>
          <Text
            variant="title"
            style={{
              fontWeight: '600',
              textAlign: 'center',
              color: colors.text
            } as TextStyle}
            numberOfLines={1}
          >
            {title}
          </Text>
          
          {subtitle && (
            <Text
              variant="caption"
              style={{
                textAlign: 'center',
                marginTop: 2,
                color: colors.textSecondary
              } as TextStyle}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {/* Right side - Action buttons */}
        <View style={styles.rightContainer}>
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                index < rightActions.length - 1 && styles.actionMargin,
              ]}
              onPress={action.onPress}
              activeOpacity={0.7}
              testID={action.testID}
            >
              <Ionicons
                name={action.icon as any}
                size={24}
                color={action.color || colors.text}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 48 : StatusBar.currentHeight || 0 + 8,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomRightRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  leftContainer: {
    width: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    width: 100, // Enough space for multiple actions
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 2,
  },
  backButton: {
    padding: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  actionMargin: {
    marginRight: Spacing.sm,
  },
}); 