// src/screens/ExerciseDetailScreen.js
import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
  ImageBackground,
  Share
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import WorkoutLogModal from './WorkoutLogModal';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { Title, Heading, Subheading, Body, Caption } from '../components/ui/Text';
import Container from '../components/ui/Container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ExerciseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { exerciseId, logWorkout } = route.params;
  const {
    getExerciseById,
    getMuscleInfo,
    toggleFavorite,
    isFavorite,
    userGoal,
    darkMode
  } = useContext(ExerciseContext);
  const exercise = getExerciseById(exerciseId);
  const insets = useSafeAreaInsets();

  // States for logging and history
  const [logModalVisible, setLogModalVisible] = useState(logWorkout || false);
  const [editingSet, setEditingSet] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [nextWorkout, setNextWorkout] = useState(null);

  // States for progress filtering & chart metric
  const [timeRange, setTimeRange] = useState('30'); // options: '7', '30', or 'all'
  const [chartMetric, setChartMetric] = useState('volume'); // options: 'volume', 'weight', 'reps'
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Initialize colors
  const defaultColors = {
    light: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#F8F9FA',
      backgroundSecondary: '#FFFFFF',
      text: '#333333',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#E0E0E0',
      card: '#FFFFFF',
      warning: '#FF9500',
      success: '#28A745',
      danger: '#FF3B30',
      info: '#5AC8FA',
      shadow: 'rgba(0,0,0,0.1)',
    },
    dark: {
      primary: '#0A84FF',
      secondary: '#5E5CE6',
      background: '#1C1C1E',
      backgroundSecondary: '#2C2C2E',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
      textTertiary: '#888888',
      border: '#555555',
      card: '#2C2C2E',
      warning: '#FF9F0A',
      success: '#33CF4D',
      danger: '#FF453A',
      info: '#64D2FF',
      shadow: 'rgba(0,0,0,0.3)',
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = darkMode ? colorScheme.dark : colorScheme.light;

  // Derived values for header animations
  const HEADER_MAX_HEIGHT = 300;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 + insets.top : 70;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  
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
    outputRange: ['transparent', colors.backgroundSecondary],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await DatabaseService.getExerciseHistory(exerciseId);
        setExerciseHistory(history);

        const recommendation = await DatabaseService.calculateNextWorkout(exerciseId);
        setNextWorkout(recommendation);
      } catch (error) {
        console.warn(error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (exercise) {
      loadHistory();
      
      // Run animations
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
    }
  }, [exerciseId, exercise]);

  // Utility: Filter history based on timeRange selection.
  const getFilteredHistory = () => {
    const now = new Date();
    if (timeRange === 'all') {
      return exerciseHistory;
    }
    return exerciseHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      const daysDiff = (now - entryDate) / (1000 * 3600 * 24);
      return daysDiff <= Number(timeRange);
    });
  };

  // Sort the filtered history in ascending order (oldest first)
  const sortedHistory = getFilteredHistory().sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Handle share exercise
  const handleShareExercise = async () => {
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
  const primaryMuscles = exercise?.primaryMuscles.map(id => getMuscleInfo(id)) || [];
  const secondaryMuscles = exercise?.secondaryMuscles.map(id => getMuscleInfo(id)) || [];
  const goalRepRange =
    exercise?.repRanges.find(range => range.goal === userGoal) || exercise?.repRanges[0];

  // Toggle favorite with haptic feedback
  const handleToggleFavorite = () => {
    if (isFavorite(exercise.id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    toggleFavorite(exercise.id);
  };

  if (!exercise) {
    return (
      <Container style={{ backgroundColor: colors.background }}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Exercise not found
          </Text>
        </View>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container style={{ backgroundColor: colors.background }}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading exercise details...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            height: headerHeight,
            backgroundColor: headerBackgroundColor,
            paddingTop: insets.top,
          }
        ]}
      >
        {/* Background Image */}
        <Animated.View
          style={[
            styles.headerBackground,
            {
              opacity: imageOpacity,
              transform: [{ translateY: imageTranslateY }],
            },
          ]}
        >
          <ImageBackground source={exercise.image} style={styles.backgroundImage}>
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            />
          </ImageBackground>
        </Animated.View>
        
        {/* Header Controls */}
        <View style={[styles.headerControls, { paddingTop: Platform.OS === 'ios' ? 0 : 8 }]}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          
          <Animated.Text 
            style={[
              styles.headerTitle, 
              { 
                opacity: headerTitleOpacity,
                color: colors.text,
              }
            ]}
            numberOfLines={1}
          >
            {exercise.name}
          </Animated.Text>
          
          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              onPress={handleShareExercise}
            >
              <Ionicons name="share-outline" size={22} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={isFavorite(exercise.id) ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite(exercise.id) ? '#FF3B30' : '#FFF'}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Exercise Name Display */}
        <Animated.View 
          style={[
            styles.exerciseNameContainer,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, HEADER_SCROLL_DISTANCE * 0.6],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              })
            }
          ]}
        >
          <Text style={[styles.exerciseName, { color: '#FFFFFF' }]}>
            {exercise.name}
          </Text>
          <View style={styles.exerciseCategoryContainer}>
            <Text style={styles.exerciseCategory}>{exercise.category}</Text>
          </View>
        </Animated.View>
      </Animated.View>
      
      {/* Content */}
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: HEADER_MAX_HEIGHT - 20 }
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Animated.View 
          style={[
            styles.contentContainer, 
            { 
              backgroundColor: colors.backgroundSecondary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              shadowColor: colors.shadow,
            }
          ]}
        >
          {/* Next Workout Recommendation */}
          {nextWorkout && (
            <View style={styles.nextWorkoutContainer}>
              <View style={styles.nextWorkoutHeader}>
                <Ionicons name="fitness-outline" size={20} color={colors.primary} />
                <Subheading style={{ color: colors.text, marginLeft: 8 }}>Recommendation</Subheading>
              </View>
              
              <View style={styles.nextWorkoutContent}>
                <View style={styles.recommendationMetrics}>
                  <View style={styles.recommendationMetric}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {nextWorkout.sets}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Sets</Text>
                  </View>
                  
                  <View style={styles.recommendationMetric}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {nextWorkout.reps}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Reps</Text>
                  </View>
                  
                  <View style={styles.recommendationMetric}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {nextWorkout.weight}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Weight</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.logButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setEditingSet(nextWorkout);
                    setLogModalVisible(true);
                  }}
                >
                  <Text style={styles.logButtonText}>Log Workout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Exercise Info Panel */}
          <View style={styles.sectionContainer}>
            <Heading style={{ color: colors.text, marginBottom: 16 }}>About this Exercise</Heading>
            
            <View style={styles.exerciseInfoGrid}>
              {/* Equipment */}
              <View style={styles.infoCard}>
                <View style={[styles.infoIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Ionicons name="barbell-outline" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Equipment</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{exercise.equipment}</Text>
              </View>
              
              {/* Difficulty */}
              <View style={styles.infoCard}>
                <View style={[styles.infoIconContainer, { backgroundColor: `${colors.warning}20` }]}>
                  <Ionicons name="speedometer-outline" size={24} color={colors.warning} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Difficulty</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{exercise.difficulty}</Text>
              </View>
              
              {/* Suggested Rep Range */}
              <View style={styles.infoCard}>
                <View style={[styles.infoIconContainer, { backgroundColor: `${colors.success}20` }]}>
                  <Ionicons name="repeat-outline" size={24} color={colors.success} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Rep Range</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {goalRepRange ? `${goalRepRange.min}-${goalRepRange.max}` : 'N/A'}
                </Text>
              </View>
              
              {/* Set Range */}
              <View style={styles.infoCard}>
                <View style={[styles.infoIconContainer, { backgroundColor: `${colors.info}20` }]}>
                  <Ionicons name="layers-outline" size={24} color={colors.info} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Sets</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {goalRepRange ? goalRepRange.sets : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Muscle Groups */}
          <View style={styles.sectionContainer}>
            <Heading style={{ color: colors.text, marginBottom: 16 }}>Muscles Targeted</Heading>
            
            <View>
              <View style={styles.muscleGroup}>
                <View style={styles.muscleGroupHeader}>
                  <Text style={[styles.muscleGroupTitle, { color: colors.text }]}>Primary</Text>
                </View>
                <View style={styles.muscleList}>
                  {primaryMuscles.map(muscle => (
                    <View key={muscle.id} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{muscle.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              {secondaryMuscles.length > 0 && (
                <View style={styles.muscleGroup}>
                  <View style={styles.muscleGroupHeader}>
                    <Text style={[styles.muscleGroupTitle, { color: colors.text }]}>Secondary</Text>
                  </View>
                  <View style={styles.muscleList}>
                    {secondaryMuscles.map(muscle => (
                      <View key={muscle.id} style={[styles.muscleTag, { backgroundColor: `${colors.secondary}30` }]}>
                        <Text style={[styles.muscleTagText, { color: colors.secondary }]}>{muscle.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
          
          {/* Instructions */}
          <View style={styles.sectionContainer}>
            <Heading style={{ color: colors.text, marginBottom: 16 }}>Instructions</Heading>
            <Body style={{ color: colors.text, lineHeight: 22 }}>{exercise.instructions}</Body>
          </View>
          
          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <View style={styles.sectionContainer}>
              <Heading style={{ color: colors.text, marginBottom: 16 }}>Tips</Heading>
              <View style={styles.tipsList}>
                {exercise.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                    <Body style={{ color: colors.text, flex: 1 }}>{tip}</Body>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
        
        {/* Progress Section */}
        {sortedHistory.length > 0 && (
          <Animated.View 
            style={[
              styles.contentContainer, 
              { 
                backgroundColor: colors.backgroundSecondary, 
                marginTop: 16,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                shadowColor: colors.shadow,
              }
            ]}
          >
            <View style={styles.historyHeader}>
              <Heading style={{ color: colors.text }}>Your Progress</Heading>
              <View style={styles.timeRangeSelectors}>
                <TouchableOpacity
                  style={[
                    styles.timeRangeButton,
                    timeRange === '7' && { backgroundColor: `${colors.primary}20` },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTimeRange('7');
                  }}
                >
                  <Text
                    style={[
                      styles.timeRangeText,
                      { color: timeRange === '7' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    7d
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.timeRangeButton,
                    timeRange === '30' && { backgroundColor: `${colors.primary}20` },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTimeRange('30');
                  }}
                >
                  <Text
                    style={[
                      styles.timeRangeText,
                      { color: timeRange === '30' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    30d
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.timeRangeButton,
                    timeRange === 'all' && { backgroundColor: `${colors.primary}20` },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTimeRange('all');
                  }}
                >
                  <Text
                    style={[
                      styles.timeRangeText,
                      { color: timeRange === 'all' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Metric selectors */}
            <View style={styles.metricSelectors}>
              <TouchableOpacity
                style={[
                  styles.metricButton,
                  chartMetric === 'volume' && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setChartMetric('volume');
                }}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    { color: chartMetric === 'volume' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Volume
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.metricButton,
                  chartMetric === 'weight' && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setChartMetric('weight');
                }}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    { color: chartMetric === 'weight' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Weight
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.metricButton,
                  chartMetric === 'reps' && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setChartMetric('reps');
                }}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    { color: chartMetric === 'reps' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Reps
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Chart */}
            {sortedHistory.length >= 2 ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: sortedHistory.map(entry => 
                      new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    ),
                    datasets: [
                      {
                        data: sortedHistory.map(entry => {
                          if (chartMetric === 'volume') {
                            // Volume = weight * reps * sets
                            return entry.sets.reduce(
                              (sum, set) => sum + (set.weight * set.reps),
                              0
                            );
                          } else if (chartMetric === 'weight') {
                            // Max weight from all sets
                            return Math.max(...entry.sets.map(set => set.weight));
                          } else if (chartMetric === 'reps') {
                            // Total reps from all sets
                            return entry.sets.reduce(
                              (sum, set) => sum + set.reps,
                              0
                            );
                          }
                        }),
                      },
                    ],
                  }}
                  width={Dimensions.get('window').width - 40}
                  height={220}
                  yAxisLabel={chartMetric === 'weight' ? '' : ''}
                  yAxisSuffix={chartMetric === 'weight' ? ' lb' : ''}
                  chartConfig={{
                    backgroundColor: colors.backgroundSecondary,
                    backgroundGradientFrom: colors.backgroundSecondary,
                    backgroundGradientTo: colors.backgroundSecondary,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(${darkMode ? '10, 132, 255' : '0, 122, 255'}, ${opacity})`,
                    labelColor: (opacity = 1) => colors.textSecondary,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: colors.primary,
                    },
                  }}
                  style={styles.chart}
                  bezier
                />
              </View>
            ) : (
              <View style={styles.notEnoughDataContainer}>
                <Ionicons name="analytics-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.notEnoughDataText, { color: colors.textSecondary }]}>
                  Log at least two workouts to see progress chart
                </Text>
              </View>
            )}
            
            {/* History List */}
            <View style={styles.historyListContainer}>
              <Subheading style={{ color: colors.text, marginBottom: 12 }}>History</Subheading>
              
              {sortedHistory.slice().reverse().map((entry, index) => (
                <View key={index} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.historyItemHeader}>
                    <Text style={[styles.historyDate, { color: colors.text }]}>
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingSet({
                          sets: entry.sets.length,
                          reps: entry.sets[0]?.reps,
                          weight: entry.sets[0]?.weight,
                          date: entry.date
                        });
                        setLogModalVisible(true);
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.setsList}>
                    {entry.sets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.setItem}>
                        <View style={styles.setNumber}>
                          <Text style={[styles.setNumberText, { color: colors.text }]}>
                            {setIndex + 1}
                          </Text>
                        </View>
                        <Text style={[styles.setText, { color: colors.text }]}>
                          {set.reps} reps × {set.weight} lb
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              
              {sortedHistory.length === 0 && (
                <View style={styles.noHistoryContainer}>
                  <Ionicons name="fitness-outline" size={40} color={colors.textTertiary} />
                  <Text style={[styles.noHistoryText, { color: colors.textSecondary }]}>
                    No history found for this timeframe
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
        
        {/* Related Exercises */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              backgroundColor: colors.backgroundSecondary,
              marginTop: 16,
              marginBottom: 24,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Heading style={{ color: colors.text, marginBottom: 16 }}>Similar Exercises</Heading>
          <View style={styles.relatedExercisesContainer}>
            {exercise.relatedExercises && exercise.relatedExercises.length > 0 ? (
              exercise.relatedExercises.map(relatedId => {
                const relatedExercise = getExerciseById(relatedId);
                if (!relatedExercise) return null;
                
                return (
                  <TouchableOpacity
                    key={relatedId}
                    style={[styles.relatedExerciseCard, { backgroundColor: colors.background }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.push('ExerciseDetail', { exerciseId: relatedId });
                    }}
                  >
                    <View style={styles.relatedExerciseImageContainer}>
                      {relatedExercise.image ? (
                        <Image
                          source={relatedExercise.image}
                          style={styles.relatedExerciseImage}
                        />
                      ) : (
                        <View style={[styles.relatedExercisePlaceholder, { backgroundColor: `${colors.primary}20` }]}>
                          <Ionicons name="barbell-outline" size={24} color={colors.primary} />
                        </View>
                      )}
                    </View>
                    <Text 
                      style={[styles.relatedExerciseName, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {relatedExercise.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noRelatedContainer}>
                <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.noRelatedText, { color: colors.textSecondary }]}>
                  No similar exercises found
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.ScrollView>
      
      {/* Bottom Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setLogModalVisible(true);
        }}
      >
        <Ionicons name="add-outline" size={24} color="#FFFFFF" />
        <Text style={styles.floatingButtonText}>Log Workout</Text>
      </TouchableOpacity>
      
      {/* Modal for logging workout */}
      <WorkoutLogModal
        visible={logModalVisible}
        onClose={() => {
          setLogModalVisible(false);
          setEditingSet(null);
        }}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
        initialValues={editingSet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    width: 250,
    alignSelf: 'center',
  },
  exerciseNameContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  exerciseCategoryContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  scrollContainer: {
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  contentContainer: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextWorkoutContainer: {
    marginBottom: 16,
    borderRadius: 8,
  },
  nextWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendationMetrics: {
    flexDirection: 'row',
  },
  recommendationMetric: {
    marginRight: 20,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  logButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  exerciseInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoCard: {
    width: '48%',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  muscleGroup: {
    marginBottom: 16,
  },
  muscleGroupHeader: {
    marginBottom: 8,
  },
  muscleGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  muscleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleTag: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  muscleTagText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRangeSelectors: {
    flexDirection: 'row',
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricSelectors: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    marginRight: 8,
  },
  metricButtonText: {
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  notEnoughDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  notEnoughDataText: {
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 220,
  },
  historyListContainer: {
    marginTop: 8,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontWeight: '600',
  },
  editButton: {
    padding: 4,
  },
  setsList: {
    marginLeft: 8,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  setNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  setText: {
    fontSize: 15,
  },
  noHistoryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noHistoryText: {
    marginTop: 12,
  },
  relatedExercisesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  relatedExerciseCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  relatedExerciseImageContainer: {
    height: 100,
    overflow: 'hidden',
  },
  relatedExerciseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  relatedExercisePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedExerciseName: {
    padding: 12,
    fontWeight: '500',
  },
  noRelatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    width: '100%',
  },
  noRelatedText: {
    marginTop: 12,
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ExerciseDetailScreen;