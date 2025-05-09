import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Card } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius } from '../constants/Theme';
import CircleProgress from './ui/CircleProgress';

type StatItem = {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
  suffix?: string;
  prefix?: string;
  progress?: number; // 0-1 if showing progress
};

interface StatsCardProps {
  title?: string;
  subtitle?: string;
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4;
  showIcons?: boolean;
  showProgress?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

/**
 * StatsCard component - displays a collection of statistics
 */
export default function StatsCard({
  title,
  subtitle,
  stats,
  columns = 2,
  showIcons = true,
  showProgress = false,
  style,
  onPress,
}: StatsCardProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  if (!stats || stats.length === 0) return null;
  
  return (
    <Card 
      category="stats"
      style={style}
      onPress={onPress}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text variant="subtitle" style={styles.title}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text 
              variant="caption" 
              style={{ color: colors.textSecondary } as TextStyle}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      <View style={[
        styles.statsContainer,
        { flexWrap: 'wrap', flexDirection: 'row' }
      ]}>
        {stats.map((stat, index) => {
          const statColor = stat.color || colors.primary;
          const flexBasis = 100 / columns;
          
          // If showing progress circles
          if (showProgress && stat.progress !== undefined) {
            return (
              <View key={index} style={[styles.statItemProgress, { flexBasis: `${flexBasis}%` }]}>
                <CircleProgress
                  progress={stat.progress}
                  size={70}
                  thickness={8}
                  color={statColor}
                  showPercentage={true}
                  label={stat.label}
                />
              </View>
            );
          }
          
          // Regular stat display
          return (
            <View key={index} style={[styles.statItem, { flexBasis: `${flexBasis}%` }]}>
              {showIcons && stat.icon && (
                <View style={[styles.iconContainer, { backgroundColor: statColor + '15' }]}>
                  <Ionicons name={stat.icon as any} size={16} color={statColor} />
                </View>
              )}
              
              <Text variant="caption" style={{ color: colors.textSecondary, marginBottom: 2 } as TextStyle}>
                {stat.label}
              </Text>
              
              <View style={styles.statValueContainer}>
                {stat.prefix && (
                  <Text variant="caption" style={{ color: colors.textSecondary, marginRight: 2 } as TextStyle}>
                    {stat.prefix}
                  </Text>
                )}
                
                <Text variant="body" style={{ color: statColor, fontWeight: '700' } as TextStyle}>
                  {stat.value}
                </Text>
                
                {stat.suffix && (
                  <Text variant="caption" style={{ color: colors.textSecondary, marginLeft: 2 } as TextStyle}>
                    {stat.suffix}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: '600',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statItemProgress: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    marginBottom: 2,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontWeight: '700',
  },
}); 