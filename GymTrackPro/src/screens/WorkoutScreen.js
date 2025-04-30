import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  Image,
  Text,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CalendarList } from 'react-native-calendars';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import moment from 'moment';
import workoutCategories from '../data/workoutCategories';

// Import our custom UI components
import { Title, Heading, Subheading, Body, Caption } from '../components/ui/Text';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import Colors from '../constants/Colors';
import { CircleProgress, FadeIn, SlideIn } from '../components/ui';
import { Colors as ThemeColors, Typography, Spacing, BorderRadius } from '../constants/Theme';

const { width } = Dimensions.get('window');

const CARD_WIDTH = (width - (Spacing.lg * 3)) / 2;

const WorkoutScreen = () => {
  const navigation = useNavigation();
  const {
    userGoal,
    getExerciseById,
    favorites,
    darkMode,
    loading: globalLoading,
    getSuggestedWeight,
    getSuggestedReps
  } = useContext(ExerciseContext);
  const { user } = useContext(AuthContext);
  const tabBarHeight = useBottomTabBarHeight();
  
  const [workoutLists, setWorkoutLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [showFavorites, setShowFavorites] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [suggestedWorkouts, setSuggestedWorkouts] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
  const [isLoading, setIsLoading] = useState(true);
  
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
  const theme = darkMode ? ThemeColors.dark : ThemeColors.light;
  
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
  const toggleFavoritesAnimation = () => {
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
  const loadAllWorkouts = async () => {
    setLoading(true);
    try {
      const lists = await DatabaseService.getAllWorkoutLists();
      setWorkoutLists(lists);
    } catch (error) {
      console.error("Error loading workout lists:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load user's recent workout history
  const loadRecentWorkouts = async () => {
    try {
      const history = await DatabaseService.getRecentWorkouts();
      setRecentWorkouts(history?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error loading recent workouts:", error);
    }
  };
  
  // Refresh workout data
  const onRefresh = async () => {
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
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Enter a name for your new workout list.');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const newPlan = await DatabaseService.createWorkoutList(newListName.trim());
      setNewListName('');
      await loadAllWorkouts();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Could not create new workout list.');
      console.error("Error creating workout list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to workout detail screen
  const handleOpenList = (list) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CustomWorkoutDetailScreen', { listId: list.id });
  };

  // Get user's favorite exercises
  const favoriteExercises = favorites
    .map((favId) => getExerciseById(favId))
    .filter(Boolean);
    
  // Get suggestions for next workout based on user's goal and history
  const getNextWorkoutSuggestions = (exerciseId) => {
    if (!exerciseId) return null;
    
    const suggestedWeight = getSuggestedWeight(exerciseId);
    const suggestedReps = getSuggestedReps(exerciseId);
    
    if (!suggestedWeight && !suggestedReps) return null;
    
    return {
      weight: suggestedWeight,
      reps: suggestedReps
    };
  };
  
  // Get color by muscle category
  const getCategoryColor = (category) => {
    const cat = workoutCategories.find(c => c.id === category);
    return cat ? cat.color : Colors.primaryBlue;
  };

  // Load workouts from API/database
  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      
      // Get current workout if exists
      const current = await DatabaseService.getCurrentWorkout();
      setCurrentWorkout(current);
      
      // Get custom workouts
      const custom = await DatabaseService.getCustomWorkouts();
      setCustomWorkouts(custom);
      
      // Get suggested workouts
      const suggested = await DatabaseService.getSuggestedWorkouts();
      setSuggestedWorkouts(suggested);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading workouts:", error);
      setIsLoading(false);
    }
  };
  
  // Load workout history
  const loadWorkoutHistory = async () => {
    try {
      // Get workout history
      const history = await DatabaseService.getWorkoutHistory();
      setWorkoutHistory(history);
      
      // Format dates for calendar marking
      const dates = {};
      Object.keys(history).forEach(date => {
        const workouts = history[date];
        // Color intensity based on number of workouts that day
        const intensity = Math.min(0.3 + (workouts.length * 0.2), 0.9);
        
        dates[date] = {
          marked: true,
          dotColor: Colors.primaryBlue,
          selected: true,
          selectedColor: `rgba(10, 108, 255, ${intensity})`,
        };
      });
      
      setMarkedDates(dates);
    } catch (error) {
      console.error("Error loading workout history:", error);
    }
  };
  
  // Navigate to workout detail
  const navigateToWorkoutDetail = (workoutId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('WorkoutDetail', { workoutId });
  };
  
  // Start workout
  const startWorkout = (workoutId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('WorkoutLog', { workoutId, isStarting: true });
  };
  
  // Create new workout
  const createNewWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CustomWorkoutDetail', { isNew: true });
  };
  
  // Calculate workout completion percentage
  const calculateCompletion = (workout) => {
    if (!workout || !workout.lastSession) return 0;
    return workout.lastSession.completed / workout.lastSession.total * 100;
  };
  
  // Format minutes as hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
  };
  
  // Render current workout card
  const renderCurrentWorkout = () => {
    if (!currentWorkout) return null;
    
    const completion = calculateCompletion(currentWorkout);
    const categoryColor = getCategoryColor(currentWorkout.category);
    
    return (
      <FadeIn delay={100} duration={600}>
        <View style={styles.sectionContainer}>
          <Text variant="sectionHeader" style={styles.sectionTitle}>Current Routine</Text>
          
          <Card style={styles.currentWorkoutCard}>
            <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
            
            <View style={styles.workoutCardContent}>
              <View style={styles.workoutCardHeader}>
                <View style={styles.workoutTitleContainer}>
                  <Ionicons 
                    name={workoutCategories.find(c => c.id === currentWorkout.category)?.icon || 'barbell-outline'} 
                    size={24} 
                    color={categoryColor} 
                    style={styles.workoutIcon} 
                  />
                  <View>
                    <Text variant="cardTitle" style={styles.workoutTitle}>{currentWorkout.name}</Text>
                    <Text variant="caption" style={styles.workoutSubtitle}>
                      {currentWorkout.exercises.length} exercises • {formatDuration(currentWorkout.duration)}
                    </Text>
                  </View>
                </View>
                
                <CircleProgress 
                  percentage={completion} 
                  size={50} 
                  strokeWidth={5} 
                  progressColor={categoryColor} 
                />
              </View>
              
              <View style={styles.workoutCardFooter}>
                <Button 
                  title="Continue" 
                  type="primary" 
                  size="small"
                  icon="play" 
                  onPress={() => startWorkout(currentWorkout.id)} 
                />
                
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => navigateToWorkoutDetail(currentWorkout.id)}
                  activeOpacity={0.7}
                >
                  <Text variant="caption" style={styles.detailsText}>Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>
      </FadeIn>
    );
  };
  
  // Render custom workout card
  const renderWorkoutCard = ({ item, index }) => {
    const categoryColor = getCategoryColor(item.category);
    
    return (
      <SlideIn direction="up" delay={100 + (index * 50)} duration={500}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigateToWorkoutDetail(item.id)}
          style={[styles.workoutCard, { width: CARD_WIDTH }]}
        >
          <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
          
          <View style={styles.cardIconContainer}>
            <View style={[styles.cardIconBackground, { backgroundColor: `${categoryColor}20` }]}>
              <Ionicons name={workoutCategories.find(c => c.id === item.category)?.icon || 'barbell-outline'} size={24} color={categoryColor} />
            </View>
          </View>
          
          <Text variant="cardTitle" numberOfLines={1} style={styles.cardTitle}>{item.name}</Text>
          
          <Text variant="caption" style={styles.cardSubtitle}>
            {item.exercises.length} exercises
          </Text>
          
          <View style={styles.cardFooter}>
            <Text variant="small" style={styles.cardDuration}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
              {' '}{formatDuration(item.duration)}
            </Text>
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                startWorkout(item.id);
              }}
              style={styles.startButton}
            >
              <Ionicons name="play" size={16} color={Colors.primaryBlue} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </SlideIn>
    );
  };
  
  // Render suggested workout card
  const renderSuggestedWorkout = ({ item, index }) => {
    const categoryColor = getCategoryColor(item.category);
    
    return (
      <SlideIn direction="up" delay={200 + (index * 50)} duration={500}>
        <Card style={styles.suggestedCard}>
          <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
          
          <View style={styles.suggestedCardContent}>
            <View style={styles.suggestedCardHeader}>
              <Ionicons name={workoutCategories.find(c => c.id === item.category)?.icon || 'barbell-outline'} size={24} color={categoryColor} style={styles.workoutIcon} />
              
              <View style={styles.suggestedTitleContainer}>
                <Text variant="cardTitle" style={styles.workoutTitle}>{item.name}</Text>
                <Text variant="caption" style={styles.workoutSubtitle}>
                  {item.reason}
                </Text>
              </View>
            </View>
            
            <Button 
              title="Try This" 
              type="secondary" 
              size="small"
              onPress={() => startWorkout(item.id)} 
            />
          </View>
        </Card>
      </SlideIn>
    );
  };
  
  // Render workout history calendar
  const renderWorkoutHistory = () => {
    if (viewMode === 'calendar') {
      return (
        <FadeIn delay={300} duration={600}>
          <View style={styles.calendarContainer}>
            <CalendarList
              markedDates={markedDates}
              markingType={'period'}
              theme={{
                calendarBackground: theme.card,
                textSectionTitleColor: theme.textSecondary,
                selectedDayBackgroundColor: Colors.primaryBlue,
                selectedDayTextColor: '#ffffff',
                todayTextColor: Colors.primaryBlue,
                dayTextColor: theme.text,
                textDisabledColor: theme.textSecondary,
                monthTextColor: theme.text,
                indicatorColor: Colors.primaryBlue,
                arrowColor: Colors.primaryBlue,
              }}
              horizontal={true}
              pagingEnabled={true}
              hideExtraDays={false}
              onDayPress={(day) => {
                if (workoutHistory[day.dateString]) {
                  navigation.navigate('WorkoutHistory', { date: day.dateString });
                }
              }}
            />
          </View>
        </FadeIn>
      );
    }
    
    return null;
  };

  return (
    <Container dark={darkMode} style={{ backgroundColor: theme.background }}>
      {/* Header with sticky title */}
      <Animated.View 
        style={[
          styles.headerContainer,
          { opacity: headerOpacity, backgroundColor: theme.background }
        ]}
      >
        <Text variant="pageTitle" style={styles.headerTitle}>Workouts</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={createNewWorkout}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[Colors.primaryBlue, Colors.primaryDarkBlue]}
            style={styles.createButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Main Scroll Content */}
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + Spacing.lg }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryBlue}
            colors={[Colors.primaryBlue]}
          />
        }
      >
        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text variant="pageTitle" style={styles.pageTitle}>Workouts</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={createNewWorkout}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.primaryBlue, Colors.primaryDarkBlue]}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Current Workout Section */}
        {renderCurrentWorkout()}
        
        {/* Custom Workouts Section */}
        <FadeIn delay={200} duration={600}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text variant="sectionHeader" style={styles.sectionTitle}>My Routines</Text>
              <TouchableOpacity
                onPress={createNewWorkout}
                activeOpacity={0.7}
                style={styles.textButton}
              >
                <Text variant="caption" style={styles.textButtonLabel}>Create New</Text>
                <Ionicons name="add-circle-outline" size={16} color={Colors.primaryBlue} />
              </TouchableOpacity>
            </View>
            
            {customWorkouts.length > 0 ? (
              <FlatList
                data={customWorkouts}
                renderItem={renderWorkoutCard}
                keyExtractor={item => item.id}
                horizontal={false}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.workoutCardsContainer}
                columnWrapperStyle={styles.columnWrapper}
                scrollEnabled={false}
              />
            ) : (
              <Card style={styles.emptyStateCard}>
                <Ionicons name="fitness-outline" size={40} color={theme.textSecondary} style={styles.emptyStateIcon} />
                <Text variant="body" style={styles.emptyStateText}>
                  You haven't created any workout routines yet
                </Text>
                <Button
                  title="Create Your First Workout"
                  onPress={createNewWorkout}
                  type="primary"
                  icon="add-circle-outline"
                  style={styles.emptyStateButton}
                />
              </Card>
            )}
          </View>
        </FadeIn>
        
        {/* Suggested Workouts Section */}
        {suggestedWorkouts.length > 0 && (
          <FadeIn delay={300} duration={600}>
            <View style={styles.sectionContainer}>
              <Text variant="sectionHeader" style={styles.sectionTitle}>Suggested For You</Text>
              
              <FlatList
                data={suggestedWorkouts}
                renderItem={renderSuggestedWorkout}
                keyExtractor={item => item.id}
                horizontal={false}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={styles.suggestedCardsContainer}
              />
            </View>
          </FadeIn>
        )}
        
        {/* Workout History Section */}
        <FadeIn delay={400} duration={600}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text variant="sectionHeader" style={styles.sectionTitle}>Workout History</Text>
              
              <View style={styles.viewModeToggle}>
                <TouchableOpacity
                  onPress={() => setViewMode('grid')}
                  style={[
                    styles.viewModeButton,
                    viewMode === 'grid' && styles.viewModeButtonActive
                  ]}
                >
                  <Ionicons 
                    name="grid-outline" 
                    size={18} 
                    color={viewMode === 'grid' ? Colors.primaryBlue : theme.textSecondary} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setViewMode('calendar')}
                  style={[
                    styles.viewModeButton,
                    viewMode === 'calendar' && styles.viewModeButtonActive
                  ]}
                >
                  <Ionicons 
                    name="calendar-outline" 
                    size={18} 
                    color={viewMode === 'calendar' ? Colors.primaryBlue : theme.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {renderWorkoutHistory()}
          </View>
        </FadeIn>
      </Animated.ScrollView>
    </Container>
  );
};

export default WorkoutScreen;

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  headerTitle: {
    fontWeight: Typography.bold,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontWeight: Typography.bold,
  },
  createButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: Typography.semibold,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textButtonLabel: {
    color: Colors.primaryBlue,
    marginRight: 4,
  },
  currentWorkoutCard: {
    marginHorizontal: Spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  categoryIndicator: {
    width: 4,
    height: '100%',
  },
  workoutCardContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutIcon: {
    marginRight: Spacing.sm,
  },
  workoutTitle: {
    fontWeight: Typography.semibold,
  },
  workoutSubtitle: {
    color: (props) => props.theme.textSecondary,
    marginTop: 2,
  },
  workoutCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  detailsText: {
    color: (props) => props.theme.textSecondary,
    marginRight: 2,
  },
  workoutCardsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  workoutCard: {
    backgroundColor: (props) => props.theme.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardIconContainer: {
    marginBottom: Spacing.sm,
  },
  cardIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: Typography.semibold,
  },
  cardSubtitle: {
    color: (props) => props.theme.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cardDuration: {
    color: (props) => props.theme.textSecondary,
  },
  startButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: (props) => `${Colors.primaryBlue}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyStateIcon: {
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: (props) => props.theme.textSecondary,
  },
  emptyStateButton: {
    marginTop: Spacing.md,
  },
  suggestedCardsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  suggestedCard: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  suggestedCardContent: {
    flex: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  suggestedTitleContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    backgroundColor: (props) => props.theme === ThemeColors.dark 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.05)',
    padding: 2,
  },
  viewModeButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  viewModeButtonActive: {
    backgroundColor: (props) => props.theme === ThemeColors.dark 
      ? 'rgba(255,255,255,0.15)' 
      : 'rgba(255,255,255,0.9)',
  },
  calendarContainer: {
    marginTop: Spacing.md,
    backgroundColor: (props) => props.theme.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});