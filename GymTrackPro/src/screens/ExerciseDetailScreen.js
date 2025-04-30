// src/screens/ExerciseDetailScreen.js
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
import { useNavigation, useRoute } from '@react-navigation/native';
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
  SlideIn,
  CircleProgress
} from '../components/ui';
import { Colors, Theme, Typography, Spacing, BorderRadius } from '../constants/Theme';

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
    darkMode,
    getRelatedExercises
  } = useContext(ExerciseContext);
  const exercise = getExerciseById(exerciseId);
  const insets = useSafeAreaInsets();
  const theme = darkMode ? Theme.dark : Theme.light;
  const { width } = Dimensions.get('window');

  // States for logging and history
  const [logModalVisible, setLogModalVisible] = useState(logWorkout || false);
  const [editingSet, setEditingSet] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({
    weight: { value: 0, date: null },
    reps: { value: 0, date: null },
    volume: { value: 0, date: null }
  });
  const [nextWorkout, setNextWorkout] = useState(null);

  // States for progress filtering & chart
  const [timeRange, setTimeRange] = useState('30'); // options: '7', '30', '90', 'all'
  const [chartMetric, setChartMetric] = useState('weight'); // options: 'weight', 'reps', 'volume'
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedExercises, setRelatedExercises] = useState([]);
  
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

  useEffect(() => {
    async function loadExerciseData() {
      try {
        if (!exercise) return;
        
        // Load exercise history
        const history = await DatabaseService.getExerciseHistory(exerciseId);
        setExerciseHistory(history);

        // Calculate personal records
        const records = calculatePersonalRecords(history);
        setPersonalRecords(records);
        
        // Get next workout recommendation
        const recommendation = await DatabaseService.calculateNextWorkout(exerciseId);
        setNextWorkout(recommendation);
        
        // Get related exercises
        const related = getRelatedExercises(exerciseId);
        setRelatedExercises(related);
        
        // Update chart data
        updateChartData(history, chartMetric, timeRange);
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
  const calculatePersonalRecords = (history) => {
    if (!history || history.length === 0) {
      return {
        weight: { value: 0, date: null },
        reps: { value: 0, date: null },
        volume: { value: 0, date: null }
      };
    }
    
    let records = {
      weight: { value: 0, date: null },
      reps: { value: 0, date: null },
      volume: { value: 0, date: null }
    };
    
    history.forEach(session => {
      // Find max weight for a single set
      const maxWeightSet = session.sets.reduce((max, set) => 
        (set.weight > max.weight) ? set : max, { weight: 0 });
      
      if (maxWeightSet.weight > records.weight.value) {
        records.weight = { 
          value: maxWeightSet.weight, 
          date: session.date 
        };
      }
      
      // Find max reps for a single set
      const maxRepsSet = session.sets.reduce((max, set) => 
        (set.reps > max.reps) ? set : max, { reps: 0 });
      
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
  const updateChartData = (history, metric, range) => {
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
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    
    // Generate data points based on the selected metric
    let labels = [];
    let data = [];
    
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
  const getFilteredHistory = (history, range) => {
    if (!history) return [];
    
    const now = new Date();
    if (range === 'all') {
      return history;
    }
    
    return history.filter(entry => {
      const entryDate = new Date(entry.date);
      const daysDiff = (now - entryDate) / (1000 * 3600 * 24);
      return daysDiff <= Number(range);
    });
  };
  
  // Get formatted label for the selected metric
  const getMetricLabel = (metric) => {
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
  const primaryMuscles = exercise?.primaryMuscles?.map(id => getMuscleInfo(id)) || [];
  const secondaryMuscles = exercise?.secondaryMuscles?.map(id => getMuscleInfo(id)) || [];
  const goalRepRange =
    exercise?.repRanges?.find(range => range.goal === userGoal) || exercise?.repRanges?.[0];

  // Toggle favorite with haptic feedback
  const handleToggleFavorite = () => {
    if (isFavorite(exercise.id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    toggleFavorite(exercise.id);
  };

  // Handle log workout
  const handleLogWorkout = () => {
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

  if (isLoading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <FadeIn>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
            <Text variant="body" style={styles.loadingText}>
              Loading exercise details...
            </Text>
          </FadeIn>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      {/* Hero Section with Animated Header */}
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
          {exercise.image ? (
            <ImageBackground 
              source={exercise.image} 
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
                style={styles.gradient}
              />
            </ImageBackground>
          ) : (
            <View style={styles.backgroundImage}>
              <View style={styles.placeholderImageContainer}>
                <Ionicons name="barbell-outline" size={80} color="rgba(255,255,255,0.4)" />
              </View>
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
                style={styles.gradient}
              />
            </View>
          )}
        </Animated.View>
        
        {/* Header Controls */}
        <View style={[styles.headerControls, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </BlurView>
          </TouchableOpacity>
          
          <Animated.Text 
            style={[
              styles.headerTitle, 
              { 
                opacity: headerTitleOpacity,
                color: theme.text,
              }
            ]}
            numberOfLines={1}
          >
            {exercise.name}
          </Animated.Text>
          
          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareExercise}
            >
              <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                <Ionicons name="share-outline" size={22} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleToggleFavorite}
            >
              <BlurView intensity={80} tint="dark" style={styles.blurButton}>
                <Ionicons
                  name={isFavorite(exercise.id) ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite(exercise.id) ? Colors.accentDanger : '#FFF'}
                />
              </BlurView>
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
          <Text variant="pageTitle" style={styles.exerciseName}>
            {exercise.name}
          </Text>
          <View style={styles.exerciseCategoryContainer}>
            <Text style={styles.exerciseCategory}>
              {exercise.category || exercise.primaryMuscles?.[0] || 'Exercise'}
            </Text>
            <View style={styles.difficultyContainer}>
              <Text style={styles.difficulty}>
                {exercise.difficulty || 'All Levels'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
      
      {/* Content */}
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: HEADER_MAX_HEIGHT - 40 }
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Main Content Cards */}
        <SlideIn direction="up" delay={100}>
          <Card style={styles.mainCard}>
            {/* Personal Records Section */}
            <View style={styles.recordsSection}>
              <Text variant="cardTitle" style={styles.sectionTitle}>Personal Records</Text>
              <View style={styles.recordsGrid}>
                <View style={styles.recordCard}>
                  <CircleProgress 
                    size={70} 
                    progress={personalRecords.weight.value > 0 ? 1 : 0}
                    strokeWidth={4}
                    progressColor={Colors.primaryBlue}
                  />
                  <Text variant="cardTitle" style={styles.recordValue}>
                    {personalRecords.weight.value > 0 ? personalRecords.weight.value : '-'}
                  </Text>
                  <Text variant="caption" style={styles.recordLabel}>Max Weight</Text>
                  {personalRecords.weight.date && (
                    <Text variant="caption" style={styles.recordDate}>
                      {format(new Date(personalRecords.weight.date), 'MMM d, yyyy')}
                    </Text>
                  )}
                </View>
                
                <View style={styles.recordCard}>
                  <CircleProgress 
                    size={70} 
                    progress={personalRecords.reps.value > 0 ? 1 : 0} 
                    strokeWidth={4}
                    progressColor={Colors.secondaryGreen}
                  />
                  <Text variant="cardTitle" style={styles.recordValue}>
                    {personalRecords.reps.value > 0 ? personalRecords.reps.value : '-'}
                  </Text>
                  <Text variant="caption" style={styles.recordLabel}>Max Reps</Text>
                  {personalRecords.reps.date && (
                    <Text variant="caption" style={styles.recordDate}>
                      {format(new Date(personalRecords.reps.date), 'MMM d, yyyy')}
                    </Text>
                  )}
                </View>
                
                <View style={styles.recordCard}>
                  <CircleProgress 
                    size={70} 
                    progress={personalRecords.volume.value > 0 ? 1 : 0}
                    strokeWidth={4}
                    progressColor={Colors.accentWarning}
                  />
                  <Text variant="cardTitle" style={styles.recordValue}>
                    {personalRecords.volume.value > 0 ? personalRecords.volume.value : '-'}
                  </Text>
                  <Text variant="caption" style={styles.recordLabel}>Max Volume</Text>
                  {personalRecords.volume.date && (
                    <Text variant="caption" style={styles.recordDate}>
                      {format(new Date(personalRecords.volume.date), 'MMM d, yyyy')}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            
            {/* Muscles Section */}
            <View style={styles.musclesSection}>
              <Text variant="cardTitle" style={styles.sectionTitle}>Muscles Targeted</Text>
              
              <View style={styles.muscleGroups}>
                <View style={styles.muscleGroup}>
                  <Text variant="body" style={styles.muscleGroupLabel}>Primary</Text>
                  <View style={styles.muscleChips}>
                    {primaryMuscles.length > 0 ? (
                      primaryMuscles.map((muscle, index) => (
                        <View key={index} style={styles.muscleChip}>
                          <Text style={styles.muscleChipText}>{muscle.name}</Text>
                        </View>
                      ))
                    ) : (
                      <Text variant="body" style={styles.noDataText}>No primary muscles specified</Text>
                    )}
                  </View>
                </View>
                
                {secondaryMuscles.length > 0 && (
                  <View style={styles.muscleGroup}>
                    <Text variant="body" style={styles.muscleGroupLabel}>Secondary</Text>
                    <View style={styles.muscleChips}>
                      {secondaryMuscles.map((muscle, index) => (
                        <View key={index} style={[styles.muscleChip, styles.secondaryMuscleChip]}>
                          <Text style={[styles.muscleChipText, styles.secondaryMuscleText]}>
                            {muscle.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Card>
        </SlideIn>
        
        {/* Description Section */}
        <SlideIn direction="up" delay={200}>
          <Card style={styles.descriptionCard}>
            <Text variant="cardTitle" style={styles.sectionTitle}>Description</Text>
            <Text variant="body" style={styles.descriptionText}>
              {exercise.instructions || exercise.description || 'No description available for this exercise.'}
            </Text>
            
            {/* Technique Tips Section */}
            {exercise.tips && exercise.tips.length > 0 && (
              <View style={styles.tipsSection}>
                <Text variant="cardTitle" style={styles.sectionTitle}>Technique Tips</Text>
                <View style={styles.tipsList}>
                  {exercise.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <View style={styles.tipBullet} />
                      <Text variant="body" style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        </SlideIn>
        
        {/* Progress Chart Section */}
        {exerciseHistory.length > 0 && (
          <SlideIn direction="up" delay={300}>
            <Card style={styles.chartCard}>
              <Text variant="cardTitle" style={styles.sectionTitle}>Your Progress</Text>
              
              {/* Chart Time Range */}
              <View style={styles.chartControls}>
                <View style={styles.timeRangeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      timeRange === '7' && styles.activeTimeRange
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTimeRange('7');
                    }}
                  >
                    <Text style={[
                      styles.timeRangeText,
                      timeRange === '7' && styles.activeTimeRangeText
                    ]}>
                      Week
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      timeRange === '30' && styles.activeTimeRange
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTimeRange('30');
                    }}
                  >
                    <Text style={[
                      styles.timeRangeText,
                      timeRange === '30' && styles.activeTimeRangeText
                    ]}>
                      Month
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      timeRange === 'all' && styles.activeTimeRange
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTimeRange('all');
                    }}
                  >
                    <Text style={[
                      styles.timeRangeText,
                      timeRange === 'all' && styles.activeTimeRangeText
                    ]}>
                      All time
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Metric Toggles */}
                <View style={styles.metricToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.metricButton,
                      chartMetric === 'weight' && styles.activeMetric
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setChartMetric('weight');
                    }}
                  >
                    <Text style={[
                      styles.metricText,
                      chartMetric === 'weight' && styles.activeMetricText
                    ]}>
                      Weight
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.metricButton,
                      chartMetric === 'reps' && styles.activeMetric
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setChartMetric('reps');
                    }}
                  >
                    <Text style={[
                      styles.metricText,
                      chartMetric === 'reps' && styles.activeMetricText
                    ]}>
                      Reps
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.metricButton,
                      chartMetric === 'volume' && styles.activeMetric
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setChartMetric('volume');
                    }}
                  >
                    <Text style={[
                      styles.metricText,
                      chartMetric === 'volume' && styles.activeMetricText
                    ]}>
                      Volume
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* The Chart */}
              {chartData && exerciseHistory.length > 1 ? (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={chartData}
                    width={width - 48}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    withInnerLines={false}
                    withOuterLines={true}
                    withDots={true}
                    withShadow={false}
                    fromZero={true}
                  />
                </View>
              ) : (
                <View style={styles.noChartDataContainer}>
                  <Ionicons 
                    name="analytics-outline" 
                    size={48} 
                    color={theme.textSecondary} 
                  />
                  <Text variant="body" style={styles.noChartDataText}>
                    Need more data to show progress chart
                  </Text>
                  <Text variant="caption" style={styles.noChartDataSubtext}>
                    Log at least two workouts to see your progress
                  </Text>
                </View>
              )}
            </Card>
          </SlideIn>
        )}
        
        {/* Related Exercises */}
        {relatedExercises.length > 0 && (
          <SlideIn direction="up" delay={400}>
            <Card style={styles.relatedCard}>
              <Text variant="cardTitle" style={styles.sectionTitle}>Similar Exercises</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedExercisesScroll}
              >
                {relatedExercises.map(relatedId => {
                  const relatedExercise = getExerciseById(relatedId);
                  if (!relatedExercise) return null;
                  
                  return (
                    <TouchableOpacity
                      key={relatedId}
                      style={styles.relatedExerciseCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.push('ExerciseDetail', { exerciseId: relatedId });
                      }}
                    >
                      {relatedExercise.image ? (
                        <Image
                          source={relatedExercise.image}
                          style={styles.relatedExerciseImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.relatedExercisePlaceholder}>
                          <Ionicons 
                            name="barbell-outline" 
                            size={28} 
                            color={Colors.primaryBlue} 
                          />
                        </View>
                      )}
                      <View style={styles.relatedExerciseInfo}>
                        <Text 
                          variant="body" 
                          style={styles.relatedExerciseName}
                          numberOfLines={2}
                        >
                          {relatedExercise.name}
                        </Text>
                        <Text 
                          variant="caption" 
                          style={styles.relatedExerciseTarget}
                          numberOfLines={1}
                        >
                          {relatedExercise.primaryMuscles?.[0] || 'Exercise'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Card>
          </SlideIn>
        )}
      </Animated.ScrollView>
      
      {/* Log Workout Button */}
      <FadeIn delay={500}>
        <TouchableOpacity
          style={styles.logWorkoutButton}
          onPress={handleLogWorkout}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primaryBlue, Colors.primaryDarkBlue]}
            style={styles.logWorkoutGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
          >
            <Ionicons name="add-outline" size={22} color="#FFFFFF" />
            <Text style={styles.logWorkoutText}>Log Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </FadeIn>
      
      {/* Workout Log Modal */}
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
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: Theme.light.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    color: Colors.secondaryTextLight
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
    paddingHorizontal: Spacing.lg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
    overflow: 'hidden',
  },
  blurButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    width: 250,
    alignSelf: 'center',
  },
  exerciseNameContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  exerciseName: {
    fontSize: Typography.pageTitle,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  exerciseCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  exerciseCategory: {
    fontSize: Typography.body,
    color: '#FFFFFF',
    fontWeight: Typography.medium,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  difficultyContainer: {
    marginLeft: Spacing.sm,
  },
  difficulty: {
    fontSize: Typography.caption,
    color: '#FFFFFF',
    fontWeight: Typography.medium,
    backgroundColor: 'rgba(46, 203, 112, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  scrollContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // Extra space for the floating button
  },
  mainCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: Theme.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  descriptionCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: Theme.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  chartCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: Theme.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  relatedCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl,
    shadowColor: Theme.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    color: Colors.primaryTextLight,
  },
  recordsSection: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  recordsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  recordCard: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordValue: {
    position: 'absolute',
    fontWeight: Typography.bold,
    color: Colors.primaryTextLight,
  },
  recordLabel: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    color: Colors.secondaryTextLight,
  },
  recordDate: {
    marginTop: 2,
    fontSize: Typography.small,
    color: Colors.secondaryTextLight,
  },
  musclesSection: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  muscleGroups: {
    gap: Spacing.md,
  },
  muscleGroup: {
    marginBottom: Spacing.md,
  },
  muscleGroupLabel: {
    fontWeight: Typography.medium,
    marginBottom: Spacing.sm,
    color: Colors.primaryTextLight,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  muscleChip: {
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  muscleChipText: {
    color: Colors.primaryBlue,
    fontWeight: Typography.medium,
  },
  secondaryMuscleChip: {
    backgroundColor: 'rgba(93, 107, 138, 0.1)',
  },
  secondaryMuscleText: {
    color: Colors.secondaryTextLight,
  },
  noDataText: {
    color: Colors.secondaryTextLight,
    fontStyle: 'italic',
  },
  descriptionText: {
    lineHeight: 22,
    color: Colors.primaryTextLight,
  },
  tipsSection: {
    marginTop: Spacing.lg,
  },
  tipsList: {
    marginTop: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryBlue,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
    color: Colors.primaryTextLight,
  },
  chartControls: {
    marginBottom: Spacing.lg,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  timeRangeButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
  },
  activeTimeRange: {
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
  },
  timeRangeText: {
    color: Colors.secondaryTextLight,
    fontWeight: Typography.medium,
  },
  activeTimeRangeText: {
    color: Colors.primaryBlue,
  },
  metricToggleContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 2,
  },
  metricButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  activeMetric: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  metricText: {
    color: Colors.secondaryTextLight,
    fontWeight: Typography.medium,
  },
  activeMetricText: {
    color: Colors.primaryTextLight,
  },
  chartWrapper: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: BorderRadius.lg,
  },
  noChartDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    padding: Spacing.xl,
  },
  noChartDataText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    color: Colors.secondaryTextLight,
    fontWeight: Typography.medium,
  },
  noChartDataSubtext: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    color: Colors.secondaryTextLight,
  },
  relatedExercisesScroll: {
    paddingBottom: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  relatedExerciseCard: {
    width: 160,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Theme.light.background,
    shadowColor: Theme.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  relatedExerciseImage: {
    width: '100%',
    height: 100,
  },
  relatedExercisePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(10, 108, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedExerciseInfo: {
    padding: Spacing.md,
  },
  relatedExerciseName: {
    fontWeight: Typography.medium,
    marginBottom: 2,
    color: Colors.primaryTextLight,
  },
  relatedExerciseTarget: {
    color: Colors.secondaryTextLight,
  },
  logWorkoutButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: Spacing.lg,
    right: Spacing.lg,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: Spacing.lg,
  },
  logWorkoutText: {
    color: '#FFFFFF',
    fontWeight: Typography.semibold,
    fontSize: Typography.body,
    marginLeft: Spacing.sm,
  },
  placeholderImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExerciseDetailScreen;