import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
  ImageStyle,
  Dimensions
} from 'react-native';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { ExerciseContext } from '../context/ExerciseContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {Theme, Spacing, BorderRadius, createElevation} from '../constants/Theme';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import {formatDistance} from 'date-fns';
// UI Components
import { 
  Text, 
  Button, 
  Card, 
  Container, 
  FadeIn,
  ProgressBar
} from '../components/ui';
// Types
import { RootStackParamList } from '../navigation/NavigationTypes';
import { UserData, WorkoutSet, WeightLogEntry } from '../types/data';
// Define types for icon names
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
// Custom animation
const SlideIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
    >
      {children}
    </Animated.View>
  );
};
// Achievement type
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: IoniconsName;
  color: string;
}
// Screen params type
type FriendProfileScreenRouteProp = RouteProp<RootStackParamList, 'FriendProfileScreen'>;
type FriendProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FriendProfileScreen'>;
// Define types for Friend data
interface FriendProfile {
  id: string;
  username: string;
  profilePic?: string;
  joinDate: string;
  stats: {
    workouts: number;
    streak: number;
    followers: number;
    following: number;
  };
  bio?: string;
  isFollowing: boolean;
  recentActivity?: Activity[];
  sharedWorkouts?: SharedWorkout[];
  firestoreSets?: WorkoutSet[];
  firestoreWeightLog?: WeightLogEntry[];
}

interface Activity {
  id: string;
  type: 'workout' | 'achievement' | 'follow';
  date: string;
  description: string;
  details?: any;
}

interface SharedWorkout {
  id: string;
  name: string;
  date: string;
  exerciseCount: number;
  duration: number;
  muscleGroups: string[];
}

const FriendProfileScreen: React.FC = () => {
  const navigation = useNavigation<FriendProfileScreenNavigationProp>();
  const route = useRoute<FriendProfileScreenRouteProp>();
  const { userId } = route.params;
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ExerciseContext);
  const { width } = Dimensions.get('window');
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [180, 100],
    extrapolate: 'clamp'
  });
  // Theme
  const theme = darkMode ? Theme.dark : Theme.light;
  // Custom colors
  const customColors = {
    textLight: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.2)'
  };
  useEffect(() => {
    loadFriendProfile();
  }, []);
  async function loadFriendProfile() {
    setLoading(true);
    if (!user) return;
    try {
      const ref = doc(db, 'users', userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as UserData;
        setFriendProfile(data as FriendProfile);
        generateAchievements(data);
      } else {
        Alert.alert('Error', 'Friend profile not found.');
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error loading friend profile:", error);
      Alert.alert('Error', 'Failed to load friend profile.');
    } finally {
      setLoading(false);
    }
  }
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendProfile();
    setRefreshing(false);
  };
  const generateAchievements = (data: UserData) => {
    const newAchievements: Achievement[] = [];
    // Check for workout consistency
    if (data.firestoreSets && data.firestoreSets.length > 10) {
      newAchievements.push({
        id: 'workout-10',
        title: 'Dedicated Athlete',
        description: 'Logged 10+ workouts',
        icon: 'trophy-outline',
        color: theme.warning
      });
    }
    if (data.firestoreSets && data.firestoreSets.length > 20) {
      newAchievements.push({
        id: 'workout-20',
        title: 'Fitness Warrior',
        description: 'Logged 20+ workouts',
        icon: 'medal-outline',
        color: theme.primary
      });
    }
    // Check for weight logging consistency
    if (data.firestoreWeightLog && data.firestoreWeightLog.length > 5) {
      newAchievements.push({
        id: 'weight-tracking',
        title: 'Progress Tracker',
        description: 'Consistently tracking weight',
        icon: 'trending-up',
        color: theme.success
      });
    }
    // Heavy lifter achievement (simplified example)
    const heavyLift = data.firestoreSets && data.firestoreSets.find((set: WorkoutSet) => set.weight > 200);
    if (heavyLift) {
      newAchievements.push({
        id: 'heavy-lifter',
        title: 'Heavy Lifter',
        description: 'Lifted over 200 lbs',
        icon: 'barbell-outline',
        color: theme.accent1
      });
    }
    setAchievements(newAchievements);
  };
  const celebrateAchievement = () => {
    setShowCelebration(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  };
  const renderWorkoutItem = ({ item, index }: { item: WorkoutSet; index: number }) => {
    return (
      <SlideIn delay={index * 50}>
        <Card 
          category="workout"
          style={styles.workoutCard}
          accentColor={theme.primary}
        >
          <View style={styles.workoutHeader}>
            <View style={[styles.exerciseTypeIcon, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="barbell-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.workoutDetails}>
              <Text 
                variant="subtitle" 
                style={{ color: theme.text }}
              >
                {item.exerciseName}
              </Text>
              <Text 
                variant="caption" 
                style={{ color: theme.textSecondary }}
              >
                {formatRelativeTime(item.date)}
              </Text>
            </View>
          </View>
          <View style={styles.workoutStats}>
            <View style={styles.statItem}>
              <Text variant="caption" style={{ color: theme.textTertiary }}>Sets</Text>
              <Text variant="body" style={{ color: theme.text, fontWeight: "600" as const }}>
                {item.sets}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="caption" style={{ color: theme.textTertiary }}>Reps</Text>
              <Text variant="body" style={{ color: theme.text, fontWeight: "600" as const }}>
                {item.reps}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="caption" style={{ color: theme.textTertiary }}>Weight</Text>
              <Text variant="body" style={{ color: theme.text, fontWeight: "600" as const }}>
                {item.weight}lbs
              </Text>
            </View>
          </View>
        </Card>
      </SlideIn>
    );
  };
  const renderWeightLogItem = ({ item, index }: { item: WeightLogEntry; index: number }) => {
    // Calculate weight change from previous entry
    const weightChange = item.change ?? 0;
    return (
      <SlideIn delay={index * 50}>
        <Card 
          category="stats"
          style={styles.weightCard}
        >
          <View style={styles.weightHeader}>
            <Text 
              variant="subtitle" 
              style={{ color: theme.text }}
            >
              {item.weight} lbs
            </Text>
            <Text 
              variant="caption" 
              style={{ color: theme.textSecondary }}
            >
              {formatRelativeTime(item.date)}
            </Text>
          </View>
          {weightChange !== 0 && (
            <View style={styles.weightChange}>
              <Ionicons 
                name={weightChange > 0 ? 'arrow-up' : 'arrow-down'} 
                size={14} 
                color={weightChange > 0 ? theme.warning : theme.success} 
              />
              <Text 
                variant="caption"
                style={{ 
                  color: weightChange > 0 ? theme.warning : theme.success,
                  fontWeight: "600" as const,
                  marginLeft: 4
                }}
              >
                {Math.abs(weightChange)} lbs
              </Text>
            </View>
          )}
        </Card>
      </SlideIn>
    );
  };
  return (
    <Container>
      {loading ? (
        <FadeIn>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </FadeIn>
      ) : friendProfile ? (
        <>
          <Animated.View
            style={[
              styles.header,
              {
                height: headerHeight,
                backgroundColor: theme.primary,
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: customColors.overlay }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={customColors.textLight} />
            </TouchableOpacity>
            <View style={styles.profileImageContainer}>
              {friendProfile.profilePic ? (
                <Image
                  source={{ uri: friendProfile.profilePic }}
                  style={styles.profileImage as ImageStyle}
                />
              ) : (
                <View style={[styles.profileImage, { backgroundColor: theme.accent1 }]}>
                  <Text style={styles.profileInitial}>
                    {friendProfile.username ? friendProfile.username.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text variant="heading2" style={{ color: customColors.textLight }}>
                {friendProfile.username || 'Gym Friend'}
              </Text>
              <Text 
                variant="body"
                style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 }}
              >
                {friendProfile.bio ? friendProfile.bio : 'Fitness Enthusiast'}
              </Text>
            </View>
            <View style={styles.socialActions}>
              <Button
                title="Message"
                type="secondary"
                size="small"
                icon="chatbubble-outline"
                onPress={() => Alert.alert('Message', 'Messaging feature coming soon!')}
                style={{ marginRight: Spacing.sm }}
              />
              <Button
                title="Challenge"
                type="secondary"
                size="small"
                icon="trophy-outline"
                onPress={() => Alert.alert('Challenge', 'Challenge your friend to a workout!')}
              />
            </View>
          </Animated.View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 200, paddingBottom: 20 }}
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
                tintColor={theme.primary}
              />
            }
          >
            {/* Comparison Stats Section */}
            <FadeIn>
              <View style={styles.section}>
                <Text variant="heading3" style={{ color: theme.text, marginBottom: Spacing.md }}>
                  Comparison Stats
                </Text>
                <Card 
                  category="stats"
                  style={styles.statsCard}
                >
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonColumn}>
                      <Text variant="caption" style={{ color: theme.textSecondary }}>
                        Your Workouts
                      </Text>
                      <Text variant="heading3" style={{ color: theme.text }}>
                        {(user as any)?.firestoreSets?.length ?? 0}
                      </Text>
                    </View>
                    <View style={[styles.vsCircle, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={{ color: theme.primary, fontWeight: "700" as const }}>VS</Text>
                    </View>
                    <View style={styles.comparisonColumn}>
                      <Text variant="caption" style={{ color: theme.textSecondary }}>
                        Their Workouts
                      </Text>
                      <Text variant="heading3" style={{ color: theme.text }}>
                        {friendProfile.stats.workouts}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonColumn}>
                      <Text variant="caption" style={{ color: theme.textSecondary }}>
                        Your Streak
                      </Text>
                      <Text variant="heading3" style={{ color: theme.text }}>
                        {(user as any)?.streak ?? 0}
                      </Text>
                    </View>
                    <View style={[styles.vsCircle, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={{ color: theme.primary, fontWeight: "700" as const }}>VS</Text>
                    </View>
                    <View style={styles.comparisonColumn}>
                      <Text variant="caption" style={{ color: theme.textSecondary }}>
                        Their Streak
                      </Text>
                      <Text variant="heading3" style={{ color: theme.text }}>
                        {friendProfile.stats.streak}
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            </FadeIn>
            {/* Achievements Section */}
            <FadeIn delay={100}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="heading3" style={{ color: theme.text }}>
                    Achievements
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.primary }}>
                    {achievements.length} Badges
                  </Text>
                </View>
                {achievements.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.achievementsContainer}
                  >
                    {achievements.map((achievement, index) => (
                      <SlideIn key={achievement.id} delay={index * 100}>
                        <Card 
                          category="achievement"
                          style={styles.achievementCard}
                        >
                          <View style={[styles.achievementIconCircle, { backgroundColor: achievement.color + '30' }]}>
                            <Ionicons name={achievement.icon} size={24} color={achievement.color} />
                          </View>
                          <Text 
                            variant="subtitle" 
                            style={{ 
                              color: theme.text,
                              fontWeight: "600" as const,
                              marginBottom: 4,
                              textAlign: 'center' 
                            }}
                          >
                            {achievement.title}
                          </Text>
                          <Text 
                            variant="caption" 
                            style={{ 
                              color: theme.textSecondary,
                              textAlign: 'center' 
                            }}
                          >
                            {achievement.description}
                          </Text>
                        </Card>
                      </SlideIn>
                    ))}
                  </ScrollView>
                ) : (
                  <Card style={styles.emptyStateCard}>
                    <Ionicons name="trophy-outline" size={40} color={theme.textSecondary} />
                    <Text 
                      variant="body"
                      style={{ 
                        color: theme.textSecondary, 
                        marginTop: Spacing.md,
                        textAlign: 'center' 
                      }}
                    >
                      No achievements yet
                    </Text>
                  </Card>
                )}
              </View>
            </FadeIn>
            {/* Recent Workouts Section */}
            <FadeIn delay={200}>
              <View style={styles.section}>
                <Text variant="heading3" style={{ color: theme.text, marginBottom: Spacing.md }}>
                  Recent Workouts
                </Text>
                {friendProfile.firestoreSets && friendProfile.firestoreSets.length > 0 ? (
                  <FlatList
                    data={friendProfile.firestoreSets.slice(0, 5)}
                    renderItem={renderWorkoutItem}
                    keyExtractor={(item, index) => `workout-${index}`}
                    scrollEnabled={false}
                  />
                ) : (
                  <Card style={styles.emptyStateCard}>
                    <Ionicons name="barbell-outline" size={40} color={theme.textSecondary} />
                    <Text 
                      variant="body"
                      style={{ 
                        color: theme.textSecondary, 
                        marginTop: Spacing.md,
                        textAlign: 'center' 
                      }}
                    >
                      No workouts logged yet
                    </Text>
                  </Card>
                )}
              </View>
            </FadeIn>
            {/* Weight Progress Section (if available) */}
            {friendProfile.firestoreWeightLog && friendProfile.firestoreWeightLog.length > 0 && (
              <FadeIn delay={300}>
                <View style={styles.section}>
                  <Text variant="heading3" style={{ color: theme.text, marginBottom: Spacing.md }}>
                    Weight Progress
                  </Text>
                  <FlatList
                    data={friendProfile.firestoreWeightLog.slice(0, 3)}
                    renderItem={renderWeightLogItem}
                    keyExtractor={(item, index) => `weight-${index}`}
                    scrollEnabled={false}
                  />
                </View>
              </FadeIn>
            )}
          </ScrollView>
          {/* Celebration Animation */}
          {showCelebration && (
            <View style={styles.celebrationOverlay}>
              <LottieView
                source={require('../../assets/animations/confetti.json')}
                autoPlay
                loop={false}
                style={styles.celebration}
              />
            </View>
          )}
        </>
      ) : (
        <FadeIn>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={theme.danger} />
            <Text 
              variant="title"
              style={{ 
                color: theme.text,
                marginTop: Spacing.md,
                marginBottom: Spacing.md,
                textAlign: 'center'
              }}
            >
              Friend profile not found
            </Text>
            <Button 
              title="Go Back"
              type="primary"
              onPress={() => navigation.goBack()}
            />
          </View>
        </FadeIn>
      )}
    </Container>
  );
};
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: Spacing.md,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: Spacing.md,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginTop: 50,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: '#fff',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  socialActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  section: {
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statsCard: {
    padding: Spacing.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  comparisonColumn: {
    flex: 1,
    alignItems: 'center',
  },
  vsCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  achievementsContainer: {
    paddingVertical: Spacing.sm,
  },
  achievementCard: {
    width: 140,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  achievementIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyStateCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightCard: {
    marginBottom: Spacing.sm,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  celebration: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  workoutCard: {
    marginBottom: Spacing.sm,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  exerciseTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  weightHeader: {
    flex: 1,
  },
  weightChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
export default FriendProfileScreen; 