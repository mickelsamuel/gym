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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { Colors, Theme, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function WorkoutDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { workoutId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { darkMode, getExerciseById } = useContext(ExerciseContext);
  
  // Theme based on dark mode
  const theme = darkMode ? Theme.dark : Theme.light;
  
  // State variables
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState([]);
  const [restTimerEnabled, setRestTimerEnabled] = useState(true);
  const [restTimerDuration, setRestTimerDuration] = useState(60);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  
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
  const loadWorkoutDetails = async () => {
    try {
      setIsLoading(true);
      
      const workoutData = await DatabaseService.getWorkoutById(workoutId);
      setWorkout(workoutData);
      
      const exercisesList = workoutData.exercises.map(exercise => {
        const exerciseDetails = getExerciseById(exercise.exerciseId);
        return {
          ...exerciseDetails,
          sets: exercise.sets || 3,
          reps: exercise.reps || 10,
          weight: exercise.weight || 0,
          restTime: exercise.restTime || restTimerDuration,
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
  const loadWorkoutPerformance = async () => {
    try {
      const performanceHistory = await DatabaseService.getWorkoutHistory(workoutId);
      
      if (performanceHistory.length > 0) {
        setHistory(performanceHistory);
        
        // Process data for the chart
        const lastSixSessions = performanceHistory.slice(-6).reverse();
        
        // Calculate total volume
        const volumeData = lastSixSessions.map(session => {
          let totalVolume = 0;
          session.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
              totalVolume += set.weight * set.reps;
            });
          });
          return totalVolume;
        });
        
        // Calculate completion time (in minutes)
        const timeData = lastSixSessions.map(session => {
          const startTime = new Date(session.startTime);
          const endTime = new Date(session.endTime);
          return Math.round((endTime - startTime) / (1000 * 60));
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
  const startWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('WorkoutLog', { workoutId, isStarting: true });
  };
  
  // Edit workout
  const editWorkout = () => {
    navigation.navigate('CustomWorkoutDetail', { workoutId, isEditing: true });
  };
  
  // Share workout
  const shareWorkout = async () => {
    Haptics.selectionAsync();
    // Implementation for sharing
  };
  
  // Get Category Color
  const getCategoryColor = (category) => {
    const cat = workoutCategories.find(c => c.id === category);
    return cat ? cat.color : Colors.primaryBlue;
  };
  
  // Get Category Icon
  const getCategoryIcon = (category) => {
    const cat = workoutCategories.find(c => c.id === category);
    return cat ? cat.icon : 'barbell-outline';
  };
  
  // Delete workout
  const handleDeleteWorkout = () => {
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
  const handleRestTimerChange = (value) => {
    setRestTimerEnabled(value);
    // Save to database
    DatabaseService.updateWorkoutSettings(workoutId, {
      ...workout.settings,
      restTimerEnabled: value
    });
  };
  
  // Handle notifications setting change
  const handleNotificationsChange = (value) => {
    setNotificationsEnabled(value);
    // Save to database
    DatabaseService.updateWorkoutSettings(workoutId, {
      ...workout.settings,
      notificationsEnabled: value
    });
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
    },
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
  
  // If still loading or workout not found
  if (isLoading || !workout) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <CircleProgress isIndeterminate size={50} />
        </View>
      </Container>
    );
  }
  
  const categoryColor = getCategoryColor(workout.category);
  
  return (
    <Container>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            height: headerHeight,
            backgroundColor: theme.background,
            opacity: headerOpacity,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <Text variant="sectionHeader" numberOfLines={1} style={styles.headerTitle}>
            {workout.name}
          </Text>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={editWorkout}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'ios' ? insets.top + 20 : 20 }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.workoutHeaderContent}>
            <View style={styles.workoutHeaderIcon}>
              <View style={[styles.iconBackground, { backgroundColor: `${categoryColor}30` }]}>
                <Ionicons name={getCategoryIcon(workout.category)} size={32} color={categoryColor} />
              </View>
            </View>
            
            <Text variant="pageTitle" style={styles.workoutTitle}>{workout.name}</Text>
            
            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <Ionicons name="barbell-outline" size={20} color="#FFF" />
                <Text variant="body" style={styles.statText}>{exercises.length} Exercises</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#FFF" />
                <Text variant="body" style={styles.statText}>{workout.duration} min</Text>
              </View>
            </View>
          </View>
          
          <LinearGradient
            colors={[categoryColor, '#0047AB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        
        {/* Start Button */}
        <View style={styles.startButtonContainer}>
          <Button
            title="Start Workout"
            type="primary"
            icon="play"
            onPress={startWorkout}
            style={styles.startButton}
          />
        </View>
        
        {/* Exercise List Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text variant="sectionHeader" style={styles.sectionTitle}>Exercises</Text>
            <TouchableOpacity
              onPress={editWorkout}
              activeOpacity={0.7}
              style={styles.textButton}
            >
              <Text variant="caption" style={styles.textButtonLabel}>Edit Order</Text>
              <Ionicons name="list-outline" size={16} color={Colors.primaryBlue} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.exerciseList}>
            {exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseItem}>
                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseNumberContainer}>
                    <Text variant="caption" style={styles.exerciseNumber}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.exerciseContent}>
                    <Text variant="cardTitle" style={styles.exerciseName}>{exercise.name}</Text>
                    <Text variant="caption" style={styles.exerciseDetails}>
                      {exercise.sets} sets • {exercise.reps} reps • {exercise.weight > 0 ? `${exercise.weight}kg` : 'Bodyweight'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.exerciseAction}
                    onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="information-circle-outline" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                {index < exercises.length - 1 && (
                  <View style={styles.restTimeContainer}>
                    <Ionicons name="timer-outline" size={16} color={theme.textSecondary} />
                    <Text variant="small" style={styles.restTimeText}>
                      {exercise.restTime}s rest
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </Card>
        
        {/* Settings Section */}
        <Card style={styles.sectionCard}>
          <Text variant="sectionHeader" style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="timer-outline" size={20} color={theme.text} style={styles.settingIcon} />
              <Text variant="body" style={styles.settingLabel}>Rest Timer</Text>
            </View>
            
            <Switch
              value={restTimerEnabled}
              onValueChange={handleRestTimerChange}
              trackColor={{ false: '#767577', true: `${Colors.primaryBlue}50` }}
              thumbColor={restTimerEnabled ? Colors.primaryBlue : '#f4f3f4'}
              ios_backgroundColor="#767577"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications-outline" size={20} color={theme.text} style={styles.settingIcon} />
              <Text variant="body" style={styles.settingLabel}>Notifications</Text>
            </View>
            
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsChange}
              trackColor={{ false: '#767577', true: `${Colors.primaryBlue}50` }}
              thumbColor={notificationsEnabled ? Colors.primaryBlue : '#f4f3f4'}
              ios_backgroundColor="#767577"
            />
          </View>
          
          <View style={styles.buttonRow}>
            <Button
              title="Share Workout"
              type="secondary"
              icon="share-outline"
              onPress={shareWorkout}
              style={[styles.actionButton, styles.shareButton]}
            />
            
            <Button
              title="Delete"
              type="danger"
              icon="trash-outline"
              onPress={handleDeleteWorkout}
              style={styles.actionButton}
            />
          </View>
        </Card>
        
        {/* Performance Stats Section */}
        {performanceData && (
          <Card style={styles.sectionCard}>
            <Text variant="sectionHeader" style={styles.sectionTitle}>Performance Stats</Text>
            
            <View style={styles.statTabs}>
              <TouchableOpacity style={[styles.statTab, styles.activeStatTab]}>
                <Text variant="caption" style={styles.activeStatTabText}>Volume</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.statTab}>
                <Text variant="caption" style={styles.statTabText}>Time</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: performanceData.labels,
                  datasets: [
                    {
                      data: performanceData.volumeData.length > 0 
                        ? performanceData.volumeData 
                        : [0, 0],
                    }
                  ]
                }}
                width={320}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
            
            <View style={styles.statHighlights}>
              <View style={styles.statHighlight}>
                <Text variant="caption" style={styles.statHighlightLabel}>Best Volume</Text>
                <Text variant="cardTitle" style={styles.statHighlightValue}>
                  {Math.max(...performanceData.volumeData)}kg
                </Text>
              </View>
              
              <View style={styles.statHighlight}>
                <Text variant="caption" style={styles.statHighlightLabel}>Best Time</Text>
                <Text variant="cardTitle" style={styles.statHighlightValue}>
                  {Math.min(...performanceData.timeData)}min
                </Text>
              </View>
              
              <View style={styles.statHighlight}>
                <Text variant="caption" style={styles.statHighlightLabel}>Last Workout</Text>
                <Text variant="cardTitle" style={styles.statHighlightValue}>
                  {history.length > 0 
                    ? moment(history[history.length - 1].date).format('MM/DD') 
                    : '-'}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </Animated.ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: Typography.semibold,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutHeaderContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  workoutHeaderIcon: {
    marginBottom: Spacing.md,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutTitle: {
    color: '#FFF',
    marginBottom: Spacing.sm,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#FFF',
    marginLeft: 4,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: Spacing.md,
  },
  startButtonContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    marginBottom: Spacing.lg,
    zIndex: 1,
  },
  startButton: {
    borderRadius: BorderRadius.md,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
  exerciseList: {
    marginBottom: Spacing.sm,
  },
  exerciseItem: {
    marginBottom: Spacing.md,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: (props) => `${Colors.primaryBlue}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  exerciseNumber: {
    color: Colors.primaryBlue,
    fontWeight: Typography.semibold,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: Typography.semibold,
  },
  exerciseDetails: {
    color: (props) => props.theme.textSecondary,
  },
  exerciseAction: {
    padding: Spacing.xs,
  },
  restTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 36,
    marginTop: Spacing.xs,
  },
  restTimeText: {
    color: (props) => props.theme.textSecondary,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: (props) => props.theme === Theme.dark 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.05)',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: Spacing.sm,
  },
  settingLabel: {
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  shareButton: {
    marginRight: Spacing.md,
  },
  statTabs: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statTab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  activeStatTab: {
    backgroundColor: (props) => `${Colors.primaryBlue}15`,
  },
  statTabText: {
    color: (props) => props.theme.textSecondary,
  },
  activeStatTabText: {
    color: Colors.primaryBlue,
    fontWeight: Typography.medium,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chart: {
    borderRadius: BorderRadius.md,
  },
  statHighlights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statHighlight: {
    alignItems: 'center',
  },
  statHighlightLabel: {
    color: (props) => props.theme.textSecondary,
    marginBottom: 2,
  },
  statHighlightValue: {
    fontWeight: Typography.semibold,
  },
}); 