import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  ViewStyle,
  Animated,
  AccessibilityInfo,
  Platform
} from 'react-native';
import { Text } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius, Colors, Animation, createElevation } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

interface WorkoutDay {
  date: string; // ISO format
  intensity: number; // 0-1 scale
  workoutId?: string;
  workoutName?: string;
  exercises?: number; // number of exercises
  duration?: number; // in minutes
}

interface CalendarHeatmapProps {
  workouts: WorkoutDay[];
  onDayPress?: (date: string, workout?: WorkoutDay) => void;
  startDate?: string; // ISO format for start date
  style?: ViewStyle;
  showSummary?: boolean;
}

type CalendarView = 'week' | 'month';

export default function CalendarHeatmap({
  workouts = [],
  onDayPress,
  startDate,
  style,
  showSummary = true
}: CalendarHeatmapProps) {
  const { darkMode, reducedMotion } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalWorkouts: 0,
    avgIntensity: 0,
    mostActive: '',
    streak: 0
  });
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const switchAnim = new Animated.Value(0);
  
  // Calculate window width for responsive grid
  const windowWidth = Dimensions.get('window').width;
  const daySize = (windowWidth - Spacing.md * 2 - Spacing.xs * 8) / 7;
  
  // Generate calendar days based on view type
  const generateCalendarDays = useCallback(() => {
    const days = [];
    let start;
    let end;
    
    // Determine start and end dates
    if (startDate) {
      start = moment(startDate);
    } else {
      start = moment().startOf('month');
    }
    
    if (calendarView === 'week') {
      start = moment().startOf('week');
      end = moment().endOf('week');
    } else {
      // Month view
      start = start.startOf('month').startOf('week');
      end = moment(start).add(41, 'days'); // Always show 6 weeks
    }
    
    // Generate all days in the range
    let currentDay = moment(start);
    while (currentDay.isSameOrBefore(end, 'day')) {
      // Find if there's a workout for this day
      const workoutForDay = workouts.find(w => 
        moment(w.date).format('YYYY-MM-DD') === currentDay.format('YYYY-MM-DD')
      );
      
      days.push({
        date: currentDay.format('YYYY-MM-DD'),
        day: currentDay.format('D'),
        isCurrentMonth: currentDay.month() === moment(startDate || undefined).month(),
        isToday: currentDay.isSame(moment(), 'day'),
        workout: workoutForDay
      });
      
      currentDay = currentDay.add(1, 'day');
    }
    
    setCalendarDays(days);
  }, [calendarView, workouts, startDate]);
  
  // Calculate calendar statistics
  const calculateSummary = useCallback(() => {
    if (workouts.length === 0) {
      setSummary({
        totalWorkouts: 0,
        avgIntensity: 0,
        mostActive: 'N/A',
        streak: 0
      });
      return;
    }
    
    // Calculate total workouts
    const totalWorkouts = workouts.length;
    
    // Calculate average intensity
    const avgIntensity = workouts.reduce((sum, workout) => 
      sum + (workout.intensity || 0), 0) / totalWorkouts;
    
    // Find most active day of week
    const dayCount: {[key: string]: number} = {};
    workouts.forEach(workout => {
      const dayOfWeek = moment(workout.date).format('dddd');
      dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    });
    
    let mostActive = 'N/A';
    let maxCount = 0;
    Object.entries(dayCount).forEach(([day, count]) => {
      if (count > maxCount) {
        mostActive = day;
        maxCount = count;
      }
    });
    
    // Calculate current streak
    let streak = 0;
    const sortedWorkouts = [...workouts].sort((a, b) => 
      moment(b.date).diff(moment(a.date))
    );
    
    let lastDate = moment();
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const currentDate = moment(sortedWorkouts[i].date);
      
      // If this workout was today or yesterday (compared to the last one)
      if (lastDate.diff(currentDate, 'days') <= 1) {
        streak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }
    
    setSummary({
      totalWorkouts,
      avgIntensity,
      mostActive,
      streak
    });
  }, [workouts]);
  
  // Effect to initialize data when props change
  useEffect(() => {
    generateCalendarDays();
    calculateSummary();
    
    // Animate content in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: reducedMotion ? 0 : Animation.medium,
      useNativeDriver: true
    }).start();
  }, [calendarView, workouts, startDate, generateCalendarDays, calculateSummary, fadeAnim, reducedMotion]);
  
  // Handle day selection
  const handleDayPress = (day: any) => {
    setSelectedDate(day.date);
    if (onDayPress) {
      onDayPress(day.date, day.workout);
    }
  };
  
  // Get color intensity based on workout intensity
  const getIntensityColor = (intensity: number = 0) => {
    if (intensity === 0) return 'transparent';
    
    // Color based on intensity
    const baseColor = colors.primary;
    const alpha = 0.2 + (intensity * 0.8); // Scale from 0.2 to 1.0 for better visibility
    
    // Convert hex to rgba
    const r = parseInt(baseColor.substr(1, 2), 16);
    const g = parseInt(baseColor.substr(3, 2), 16);
    const b = parseInt(baseColor.substr(5, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  // Toggle between week and month view with animation
  const toggleView = () => {
    // Animate out
    Animated.timing(switchAnim, {
      toValue: 1,
      duration: reducedMotion ? 0 : Animation.fast,
      useNativeDriver: true
    }).start(() => {
      // Switch view
      setCalendarView(calendarView === 'week' ? 'month' : 'week');
      
      // Reset animation value and animate back in
      switchAnim.setValue(0);
    });
  };
  
  // Render week day headers
  const renderWeekDays = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <View key={`weekday-${index}`} style={[styles.weekDay, { width: daySize }]}>
            <Text 
              variant="caption"
              style={{ color: colors.textSecondary }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  // Render calendar grid
  const renderCalendarGrid = () => {
    // Calculate animation transformations
    const opacity = fadeAnim;
    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 0]
    });
    
    const switchOpacity = switchAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 1]
    });
    
    return (
      <Animated.View 
        style={[
          styles.calendarGrid,
          { 
            opacity,
            transform: [{ translateY }]
          }
        ]}
      >
        {calendarDays.map((day, index) => {
          const isSelected = selectedDate === day.date;
          const hasWorkout = day.workout !== undefined;
          const intensityColor = hasWorkout ? 
            getIntensityColor(day.workout.intensity) : 'transparent';
          
          // Calculate additional style for focus effect
          const dayStyle = {
            width: daySize,
            height: daySize,
            backgroundColor: intensityColor,
            borderColor: isSelected ? colors.primary : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          };
          
          // Accessibility label construction
          const workoutDescription = hasWorkout ? 
            `Workout: ${day.workout.workoutName || 'Unnamed workout'}. Intensity: ${Math.round(day.workout.intensity * 100)}%.` : 
            'No workout.';
          
          const accessibilityLabel = `${day.isToday ? 'Today, ' : ''}${moment(day.date).format('MMMM D')}, ${workoutDescription}`;
          
          return (
            <TouchableOpacity
              key={`day-${index}`}
              style={[styles.dayContainer]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              accessibilityState={{ selected: isSelected }}
              accessibilityHint="Double tap to view workout details for this day"
            >
              <View 
                style={[
                  styles.day,
                  !day.isCurrentMonth && styles.notCurrentMonth,
                  day.isToday && styles.today,
                  isSelected && styles.selectedDay,
                  dayStyle
                ]}
              >
                <Text 
                  style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.notCurrentMonthText,
                    day.isToday && styles.todayText,
                    isSelected && styles.selectedDayText,
                    hasWorkout && styles.workoutDayText
                  ]}
                >
                  {day.day}
                </Text>
                
                {/* Indicator for workouts with additional data */}
                {hasWorkout && day.workout.exercises && day.workout.exercises > 0 && (
                  <View style={styles.workoutIndicator}>
                    <Text style={styles.workoutIndicatorText}>
                      {day.workout.exercises}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    );
  };
  
  // Render summary information
  const renderSummary = () => {
    if (!showSummary) return null;
    
    return (
      <Animated.View 
        style={[
          styles.summaryContainer, 
          { 
            opacity: fadeAnim,
            backgroundColor: colors.card,
            ...createElevation(1, darkMode)
          }
        ]}
      >
        <Text 
          variant="subtitle" 
          style={styles.summaryTitle}
        >
          Workout Summary
        </Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text 
              variant="caption" 
              style={{ color: colors.textSecondary }}
            >
              Total Workouts
            </Text>
            <Text 
              variant="subtitle" 
              style={{ color: colors.text }}
            >
              {summary.totalWorkouts}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text 
              variant="caption" 
              style={{ color: colors.textSecondary }}
            >
              Avg. Intensity
            </Text>
            <Text 
              variant="subtitle" 
              style={{ color: colors.text }}
            >
              {Math.round(summary.avgIntensity * 100)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text 
              variant="caption" 
              style={{ color: colors.textSecondary }}
            >
              Most Active
            </Text>
            <Text 
              variant="subtitle" 
              style={{ color: colors.text }}
            >
              {summary.mostActive}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text 
              variant="caption" 
              style={{ color: colors.textSecondary }}
            >
              Current Streak
            </Text>
            <Text 
              variant="subtitle" 
              style={{ color: colors.text }}
            >
              {summary.streak} days
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text variant="subtitle">
          {calendarView === 'week' ? 'Weekly View' : 'Monthly View'}
        </Text>
        
        <TouchableOpacity
          onPress={toggleView}
          style={styles.viewToggle}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${calendarView === 'week' ? 'month' : 'week'} view`}
          accessibilityHint={`Changes calendar to show ${calendarView === 'week' ? 'monthly' : 'weekly'} data`}
        >
          <Text 
            variant="bodySmall" 
            style={{ color: colors.primary }}
          >
            {calendarView === 'week' ? 'Month' : 'Week'}
          </Text>
          <Ionicons 
            name="swap-horizontal" 
            size={16} 
            color={colors.primary} 
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>
      
      {renderWeekDays()}
      {renderCalendarGrid()}
      {renderSummary()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(55, 114, 255, 0.1)'
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xs
  },
  weekDay: {
    alignItems: 'center',
    padding: Spacing.xs / 2
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayContainer: {
    padding: Spacing.xs / 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  day: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 2
  },
  dayText: {
    fontSize: 12,
    fontWeight: '400'
  },
  notCurrentMonth: {
    opacity: 0.5
  },
  notCurrentMonthText: {
    opacity: 0.6
  },
  today: {
    borderWidth: 1,
    borderColor: Colors.primaryBlue
  },
  todayText: {
    fontWeight: '700',
    color: Colors.primaryBlue
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: Colors.primaryBlue
  },
  selectedDayText: {
    fontWeight: '700'
  },
  workoutDayText: {
    fontWeight: '600'
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: Colors.primaryBlue,
    borderRadius: 4,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  workoutIndicatorText: {
    color: '#FFF',
    fontSize: 6,
    fontWeight: '700'
  },
  summaryContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md
  },
  summaryTitle: {
    marginBottom: Spacing.sm
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm
  },
  summaryItem: {
    flex: 1
  }
}); 