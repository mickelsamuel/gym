import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useExercise } from '../context/ExerciseContext';
import { Text, ProgressBar, Card } from './ui';
import { Theme, Colors, Spacing, BorderRadius } from '../constants/Theme';

interface WorkoutProgressTrackerProps {
  totalExercises: number;
  currentExerciseIndex: number;
  startTime: Date;
  estimatedDuration: number; // in minutes
  onFinish?: () => void;
  onPause?: () => void;
  isPaused?: boolean;
  currentExerciseName?: string;
  nextExerciseName?: string;
  caloriesBurned?: number;
}

/**
 * WorkoutProgressTracker component
 * 
 * Shows real-time progress through a workout with estimated time remaining,
 * calories burned, and current exercise indicators
 */
const WorkoutProgressTracker: React.FC<WorkoutProgressTrackerProps> = ({
  totalExercises,
  currentExerciseIndex,
  startTime,
  estimatedDuration,
  onFinish,
  onPause,
  isPaused = false,
  currentExerciseName = '',
  nextExerciseName = '',
  caloriesBurned = 0,
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  
  // Update progress when current exercise changes
  useEffect(() => {
    const newProgress = Math.min(currentExerciseIndex / totalExercises, 1);
    setProgress(newProgress);
  }, [currentExerciseIndex, totalExercises]);
  
  // Track elapsed time
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      setElapsedTime(seconds);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, isPaused]);
  
  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate estimated time remaining
  const getTimeRemaining = (): string => {
    const totalSeconds = estimatedDuration * 60;
    const remaining = Math.max(0, totalSeconds - elapsedTime);
    
    if (remaining <= 0) return '00:00';
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handlePausePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPause) onPause();
  };
  
  const handleFinishPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (onFinish) onFinish();
  };

  return (
    <Card style={styles.container} category="elevated">
      <LinearGradient
        colors={[theme.primary, theme.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientContainer, { borderRadius: BorderRadius.lg }]}
      >
        {/* Progress visualization */}
        <View style={styles.progressSection}>
          <ProgressBar
            progress={progress}
            height={8}
            backgroundColor={`${Colors.primaryBlue}50`}
            progressColor="#FFFFFF"
            style={styles.progressBar}
            animated
          />
          <View style={styles.exerciseIndicator}>
            <Text style={styles.lightText}>
              {currentExerciseIndex + 1} of {totalExercises} exercises
            </Text>
          </View>
        </View>
        
        {/* Current exercise */}
        <View style={styles.currentExerciseSection}>
          <Text style={styles.sectionLabel}>CURRENT EXERCISE</Text>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {currentExerciseName || 'Rest period'}
          </Text>
        </View>
        
        {/* Stats section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.statLabel}>Elapsed</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="hourglass-outline" size={20} color="#FFFFFF" />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{getTimeRemaining()}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={20} color="#FFFFFF" />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{caloriesBurned}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>
        </View>
        
        {/* Next exercise section */}
        {nextExerciseName && (
          <View style={styles.nextExerciseSection}>
            <Text style={styles.sectionLabel}>NEXT EXERCISE</Text>
            <Text style={styles.nextExerciseName} numberOfLines={1}>
              {nextExerciseName}
            </Text>
          </View>
        )}
        
        {/* Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.pauseButton]} 
            onPress={handlePausePress}
          >
            <Ionicons 
              name={isPaused ? "play" : "pause"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.finishButton]}
            onPress={handleFinishPress}
          >
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    padding: 0,
  },
  gradientContainer: {
    padding: Spacing.lg,
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  exerciseIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentExerciseSection: {
    marginBottom: Spacing.md,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContent: {
    marginLeft: Spacing.xs,
  },
  statValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
  },
  nextExerciseSection: {
    marginBottom: Spacing.md,
  },
  nextExerciseName: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  finishButton: {
    backgroundColor: Colors.secondaryGreen,
  },
  lightText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default WorkoutProgressTracker; 