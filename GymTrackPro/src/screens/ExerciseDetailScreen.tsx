import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
  ImageBackground,
  Share,
  SectionList,
  StyleSheet
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import WorkoutLogModal from './WorkoutLogModal';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { 
  Button, 
  Text,
  Card, 
  Container,
  FadeIn,
  CircleProgress
} from '../components/ui';
import { Colors, Theme, Typography, Spacing, BorderRadius } from '../constants/Theme';
import { RootStackParamList } from '../navigation/NavigationTypes';
import { Exercise, WorkoutSet } from '../types/data';

// Types for exercise history and related data
interface ExerciseHistoryEntry {
  id: string;
  date: string;
  sets: WorkoutSet[];
}

interface PersonalRecord {
  value: number;
  date: string | null;
}

interface PersonalRecords {
  weight: PersonalRecord;
  reps: PersonalRecord;
  volume: PersonalRecord;
}

interface NextWorkoutRecommendation {
  sets: number;
  reps: number;
  weight: number;
}

interface ChartDataset {
  data: number[];
  color: (opacity: number) => string;
  strokeWidth: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  legend: string[];
}

type ChartMetric = 'weight' | 'reps' | 'volume';
type TimeRange = '7' | '30' | '90' | 'all';

// Screen navigation params
type ExerciseDetailScreenRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;
type ExerciseDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;

// Main component
const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation<ExerciseDetailScreenNavigationProp>();
  const route = useRoute<ExerciseDetailScreenRouteProp>();
  const { exerciseId, logWorkout } = route.params;
  const {
    getExerciseById,
    getMuscleInfo,
    toggleFavorite,
    isFavorite,
    userGoal,
    darkMode,
    getRelatedExercises
  } = useContext(ExerciseContext);
  const exercise = getExerciseById(exerciseId);
  const insets = useSafeAreaInsets();
  const theme = darkMode ? Theme.dark : Theme.light;
  const { width } = Dimensions.get('window');

  // States for logging and history
  const [logModalVisible, setLogModalVisible] = useState<boolean>(logWorkout || false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecords>({
    weight: { value: 0, date: null },
    reps: { value: 0, date: null },
    volume: { value: 0, date: null }
  });
  const [nextWorkout, setNextWorkout] = useState<NextWorkoutRecommendation | null>(null);

  // States for progress filtering & chart
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('weight');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);
  const [relatedExercises, setRelatedExercises] = useState<Exercise[]>([]);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Derived values for header animations
  const HEADER_MAX_HEIGHT = 300;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 + insets.top : 70;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  
  // Setup animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Animation interpolations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.6, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });
  
  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: ['transparent', theme.card],
    extrapolate: 'clamp',
  });

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: chartMetric === 'weight' || chartMetric === 'volume' ? 1 : 0,
    color: (opacity = 1) => `rgba(10, 108, 255, ${opacity})`,
    labelColor: (opacity = 1) => theme.textSecondary,
    style: {
      borderRadius: BorderRadius.lg,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: Colors.primaryBlue,
    },
    propsForBackgroundLines: {
      stroke: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      strokeDasharray: '5, 5',
    },
  };

  // Load exercise data
  useEffect(() => {
    async function loadExerciseData() {
      try {
        if (!exercise) return;
        
        // These would be actual implementations in the real DatabaseService
        // For now, we're just setting dummy data
        setExerciseHistory([]);
        setPersonalRecords({
          weight: { value: 0, date: null },
          reps: { value: 0, date: null },
          volume: { value: 0, date: null }
        });
        setNextWorkout(null);
        
        // Get related exercises
        const related = getRelatedExercises(exerciseId);
        setRelatedExercises(related);
        
        // Update chart data with empty data for now
        updateChartData([], chartMetric, timeRange);
      } catch (error) {
        console.warn("Error loading exercise data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadExerciseData();
  }, [exerciseId, exercise]);
  
  // Update chart data when metric or time range changes
  useEffect(() => {
    updateChartData(exerciseHistory, chartMetric, timeRange);
  }, [chartMetric, timeRange, exerciseHistory]);

  // Calculate personal records from history
  const calculatePersonalRecords = (history: ExerciseHistoryEntry[]): PersonalRecords => {
    if (!history || history.length === 0) {
      return {
        weight: { value: 0, date: null },
        reps: { value: 0, date: null },
        volume: { value: 0, date: null }
      };
    }
    
    let records: PersonalRecords = {
      weight: { value: 0, date: null },
      reps: { value: 0, date: null },
      volume: { value: 0, date: null }
    };
    
    history.forEach(session => {
      // Find max weight for a single set
      const maxWeightSet = session.sets.reduce((max, set) => 
        (set.weight > max.weight) ? set : max, { weight: 0 } as WorkoutSet);
      
      if (maxWeightSet.weight > records.weight.value) {
        records.weight = { 
          value: maxWeightSet.weight, 
          date: session.date 
        };
      }
      
      // Find max reps for a single set
      const maxRepsSet = session.sets.reduce((max, set) => 
        (set.reps > max.reps) ? set : max, { reps: 0 } as WorkoutSet);
      
      if (maxRepsSet.reps > records.reps.value) {
        records.reps = { 
          value: maxRepsSet.reps, 
          date: session.date 
        };
      }
      
      // Calculate total volume for the session (weight × reps for all sets)
      const totalVolume = session.sets.reduce((sum, set) => 
        sum + (set.weight * set.reps), 0);
      
      if (totalVolume > records.volume.value) {
        records.volume = { 
          value: totalVolume, 
          date: session.date 
        };
      }
    });
    
    return records;
  };

  // Update chart data based on selected metric and time range
  const updateChartData = (history: ExerciseHistoryEntry[], metric: ChartMetric, range: TimeRange): void => {
    if (!history || history.length === 0) {
      setChartData(null);
      return;
    }
    
    // Filter history based on time range
    const filteredHistory = getFilteredHistory(history, range);
    
    if (filteredHistory.length === 0) {
      setChartData(null);
      return;
    }
    
    // Sort history by date (oldest first)
    const sortedHistory = [...filteredHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Generate data points based on the selected metric
    let labels: string[] = [];
    let data: number[] = [];
    
    // Limit to 7 data points for clarity
    const step = Math.max(1, Math.floor(sortedHistory.length / 7));
    const limitedHistory = sortedHistory.filter((_, index) => index % step === 0 || index === sortedHistory.length - 1);
    
    limitedHistory.forEach(session => {
      const date = new Date(session.date);
      
      // Format the label based on time range
      let label;
      if (range === '7') {
        label = format(date, 'E'); // Day of week (Mon, Tue, etc.)
      } else if (range === '30') {
        label = format(date, 'MM/dd'); // Month/day
      } else {
        label = format(date, 'MM/yy'); // Month/year
      }
      
      labels.push(label);
      
      switch (metric) {
        case 'weight':
          // Use the max weight from the session
          const maxWeight = session.sets.reduce((max, set) => 
            Math.max(max, set.weight), 0);
          data.push(maxWeight);
          break;
          
        case 'reps':
          // Use the max reps from the session
          const maxReps = session.sets.reduce((max, set) => 
            Math.max(max, set.reps), 0);
          data.push(maxReps);
          break;
          
        case 'volume':
          // Calculate total volume (weight × reps for all sets)
          const totalVolume = session.sets.reduce((sum, set) => 
            sum + (set.weight * set.reps), 0);
          data.push(totalVolume);
          break;
      }
    });
    
    setChartData({
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(10, 108, 255, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: [getMetricLabel(metric)]
    });
  };

  // Utility: Filter history based on timeRange selection
  const getFilteredHistory = (history: ExerciseHistoryEntry[], range: TimeRange): ExerciseHistoryEntry[] => {
    if (!history) return [];
    
    const now = new Date();
    if (range === 'all') {
      return history;
    }
    
    return history.filter(entry => {
      const entryDate = new Date(entry.date);
      const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= Number(range);
    });
  };
  
  // Get formatted label for the selected metric
  const getMetricLabel = (metric: ChartMetric): string => {
    switch (metric) {
      case 'weight':
        return 'Weight (kg)';
      case 'reps':
        return 'Repetitions';
      case 'volume':
        return 'Total Volume (kg)';
      default:
        return metric;
    }
  };

  // Handle share exercise
  const handleShareExercise = async (): Promise<void> => {
    if (!exercise) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Check out this exercise in GymTrackPro: ${exercise.name}\n\n${exercise.instructions}`,
        title: `GymTrackPro - ${exercise.name}`
      });
    } catch (error) {
      console.error('Error sharing exercise:', error);
    }
  };

  // De-structure data for muscles and rep ranges
  const primaryMuscles = exercise?.primaryMuscles?.map((id: string) => getMuscleInfo(id)) || [];
  const secondaryMuscles = exercise?.secondaryMuscles?.map((id: string) => getMuscleInfo(id)) || [];
  const goalRepRange =
    exercise?.repRanges?.find((range: {goal: string}) => range.goal === userGoal) || exercise?.repRanges?.[0];

  // Toggle favorite with haptic feedback
  const handleToggleFavorite = (): void => {
    if (!exercise) return;
    
    if (isFavorite(exercise.id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    toggleFavorite(exercise.id);
  };

  // Handle log workout
  const handleLogWorkout = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogModalVisible(true);
  };

  if (!exercise) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <FadeIn>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
            <Text variant="body" style={styles.loadingText}>
              Exercise not found
            </Text>
          </FadeIn>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        {/* Background Image */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: imageOpacity,
            transform: [{ translateY: imageTranslateY }],
          }}
        >
          {exercise.imageUrl ? (
            <Image source={{ uri: exercise.imageUrl }} style={styles.exerciseImage} />
          ) : (
            <View
              style={[
                styles.exerciseImage,
                { backgroundColor: theme.primary }
              ]}
            />
          )}
          
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
            }}
          />
        </Animated.View>
        
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        {/* Fixed header title (visible on scroll) */}
        <Animated.View
          style={[
            styles.headerTitle,
            {
              opacity: headerTitleOpacity,
              backgroundColor: headerBackgroundColor,
            },
          ]}
        >
          <Text variant="title" style={{ color: theme.text }}>
            {exercise.name}
          </Text>
        </Animated.View>
        
        {/* Header content (title and info) */}
        <View style={styles.headerContent}>
          <Text variant="heading2" style={{ color: '#FFF' }}>
            {exercise.name}
          </Text>
        </View>
      </Animated.View>
      
      {/* Main scroll content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: theme.background }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise information section */}
        <FadeIn>
          <View style={styles.section}>
            <Text variant="heading3" style={[styles.sectionTitle, { color: theme.text }]}>
              Information
            </Text>
            
            <View style={styles.chipContainer}>
              {/* Equipment */}
              <View style={[styles.chip, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="barbell-outline" size={16} color={theme.primary} />
                <Text variant="caption" style={[styles.chipText, { color: theme.text }]}>
                  {exercise.equipment}
                </Text>
              </View>
              
              {/* Difficulty */}
              <View style={[styles.chip, { backgroundColor: `${theme.secondary}20` }]}>
                <Ionicons name="speedometer-outline" size={16} color={theme.secondary} />
                <Text variant="caption" style={[styles.chipText, { color: theme.text }]}>
                  {exercise.difficulty}
                </Text>
              </View>

              {/* Rep range for goal */}
              {goalRepRange && (
                <View style={[styles.chip, { backgroundColor: `${theme.accent1}20` }]}>
                  <Ionicons name="repeat-outline" size={16} color={theme.accent1} />
                  <Text variant="caption" style={[styles.chipText, { color: theme.text }]}>
                    {goalRepRange.min}-{goalRepRange.max} reps
                  </Text>
                </View>
              )}
            </View>
            
            {/* Description */}
            <Card style={{ marginBottom: Spacing.md }}>
              <Text variant="body" style={{ color: theme.text }}>
                {showFullDescription
                  ? exercise.description
                  : exercise.description?.length > 120
                  ? exercise.description.substring(0, 120) + '...'
                  : exercise.description}
              </Text>
              
              {exercise.description?.length > 120 && (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  style={{ marginTop: Spacing.sm }}
                >
                  <Text variant="caption" style={{ color: theme.primary }}>
                    {showFullDescription ? 'Read less' : 'Read more'}
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        </FadeIn>
        
        {/* Log workout button for small screens */}
        <View style={{ marginBottom: Spacing.xl }}>
          <Button 
            title="Log Exercise" 
            icon="add-circle-outline"
            type="primary"
            onPress={handleLogWorkout}
          />
        </View>
      </ScrollView>
      
      {/* Bottom action bar */}
      <View style={[
        styles.buttonBar,
        { 
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          paddingBottom: Platform.OS === 'ios' ? (insets.bottom + Spacing.sm) : Spacing.md
        }
      ]}>
        <Button
          title={isFavorite(exercise.id) ? 'Favorited' : 'Favorite'}
          icon={isFavorite(exercise.id) ? 'heart' : 'heart-outline'}
          type={isFavorite(exercise.id) ? 'secondary' : 'tertiary'}
          onPress={handleToggleFavorite}
          style={{ marginRight: Spacing.md }}
        />
        
        <Button
          title="Log Exercise"
          icon="add-circle-outline"
          type="primary"
          onPress={handleLogWorkout}
          style={{ flex: 1 }}
        />
      </View>
      
      {/* Workout log modal */}
      {logModalVisible && (
        <WorkoutLogModal
          visible={logModalVisible}
          onClose={() => setLogModalVisible(false)}
          exerciseName={exercise.name}
          darkMode={darkMode}
          initialData={editingSet ? {
            date: editingSet.date,
            weight: editingSet.weight,
            reps: editingSet.reps,
            notes: editingSet.notes || ''
          } : undefined}
          previousPerformance={exerciseHistory.length > 0 ? 
            exerciseHistory.flatMap(entry => entry.sets).map(set => ({
              weight: set.weight,
              reps: set.reps
            })) : 
            undefined
          }
          onSave={(data) => {
            console.log('Workout logged:', data);
            // Here we would typically call a database service to save the workout
            setLogModalVisible(false);
          }}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.md,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    zIndex: 20,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    marginBottom: Spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    marginLeft: 4,
  },
  instruction: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  instructionText: {
    flex: 1,
  },
  statsCard: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
  },
  recordValue: {
    textAlign: 'center',
  },
  recordLabel: {
    textAlign: 'center',
  },
  recordDate: {
    textAlign: 'center',
  },
  chartContainer: {
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  metricSelector: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  metricButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginRight: 8,
  },
  buttonBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  favoriteButton: {
    marginRight: Spacing.md,
  },
  relatedExerciseCard: {
    marginRight: Spacing.md,
  },
  relatedExerciseImage: {
    width: '100%',
    height: 120,
    marginBottom: Spacing.sm,
  },
});

export default ExerciseDetailScreen; 