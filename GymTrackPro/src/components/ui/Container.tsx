import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useExercise } from '../../context/ExerciseContext';
import { Theme, Spacing } from '../../constants/Theme';

const { width, height } = Dimensions.get('window');
// Define a threshold for tablet-sized devices
const isTablet = width >= 768 || height >= 768;

interface ContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  bottomInset?: boolean;
  topInset?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  paddingHorizontal?: number;
  testID?: string;
  contentContainerStyle?: ViewStyle;
  centerContentOnTablet?: boolean; // New prop for tablet layouts
}

/**
 * Container component following the GymTrackPro design system
 * Provides consistent padding and layout across the app
 * Responsive to both phone and tablet screen sizes
 */
export default function Container({
  children,
  style,
  scrollable = false,
  refreshing = false,
  onRefresh,
  bottomInset = true,
  topInset = true,
  fullWidth = false,
  backgroundColor,
  paddingHorizontal,
  testID,
  contentContainerStyle,
  centerContentOnTablet = true, // Default to centering content on tablets
}: ContainerProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Determine background color
  const bgColor = backgroundColor || colors.background;
  
  // Determine horizontal padding
  const hPadding = paddingHorizontal !== undefined 
    ? paddingHorizontal 
    : (fullWidth ? 0 : Spacing.md);
  
  // Set maximum width for tablet layouts
  const tabletStyles: ViewStyle = isTablet && centerContentOnTablet ? {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  } : {};
  
  // Base container styles
  const containerStyles = [
    styles.container,
    {
      backgroundColor: bgColor,
      paddingTop: topInset ? (Platform.OS === 'ios' ? 10 : StatusBar.currentHeight || 10) : 0,
      paddingBottom: bottomInset ? (Platform.OS === 'ios' ? 34 : 16) : 0,
    },
    style,
  ];
  
  // Content styles for scrollable container
  const contentStyles = [
    styles.content,
    {
      paddingHorizontal: hPadding,
      paddingBottom: scrollable ? Spacing.lg : 0,
    },
    contentContainerStyle,
    tabletStyles,
  ];
  
  // Render scrollable container
  if (scrollable) {
    return (
      <SafeAreaView style={[containerStyles, { paddingTop: 0 }]} testID={testID}>
        <StatusBar 
          barStyle={darkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={bgColor} 
          translucent={true}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={contentStyles}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary, colors.secondary]}
              progressBackgroundColor={colors.card}
            />
          ) : undefined}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  // Render regular container
  return (
    <SafeAreaView style={containerStyles} testID={testID}>
      <StatusBar 
        barStyle={darkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={bgColor} 
        translucent={true}
      />
      <View style={contentStyles}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
}); 