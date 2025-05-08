import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  Image,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TextInput
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/NavigationTypes';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CalendarList } from 'react-native-calendars';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { AuthContext, useAuth } from '../context/AuthContext';
import moment from 'moment';
import workoutCategories from '../data/workoutCategories';
import { Workout, WorkoutExercise, Exercise } from '../types/globalTypes';

// Import our custom UI components from design system
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
const CARD_WIDTH = (width - (Spacing.lg * 3)) / 2;

// Types and interfaces
interface WorkoutList {
  id: string;
  name: string;
  exercises: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkoutSet {
  weight: number;
  reps: number;
  completed?: boolean;
}

interface LocalWorkoutExercise {
  exerciseId: string;
  exercise?: Exercise;
  sets: WorkoutSet[];
}

interface LocalWorkout {
  id: string;
  name: string;
  date: string;
  exercises: LocalWorkoutExercise[];
  duration: number;
  userId: string;
  completed?: boolean;
  notes?: string;
}

interface MarkedDate {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    customStyles?: {
      container?: {
        backgroundColor?: string;
      };
      text?: {
        color?: string;
      };
    };
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

type ViewModeType = 'grid' | 'calendar';

const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    userGoal,
    getExerciseById,
    favorites,
    darkMode,
    loading: globalLoading,
    getSuggestedWeight,
    getSuggestedReps
  } = useContext(ExerciseContext);
  const { user, isOnline } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  
  const [workoutLists, setWorkoutLists] = useState<WorkoutList[]>([]);
  const [newListName, setNewListName] = useState<string>('');
  const [showFavorites, setShowFavorites] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [recentWorkouts, setRecentWorkouts] = useState<LocalWorkout[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<LocalWorkout | null>(null);
  const [customWorkouts, setCustomWorkouts] = useState<WorkoutList[]>([]);
  const [suggestedWorkouts, setSuggestedWorkouts] = useState<WorkoutList[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<{[key: string]: LocalWorkout[]}>({});
  const [markedDates, setMarkedDates] = useState<MarkedDate>({});
  const [viewMode, setViewMode] = useState<ViewModeType>('grid');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Replace height animation with opacity and scale 
  const favoritesOpacity = useRef(new Animated.Value(0)).current;
  const favoritesScale = useRef(new Animated.Value(0)).current;
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  // Theme based on dark mode
  const theme = darkMode ? Theme.dark : Theme.light;
  
  // Load all workout lists on initial render
  useEffect(() => {
    loadAllWorkouts();
    
    // Animate elements when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
    
    // Load recent workout history
    loadRecentWorkouts();
  }, []);

  // Toggle animation for favorites section
  useEffect(() => {
    toggleFavoritesAnimation();
  }, [showFavorites]);

  // Refresh workout lists when screen regains focus
  useFocusEffect(
    useCallback(() => {
      loadAllWorkouts();
      loadRecentWorkouts();
    }, [])
  );
  
  // Update this function to use opacity and scale instead of height
  const toggleFavoritesAnimation = (): void => {
    if (showFavorites) {
      // Show favorites
      Animated.parallel([
        Animated.timing(favoritesOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(favoritesScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Hide favorites
      Animated.parallel([
        Animated.timing(favoritesOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(favoritesScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  };
  
  // Load all custom workout plans
  const loadAllWorkouts = async (): Promise<void> => {
    setLoading(true);
    try {
      if (user?.uid) {
        const response = await DatabaseService.getAllWorkouts(user.uid, isOnline);
        if (response.success && response.data) {
          // Convert response data to the expected format
          const lists = response.data.map(workout => ({
            id: workout.id || '',
            name: workout.name,
            exercises: workout.exercises.map(ex => ex.id),
            userId: workout.userId,
            createdAt: workout.createdAt?.toString() || new Date().toISOString(),
            updatedAt: workout.updatedAt?.toString() || new Date().toISOString()
          }));
          setWorkoutLists(lists);
        }
      }
    } catch (error) {
      console.error("Error loading workout lists:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load user's recent workout history
  const loadRecentWorkouts = async (): Promise<void> => {
    try {
      if (user?.uid) {
        const response = await DatabaseService.getRecentWorkouts(user.uid, isOnline);
        if (response.success && response.data) {
          // Convert Workout[] from API to LocalWorkout[]
          const localWorkouts: LocalWorkout[] = response.data.map(workout => ({
            id: workout.id || `workout_${Date.now()}_${Math.random()}`,
            name: workout.name,
            date: workout.date,
            exercises: workout.exercises.map(ex => ({
              exerciseId: ex.id,
              sets: ex.sets.map(set => ({
                weight: set.weight,
                reps: set.reps,
                completed: set.isCompleted
              }))
            })),
            duration: workout.duration || 0,
            userId: workout.userId,
            notes: workout.description
          }));
          setRecentWorkouts(localWorkouts.slice(0, 5));
        }
      }
    } catch (error) {
      console.error("Error loading recent workouts:", error);
    }
  };
  
  // Refresh workout data
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadAllWorkouts(),
        loadRecentWorkouts()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Create a new workout list
  const handleCreateList = async (): Promise<void> => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Enter a name for your new workout list.');
      return;
    }
    
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to create a workout.');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    try {
      // Create an API-compatible Workout object
      const newWorkout: Workout = {
        name: newListName.trim(),
        userId: user.uid,
        date: new Date().toISOString(),
        exercises: [],
        duration: 0
      };
      
      const response = await DatabaseService.saveWorkout(newWorkout, isOnline);
      
      setNewListName('');
      await loadAllWorkouts();
      
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(response.error?.message || 'Failed to create workout');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not create new workout list.');
      if(error instanceof Error){
        console.error("Error creating workout list:", error.message);
      } else {
        console.error("Error creating workout list:", error);
      }
     
    } finally {
      setLoading(false);
    }
  };

  // Navigate to workout detail screen
  const handleOpenList = (list: WorkoutList): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CustomWorkoutDetailScreen', { listId: list.id });
  };

  // Get user's favorite exercises
  const favoriteExercises = favorites
    ? favorites.map((id: string) => getExerciseById(id)).filter(Boolean)
    : [];

  // More methods will be implemented...

  return (
    <Container>
      {/* Fixed header that appears when scrolling */}
      <Animated.View style={[
        styles.fixedHeader,
        { opacity: headerOpacity, backgroundColor: theme.background }
      ]}>
        <Text variant="heading3">Workouts</Text>
      </Animated.View>

      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + 20 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text variant="heading2">
            Workouts
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: viewMode === 'grid' ? theme.primary : 'transparent' }]} 
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={22} color={viewMode === 'grid' ? '#FFFFFF' : theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: viewMode === 'calendar' ? theme.primary : 'transparent' }]} 
              onPress={() => setViewMode('calendar')}
            >
              <Ionicons name="calendar" size={22} color={viewMode === 'calendar' ? '#FFFFFF' : theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Create List Input */}
        <View style={styles.createListInput}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder="New workout name"
              placeholderTextColor={theme.textSecondary}
              value={newListName}
              onChangeText={setNewListName}
            />
            <Button 
              title="Create"
              onPress={handleCreateList} 
              disabled={!isOnline || loading} 
              loading={loading}
              icon="add"
            />
            {!isOnline && <Text style={{ color: theme.danger }}>You are offline. You can not create a new workout.</Text>}
        </View>

        {/* Main content will go here... */}
      </Animated.ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    zIndex: 1000,
    ...createElevation(3),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  createListInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },

  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  addButton: {
    height: 50,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9
  },
  buttonText: {
    marginLeft: Spacing.xs,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workoutListsContainer: {
    marginTop: Spacing.sm,
  },
  workoutCard: {
    width: CARD_WIDTH,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    ...createElevation(2),
  },
  cardTitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  exerciseCountText: {
    marginBottom: Spacing.xs,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  toggleText: {
    marginLeft: Spacing.xs,
  },
  favoriteExercisesContainer: {
    marginBottom: Spacing.lg,
  },
  shadowContainer: {
    ...createElevation(3),
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  currentWorkoutCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  progressText: {
    marginLeft: Spacing.md,
  },
  cardButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  actionButtonText: {
    marginLeft: Spacing.xs,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyStateText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    ...createElevation(2),
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dayHeader: {
    backgroundColor: 'transparent',
  }
});

export default WorkoutScreen; 