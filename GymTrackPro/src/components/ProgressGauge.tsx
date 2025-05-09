import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';
import { Text } from './ui';
import { CircleProgress } from './ui';
import { Theme, Spacing, BorderRadius, createElevation, Animation, Colors } from '../constants/Theme';
import { useExercise } from '../context/ExerciseContext';
import { Ionicons } from '@expo/vector-icons';

interface ProgressGaugeProps {
  progress: number; // 0 to 1
  size?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showIcon?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  label?: string;
  sublabel?: string;
  style?: ViewStyle;
  previousValue?: number; // Previous progress value for trend
  showTrend?: boolean; // Whether to show trend indicator
  trendLabel?: string; // Label for trend
  animated?: boolean; // Whether to animate the progress
}

/**
 * ProgressGauge component
 * A circular progress indicator with percentage display, optional icon, and trend
 */
export default function ProgressGauge({
  progress,
  size = 120,
  color,
  backgroundColor,
  showPercentage = true,
  showIcon = false,
  icon = 'fitness-outline',
  iconSize = 24,
  iconColor,
  label,
  sublabel,
  style,
  previousValue,
  showTrend = false,
  trendLabel,
  animated = true
}: ProgressGaugeProps) {
  const { darkMode, reducedMotion } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Animation value for progress
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation for icon scale
  const iconScale = useRef(new Animated.Value(1)).current;
  
  // Animation for the whole component
  const fadeIn = useRef(new Animated.Value(0)).current;
  
  // State to hold the current percentage value for display
  const [displayPercentage, setDisplayPercentage] = useState(0);
  
  // Set defaults
  const progressColor = color || colors.primary;
  const bgColor = backgroundColor || (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)');
  const iconFillColor = iconColor || progressColor;
  
  // Calculate trend
  const hasTrend = previousValue !== undefined && showTrend;
  const trendValue = hasTrend ? progress - previousValue : 0;
  const trendIcon = trendValue > 0 ? 'arrow-up' : trendValue < 0 ? 'arrow-down' : 'remove';
  const trendColor = trendValue > 0 ? Colors.success : trendValue < 0 ? Colors.danger : colors.textSecondary;
  
  // Update the displayed percentage value when progress changes
  useEffect(() => {
    setDisplayPercentage(Math.round(progress * 100));
  }, [progress]);
  
  // Animate gauge on mount and when progress changes
  useEffect(() => {
    if (!animated) {
      setDisplayPercentage(Math.round(progress * 100));
      return;
    }
    
    // Fade in animation
    fadeIn.setValue(0);
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: Animation.medium,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic)
    }).start();
    
    // Progress animation with callback to update display percentage
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: Animation.slow,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic)
    }).start(({ finished }) => {
      if (finished) {
        setDisplayPercentage(Math.round(progress * 100));
      }
    });
    
    // Listen to progress animation changes to update displayed percentage
    const animationListener = progressAnimation.addListener(({ value }) => {
      setDisplayPercentage(Math.round(value * 100));
    });
    
    // Icon pulse animation for values > 75%
    if (progress > 0.75) {
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.2,
          duration: Animation.medium,
          useNativeDriver: true,
          easing: Easing.out(Easing.elastic(1))
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: Animation.medium,
          useNativeDriver: true,
          easing: Easing.in(Easing.elastic(1))
        })
      ]).start();
    }
    
    // Clean up animation listener
    return () => {
      progressAnimation.removeListener(animationListener);
    };
  }, [progress, reducedMotion, animated, fadeIn, progressAnimation, iconScale]);
  
  // Accessibility label for the progress gauge
  const accessibilityLabel = `${label ? `${label}: ` : ''}${displayPercentage}%${trendLabel ? `. ${trendLabel}` : ''}`;
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        { opacity: fadeIn }
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: displayPercentage
      }}
    >
      <View style={styles.gaugeContainer}>
        <CircleProgress
          progress={progress}
          size={size}
          thickness={size / 10}
          color={progressColor}
          backgroundColor={bgColor}
          showPercentage={false}
          animate={animated && !reducedMotion}
          animationDuration={Animation.slow}
        />
        
        {/* Center content */}
        <View style={[styles.centerContent, { width: size, height: size }]}>
          {showIcon && (
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <Ionicons 
                name={icon} 
                size={iconSize} 
                color={iconFillColor} 
                style={styles.icon}
              />
            </Animated.View>
          )}
          
          {showPercentage && (
            <Text
              style={[
                styles.percentageText, 
                { 
                  color: progressColor,
                  fontSize: size / 4,
                  fontFamily: 'Inter-Bold',
                },
                showIcon && styles.percentageWithIcon
              ]}
            >
              {`${displayPercentage}%`}
            </Text>
          )}
        </View>
      </View>
      
      {/* Labels under gauge */}
      {(label || sublabel) && (
        <View style={styles.labelsContainer}>
          {label && (
            <Text variant="body" style={styles.label}>
              {label}
            </Text>
          )}
          
          {sublabel && (
            <Text variant="caption" style={[styles.sublabel, { color: colors.textSecondary }]}>
              {sublabel}
            </Text>
          )}
          
          {/* Trend indicator */}
          {hasTrend && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={trendIcon} 
                size={14} 
                color={trendColor} 
                style={styles.trendIcon}
              />
              <Text 
                variant="caption" 
                style={[styles.trendText, { color: trendColor }]}
              >
                {Math.abs(Math.round(trendValue * 100))}%
                {trendLabel && ` ${trendLabel}`}
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontWeight: '700',
  },
  percentageWithIcon: {
    marginTop: 4,
  },
  icon: {
    marginBottom: 4,
  },
  labelsContainer: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  sublabel: {
    textAlign: 'center',
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  trendIcon: {
    marginRight: 2,
  },
  trendText: {
    fontWeight: '600',
  }
}); 