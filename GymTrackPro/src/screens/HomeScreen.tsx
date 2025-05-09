import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import {View, StyleSheet, Dimensions, RefreshControl, Animated, ViewStyle} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';
import { AuthContext } from '../context/AuthContext';
import DatabaseService from '../services/DatabaseService';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import goals from '../data/goals';
import { Exercise } from '../types/mergedTypes';
// Import our custom UI components from design system
import {Text, Container} from '../components/ui';
import ParallaxScrollView from '../components/ParallaxScrollView';
import {Colors, Theme, Spacing, BorderRadius, createElevation, Animation} from '../constants/Theme';
import { useAnimatedValue } from '../hooks';

const { width, height } = Dimensions.get('window');
// Types and interfaces
interface HealthSummary {
  steps: number;
  calories: number;
  water: number;
  sleep: number;
}
interface ProgressData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
  }[];
  legend: string[];
}
interface Workout {
  id: string;
  date: string;
  exercises: {
    exerciseId: string;
    sets: {
      weight: number;
      reps: number;
    }[];
  }[];
  duration: number;
  userId: string;
  userName?: string;
  userProfileImage?: string;
}
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
  type: string;
}
type TimeRange = 'week' | 'month' | 'year';
type MetricType = 'weight' | 'volume' | 'reps';
const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, userProfile } = useContext(AuthContext);
  const {
    userGoal,
    getGoalInfo,
    favorites,
    getExerciseById,
    darkMode,
    setGoal,
    recentWorkouts,
    loading,
    refreshWorkoutData,
    getExerciseStats,
    reducedMotion
  } = useContext(ExerciseContext);
  const [profile, setProfile] = useState<any>(null);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [latestAchievement, setLatestAchievement] = useState<Achievement | null>(null);
  const [friendsWorkouts, setFriendsWorkouts] = useState<Workout[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary>({
    steps: 0,
    calories: 0,
    water: 0,
    sleep: 0
  });
  const [workoutStreak, setWorkoutStreak] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const confettiAnimation = useRef<LottieView>(null);
  // Use the useAnimatedValue hook instead of direct Animated.Value
  const { value: fadeAnim, animate: animateFade } = useAnimatedValue(0);
  const { value: slideAnim, animate: animateSlide } = useAnimatedValue(50);
  // Get theme colors based on dark mode
  const theme = darkMode ? Theme.dark : Theme.light;
  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10, 108, 255, ${opacity})`,
    labelColor: (opacity = 1) => theme.textSecondary,
    style: {
      borderRadius: 16,
    } as ViewStyle,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: Colors.primaryBlue,
    },
    propsForBackgroundLines: {
      stroke: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      strokeDasharray: '5, 5',
    },
    formatYLabel: (value: string) => value.toString(),
  };
  // Load initial data
  useEffect(() => {
    loadProfile();
    loadRecentExercises();
    identifyLatestAchievement();
    loadFriendsWorkouts();
    calculateWorkoutStreak();
    generateDemoHealthData();
    loadProgressData();
    
    // Start entrance animations - this will respect reduced motion
    animateFade({
      toValue: 1,
      duration: Animation.medium,
      useNativeDriver: true
    }).start();
    
    animateSlide({
      toValue: 0,
      duration: Animation.medium,
      useNativeDriver: true
    }).start();
  }, [favorites, recentWorkouts]);
  // Show goal modal if no goal is set
  useEffect(() => {
    if (!userGoal) {
      setShowGoalModal(true);
    }
  }, [userGoal]);
  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadRecentExercises();
      identifyLatestAchievement();
      loadFriendsWorkouts();
      calculateWorkoutStreak();
      loadProgressData();
    }, [favorites, recentWorkouts, timeRange, selectedMetric])
  );
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllUserData();
    setRefreshing(false);
  }, []);
  // Fetch all user data
  const fetchAllUserData = async (): Promise<void> => {
    try {
      await Promise.all([
        loadProfile(),
        loadRecentExercises(),
        refreshWorkoutData(),
        loadFriendsWorkouts(),
        loadProgressData()
      ]);
      identifyLatestAchievement();
      calculateWorkoutStreak();
      generateDemoHealthData();
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
  // Update this function to use real data
  const generateDemoHealthData = (): void => {
    // Demo data for UI presentation
    setHealthSummary({
      steps: Math.floor(Math.random() * 10000) + 2000,
      calories: Math.floor(Math.random() * 500) + 100,
      water: Math.floor(Math.random() * 8) + 1,
      sleep: Math.floor(Math.random() * 3) + 5
    });
  };
  // Load progress data based on selected metric and time range
  const loadProgressData = (): void => {
    // Demo data for progress chart
    let data: number[] = [];
    let labels: string[] = [];
    if (timeRange === 'week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = [65, 67, 66, 68, 69, 70, 69]; // Demo weight data
      if (selectedMetric === 'volume') {
        data = [2100, 0, 2300, 0, 2500, 2400, 0]; // Demo volume data
      } else if (selectedMetric === 'reps') {
        data = [45, 0, 50, 0, 55, 48, 0]; // Demo reps data
      }
    } else if (timeRange === 'month') {
      labels = ['W1', 'W2', 'W3', 'W4'];
      data = [65, 67, 68, 70]; // Demo weight data
      if (selectedMetric === 'volume') {
        data = [2000, 2200, 2400, 2500]; // Demo volume data
      } else if (selectedMetric === 'reps') {
        data = [40, 45, 50, 55]; // Demo reps data
      }
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = [75, 74, 72, 70, 68, 67, 66, 65, 64, 63, 62, 60]; // Demo yearly progress
      if (selectedMetric === 'volume') {
        data = [1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900]; // Demo volume data
      } else if (selectedMetric === 'reps') {
        data = [30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63]; // Demo reps data
      }
    }
    setProgressData({
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(10, 108, 255, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: [getMetricName(selectedMetric)]
    });
  };
  // Get display name for selected metric
  const getMetricName = (metric: MetricType): string => {
    switch (metric) {
      case 'weight': return 'Weight (kg)';
      case 'volume': return 'Volume (kg)';
      case 'reps': return 'Total Reps';
      default: return metric;
    }
  };
  const calculateWorkoutStreak = (): void => {
    // Demo data for streak
    setWorkoutStreak(Math.floor(Math.random() * 10) + 3);
  };
  async function loadProfile(): Promise<void> {
    try {
      // In a real app, this would fetch the user profile from a database
      setProfile(userProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }
  async function loadRecentExercises(): Promise<void> {
    try {
      // Demo data - in a real app, this would fetch from a database
      if (favorites && favorites.length > 0) {
        // Cast the exercises to proper Exercise[] type from mergedTypes
        const exercises = favorites.map((id: string) => getExerciseById(id)) as Exercise[];
        setRecentExercises(exercises.filter(Boolean).slice(0, 4));
      }
    } catch (error) {
      console.error("Error loading recent exercises:", error);
    }
  }
  async function loadFriendsWorkouts(): Promise<void> {
    try {
      // Demo data for friend's workouts
      const demoFriendWorkouts: Workout[] = [
        {
          id: 'fw1',
          date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          exercises: [
            { 
              exerciseId: 'bench-press',
              sets: [
                { weight: 80, reps: 10 },
                { weight: 80, reps: 8 },
                { weight: 75, reps: 8 }
              ]
            }
          ],
          duration: 45,
          userId: 'friend1',
          userName: 'Alex Smith',
          userProfileImage: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        {
          id: 'fw2',
          date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          exercises: [
            { 
              exerciseId: 'squat',
              sets: [
                { weight: 100, reps: 8 },
                { weight: 100, reps: 8 },
                { weight: 110, reps: 6 }
              ]
            }
          ],
          duration: 60,
          userId: 'friend2',
          userName: 'Jessica Lee',
          userProfileImage: 'https://randomuser.me/api/portraits/women/44.jpg'
        }
      ];
      setFriendsWorkouts(demoFriendWorkouts);
    } catch (error) {
      console.error("Error loading friends' workouts:", error);
    }
  }
  const identifyLatestAchievement = (): void => {
    // Demo data for achievement
    const demoAchievement: Achievement = {
      id: 'ach1',
      title: 'Consistency Champion',
      description: 'Completed workouts 3 days in a row',
      icon: 'trophy',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
      type: 'streak'
    };
    setLatestAchievement(demoAchievement);
  };
  // When an achievement is unlocked
  const showAchievementAnimation = () => {
    // Only play animation if reduced motion is off
    if (!reducedMotion && confettiAnimation.current) {
      confettiAnimation.current.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Just trigger haptic for reduced motion users
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  return (
    <Container>
      <ParallaxScrollView
        headerComponent={
          <LinearGradient
            colors={[theme.primary, 'transparent']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text variant="heading2" style={styles.headerText}>
                Dashboard
              </Text>
            </View>
          </LinearGradient>
        }
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        scrollEnabled={true}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* Content will go here in future improvements */}
          <Text>Dashboard content</Text>
        </Animated.View>
      </ParallaxScrollView>
      
      {/* Conditionally render LottieView based on reduced motion preference */}
      {!reducedMotion && (
        <LottieView
          ref={confettiAnimation}
          source={require('../../assets/animations/confetti.json')}
          style={styles.confettiAnimation}
          autoPlay={false}
          loop={false}
        />
      )}
    </Container>
  );
};
const styles = StyleSheet.create({
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    justifyContent: 'flex-end',
  },
  headerText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    ...createElevation(2),
  },
  statsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  statItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  chartContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  timeRangeOption: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeRange: {
    backgroundColor: Colors.primaryBlue,
  },
  metricSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  metricOption: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    marginHorizontal: Spacing.xs,
  },
  selectedMetric: {
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
  },
  workoutCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...createElevation(1),
  },
  cardImage: {
    height: 140,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.md,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  goalModal: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxHeight: height * 0.7,
    ...createElevation(3),
  },
  goalOption: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  selectedGoal: {
    backgroundColor: 'rgba(10, 108, 255, 0.05)',
    borderColor: Colors.primaryBlue,
  },
  confettiAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});
export default HomeScreen; 