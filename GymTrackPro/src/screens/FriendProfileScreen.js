import React, { useContext, useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { db } from '../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { AuthContext } from '../context/AuthContext'
import { ExerciseContext } from '../context/ExerciseContext'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import LottieView from 'lottie-react-native'
import Container from '../components/ui/Container'
import { Title, Heading, Subheading, Body, Caption } from '../components/ui/Text'
import Button from '../components/ui/Button'
import * as Haptics from 'expo-haptics'
import Card from '../components/ui/Card'

export default function FriendProfileScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { friendUid } = route.params
  const { user } = useContext(AuthContext)
  const { darkMode } = useContext(ExerciseContext)
  const [friendData, setFriendData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [achievements, setAchievements] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [180, 100],
    extrapolate: 'clamp'
  })
  
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

  useEffect(() => {
    loadFriendProfile()
  }, [])

  async function loadFriendProfile() {
    setLoading(true)
    if (!user) return
    
    try {
      const ref = doc(db, 'users', friendUid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data()
        setFriendData(data)
        generateAchievements(data)
      } else {
        Alert.alert('Error', 'Friend profile not found.')
        navigation.goBack()
      }
    } catch (error) {
      console.error("Error loading friend profile:", error)
      Alert.alert('Error', 'Failed to load friend profile.')
    } finally {
      setLoading(false)
    }
  }
  
  const onRefresh = async () => {
    setRefreshing(true)
    await loadFriendProfile()
    setRefreshing(false)
  }
  
  const generateAchievements = (data) => {
    const newAchievements = []
    
    // Check for workout consistency
    if (data.firestoreSets && data.firestoreSets.length > 10) {
      newAchievements.push({
        id: 'workout-10',
        title: 'Dedicated Athlete',
        description: 'Logged 10+ workouts',
        icon: 'trophy-outline',
        color: colors.warning
      })
    }
    
    if (data.firestoreSets && data.firestoreSets.length > 20) {
      newAchievements.push({
        id: 'workout-20',
        title: 'Fitness Warrior',
        description: 'Logged 20+ workouts',
        icon: 'medal-outline',
        color: colors.primary
      })
    }
    
    // Check for weight logging consistency
    if (data.firestoreWeightLog && data.firestoreWeightLog.length > 5) {
      newAchievements.push({
        id: 'weight-tracking',
        title: 'Progress Tracker',
        description: 'Consistently tracking weight',
        icon: 'trending-up',
        color: colors.success
      })
    }
    
    // Heavy lifter achievement (simplified example)
    const heavyLift = data.firestoreSets && data.firestoreSets.find(set => set.weight > 200)
    if (heavyLift) {
      newAchievements.push({
        id: 'heavy-lifter',
        title: 'Heavy Lifter',
        description: 'Lifted over 200 lbs',
        icon: 'barbell-outline',
        color: colors.secondary
      })
    }
    
    setAchievements(newAchievements)
  }
  
  const celebrateAchievement = () => {
    setShowCelebration(true)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTimeout(() => {
      setShowCelebration(false)
    }, 3000)
  }
  
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`
    } else {
      return date.toLocaleDateString()
    }
  }
  
  const renderWorkoutItem = ({ item }) => {
    return (
      <View style={[styles.workoutCard, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.workoutHeader}>
          <View style={[styles.exerciseTypeIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="barbell-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.workoutDetails}>
            <Text style={[styles.workoutTitle, { color: colors.text }]}>
              {item.exerciseName}
            </Text>
            <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>
              {formatRelativeTime(item.date)}
            </Text>
          </View>
        </View>
        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <Caption style={{ color: colors.textTertiary }}>Sets</Caption>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.sets}</Text>
          </View>
          <View style={styles.statItem}>
            <Caption style={{ color: colors.textTertiary }}>Reps</Caption>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.reps}</Text>
          </View>
          <View style={styles.statItem}>
            <Caption style={{ color: colors.textTertiary }}>Weight</Caption>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.weight}lbs</Text>
          </View>
        </View>
      </View>
    )
  }
  
  const renderWeightLogItem = ({ item }) => {
    // Calculate weight change from previous entry
    const weightChange = item.change ?? 0

    return (
      <View style={[styles.weightCard, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.weightHeader}>
          <Text style={[styles.weightValue, { color: colors.text }]}>
            {item.weight} lbs
          </Text>
          <Text style={[styles.weightDate, { color: colors.textSecondary }]}>
            {formatRelativeTime(item.date)}
          </Text>
        </View>
        {weightChange !== 0 && (
          <View style={styles.weightChange}>
            <Ionicons 
              name={weightChange > 0 ? 'arrow-up' : 'arrow-down'} 
              size={14} 
              color={weightChange > 0 ? colors.warning : colors.success} 
            />
            <Text style={[
              styles.changeText, 
              { color: weightChange > 0 ? colors.warning : colors.success }
            ]}>
              {Math.abs(weightChange)} lbs
            </Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <Container>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : friendData ? (
        <>
          <Animated.View
            style={[
              styles.header,
              {
                height: headerHeight,
                backgroundColor: colors.primary,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.profileImageContainer}>
              {friendData.profilePic ? (
                <Image
                  source={{ uri: friendData.profilePic }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.profileInitial}>
                    {friendData.username ? friendData.username.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Heading style={{ color: '#FFF' }}>
                {friendData.username || 'Gym Friend'}
              </Heading>
              
              <Text style={styles.userGoal}>
                {friendData.userGoal ? 
                  `Goal: ${friendData.userGoal.charAt(0).toUpperCase() + friendData.userGoal.slice(1)}` : 
                  'Fitness Enthusiast'}
              </Text>
            </View>
            
            <View style={styles.socialActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
                onPress={() => navigation.navigate('Chat', { friendUid })}
              >
                <Ionicons name="chatbubble-outline" size={18} color={colors.success} />
                <Text style={{ color: colors.success, marginLeft: 4 }}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
                onPress={() => Alert.alert('Challenge', 'Challenge your friend to a workout!')}
              >
                <Ionicons name="trophy-outline" size={18} color={colors.warning} />
                <Text style={{ color: colors.warning, marginLeft: 4 }}>Challenge</Text>
              </TouchableOpacity>
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
                tintColor={colors.primary}
              />
            }
          >
            {/* Comparison Stats Section */}
            <View style={styles.section}>
              <Title style={{ color: colors.text, marginBottom: 16 }}>Comparison Stats</Title>
              <Card style={styles.comparisonCard}>
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonColumn}>
                    <Text style={{ color: colors.textSecondary }}>Your Workouts</Text>
                    <Heading style={{ color: colors.text, fontSize: 28 }}>
                      {user?.firestoreSets?.length || 0}
                    </Heading>
                  </View>
                  
                  <View style={[styles.vsCircle, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>VS</Text>
                  </View>
                  
                  <View style={styles.comparisonColumn}>
                    <Text style={{ color: colors.textSecondary }}>Their Workouts</Text>
                    <Heading style={{ color: colors.text, fontSize: 28 }}>
                      {friendData.firestoreSets?.length || 0}
                    </Heading>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonColumn}>
                    <Text style={{ color: colors.textSecondary }}>Your Streak</Text>
                    <Heading style={{ color: colors.text, fontSize: 28 }}>
                      {user?.streak || 0}
                    </Heading>
                  </View>
                  
                  <View style={[styles.vsCircle, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>VS</Text>
                  </View>
                  
                  <View style={styles.comparisonColumn}>
                    <Text style={{ color: colors.textSecondary }}>Their Streak</Text>
                    <Heading style={{ color: colors.text, fontSize: 28 }}>
                      {friendData.streak || 0}
                    </Heading>
                  </View>
                </View>
              </Card>
            </View>
            
            {/* Achievements Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Title style={{ color: colors.text }}>Achievements</Title>
                <Text style={{ color: colors.primary }}>
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
                    <TouchableOpacity
                      key={achievement.id}
                      style={[styles.achievementCard, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={celebrateAchievement}
                    >
                      <View style={[styles.achievementIconCircle, { backgroundColor: achievement.color + '30' }]}>
                        <Ionicons name={achievement.icon} size={24} color={achievement.color} />
                      </View>
                      <Text style={[styles.achievementTitle, { color: colors.text }]}>
                        {achievement.title}
                      </Text>
                      <Caption style={{ color: colors.textSecondary, textAlign: 'center' }}>
                        {achievement.description}
                      </Caption>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Card style={styles.emptyStateCard}>
                  <Ionicons name="trophy-outline" size={40} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                    No achievements yet
                  </Text>
                </Card>
              )}
            </View>
            
            {/* Recent Workouts Section */}
            <View style={styles.section}>
              <Title style={{ color: colors.text, marginBottom: 16 }}>Recent Workouts</Title>
              
              {friendData.firestoreSets && friendData.firestoreSets.length > 0 ? (
                <FlatList
                  data={friendData.firestoreSets.slice(0, 5)}
                  renderItem={renderWorkoutItem}
                  keyExtractor={(item, index) => `workout-${index}`}
                  scrollEnabled={false}
                />
              ) : (
                <Card style={styles.emptyStateCard}>
                  <Ionicons name="barbell-outline" size={40} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                    No workouts logged yet
                  </Text>
                </Card>
              )}
            </View>
            
            {/* Weight Progress Section (if available) */}
            {friendData.firestoreWeightLog && friendData.firestoreWeightLog.length > 0 && (
              <View style={styles.section}>
                <Title style={{ color: colors.text, marginBottom: 16 }}>Weight Progress</Title>
                <Card style={styles.weightCard}>
                  <FlatList
                    data={friendData.firestoreWeightLog.slice(0, 3)}
                    renderItem={renderWeightLogItem}
                    keyExtractor={(item, index) => `weight-${index}`}
                    scrollEnabled={false}
                  />
                </Card>
              </View>
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Friend profile not found
          </Text>
          <Button 
            style={{ marginTop: 20 }}
            onPress={() => navigation.goBack()}
          >
            Go Back
          </Button>
        </View>
      )}
    </Container>
  );
}

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
    padding: 16,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  userGoal: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  socialActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonCard: {
    padding: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  comparisonColumn: {
    flex: 1,
    alignItems: 'center',
  },
  vsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
  },
  achievementsContainer: {
    paddingVertical: 8,
  },
  achievementCard: {
    width: 140,
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  achievementIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightCard: {
    padding: 0,
    overflow: 'hidden',
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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  workoutCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  workoutDate: {
    fontSize: 12,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  weightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightHeader: {
    flex: 1,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  weightDate: {
    fontSize: 12,
  },
  weightChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});