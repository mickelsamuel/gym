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
import goals from '../data/goals';

// Import our custom UI components
import { Title, Heading, Subheading, Body, Caption } from '../components/ui/Text';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import ParallaxScrollView from '../components/ParallaxScrollView';
import Colors from '../constants/Colors';

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
  const confettiAnimation = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Initialize a default colors object in case the import fails
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
      tabIconDefault: '#C4C4C6',
      tabIconSelected: '#007AFF',
      success: '#28A745',
      warning: '#FF9500',
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
      tabIconDefault: '#515154',
      tabIconSelected: '#0A84FF',
      success: '#33CF4D',
      warning: '#FF9F0A',
      danger: '#FF453A',
      info: '#64D2FF',
      shadow: 'rgba(0,0,0,0.3)',
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = darkMode ? colorScheme.dark : colorScheme.light;

  // Load initial data
  useEffect(() => {
    loadProfile();
    loadRecentExercises();
    identifyLatestAchievement();
    loadFriendsWorkouts();
    calculateWorkoutStreak();
    
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
    
    // Generate random health summary data for demo
    // In a real app, this would come from HealthKit/Google Fit integration
    generateDemoHealthData();
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
    }, [favorites, recentWorkouts])
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
        loadFriendsWorkouts()
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
    // Instead of generating random health data, initialize with zeros
    // In a real app, this would come from HealthKit/Google Fit integration
    setHealthSummary({
      steps: 0,
      calories: 0,
      water: 0,
      sleep: 0
    });
  };

  // Calculate workout streak
  const calculateWorkoutStreak = () => {
    if (!recentWorkouts || recentWorkouts.length === 0) {
      setWorkoutStreak(0);
      return;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort workouts by date (newest first)
    const sortedWorkouts = [...recentWorkouts].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Group workouts by day
    const workoutsByDay = {};
    sortedWorkouts.forEach(workout => {
      const date = new Date(workout.date);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!workoutsByDay[dateStr]) {
        workoutsByDay[dateStr] = true;
      }
    });

    // Count consecutive days
    for (let i = 0; i < 30; i++) { // Check up to 30 days back
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (workoutsByDay[dateStr]) {
        streak++;
      } else if (i > 0) { // Allow current day to be missing
        break;
      }
    }

    setWorkoutStreak(streak);
  };

  async function loadProfile() {
    try {
      const userProfile = await DatabaseService.getProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }

  async function loadRecentExercises() {
    try {
      // Get top 5 favorites
      const recentExerciseIds = favorites.slice(0, 5);
      const exercises = recentExerciseIds.map(id => getExerciseById(id)).filter(Boolean);
      setRecentExercises(exercises);

      // Generate progress chart data for the first favorite exercise
      if (exercises.length > 0) {
        const historyData = await DatabaseService.getExerciseHistory(exercises[0].id);
        if (historyData.length > 0) {
          const sliced = historyData.slice(0, 5);
          const dates = sliced
            .map(entry => {
              const date = new Date(entry.date);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            })
            .reverse();
          const weights = sliced.map(entry => entry.weight).reverse();
          setProgressData({
            labels: dates,
            datasets: [
              {
                data: weights,
                strokeWidth: 2
              }
            ],
            exercise: exercises[0].name
          });
        }
      }
    } catch (error) {
      console.error("Error loading recent exercises:", error);
    }
  }

  // Load friends' recent workouts for social feature
  async function loadFriendsWorkouts() {
    try {
      if (!userProfile || !userProfile.friends || userProfile.friends.length === 0) {
        return;
      }
      
      // In a real app, this would fetch from Firestore
      // For now, generate demo data
      const demoFriends = [
        { id: 'friend1', name: 'John', exercise: 'Bench Press', weight: 185, date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
        { id: 'friend2', name: 'Sarah', exercise: 'Deadlift', weight: 225, date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
        { id: 'friend3', name: 'Mike', exercise: 'Squats', weight: 275, date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
      ];
      
      setFriendsWorkouts(demoFriends);
    } catch (error) {
      console.error("Error loading friends' workouts:", error);
    }
  }

  // Replace this function with one that uses real achievements
  const identifyLatestAchievement = () => {
    // Only set achievement if we have real workout data
    setLatestAchievement(null);
    
    // Check workout streak for a potential achievement
    if (workoutStreak >= 3) {
      setLatestAchievement({
        title: `${workoutStreak} Day Streak!`,
        description: `You've been consistent with your workouts for ${workoutStreak} days.`,
        icon: 'flame',
        color: colors.warning
      });
      
      // Show celebration animation when the achievement is set
      setTimeout(() => {
        celebrateAchievement();
      }, 500);
    }
  };

  // Format relative time for timestamps
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    } else if (diffHr > 0) {
      return `${diffHr}h ago`;
    } else if (diffMin > 0) {
      return `${diffMin}m ago`;
    } else {
      return 'just now';
    }
  };

  // When user completes a goal or achieves something
  const celebrateAchievement = () => {
    if (confettiAnimation.current) {
      confettiAnimation.current.play();
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const goalInfo = userGoal ? getGoalInfo(userGoal) : null;
  const screenWidth = Dimensions.get('window').width - 32;
  
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: opacity => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 1,
    style: {
      borderRadius: 16
    }
  };

  const handleSelectGoal = goalId => {
    setGoal(goalId);
    setShowGoalModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    celebrateAchievement();
  };

  // Render header for parallax effect
  const renderHeader = () => (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <View style={styles.userInfoContainer}>
          <View style={styles.profileImageContainer}>
            {profile?.profilePic ? (
              <Image 
                source={{ uri: profile.profilePic }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="person" size={30} color={colors.text} />
              </View>
            )}
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.welcomeText, { color: '#FFFFFF' }]}>
              Welcome, {profile?.firstName || userProfile?.username || 'Fitness Enthusiast'}!
            </Text>
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
              Let's crush your fitness goals today!
            </Text>
          </View>
        </View>
        
        {workoutStreak > 0 && (
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={24} color="#FF9500" />
            <Text style={styles.streakText}>{workoutStreak} day streak</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <Container style={{ width: '100%' }}>
      <ParallaxScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ width: '100%' }}
        headerComponent={renderHeader()}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ width: '100%', paddingHorizontal: 16 }}>
          {/* Health Summary Section */}
          <View style={[styles.section, styles.healthSummarySection, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <Subheading dark={darkMode}>Today's Activity</Subheading>
              <Ionicons name="pulse" size={18} color={colors.primary} />
            </View>
            
            <View style={styles.healthMetricsContainer}>
              <View style={styles.healthMetric}>
                <Ionicons name="footsteps" size={20} color={colors.primary} />
                <Text style={[styles.healthMetricValue, { color: colors.text }]}>{healthSummary.steps.toLocaleString()}</Text>
                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>Steps</Text>
              </View>
              
              <View style={styles.healthMetric}>
                <Ionicons name="flame" size={20} color={colors.danger} />
                <Text style={[styles.healthMetricValue, { color: colors.text }]}>{healthSummary.calories}</Text>
                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>Calories</Text>
              </View>
              
              <View style={styles.healthMetric}>
                <Ionicons name="water" size={20} color={colors.info} />
                <Text style={[styles.healthMetricValue, { color: colors.text }]}>{healthSummary.water}</Text>
                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>Glasses</Text>
              </View>
              
              <View style={styles.healthMetric}>
                <Ionicons name="bed" size={20} color={colors.secondary} />
                <Text style={[styles.healthMetricValue, { color: colors.text }]}>{healthSummary.sleep}h</Text>
                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>Sleep</Text>
              </View>
            </View>
          </View>

          {/* Achievements Section */}
          {latestAchievement && (
            <View style={[styles.section, styles.achievementsSection, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.achievementHeader}>
                <Ionicons name="trophy" size={20} color={colors.warning} />
                <Subheading dark={darkMode} style={{ marginLeft: 8 }}>
                  Latest Achievement
                </Subheading>
              </View>
              
              <Body dark={darkMode}>
                {latestAchievement.title}
              </Body>
              <Body dark={darkMode}>
                {latestAchievement.description}
              </Body>
            </View>
          )}

          {/* Goals Section */}
          <View style={[styles.section, styles.goalsSection, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <Subheading dark={darkMode}>Your Goal</Subheading>
              {goalInfo && (
                <TouchableOpacity onPress={() => setShowGoalModal(true)}>
                  <Caption dark={darkMode} style={{ color: colors.primary }}>Change</Caption>
                </TouchableOpacity>
              )}
            </View>
            
            <Heading dark={darkMode} style={styles.goalTitle}>
              {goalInfo?.name || 'Not set'}
            </Heading>
            
            <Body dark={darkMode} style={styles.goalDescription}>
              {goalInfo?.description || 'Set your fitness goal to get personalized recommendations'}
            </Body>
            
            {goalInfo && (
              <Button
                title="Start Workout"
                icon="barbell-outline"
                onPress={() => navigation.navigate('Workout')}
                style={styles.startButton}
                dark={darkMode}
              />
            )}
          </View>

          {/* Friends Activity Section */}
          {friendsWorkouts.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.sectionHeader}>
                <Subheading dark={darkMode}>Friends Activity</Subheading>
                <TouchableOpacity onPress={() => navigation.navigate('Social')}>
                  <Caption dark={darkMode} style={{ color: colors.primary }}>View All</Caption>
                </TouchableOpacity>
              </View>
              
              {friendsWorkouts.map((friend) => (
                <TouchableOpacity 
                  key={friend.id}
                  style={styles.friendActivityItem}
                  onPress={() => navigation.navigate('FriendProfile', { friendId: friend.id })}
                >
                  <View style={styles.friendActivityLeft}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendInitial}>{friend.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.friendActivityInfo}>
                      <Text style={[styles.friendName, { color: colors.text }]}>{friend.name}</Text>
                      <Text style={[styles.friendActivity, { color: colors.textSecondary }]}>
                        {friend.exercise} • {friend.weight} lbs
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.friendActivityTime, { color: colors.textTertiary }]}>
                    {formatRelativeTime(friend.date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Exercises Section */}
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <Subheading dark={darkMode}>Recent Exercises</Subheading>
              <TouchableOpacity onPress={() => navigation.navigate('Exercises')}>
                <Caption dark={darkMode} style={{ color: colors.primary }}>See All</Caption>
              </TouchableOpacity>
            </View>
            
            {loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}
            
            {!loading && recentExercises.length > 0 ? (
              <FlatList
                data={recentExercises}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentExercisesContainer}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.exerciseCard, { backgroundColor: colors.background }]}
                    onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
                  >
                    <View style={styles.exerciseIconContainer}>
                      <Ionicons
                        name={item.type === 'cardio' ? 'pulse' : 'barbell'}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <Body dark={darkMode} style={styles.exerciseName} numberOfLines={2}>
                      {item.name}
                    </Body>
                    <Caption dark={darkMode} style={styles.exerciseCategory}>
                      {item.category}
                    </Caption>
                  </TouchableOpacity>
                )}
              />
            ) : !loading ? (
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No favorite exercises yet. Visit the Exercises tab to explore and add favorites.
              </Text>
            ) : null}
          </View>

          {/* Progress Chart Section */}
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <Subheading dark={darkMode}>Your Progress</Subheading>
            </View>
            {progressData && progressData.datasets && progressData.datasets[0].data.length > 0 ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: progressData.labels,
                    datasets: progressData.datasets
                  }}
                  width={screenWidth}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => colors.primary,
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: colors.primary
                    }
                  }}
                  bezier
                  style={styles.chart}
                />
                
                <Caption dark={darkMode} style={styles.chartCaption}>
                  Weight progression over time
                </Caption>
              </View>
            ) : (
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No progress data available yet. Complete workouts to see your progress!
              </Text>
            )}
          </View>

          {/* Nutrition Tips Card */}
          {goalInfo && (
            <Card dark={darkMode}>
              <View style={styles.sectionHeader}>
                <Subheading dark={darkMode}>Nutrition Tips</Subheading>
                <Ionicons name="nutrition" size={18} color={colors.primary} />
              </View>
              
              <Body dark={darkMode} style={styles.tipText}>
                {goalInfo.nutritionTips || 'Stay hydrated and maintain a balanced diet with plenty of protein for recovery.'}
              </Body>
            </Card>
          )}
        </View>
      </ParallaxScrollView>

      {/* Confetti animation for achievements */}
      <View style={styles.confettiContainer} pointerEvents="none">
        <LottieView
          ref={confettiAnimation}
          source={require('../../assets/animations/confetti.json')}
          style={styles.confetti}
          loop={false}
          autoPlay={false}
        />
      </View>

      {/* Goal selection modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <BlurView
            tint={darkMode ? "dark" : "light"}
            intensity={90}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <Title dark={darkMode}>Select Your Goal</Title>
              <Caption dark={darkMode} style={styles.modalSubtitle}>
                Choose a goal to receive personalized workouts
              </Caption>
            </View>
            
            <FlatList
              data={goals}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.goalsList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.goalItem,
                    { 
                      backgroundColor: pressed ? colors.primary + '20' : colors.background,
                      borderColor: userGoal === item.id ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => handleSelectGoal(item.id)}
                >
                  <View style={styles.goalItemContent}>
                    <View style={[styles.goalIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name={item.icon || "barbell"} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.goalItemText}>
                      <Subheading dark={darkMode}>{item.name}</Subheading>
                      <Caption dark={darkMode} numberOfLines={2} style={styles.goalDescription}>
                        {item.shortDescription || item.description}
                      </Caption>
                    </View>
                  </View>
                  {userGoal === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </Pressable>
              )}
            />
            
            <TouchableOpacity 
              style={[styles.cancelButton, { borderTopColor: colors.border }]}
              onPress={() => setShowGoalModal(false)}
            >
              <Body dark={darkMode} style={{ color: colors.danger }}>Cancel</Body>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    width: '100%',
    paddingHorizontal: 16,
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
    flexGrow: 1,
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
    marginBottom: 12,
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
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: height * 0.7,
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
    color: '#007AFF',
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
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
});