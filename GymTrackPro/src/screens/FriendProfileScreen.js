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
  
  const renderAchievementItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.achievementCard, { backgroundColor: colors.backgroundSecondary }]}
        onPress={celebrateAchievement}
      >
        <View style={[styles.achievementIconCircle, { backgroundColor: item.color + '30' }]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Caption style={{ color: colors.textSecondary }}>
            {item.description}
          </Caption>
        </View>
      </TouchableOpacity>
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

  if (loading && !refreshing) {
    return (
      <Container style={{ backgroundColor: colors.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </Container>
    )
  }

  return (
    <Container style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            height: headerHeight,
            backgroundColor: colors.backgroundSecondary
          }
        ]}
      >
        <View style={styles.profileInfo}>
          {friendData?.profilePic ? (
            <Image source={{ uri: friendData.profilePic }} style={styles.profilePic} />
          ) : (
            <View style={[styles.noPic, { backgroundColor: colors.primary + '30' }]}>
              <Text style={{ color: colors.primary, fontSize: 24, fontWeight: 'bold' }}>
                {friendData?.username?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Title style={[styles.username, { color: colors.text }]}>
            {friendData?.username}
          </Title>
          <Caption style={{ color: colors.textSecondary }}>
            {friendData?.firestoreSets?.length || 0} workouts · {friendData?.firestoreWeightLog?.length || 0} weigh-ins
          </Caption>
        </View>
      </Animated.View>
      
      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
            colors={[colors.primary]}
          />
        }
      >
        {/* Achievements Section */}
        {achievements.length > 0 && (
          <View style={styles.section}>
            <Subheading style={[styles.sectionTitle, { color: colors.text }]}>
              Achievements
            </Subheading>
            <FlatList
              data={achievements}
              keyExtractor={(item) => item.id}
              renderItem={renderAchievementItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.achievementsList}
            />
          </View>
        )}
        
        {/* Recent Workouts */}
        <View style={styles.section}>
          <Subheading style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Workouts
          </Subheading>
          {friendData?.firestoreSets && friendData.firestoreSets.length > 0 ? (
            <FlatList
              data={friendData.firestoreSets.slice(0, 5)}
              keyExtractor={(item, index) => `workout-${index}`}
              renderItem={renderWorkoutItem}
              scrollEnabled={false}
            />
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No workout data yet
              </Text>
            </View>
          )}
        </View>

        {/* Weight Log */}
        <View style={styles.section}>
          <Subheading style={[styles.sectionTitle, { color: colors.text }]}>
            Weight Log
          </Subheading>
          {friendData?.firestoreWeightLog && friendData.firestoreWeightLog.length > 0 ? (
            <FlatList
              data={friendData.firestoreWeightLog.slice(0, 5)}
              keyExtractor={(item, index) => `weight-${index}`}
              renderItem={renderWeightLogItem}
              scrollEnabled={false}
            />
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="trending-up" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No weight logs yet
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>
      
      {/* Celebration animation */}
      {showCelebration && (
        <View style={styles.celebrationContainer}>
          <LottieView
            source={require('../../assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={styles.celebration}
          />
        </View>
      )}
    </Container>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 190,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12
  },
  noPic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  username: {
    fontWeight: '600'
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  achievementsList: {
    marginVertical: 8,
  },
  achievementCard: {
    padding: 12,
    borderRadius: 16,
    marginRight: 12,
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontWeight: '600',
    fontSize: 14,
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
  emptyContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  celebrationContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 999,
  },
  celebration: {
    width: '100%',
    height: '100%',
  }
})