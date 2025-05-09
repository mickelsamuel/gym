import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button } from './ui';
import { Theme, Spacing } from '../constants/Theme';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * AppErrorBoundary component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error information
    console.error('Error caught by AppErrorBoundary:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Report to error monitoring service
    try {
      Sentry.captureException(error);
    } catch (sentryError) {
      console.warn('Failed to report error to Sentry:', sentryError);
    }

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Attempt to recover by reloading the app
    // This depends on your navigation setup
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      // On native platforms, we can't fully reload the app,
      // but we can reset the error state and hope the component recovers
      Alert.alert(
        'App Reset',
        'The application has been reset. If the error persists, please restart the app.',
        [{ text: 'OK' }]
      );
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    // If there's a custom fallback component, use it
    if (hasError && fallback) {
      return fallback;
    }

    // If there's an error, show the error screen
    if (hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.errorContainer}>
              <Text variant="heading2" color="#E53935" style={styles.errorTitle}>
                Something went wrong
              </Text>
              
              <Text variant="body" style={styles.errorDescription}>
                The application encountered an unexpected error. 
                Our team has been notified and is working on a fix.
              </Text>
              
              <View style={styles.errorDetails}>
                <Text variant="bodySmall" weight="medium">
                  Error: {error?.name}
                </Text>
                <Text variant="bodySmall" style={styles.errorMessage}>
                  {error?.message}
                </Text>
                
                {__DEV__ && errorInfo && (
                  <View style={styles.componentStack}>
                    <Text variant="caption" style={styles.stackTitle}>Component Stack:</Text>
                    <Text variant="micro" style={styles.stackTrace}>
                      {errorInfo.componentStack}
                    </Text>
                  </View>
                )}
              </View>
              
              <Button 
                title="Try Again" 
                onPress={this.handleReset} 
                style={styles.resetButton}
              />
            </View>
          </ScrollView>
        </View>
      );
    }

    // Otherwise, render children normally
    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorContainer: {
    padding: Spacing.lg,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 1,
    elevation: 3,
  },
  errorTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorDescription: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
    color: '#616161',
  },
  errorDetails: {
    padding: Spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  errorMessage: {
    color: '#E53935',
    marginBottom: Spacing.md,
  },
  componentStack: {
    marginTop: Spacing.sm,
  },
  stackTitle: {
    fontWeight: '600', 
    marginBottom: Spacing.xs
  },
  stackTrace: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#616161',
  },
  resetButton: {
    marginTop: Spacing.md,
  },
});

export default AppErrorBoundary; 