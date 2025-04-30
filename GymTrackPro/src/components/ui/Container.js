import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

/**
 * Container component for consistent screen layouts with safe area and keyboard handling
 */
export default function Container({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  dark = false,
  dismissKeyboardOnTouch = true,
  avoidKeyboard = Platform.OS === 'ios',
  edges = ['right', 'left'], // Don't include top by default to allow custom headers
  ...props
}) {
  // Initialize a default colors object in case the import fails
  const defaultColors = {
    light: {
      primary: '#007AFF',
      background: '#F8F9FA',
      backgroundSecondary: '#FFFFFF',
      text: '#333333',
      textSecondary: '#666666',
      card: '#FFFFFF',
    },
    dark: {
      primary: '#0A84FF',
      background: '#1C1C1E',
      backgroundSecondary: '#2C2C2E',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
      card: '#2C2C2E',
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = dark ? colorScheme.dark : colorScheme.light;
  const backgroundColor = colors.background;
  
  const content = (
    <>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      
      {scrollable ? (
        <ScrollView
          style={[styles.scrollView, { backgroundColor }]}
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined}
          {...props}
        >
          {children}
        </ScrollView>
      ) : (
        <View 
          style={[
            styles.container, 
            { backgroundColor }, 
            style
          ]}
          {...props}
        >
          {children}
        </View>
      )}
    </>
  );
  
  const renderContent = () => {
    if (avoidKeyboard) {
      return (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      );
    }
    return content;
  };
  
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={edges}
    >
      {dismissKeyboardOnTouch ? (
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
          style={styles.flex}
        >
          {renderContent()}
        </TouchableWithoutFeedback>
      ) : (
        renderContent()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  flex: {
    flex: 1,
  },
}); 