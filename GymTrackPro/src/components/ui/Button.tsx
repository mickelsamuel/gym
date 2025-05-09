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
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '../../context/ExerciseContext';
import {Theme, Spacing, BorderRadius, Animation, createElevation} from '../../constants/Theme';
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
export interface ButtonProps {
  title: string;
  onPress?: () => void;
  type?: 'primary' | 'secondary' | 'text' | 'icon' | 'fab' | 'danger' | 'success' | 'tertiary' | 'disabled';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: IoniconsName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
interface BackgroundStyle {
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  element?: React.ReactNode;
}
/**
 * Button component following the GymTrackPro design system
 * Includes accessibility features and minimum touch target size of 44x44px
 */
const Button: React.FC<ButtonProps> = ({
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
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  // Animation for press effect
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  // Haptic feedback on press
  const handlePressIn = () => {
    if (!disabled && !loading) {
      // Scale down animation
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: Animation.fast,
        useNativeDriver: true,
      }).start();
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };
  const handlePressOut = () => {
    if (!disabled && !loading) {
      // Scale back up animation
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: Animation.fast,
        useNativeDriver: true,
      }).start();
    }
  };
  // Determine button height based on size and type
  const getButtonHeight = (): number => {
    if (type === 'icon') return Math.max(48, 44); // Ensure minimum 44x44 target size
    if (type === 'fab') return Math.max(56, 44); // Ensure minimum 44x44 target size
    switch (size) {
      case 'small': return Math.max(44, 44); // Ensure minimum 44x44 target size
      case 'large': return 56;
      default: return 52; // Medium
    }
  };
  // Determine button width
  const getButtonWidth = () => {
    if (type === 'icon' || type === 'fab') return getButtonHeight();
    if (fullWidth) return '100%';
    return undefined;
  };
  // Determine button border radius
  const getButtonBorderRadius = () => {
    if (type === 'icon' || type === 'fab') return BorderRadius.circle;
    switch (size) {
      case 'small': return BorderRadius.sm;
      case 'large': return BorderRadius.md;
      default: return BorderRadius.md;
    }
  };
  // Get background style based on button type
  const getBackgroundStyle = (): BackgroundStyle => {
    // For disabled state
    if (disabled) {
      return { backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' };
    }
    // For different button types
    switch (type) {
      case 'primary':
        return {
          element: (
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
          backgroundColor: 'transparent',
          ...createElevation(1, darkMode),
        };
      case 'secondary':
        return {
          backgroundColor: darkMode ? 'transparent' : '#EEF3FF', // Use direct color value instead of theme.lightBlue
          borderWidth: 1,
          borderColor: theme.primary,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
        };
      case 'icon':
        return {
          backgroundColor: 'transparent',
        };
      case 'fab':
        return {
          element: (
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
          backgroundColor: 'transparent',
          ...createElevation(2, darkMode),
        };
      case 'danger':
        return {
          backgroundColor: theme.danger,
          ...createElevation(1, darkMode),
        };
      case 'success':
        return {
          backgroundColor: theme.success,
          ...createElevation(1, darkMode),
        };
      case 'tertiary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        };
      case 'disabled':
        return {
          backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        };
      default:
        return {
          backgroundColor: theme.primary,
        };
    }
  };
  // Get text color based on button type
  const getTextColor = () => {
    if (disabled) {
      return darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    }
    switch (type) {
      case 'primary':
      case 'fab':
      case 'danger':
      case 'success':
        return '#FFFFFF';
      case 'secondary':
        return theme.primary;
      case 'text':
      case 'icon':
      case 'tertiary':
        return theme.primary;
      case 'disabled':
        return darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
      default:
        return '#FFFFFF';
    }
  };
  // Get text size based on button size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };
  // Get font weight based on button type
  const getFontWeight = (): '700' | '600' | '500' => {
    if (type === 'text' || type === 'icon') return '500';
    return '700';
  };
  // Get font family based on weight
  const getFontFamily = (): string => {
    const weight = getFontWeight();
    switch (weight) {
      case '700': return 'Inter-Bold';
      case '600': return 'Inter-SemiBold';
      case '500': return 'Inter-Medium';
      default: return 'Inter';
    }
  };
  // Get padding based on button type and size
  const getPadding = (): ViewStyle => {
    if (type === 'icon' || type === 'fab') {
      return { padding: 0 };
    }
    switch (size) {
      case 'small':
        return { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs };
      case 'large':
        return { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md };
      default:
        return { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm };
    }
  };
  // Get icon size based on button size
  const getIconSize = () => {
    if (type === 'fab') return 24;
    if (type === 'icon') return 22;
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 22;
      default:
        return 18;
    }
  };
  // Determine if button has an icon
  const hasIcon = icon !== undefined;
  // Get background style for the button
  const backgroundStyle = getBackgroundStyle();
  // Build style for the button
  const buttonStyle: ViewStyle = {
    height: getButtonHeight(),
    width: getButtonWidth(),
    borderRadius: getButtonBorderRadius(),
    ...getPadding(),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: backgroundStyle.backgroundColor,
    borderWidth: backgroundStyle.borderWidth,
    borderColor: backgroundStyle.borderColor,
    minWidth: type === 'text' ? undefined : 70, // Ensure buttons aren't too narrow
  };
  // Accessibility props to ensure accessible buttons
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityState: { 
      disabled: disabled,
      busy: loading
    },
    accessibilityLabel: accessibilityLabel || title,
    accessibilityHint: accessibilityHint,
  };
  // Render the button
  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={loading || disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[buttonStyle, style]}
        activeOpacity={0.7}
        disabled={disabled || loading}
        testID={testID}
        {...accessibilityProps}
      >
        {/* Background gradient if present */}
        {backgroundStyle.element}
        {/* Left icon */}
        {hasIcon && iconPosition === 'left' && !loading && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getTextColor()}
            style={{ marginRight: title ? Spacing.xs : 0 }}
          />
        )}
        {/* Loading indicator */}
        {loading && (
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={getTextColor()}
            style={{ marginRight: title ? Spacing.xs : 0 }}
          />
        )}
        {/* Button text (not for icon button) */}
        {(type !== 'icon' && type !== 'fab') && (
          <Text
            style={[
              {
                color: getTextColor(),
                fontSize: getTextSize(),
                fontWeight: getFontWeight(),
                textAlign: 'center',
                fontFamily: getFontFamily(),
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
        {/* Right icon */}
        {hasIcon && iconPosition === 'right' && !loading && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getTextColor()}
            style={{ marginLeft: Spacing.xs }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
export default Button; 