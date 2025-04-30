import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import * as Haptics from 'expo-haptics';

/**
 * Modern button component with various styles and haptic feedback
 */
export default function Button({
  title,
  onPress,
  type = 'primary', // primary, secondary, success, danger, outline
  size = 'medium', // small, medium, large
  icon,  // Ionicons name
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  hapticFeedback = true,
  dark = false,
  ...props
}) {
  // Initialize a default colors object in case the import fails
  const defaultColors = {
    light: {
      primary: '#007AFF',
      backgroundSecondary: '#FFFFFF',
      success: '#28A745',
      danger: '#FF3B30',
      text: '#333333',
    },
    dark: {
      primary: '#0A84FF',
      backgroundSecondary: '#2C2C2E',
      success: '#33CF4D',
      danger: '#FF453A',
      text: '#FFFFFF',
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = dark ? colorScheme.dark : colorScheme.light;
  
  const getBackgroundColor = () => {
    if (disabled) return 'rgba(0,0,0,0.1)';
    
    switch (type) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.backgroundSecondary;
      case 'success': return colors.success;
      case 'danger': return colors.danger;
      case 'outline': return 'transparent';
      default: return colors.primary;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return dark ? '#888888' : '#999999';
    
    switch (type) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return dark ? '#FFFFFF' : '#333333';
      case 'success': return '#FFFFFF';
      case 'danger': return '#FFFFFF';
      case 'outline': return colors.primary;
      default: return '#FFFFFF';
    }
  };
  
  const getBorderColor = () => {
    if (type === 'outline') {
      return disabled ? 'rgba(0,0,0,0.1)' : colors.primary;
    }
    return 'transparent';
  };
  
  const getButtonPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'large': return { paddingVertical: 16, paddingHorizontal: 24 };
      default: return { paddingVertical: 12, paddingHorizontal: 20 };
    }
  };
  
  const getFontSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 18;
      default: return 16;
    }
  };
  
  const handlePress = () => {
    if (disabled || loading) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress && onPress();
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: type === 'outline' ? 1 : 0,
          ...getButtonPadding(),
          width: fullWidth ? '100%' : undefined,
        },
        style
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={getTextColor()}
          size="small"
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={getFontSize() + 2} 
              color={getTextColor()} 
              style={styles.iconLeft}
            />
          )}
          
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                fontWeight: '600',
              },
              textStyle
            ]}
          >
            {title}
          </Text>
          
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={getFontSize() + 2} 
              color={getTextColor()} 
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
}); 