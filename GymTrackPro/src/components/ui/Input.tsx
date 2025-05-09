import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {TextInput, View, StyleSheet, TextInputProps, TextStyle, ViewStyle, TouchableOpacity, NativeSyntheticEvent, TextInputFocusEventData, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Colors, BorderRadius, Spacing } from '../../constants/Theme';
import Text from './Text';
export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  iconLeft?: string;
  iconRight?: string;
  onRightIconPress?: () => void;
  onIconRightPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  valid?: boolean;
  testID?: string;
  touched?: boolean;
}
export interface InputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}
/**
 * Input component
 * 
 * A custom text input component following the design specification
 */
const Input = forwardRef<InputRef, InputProps>((props, ref) => {
  const {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    iconLeft,
    iconRight,
    onRightIconPress,
    onIconRightPress,
    containerStyle,
    inputStyle,
    labelStyle,
    valid,
    testID,
    touched,
    ...restProps
  } = props;
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => inputRef.current?.clear(),
  }));
  // Determine input state for styling
  const hasError = !!error;
  const isValid = !!valid && !hasError;
  // Handle focus
  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };
  // Handle blur
  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };
  // Determine border and icon colors based on component state
  const borderColor = hasError ? Colors.danger : 
                     isValid ? Colors.success : 
                     isFocused ? theme.primary : 
                     theme.border;
  const iconColor = hasError ? Colors.danger : 
                    isValid ? Colors.success : 
                    isFocused ? theme.primary : 
                    theme.textSecondary;
  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text
          variant="bodySmall"
          style={[
            styles.label,
            { color: hasError ? Colors.danger : theme.textSecondary },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderColor,
            borderWidth: 1,
          },
          isFocused && styles.focused,
        ]}
      >
        {(leftIcon || iconLeft) && (
          <View style={styles.leftIconContainer}>
            <Ionicons 
              name={(leftIcon || iconLeft) as any} 
              size={20} 
              color={iconColor} 
            />
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: theme.text,
              paddingLeft: (leftIcon || iconLeft) ? 0 : Spacing.sm,
              paddingRight: (rightIcon || iconRight || hasError || isValid) ? 0 : Spacing.sm,
            },
            inputStyle,
          ]}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...restProps}
        />
        {(rightIcon || iconRight || hasError || isValid) && (
          <TouchableOpacity 
            style={styles.rightIconContainer} 
            onPress={onIconRightPress || onRightIconPress}
            disabled={!(onIconRightPress || onRightIconPress)}
          >
            <Ionicons 
              name={
                hasError ? 'alert-circle' : 
                isValid ? 'checkmark-circle' : 
                (rightIcon || iconRight) as any
              } 
              size={20} 
              color={iconColor} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
          variant="caption"
          color={Colors.danger}
          style={styles.helperText}
        >
          {error}
        </Text>
      )}
      {!error && hint && (
        <Text
          variant="caption"
          color={theme.textSecondary}
          style={styles.helperText}
        >
          {hint}
        </Text>
      )}
    </View>
  );
});

// Add display name
Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    height: 56,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  label: {
    marginBottom: Spacing.xs,
  },
  focused: {
    borderWidth: 2,
  },
  leftIconContainer: {
    paddingHorizontal: Spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    paddingHorizontal: Spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    marginTop: Spacing.xs,
  },
});
export default Input; 