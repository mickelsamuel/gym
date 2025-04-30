import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  FlatList,
  Animated,
  Platform,
  Pressable,
  SafeAreaView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';
import { AuthContext } from '../context/AuthContext';
import DatabaseService from '../services/DatabaseService';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { format } from 'date-fns';
import goals from '../data/goals';

// Import our custom UI components from design system
import { 
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
  Button,
  Card,
  Container,
  CircleProgress,
  FadeIn,
  SlideIn 
} from '../components/ui';
import ParallaxScrollView from '../components/ParallaxScrollView';
import { Colors, Theme, Typography, Spacing, BorderRadius } from '../constants/Theme';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
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
    getExerciseStats
  } = useContext(ExerciseContext);

  const [profile, setProfile] = useState(null);
  const [recentExercises, setRecentExercises] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [latestAchievement, setLatestAchievement] = useState(null);
  const [friendsWorkouts, setFriendsWorkouts] = useState([]);
  const [healthSummary, setHealthSummary] = useState({
    steps: 0,
    calories: 0,
    water: 0,
    sleep: 0
  });
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [selectedMetric, setSelectedMetric] = useState('weight'); // 'weight', 'volume', 'reps'
  const confettiAnimation = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
    formatYLabel: (value) => value.toString(),
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
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
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
  const fetchAllUserData = async () => {
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
  const generateDemoHealthData = () => {
    // Demo data for UI presentation
    setHealthSummary({
      steps: Math.floor(Math.random() * 10000) + 2000,
      calories: Math.floor(Math.random() * 500) + 100,
      water: Math.floor(Math.random() * 8) + 1,
      sleep: Math.floor(Math.random() * 3) + 5
    });
  };
  
  // Load progress data based on selected metric and time range
  const loadProgressData = () => {
    // Demo data for progress chart
    let data = [];
    let labels = [];
    
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
  const getMetricName = (metric) => {
    switch (metric) {
      case 'weight': return 'Weight (kg)';
      case 'volume': return 'Volume (kg)';
      case 'reps': return 'Total Reps';
      default: return metric;
    }
  };

  // Calculate workout streak
  const calculateWorkoutStreak = () => {
    // Demo data
    setWorkoutStreak(5);
  };

  // Load user profile
  async function loadProfile() {
    try {
      setProfile(userProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }

  // Load recent exercises
  async function loadRecentExercises() {
    try {
      // In a real app, this would come from your backend
      const recentExerciseIds = recentWorkouts
        .slice(0, 5)
        .flatMap(workout => workout.exercises)
        .slice(0, 8);
      
      const exercises = recentExerciseIds.map(id => getExerciseById(id)).filter(Boolean);
      setRecentExercises(exercises);
    } catch (error) {
      console.error("Error loading recent exercises:", error);
    }
  }

  // Load friends' workouts
  async function loadFriendsWorkouts() {
    try {
      // Demo data - in a real app, this would come from your backend
      const demoFriendsWorkouts = [
        {
          id: '1',
          username: 'sarah_fit',
          name: 'Sarah Johnson',
          workout: 'Upper Body Strength',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
        },
        {
          id: '2',
          username: 'mike_strong',
          name: 'Mike Peterson',
          workout: 'Leg Day',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
        }
      ];
      
      setFriendsWorkouts(demoFriendsWorkouts);
    } catch (error) {
      console.error("Error loading friends workouts:", error);
    }
  }

  // Identify latest achievement for celebration
  const identifyLatestAchievement = () => {
    // Demo achievement - in a real app, this would come from your achievements system
    const achievement = {
      id: '1',
      title: '5-Day Streak',
      description: 'You worked out for 5 days in a row!',
      icon: 'trophy',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      type: 'streak'
    };
    
    setLatestAchievement(achievement);
  };

  // Format relative time for timestamps
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  // Handle goal selection
  const handleGoalSelection = (selectedGoal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGoal(selectedGoal);
    setShowGoalModal(false);
  };

  // Show confetti animation for achievements
  const celebrateAchievement = () => {
    if (confettiAnimation.current) {
      confettiAnimation.current.play();
    }
  };

  // Handle logging a new workout
  const handleLogWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Workout');
  };

  // Render the header section with personalized greeting
  const renderHeader = () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    let greeting = 'Hello';
    if (currentHour < 12) {
      greeting = 'Good morning';
    } else if (currentHour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    const displayName = profile?.displayName || profile?.username || user?.email?.split('@')[0] || 'there';
    
    return (
      <View style={styles.header}>
        <View>
          <Text variant="body" style={styles.greeting}>
            {greeting},
          </Text>
          <Text variant="pageTitle" style={styles.username}>
            {displayName}
          </Text>
          <Text variant="caption" style={styles.date}>
            {format(new Date(), 'EEEE, MMMM d')}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          {profile?.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Ionicons 
                name="person" 
                size={24} 
                color={darkMode ? Colors.darkCardBackground : Colors.lightCardBackground} 
              />
            </View>
          )}
          {/* Notification indicator */}
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render the daily summary card
  const renderDailySummaryCard = () => {
    return (
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text variant="cardTitle">Today's Activity</Text>
            <Text variant="caption" style={styles.summarySubtitle}>
              {workoutStreak > 0 ? `${workoutStreak} day streak 🔥` : 'No current streak'}
            </Text>
          </View>
          
          <Button
            title="Log Workout"
            onPress={handleLogWorkout}
            type="primary"
            size="small"
            icon="add"
          />
        </View>
        
        <View style={styles.healthMetrics}>
          <View style={styles.metricItem}>
            <CircleProgress 
              percentage={75} 
              size={55} 
              strokeWidth={6} 
              color={Colors.primaryBlue}
            />
            <View style={styles.metricText}>
              <Text variant="caption" style={styles.metricLabel}>Steps</Text>
              <Text variant="body" style={styles.metricValue}>{healthSummary.steps.toLocaleString()}</Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <CircleProgress 
              percentage={50} 
              size={55} 
              strokeWidth={6} 
              color={Colors.secondaryGreen}
            />
            <View style={styles.metricText}>
              <Text variant="caption" style={styles.metricLabel}>Calories</Text>
              <Text variant="body" style={styles.metricValue}>{healthSummary.calories}</Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <CircleProgress 
              percentage={30} 
              size={55} 
              strokeWidth={6} 
              color={Colors.accentWarning}
            />
            <View style={styles.metricText}>
              <Text variant="caption" style={styles.metricLabel}>Water</Text>
              <Text variant="body" style={styles.metricValue}>{healthSummary.water}/8</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };
  
  // Render the progress section with chart
  const renderProgressSection = () => {
    if (!progressData) return null;
    
    return (
      <View style={styles.progressSection}>
        <View style={styles.sectionHeader}>
          <Text variant="sectionHeader">Progress</Text>
          
          <View style={styles.timeRangeSelector}>
            {['week', 'month', 'year'].map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeOption,
                  timeRange === range && styles.selectedTimeRange
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTimeRange(range);
                }}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.timeRangeText,
                    timeRange === range && styles.selectedTimeRangeText
                  ]}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <Card style={styles.chartCard}>
          <LineChart
            data={progressData}
            width={width - 60}
            height={180}
            chartConfig={chartConfig}
            bezier
            withDots
            withShadow={false}
            withInnerLines={false}
            withOuterLines={true}
            style={styles.chart}
          />
          
          <View style={styles.metricSelector}>
            {['weight', 'volume', 'reps'].map(metric => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.metricOption,
                  selectedMetric === metric && styles.selectedMetric
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedMetric(metric);
                }}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.metricOptionText,
                    selectedMetric === metric && styles.selectedMetricText
                  ]}
                >
                  {getMetricName(metric)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.keyStats}>
            {selectedMetric === 'weight' && (
              <>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Starting</Text>
                  <Text variant="body" style={styles.keyStatValue}>75 kg</Text>
                </View>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Current</Text>
                  <Text variant="body" style={styles.keyStatValue}>68 kg</Text>
                </View>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Goal</Text>
                  <Text variant="body" style={styles.keyStatValue}>65 kg</Text>
                </View>
              </>
            )}
            
            {selectedMetric === 'volume' && (
              <>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Average</Text>
                  <Text variant="body" style={styles.keyStatValue}>2,400 kg</Text>
                </View>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Max</Text>
                  <Text variant="body" style={styles.keyStatValue}>2,900 kg</Text>
                </View>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Goal</Text>
                  <Text variant="body" style={styles.keyStatValue}>3,000 kg</Text>
                </View>
              </>
            )}
            
            {selectedMetric === 'reps' && (
              <>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Average</Text>
                  <Text variant="body" style={styles.keyStatValue}>45</Text>
                </View>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Max</Text>
                  <Text variant="body" style={styles.keyStatValue}>60</Text>
                </View>
                <View style={styles.keyStat}>
                  <Text variant="caption" style={styles.keyStatLabel}>Goal</Text>
                  <Text variant="body" style={styles.keyStatValue}>75</Text>
                </View>
              </>
            )}
          </View>
        </Card>
      </View>
    );
  };
  
  // Render recent workouts section
  const renderRecentWorkouts = () => {
    if (!recentWorkouts || recentWorkouts.length === 0) return null;
    
    return (
      <View style={styles.recentWorkoutsSection}>
        <View style={styles.sectionHeader}>
          <Text variant="sectionHeader">Recent Workouts</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Workout')}
            activeOpacity={0.7}
          >
            <Text variant="body" style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentWorkoutsScroll}
        >
          {recentWorkouts.slice(0, 5).map((workout, index) => (
            <Card
              key={workout.id || index}
              style={styles.workoutCard}
              onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
              category="workout"
              accentColor={
                workout.category === 'strength' ? Colors.primaryBlue :
                workout.category === 'cardio' ? Colors.secondaryGreen :
                workout.category === 'recovery' ? Colors.accentWarning :
                Colors.primaryDarkBlue
              }
            >
              <View style={styles.workoutCardContent}>
                <View style={styles.workoutTypeIcon}>
                  <Ionicons
                    name={
                      workout.category === 'strength' ? 'barbell-outline' :
                      workout.category === 'cardio' ? 'heart-outline' :
                      workout.category === 'recovery' ? 'water-outline' :
                      'fitness-outline'
                    }
                    size={20}
                    color={
                      workout.category === 'strength' ? Colors.primaryBlue :
                      workout.category === 'cardio' ? Colors.secondaryGreen :
                      workout.category === 'recovery' ? Colors.accentWarning :
                      Colors.primaryDarkBlue
                    }
                  />
                </View>
                
                <Text variant="cardTitle" style={styles.workoutTitle}>
                  {workout.name || 'Unnamed Workout'}
                </Text>
                
                <View style={styles.workoutMeta}>
                  <Text variant="caption" style={styles.workoutMetaText}>
                    {workout.exercises?.length || 0} exercises
                  </Text>
                  <Text variant="caption" style={styles.workoutMetaText}>
                    {workout.duration ? `${workout.duration} min` : '0 min'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.repeatButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('WorkoutLog', { workoutId: workout.id });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="repeat" size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  // Render upcoming section
  const renderUpcoming = () => {
    // Demo data
    const hasUpcoming = Math.random() > 0.5;
    
    if (!hasUpcoming) return null;
    
    return (
      <View style={styles.upcomingSection}>
        <Text variant="sectionHeader">Upcoming</Text>
        
        <Card style={styles.upcomingCard}>
          <View style={styles.upcomingContent}>
            <View style={styles.upcomingTimeContainer}>
              <Text variant="caption" style={styles.upcomingDay}>Tomorrow</Text>
              <Text variant="body" style={styles.upcomingTime}>6:30 AM</Text>
            </View>
            
            <View style={styles.upcomingDetails}>
              <Text variant="cardTitle" style={styles.upcomingTitle}>
                Morning Strength Training
              </Text>
              <Text variant="caption" style={styles.upcomingMeta}>
                45 min • Upper Body
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.notificationToggle, { backgroundColor: theme.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Toggle notification logic
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  };
  
  // Render motivation element
  const renderMotivation = () => {
    // Demo quote - in a real app, this would come from a quotes API or your backend
    const quote = {
      text: "The only bad workout is the one that didn't happen.",
      author: "Unknown"
    };
    
    return (
      <View style={styles.motivationSection}>
        <LinearGradient
          colors={[Colors.primaryBlue, Colors.primaryDarkBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.motivationCard}
        >
          <Text variant="body" style={styles.quoteText}>
            "{quote.text}"
          </Text>
          <Text variant="caption" style={styles.quoteAuthor}>
            — {quote.author}
          </Text>
        </LinearGradient>
      </View>
    );
  };
  
  // Render the main screen
  return (
    <Container>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FadeIn>
          {renderHeader()}
        </FadeIn>
        
        <SlideIn direction="up" delay={100}>
          {renderDailySummaryCard()}
        </SlideIn>
        
        <SlideIn direction="up" delay={200}>
          {renderProgressSection()}
        </SlideIn>
        
        <SlideIn direction="up" delay={300}>
          {renderRecentWorkouts()}
        </SlideIn>
        
        <SlideIn direction="up" delay={400}>
          {renderUpcoming()}
        </SlideIn>
        
        <SlideIn direction="up" delay={500}>
          {renderMotivation()}
        </SlideIn>
        
        {/* Achievement confetti animation */}
        {latestAchievement && (
          <View style={styles.confettiContainer}>
            <LottieView
              ref={confettiAnimation}
              source={require('../../assets/animations/confetti.json')}
              autoPlay={false}
              loop={false}
              style={styles.confetti}
            />
          </View>
        )}
      </ScrollView>
      
      {/* Goal selection modal */}
      {showGoalModal && (
        <BlurView intensity={90} tint={darkMode ? 'dark' : 'light'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text variant="pageTitle" style={styles.modalTitle}>
              Set Your Goal
            </Text>
            <Text variant="body" style={styles.modalDescription}>
              What do you want to focus on in your fitness journey?
            </Text>
            
            <View style={styles.goalOptions}>
              {goals.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalOption}
                  onPress={() => handleGoalSelection(goal.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
                    <Ionicons name={goal.icon} size={24} color="#FFFFFF" />
                  </View>
                  <Text variant="cardTitle" style={styles.goalTitle}>
                    {goal.title}
                  </Text>
                  <Text variant="caption" style={styles.goalDescription}>
                    {goal.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </BlurView>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerGradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: 16,
    paddingBottom: 50,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalsSection: {
    position: 'relative',
  },
  achievementsSection: {
    marginTop: 16,
  },
  healthSummarySection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  goalDescription: {
    marginBottom: 16,
  },
  startButton: {
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 14,
  },
  exerciseCard: {
    width: 150,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
  },
  exerciseIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 12,
  },
  recentExercisesContainer: {
    paddingVertical: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chart: {
    borderRadius: 16,
    paddingRight: 16,
  },
  chartCaption: {
    marginTop: 8,
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  tipText: {
    lineHeight: 20,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    backgroundColor: darkMode => darkMode ? Colors.darkCardBackground : Colors.lightCardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  goalsList: {
    paddingHorizontal: 20,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  goalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalItemText: {
    flex: 1,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    marginTop: 12,
  },
  loader: {
    marginVertical: 20,
  },
  healthMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  healthMetric: {
    alignItems: 'center',
    width: '22%',
  },
  healthMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  healthMetricLabel: {
    fontSize: 12,
  },
  friendActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  friendActivityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,122,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryBlue,
  },
  friendActivityInfo: {
    flex: 1,
  },
  friendName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  friendActivity: {
    fontSize: 14,
  },
  friendActivityTime: {
    fontSize: 12,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
  greeting: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
  },
  username: {
    marginTop: 2,
    marginBottom: 4,
  },
  date: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: darkMode => darkMode ? Colors.primaryDarkBlue : Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accentDanger,
    borderWidth: 2,
    borderColor: darkMode => darkMode ? Colors.darkBackground : Colors.lightBackground,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summarySubtitle: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
    marginTop: 2,
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  metricText: {
    marginLeft: Spacing.sm,
  },
  metricLabel: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
  },
  metricValue: {
    fontWeight: Typography.semibold,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: darkMode => darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  timeRangeOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  selectedTimeRange: {
    backgroundColor: Colors.primaryBlue,
  },
  timeRangeText: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
    fontSize: Typography.small,
  },
  selectedTimeRangeText: {
    color: '#FFFFFF',
    fontWeight: Typography.medium,
  },
  chartCard: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  chart: {
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  metricSelector: {
    flexDirection: 'row',
    marginVertical: Spacing.sm,
  },
  metricOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: darkMode => darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  selectedMetric: {
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
    borderColor: Colors.primaryBlue,
  },
  metricOptionText: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
    fontSize: Typography.small,
  },
  selectedMetricText: {
    color: Colors.primaryBlue,
    fontWeight: Typography.medium,
  },
  keyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
  },
  keyStat: {
    alignItems: 'center',
  },
  keyStatLabel: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
    marginBottom: 2,
  },
  keyStatValue: {
    fontWeight: Typography.semibold,
  },
  recentWorkoutsSection: {
    marginBottom: Spacing.lg,
  },
  seeAllLink: {
    color: Colors.primaryBlue,
  },
  recentWorkoutsScroll: {
    paddingRight: Spacing.md,
  },
  workoutCard: {
    width: 180,
    marginRight: Spacing.md,
    padding: Spacing.md,
  },
  workoutCardContent: {
    position: 'relative',
  },
  workoutTypeIcon: {
    padding: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: darkMode => 
      darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  workoutTitle: {
    marginBottom: 2,
  },
  workoutMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  workoutMetaText: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
    marginRight: Spacing.sm,
  },
  repeatButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    borderRadius: BorderRadius.xs,
  },
  upcomingSection: {
    marginBottom: Spacing.lg,
  },
  upcomingCard: {
    padding: Spacing.md,
  },
  upcomingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingTimeContainer: {
    alignItems: 'center',
    marginRight: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: darkMode => 
      darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    minWidth: 80,
  },
  upcomingDay: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
    marginBottom: 2,
  },
  upcomingTime: {
    fontWeight: Typography.semibold,
  },
  upcomingDetails: {
    flex: 1,
  },
  upcomingTitle: {
    marginBottom: 2,
  },
  upcomingMeta: {
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
  },
  notificationToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  motivationSection: {
    marginBottom: Spacing.lg,
  },
  motivationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  quoteText: {
    color: '#FFFFFF',
    fontWeight: Typography.medium,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  quoteAuthor: {
    color: 'rgba(255,255,255,0.8)',
    alignSelf: 'flex-end',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    textAlign: 'center',
    color: darkMode => darkMode ? Colors.secondaryTextDark : Colors.secondaryTextLight,
    marginBottom: Spacing.lg,
  },
  goalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalOption: {
    width: '48%',
    backgroundColor: darkMode => 
      darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
});