import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextStyle,
  ViewStyle,
  TextInputProps,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography, BorderRadius, Spacing, createElevation } from '../../constants/Theme';
import Text from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  iconLeft?: string;
  iconRight?: string;
  onIconRightPress?: () => void;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  rounded?: boolean;
  variant?: 'filled' | 'outlined';
  touched?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  testID?: string;
}

/**
 * Input component following the GymTrackPro design system
 */
export default function Input({
  label,
  iconLeft,
  iconRight,
  onIconRightPress,
  error,
  helper,
  containerStyle,
  inputStyle,
  rounded = false,
  variant = 'filled',
  secureTextEntry = false,
  touched,
  onBlur,
  onFocus,
  testID,
  ...props
}: InputProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // Handle focus event
  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };
  
  // Handle blur event
  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  // Determine if there is an error
  const hasError = touched && error ? true : false;
  
  // Get background color based on variant, state, and theme
  const getBackgroundColor = () => {
    if (variant === 'outlined') {
      return 'transparent';
    }
    
    if (darkMode) {
      return isFocused ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.04)';
    }
    
    return isFocused ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.02)';
  };
  
  // Get border styles based on variant, focus state, and error
  const getBorderStyles = () => {
    if (variant === 'outlined') {
      const borderColor = hasError 
        ? colors.danger 
        : (isFocused ? colors.primary : colors.border);
        
      return {
        borderWidth: 1.5,
        borderColor,
      };
    }
    
    return {
      borderWidth: 0,
      borderBottomWidth: 2,
      borderBottomColor: hasError 
        ? colors.danger 
        : (isFocused ? colors.primary : 'transparent'),
    };
  };
  
  // Get text color based on theme
  const getTextColor = () => {
    return darkMode ? colors.text : colors.text;
  };
  
  // Get placeholder color based on theme
  const getPlaceholderColor = () => {
    return darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
  };
  
  // Get icon color based on focus state and theme
  const getIconColor = () => {
    if (hasError) return colors.danger;
    if (isFocused) return colors.primary;
    return darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)';
  };
  
  // Determine whether to show password toggle icon
  const showPasswordIcon = secureTextEntry && !iconRight;
  
  // Get password icon based on visibility
  const getPasswordIcon = () => {
    return isPasswordVisible ? 'eye-off-outline' : 'eye-outline';
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="caption"
          style={{ 
            ...styles.label,
            color: hasError ? colors.danger : colors.textSecondary 
          }}
        >
          {label}
        </Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderRadius: rounded ? 100 : BorderRadius.md,
            ...getBorderStyles(),
          },
          isFocused && !hasError && variant === 'filled' && createElevation(1, darkMode),
        ]}
      >
        {iconLeft && (
          <Ionicons
            name={iconLeft as any}
            size={18}
            color={getIconColor()}
            style={styles.iconLeft}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            {
              color: getTextColor(),
              paddingLeft: iconLeft ? 8 : 16,
              paddingRight: (iconRight || showPasswordIcon) ? 8 : 16,
            },
            inputStyle,
          ]}
          selectionColor={colors.primary}
          placeholderTextColor={getPlaceholderColor()}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          testID={testID}
          {...props}
        />
        
        {(showPasswordIcon || iconRight) && (
          <TouchableOpacity
            onPress={showPasswordIcon ? togglePasswordVisibility : onIconRightPress}
            style={styles.iconRight}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(showPasswordIcon ? getPasswordIcon() : iconRight) as any}
              size={18}
              color={getIconColor()}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(hasError || helper) && (
        <Text
          variant="tiny"
          style={{ 
            ...styles.helperText,
            color: hasError ? colors.danger : colors.textTertiary 
          }}
        >
          {hasError ? error : helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  label: {
    marginBottom: 4,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: Typography.body,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  iconLeft: {
    marginLeft: 16,
  },
  iconRight: {
    padding: 8,
    marginRight: 8,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 4,
  },
}); 