import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui';
import { Colors, Spacing, Theme, BorderRadius } from '../constants/Theme';
import { useExercise } from '../context/ExerciseContext';
import { useAnimatedValue } from '../hooks';

interface NetworkStateIndicatorProps {
  isOffline?: boolean;
  isLimitedConnectivity?: boolean;
  isConnected?: boolean;
  hasPendingSync?: boolean;
  isSyncing?: boolean;
  syncCount?: number;
  pendingOperations?: number;
  onRetry?: () => void;
  onSyncNow?: () => void;
}

const NetworkStateIndicator: React.FC<NetworkStateIndicatorProps> = ({ 
  isOffline = false,
  isLimitedConnectivity = false,
  isConnected = true,
  hasPendingSync = false,
  isSyncing = false,
  syncCount = 0,
  pendingOperations = 0,
  onRetry,
  onSyncNow,
}) => {
  const insets = useSafeAreaInsets();
  const { darkMode, reducedMotion } = useExercise();
  
  // Animated values using our custom hook
  const { value: translateY, animate: animateTranslateY } = useAnimatedValue(-100);
  const { value: opacity, animate: animateOpacity } = useAnimatedValue(0);
  
  // For the rotating sync icon
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Decide if we should show the indicator
  const shouldShow = isOffline || isLimitedConnectivity || hasPendingSync || isSyncing;
  
  // Animate appearance based on showing state
  useEffect(() => {
    // If we should show the banner
    if (shouldShow) {
      animateTranslateY({
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      
      animateOpacity({
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }).start();
    } else {
      // Animate out
      animateTranslateY({
        toValue: -100,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
      
      animateOpacity({
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }).start();
    }
  }, [shouldShow, animateTranslateY, animateOpacity]);
  
  // Rotation animation for sync icon
  useEffect(() => {
    if (isSyncing && !reducedMotion) {
      // Create a rotating animation for the sync icon
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
    } else {
      // Reset rotation when not syncing
      rotateAnim.setValue(0);
    }
    
    return () => {
      rotateAnim.setValue(0);
    };
  }, [isSyncing, reducedMotion, rotateAnim]);
  
  // Get the appropriate banner color based on status
  const getBannerColor = () => {
    if (isOffline) return Colors.danger;
    if (isSyncing) return Colors.info;
    if (hasPendingSync) return Colors.warning;
    return Colors.info; // Limited connectivity
  };
  
  // Get the icon name based on connection status
  const getIconName = () => {
    if (isOffline) return 'cloud-offline-outline';
    if (isSyncing) return 'sync-outline';
    if (hasPendingSync) return 'cloud-upload-outline';
    return 'wifi-outline'; // Limited connectivity
  };
  
  // Get the network status text
  const getNetworkTypeText = () => {
    if (isOffline) return 'You are offline';
    if (isSyncing) return `Syncing ${syncCount > 0 ? `(${syncCount} items)` : ''}`;
    if (hasPendingSync) return `Changes pending`;
    return 'Limited connectivity';
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
        <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
          <Ionicons 
            name={getIconName()} 
            size={20} 
            color="#FFFFFF" 
          />
        </Animated.View>
        <Text style={styles.text}>{getNetworkTypeText()}</Text>
        {getActionButton()}
      </View>
      <Text style={styles.subText}>{getSubText()}</Text>
      
      {/* Progress bar for syncing status */}
      {isSyncing && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                { width: '30%' } // This would be dynamic based on sync progress
              ]}
            />
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: Spacing.sm,
    flex: 1,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.sm,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginTop: Spacing.md,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});

export default NetworkStateIndicator; 