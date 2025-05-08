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
import { Theme, Typography, BorderRadius, Animation, createElevation } from '../../constants/Theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  type?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'disabled';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: IoniconsName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  rounded?: boolean;
}

/**
 * Button component following the modern GymTrackPro design system
 */
export default function Button({
  title,
  onPress = () => {},
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
  rounded = false,
}: ButtonProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Haptic feedback on press
  const handlePress = () => {
    if (!disabled && !loading) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  // Determine button height based on size
  const getButtonHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'large': return 54;
      default: return 46;
    }
  };

  // Determine button width
  const getButtonWidth = () => {
    if (fullWidth) return '100%';
    return null;
  };
  
  // Determine button border radius
  const getButtonBorderRadius = () => {
    if (rounded) {
      return getButtonHeight() / 2; // Fully rounded corners
    }
    
    switch (size) {
      case 'small': return BorderRadius.sm;
      case 'large': return BorderRadius.lg;
      default: return BorderRadius.md;
    }
  };
  
  // Determine button background colors based on type
  const getButtonBackground = () => {
    if (disabled || type === 'disabled') {
      return { backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' };
    }

    const gradientMap: { [key: string]: [string, string] } = {
      primary: [colors.primary, colors.primaryDark],
      danger: [colors.danger, '#FF3B58'],
      success: [colors.success, '#2BB894'],
    };

    const gradientColors = gradientMap[type];

    if (gradientColors) {
      return {
        element: (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ),
        backgroundColor: 'transparent',
      };
    }

    if (type === 'secondary') {
      return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
    }

    if (type === 'tertiary') {
      return { backgroundColor: 'transparent' };
    }

    return { backgroundColor: colors.primary };
  };
  
  // Determine text color based on button type
  const getTextColor = () => {
    if (disabled || type === 'disabled') return darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    
    switch (type) {
      case 'primary':
      case 'danger':
      case 'success':
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
      case 'small': return typeof Typography.caption === 'object' ? Typography.caption.fontSize : 12;
      case 'large': return typeof Typography.body === 'object' ? Typography.body.fontSize : 16;
      default: return typeof Typography.bodySmall === 'object' ? Typography.bodySmall.fontSize : 14;
    }
  };
  
  // Get font weight
  const getFontWeight = () => {
    return type === 'tertiary' ? '500' : '600';
  };
  
  const background = getButtonBackground();
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled || loading || type === 'disabled'}
      testID={testID}
      style={[
        styles.button,
        background,
        {
          height: getButtonHeight(),
          width: getButtonWidth(),
          borderRadius: getButtonBorderRadius(),
          ...(!disabled && type !== 'tertiary' && type !== 'secondary' && type !== 'disabled' && createElevation(1, darkMode)),
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
                size={size === 'small' ? 14 : 18} 
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
                  fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif-medium',
                },
                textStyle
              ]}
            >
              {title}
            </Text>
            
            {icon && iconPosition === 'right' && (
              <Ionicons 
                name={icon} 
                size={size === 'small' ? 14 : 18} 
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
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
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