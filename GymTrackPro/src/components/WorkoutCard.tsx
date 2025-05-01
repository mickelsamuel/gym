import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Card } from './ui';
import { LinearProgress } from './ui/Progress';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius } from '../constants/Theme';
import { format } from 'date-fns';

interface WorkoutCardProps {
  workout: any; // Replace with your workout type
  onPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
  showProgress?: boolean;
}

/**
 * WorkoutCard component - displays workout details in a card format with color-coding by type
 */
export default function WorkoutCard({
  workout,
  onPress,
  style,
  compact = false,
  showProgress = true,
}: WorkoutCardProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  if (!workout) return null;
  
  // Determine color based on workout type
  const getWorkoutColor = () => {
    if (!workout.type) return colors.primary;
    
    const type = workout.type.toLowerCase();
    
    switch (type) {
      case 'strength':
        return colors.primary;
      case 'hypertrophy':
        return colors.accent1;
      case 'endurance':
        return colors.accent2;
      case 'cardio':
        return colors.secondary;
      case 'hiit':
        return colors.danger;
      case 'recovery':
        return colors.success;
      default:
        return colors.primary;
    }
  };
  
  const workoutColor = getWorkoutColor();
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Get completion percentage
  const getCompletionPercentage = () => {
    if (!workout.exercises || workout.exercises.length === 0) return 0;
    
    const completed = workout.exercises.filter((ex: any) => ex.completed).length;
    return completed / workout.exercises.length;
  };
  
  // Format duration
  const formatDuration = (minutes: number) => {
    if (!minutes) return 'Not set';
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
  };
  
  const completionPercentage = getCompletionPercentage();
  
  const renderCompactVersion = () => {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.typeIndicator, { backgroundColor: workoutColor }]} />
        
        <View style={styles.compactContent}>
          <Text variant="subtitle" style={styles.compactTitle} numberOfLines={1}>
            {workout.name}
          </Text>
          
          <View style={styles.compactMeta}>
            <Text
              variant="caption"
              style={{ color: colors.textSecondary } as TextStyle}
              numberOfLines={1}
            >
              {workout.type || 'Custom'} • {workout.exercises?.length || 0} exercises
              {workout.duration && ` • ${formatDuration(workout.duration)}`}
            </Text>
          </View>
          
          {showProgress && (
            <View style={styles.progressContainer}>
              <LinearProgress 
                progress={completionPercentage}
                color={workoutColor}
                height={4}
                rounded={true}
                showAnimation={false}
              />
              <Text
                variant="tiny"
                style={{ color: colors.textTertiary, marginTop: 2 } as TextStyle}
              >
                {Math.round(completionPercentage * 100)}% Complete
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  const renderFullVersion = () => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text variant="title" style={styles.title} numberOfLines={2}>
              {workout.name}
            </Text>
            <View style={styles.typeBadge}>
              <View style={[styles.typeDot, { backgroundColor: workoutColor }]} />
              <Text
                variant="caption"
                style={{ color: colors.textSecondary } as TextStyle}
              >
                {workout.type || 'Custom'} Workout
              </Text>
            </View>
          </View>
          
          {workout.date && (
            <Text
              variant="caption"
              style={{ color: colors.textSecondary } as TextStyle}
            >
              {formatDate(workout.date)}
            </Text>
          )}
        </View>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Ionicons name="barbell-outline" size={16} color={colors.textSecondary} />
            <Text
              variant="body"
              style={{ fontWeight: '600', marginLeft: 4 } as TextStyle}
            >
              {workout.exercises?.length || 0}
            </Text>
            <Text
              variant="caption"
              style={{ color: colors.textSecondary, marginLeft: 4 } as TextStyle}
            >
              Exercises
            </Text>
          </View>
          
          {workout.duration && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text
                variant="body"
                style={{ fontWeight: '600', marginLeft: 4 } as TextStyle}
              >
                {formatDuration(workout.duration)}
              </Text>
            </View>
          )}
          
          {workout.calories && (
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={16} color={colors.textSecondary} />
              <Text
                variant="body"
                style={{ fontWeight: '600', marginLeft: 4 } as TextStyle}
              >
                {workout.calories}
              </Text>
              <Text
                variant="caption"
                style={{ color: colors.textSecondary, marginLeft: 4 } as TextStyle}
              >
                kcal
              </Text>
            </View>
          )}
        </View>
        
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text 
                variant="caption" 
                style={{ fontWeight: '600' } as TextStyle}
              >
                Progress
              </Text>
              <Text 
                variant="caption" 
                style={{ color: colors.textSecondary } as TextStyle}
              >
                {Math.round(completionPercentage * 100)}%
              </Text>
            </View>
            <LinearProgress 
              progress={completionPercentage}
              color={workoutColor}
              height={6}
              rounded={true}
              showAnimation={false}
            />
          </View>
        )}
      </View>
    );
  };
  
  return (
    <Card
      style={style}
      onPress={onPress}
      category="workout"
      compact={compact}
      accentColor={workoutColor}
    >
      {compact ? renderCompactVersion() : renderFullVersion()}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  progressContainer: {
    marginTop: Spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  typeIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontWeight: '600',
  },
  compactMeta: {
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
}); 