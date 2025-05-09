import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkState } from '../hooks/useNetworkState';
import { Ionicons } from '@expo/vector-icons';
import { Theme, Spacing, BorderRadius } from '../constants/Theme';
import { useExercise } from '../context/ExerciseContext';
interface NetworkStateIndicatorProps {
  onRetry?: () => void;
  isSyncing?: boolean;
  pendingOperations?: number;
  onSyncNow?: () => void;
}
/**
 * Network state indicator that shows when the app is offline
 * or has limited connectivity. Also displays sync status.
 */
const NetworkStateIndicator: React.FC<NetworkStateIndicatorProps> = ({ 
  onRetry, 
  isSyncing = false,
  pendingOperations = 0,
  onSyncNow
}) => {
  const { isConnected, isInternetReachable, type } = useNetworkState();
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  const insets = useSafeAreaInsets();
  // Animation values
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // Determine network state and message
  const isOffline = !isConnected;
  const hasLimitedConnectivity = isConnected && !isInternetReachable;
  const hasPendingSync = pendingOperations > 0;
  const shouldShow = isOffline || hasLimitedConnectivity || (hasPendingSync && isConnected);
  // Network type display
  const getNetworkTypeText = () => {
    if (isSyncing) return 'Syncing data...';
    if (hasPendingSync && isConnected) return `Syncing pending changes (${pendingOperations})`;
    if (!isConnected) return 'No connection';
    if (type === 'unknown') return 'Limited connectivity';
    if (type === 'none') return 'Offline mode';
    return `${type} connection`;
  };
  // Animation when network state changes
  useEffect(() => {
    if (shouldShow) {
      // Show the indicator
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide the indicator
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShow, isConnected, isInternetReachable, isSyncing, hasPendingSync]);
  // Determine colors based on connection state
  const getBannerColor = () => {
    if (isSyncing) return theme.info;
    if (hasPendingSync && isConnected) return theme.info; 
    if (isOffline) return theme.danger;
    if (hasLimitedConnectivity) return theme.warning;
    return theme.success;
  };
  const getIconName = () => {
    if (isSyncing || (hasPendingSync && isConnected)) return 'sync-outline';
    if (isOffline) return 'cloud-offline-outline';
    if (hasLimitedConnectivity) return 'wifi-outline';
    return 'wifi';
  };
  // Get appropriate action button based on status
  const getActionButton = () => {
    if (isOffline && onRetry) {
      return (
        <TouchableOpacity 
          onPress={onRetry} 
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
          accessibilityHint="Tries to reconnect to the network"
        >
          <Text style={styles.actionText}>Retry</Text>
        </TouchableOpacity>
      );
    } else if (hasPendingSync && isConnected && onSyncNow && !isSyncing) {
      return (
        <TouchableOpacity 
          onPress={onSyncNow} 
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Sync now"
          accessibilityHint="Manually sync pending changes"
        >
          <Text style={styles.actionText}>Sync Now</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };
  // Get appropriate subtitle text
  const getSubText = () => {
    if (isSyncing) return 'Please wait while your data is being synchronized...';
    if (hasPendingSync && isConnected) return 'You have pending changes that need to be synchronized.';
    if (isOffline) return 'Your changes will be saved locally and synced when you\'re back online.';
    return 'Limited connectivity. Some features may not work properly.';
  };
  // Don't render anything if we're fully connected and no sync is needed
  if (!shouldShow) return null;
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBannerColor(),
          paddingTop: insets.top > 0 ? insets.top : Spacing.md,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.content}>
        <Ionicons 
          name={getIconName()} 
          size={20} 
          color="#FFFFFF" 
          style={[isSyncing && styles.rotatingIcon]} 
        />
        <Text style={styles.text}>{getNetworkTypeText()}</Text>
        {getActionButton()}
      </View>
      <Text style={styles.subText}>{getSubText()}</Text>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.md,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  subText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.xs,
    opacity: 0.8,
    paddingHorizontal: Spacing.lg,
  },
  actionButton: {
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.pill,
    minWidth: 80,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rotatingIcon: {
    // Animation will be added via React Native Animated API in the component
  },
});
export default NetworkStateIndicator; 