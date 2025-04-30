import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StatusBar,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Spacing } from '../../constants/Theme';

interface ContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
  avoidKeyboard?: boolean;
  testID?: string;
  contentContainerStyle?: ViewStyle;
}

/**
 * Container component following the GymTrackPro design system
 */
export default function Container({
  children,
  style,
  scrollable = false,
  paddingHorizontal = Spacing.md,
  paddingVertical = Spacing.md,
  avoidKeyboard = true,
  testID,
  contentContainerStyle,
}: ContainerProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Base container style
  const containerStyle = [
    styles.container,
    {
      backgroundColor: colors.background,
      paddingHorizontal,
      paddingVertical,
    },
    style,
  ];
  
  // Determine status bar style based on theme
  const barStyle = darkMode ? 'light-content' : 'dark-content';
  
  // Content to be rendered
  const content = (
    <>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal, paddingVertical },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[containerStyle, contentContainerStyle]}>
          {children}
        </View>
      )}
    </>
  );
  
  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          {content}
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }
  
  return (
    <SafeAreaView 
      testID={testID}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
}); 