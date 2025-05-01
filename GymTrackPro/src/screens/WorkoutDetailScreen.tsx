import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  SectionList,
  Switch,
  ViewStyle,
  TextStyle,
  Dimensions,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/NavigationTypes';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ExerciseContext } from '../context/ExerciseContext';
import { AuthContext } from '../context/AuthContext';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import DatabaseService from '../services/DatabaseService';
import workoutCategories from '../data/workoutCategories';

// Import custom UI components
import { 
  Text, 
  Button, 
  Card, 
  Container,
  CircleProgress,
  FadeIn,
  SlideIn
} from '../components/ui';
import { Colors, Theme, Typography, Spacing, BorderRadius, createElevation } from '../constants/Theme';

const { width } = Dimensions.get('window');

// Types and interfaces
interface WorkoutSet {
  weight: number;
  reps: number;
  completed?: boolean;
}

interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment?: string;
  description?: string;
  category?: string;
  image?: string;
  videoUrl?: string;
  restTime?: number;
  sets?: number;
  reps?: number;
  weight?: number;
}

interface WorkoutSettings {
  restTimerEnabled: boolean;
  restTimerDuration: number;
  notificationsEnabled: boolean;
}

interface Workout {
  id: string;
  name: string;
  description?: string;
  category?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  settings?: WorkoutSettings;
}

interface WorkoutSession {
  id: string;
  workoutId: string;
  date: string;
  startTime: string;
  endTime: string;
  exercises: Array<{
    exerciseId: string;
    sets: WorkoutSet[];
  }>;
}

interface PerformanceData {
  labels: string[];
  volumeData: number[];
  timeData: number[];
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

type WorkoutDetailScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WorkoutDetailScreenRouteProp>();
  const { workoutId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { darkMode, getExerciseById } = useContext(ExerciseContext);
  
  // Theme based on dark mode
  const theme = darkMode ? Theme.dark : Theme.light;
  
  // State variables
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [restTimerEnabled, setRestTimerEnabled] = useState<boolean>(true);
  const [restTimerDuration, setRestTimerDuration] = useState<number>(60);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Header animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [Platform.OS === 'ios' ? 90 + insets.top : 70, Platform.OS === 'ios' ? 50 + insets.top : 50],
    extrapolate: 'clamp',
  });
  
  // Load data when screen mounts
  useEffect(() => {
    loadWorkoutDetails();
    loadWorkoutPerformance();
  }, [workoutId]);
  
  // Load workout details
  const loadWorkoutDetails = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const workoutData = await DatabaseService.getWorkoutById(workoutId);
      setWorkout(workoutData);
      
      const exercisesList = workoutData.exercises.map((exercise: WorkoutExercise) => {
        const exerciseDetails = getExerciseById(exercise.exerciseId);
        return {
          ...exerciseDetails,
          sets: exercise.sets?.length || 3,
          reps: exercise.sets?.[0]?.reps || 10,
          weight: exercise.sets?.[0]?.weight || 0,
          restTime: exerciseDetails?.restTime || restTimerDuration,
        };
      });
      
      setExercises(exercisesList);
      setRestTimerEnabled(workoutData.settings?.restTimerEnabled ?? true);
      setRestTimerDuration(workoutData.settings?.restTimerDuration ?? 60);
      setNotificationsEnabled(workoutData.settings?.notificationsEnabled ?? true);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading workout details:", error);
      setIsLoading(false);
    }
  };
  
  // Load workout performance data
  const loadWorkoutPerformance = async (): Promise<void> => {
    try {
      const performanceHistory = await DatabaseService.getWorkoutHistory(workoutId);
      
      if (performanceHistory.length > 0) {
        setHistory(performanceHistory);
        
        // Process data for the chart
        const lastSixSessions = performanceHistory.slice(-6).reverse();
        
        // Calculate total volume
        const volumeData = lastSixSessions.map(session => {
          let totalVolume = 0;
          session.exercises.forEach((exercise: { sets: Array<{ weight: number, reps: number }> }) => {
            exercise.sets.forEach((set: { weight: number, reps: number }) => {
              totalVolume += set.weight * set.reps;
            });
          });
          return totalVolume;
        });
        
        // Calculate completion time (in minutes)
        const timeData = lastSixSessions.map(session => {
          const startTime = new Date(session.startTime);
          const endTime = new Date(session.endTime);
          return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        });
        
        // Format dates for labels
        const labels = lastSixSessions.map(session => {
          return moment(session.date).format('MM/DD');
        });
        
        setPerformanceData({
          labels,
          volumeData,
          timeData
        });
      }
    } catch (error) {
      console.error("Error loading workout performance:", error);
    }
  };
  
  // Start workout
  const startWorkout = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('WorkoutLog', { workoutId, isStarting: true });
  };
  
  // Edit workout
  const editWorkout = (): void => {
    navigation.navigate('CustomWorkoutDetail', { workoutId, isEditing: true });
  };
  
  // Share workout
  const shareWorkout = async (): Promise<void> => {
    Haptics.selectionAsync();
    // Implementation for sharing
  };
  
  // Get Category Color
  const getCategoryColor = (category?: string): string => {
    const cat = workoutCategories.find(c => c.id === category);
    return cat ? cat.color : Colors.primaryBlue;
  };
  
  // Get Category Icon
  const getSafeIconName = (category?: string): string => {
    const safeIcons: Record<string, string> = {
      'strength': 'barbell-outline',
      'cardio': 'heart-outline',
      'hiit': 'flame-outline',
      'yoga': 'body-outline',
      'default': 'fitness-outline'
    };
    
    return safeIcons[category || ''] || safeIcons.default;
  };
  
  // Delete workout
  const handleDeleteWorkout = (): void => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await DatabaseService.deleteWorkout(workoutId);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting workout:", error);
              Alert.alert("Error", "Could not delete workout. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // Handle rest timer setting change
  const handleRestTimerChange = (value: boolean): void => {
    setRestTimerEnabled(value);
    // Save to database
    if (workout?.settings) {
      DatabaseService.updateWorkoutSettings(workoutId, {
        ...workout.settings,
        restTimerEnabled: value
      });
    }
  };
  
  // Handle notifications setting change
  const handleNotificationsChange = (value: boolean): void => {
    setNotificationsEnabled(value);
    // Save to database
    if (workout?.settings) {
      DatabaseService.updateWorkoutSettings(workoutId, {
        ...workout.settings,
        notificationsEnabled: value
      });
    }
  };
  
  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10, 108, 255, ${opacity})`,
    labelColor: (opacity = 1) => theme.textSecondary,
    style: {
      borderRadius: BorderRadius.lg,
    } as ViewStyle,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.primaryBlue,
    },
    propsForBackgroundLines: {
      stroke: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      strokeDasharray: '5, 5',
    },
  };

  // Render header
  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.header, 
        { 
          height: headerHeight,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        }
      ]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.headerTitleContainer,
            { opacity: headerOpacity }
          ]}
        >
          <Text 
            variant="heading3" 
            numberOfLines={1} 
            style={{ maxWidth: width * 0.6 }}
          >
            {workout?.name || 'Workout'}
          </Text>
        </Animated.View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={shareWorkout}
          >
            <Ionicons name="share-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleDeleteWorkout}
          >
            <Ionicons name="trash-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  // Main render
  return (
    <Container>
      {renderHeader()}
      
      <Animated.ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Platform.OS === 'ios' ? 90 + insets.top : 70 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <CircleProgress size={60} progress={0.5} />
          </View>
        ) : (
          <>
            <View style={styles.headerSection}>
              <View style={styles.workoutInfo}>
                <Text variant="heading1">{workout?.name}</Text>
                
                {workout?.category && (
                  <View style={[
                    styles.categoryBadge, 
                    { backgroundColor: getCategoryColor(workout.category) + '20' }
                  ]}>
                    <Ionicons 
                      name="fitness-outline" 
                      size={14} 
                      color={getCategoryColor(workout.category)} 
                      style={{ marginRight: 4 }}
                    />
                    <Text 
                      variant="caption"
                      style={{ color: getCategoryColor(workout.category) }}
                    >
                      {workoutCategories.find(c => c.id === workout.category)?.name || ''}
                    </Text>
                  </View>
                )}
                
                {workout?.description && (
                  <Text 
                    variant="body"
                    style={{ 
                      color: theme.textSecondary,
                      marginTop: Spacing.sm 
                    }}
                  >
                    {workout.description}
                  </Text>
                )}
              </View>
              
              <Button
                title="Start Workout"
                onPress={startWorkout}
                type="primary"
                size="large"
                icon="play"
                fullWidth
                style={{ marginTop: Spacing.md }}
              />
            </View>

            {/* Rest Timer */}
            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => handleRestTimerChange(!restTimerEnabled)}
            >
              <View style={styles.settingIcon}>
                <CircleProgress 
                  size={40} 
                  progress={0.65} 
                  color={restTimerEnabled ? theme.primary : theme.textSecondary} 
                />
              </View>
              <View style={styles.settingText}>
                <Text 
                  variant="subtitle" 
                  style={{ color: theme.text }}
                >
                  Rest Timer
                </Text>
                <Text 
                  variant="caption" 
                  style={{ color: theme.textSecondary }}
                >
                  {restTimerEnabled ? `${restTimerDuration} seconds between sets` : 'Disabled'}
                </Text>
              </View>
              <Switch
                value={restTimerEnabled}
                onValueChange={handleRestTimerChange}
                trackColor={{ false: theme.background, true: theme.primary + '40' }}
                thumbColor={restTimerEnabled ? theme.primary : theme.border}
              />
            </TouchableOpacity>

            {/* Rest of content will go here */}
          </>
        )}
      </Animated.ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    ...createElevation(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: '100%',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  workoutInfo: {
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingLabel: {
    flex: 1,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginRight: Spacing.sm,
  },
  performanceContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  tabButtons: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  tabButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    marginRight: Spacing.sm,
  },
  chartContainer: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  historyItemContainer: {
    marginBottom: Spacing.md,
  },
  historyDate: {
    marginBottom: Spacing.xs,
  },
  historyCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  statColumn: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
});

export default WorkoutDetailScreen; 