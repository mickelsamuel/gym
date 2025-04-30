import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Typography, BorderRadius, Spacing } from '../../constants/Theme';
import Text from './Text';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  icon?: IoniconsName;
  iconPosition?: 'left' | 'right';
  clearButton?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  testID?: string;
  multiline?: boolean;
  numberOfLines?: number;
}

/**
 * Input component following the GymTrackPro design system
 */
export default function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  icon,
  iconPosition = 'left',
  clearButton = false,
  style,
  inputStyle,
  containerStyle,
  onSubmitEditing,
  returnKeyType,
  testID,
  multiline = false,
  numberOfLines = 1,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  const animatedLabelValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  
  // Animation for floating label
  const animateLabel = (toValue: number) => {
    Animated.timing(animatedLabelValue, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    animateLabel(1);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      animateLabel(0);
    }
  };
  
  // Animated styles for label
  const labelStyle = {
    top: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -10]
    }),
    fontSize: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Typography.body, Typography.caption]
    }),
    color: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textSecondary, isFocused ? colors.primary : colors.textSecondary]
    }),
  };
  
  // Background color changes based on state (focus/error)
  const getBackgroundColor = () => {
    if (error) return darkMode ? 'rgba(255, 78, 100, 0.1)' : 'rgba(255, 78, 100, 0.05)';
    return darkMode 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.03)';
  };
  
  // Border color changes based on state (focus/error)
  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isFocused) return colors.primary;
    return 'transparent';
  };
  
  const toggleSecureEntry = () => {
    setIsSecureVisible(!isSecureVisible);
  };
  
  const handleClearText = () => {
    onChangeText('');
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Animated.Text
          style={[
            styles.label,
            {
              left: icon && iconPosition === 'left' ? 40 : 12,
              backgroundColor: colors.background,
              paddingHorizontal: 4,
            },
            labelStyle
          ]}
        >
          {label}
        </Animated.Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderRadius: BorderRadius.md,
            paddingVertical: multiline ? 12 : 0,
          },
          style
        ]}
      >
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
              fontSize: Typography.body,
              height: multiline ? undefined : 48,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingLeft: icon && iconPosition === 'left' ? 0 : 12,
              paddingRight: (secureTextEntry || clearButton || (icon && iconPosition === 'right')) ? 40 : 12,
            },
            inputStyle
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          testID={testID}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
        />
        
        {icon && iconPosition === 'right' && !secureTextEntry && !clearButton && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.rightIcon}
          />
        )}
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={toggleSecureEntry}
            style={styles.rightIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSecureVisible ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {clearButton && value.length > 0 && !secureTextEntry && (
          <TouchableOpacity
            onPress={handleClearText}
            style={styles.rightIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text
          variant="small"
          color={colors.danger}
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  label: {
    position: 'absolute',
    zIndex: 1,
    paddingHorizontal: 4,
    marginLeft: -4,
  },
  leftIcon: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 12,
  },
}); 