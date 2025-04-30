import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography, BorderRadius, Animation, createShadow } from '../../constants/Theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: IoniconsName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

/**
 * Button component following the GymTrackPro design system
 */
export default function Button({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Haptic feedback on press
  const handlePress = () => {
    if (!disabled && !loading) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }
  };

  // Determine button height based on size
  const getButtonHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'large': return 56;
      default: return 48;
    }
  };

  // Determine button width
  const getButtonWidth = () => {
    if (fullWidth) return '100%';
    return null;
  };
  
  // Determine button background colors based on type
  const getButtonBackground = () => {
    if (disabled) return { backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' };
    
    switch (type) {
      case 'primary':
        return {
          element: (
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
          backgroundColor: 'transparent',
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        };
      case 'tertiary':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          element: (
            <LinearGradient
              colors={[colors.danger, '#FF2D50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
          backgroundColor: 'transparent',
        };
      default:
        return { backgroundColor: colors.primary };
    }
  };
  
  // Determine text color based on button type
  const getTextColor = () => {
    if (disabled) return darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    
    switch (type) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return colors.primary;
      case 'tertiary':
        return colors.primary;
      default:
        return colors.text;
    }
  };
  
  // Determine font size based on button size
  const getFontSize = () => {
    switch (size) {
      case 'small': return Typography.caption;
      case 'large': return Typography.body;
      default: return Typography.button;
    }
  };
  
  // Get font weight as a valid string
  const getFontWeight = () => {
    return type === 'tertiary' ? '500' : '600';
  };
  
  const background = getButtonBackground();
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      testID={testID}
      style={[
        styles.button,
        background,
        {
          height: getButtonHeight(),
          width: getButtonWidth(),
          borderRadius: type === 'tertiary' ? 0 : BorderRadius.md,
          ...(!disabled && !background.element && type !== 'tertiary' && type !== 'secondary' && createShadow(4)),
        },
        style
      ]}
    >
      {background.element}
      
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            color={getTextColor()} 
            size="small" 
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons 
                name={icon} 
                size={size === 'small' ? 16 : 20} 
                color={getTextColor()} 
                style={styles.leftIcon} 
              />
            )}
            
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: getFontSize(),
                  fontWeight: getFontWeight(),
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Rounded' : 'sans-serif-medium',
                },
                textStyle
              ]}
            >
              {title}
            </Text>
            
            {icon && iconPosition === 'right' && (
              <Ionicons 
                name={icon} 
                size={size === 'small' ? 16 : 20} 
                color={getTextColor()} 
                style={styles.rightIcon} 
              />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
}); 