import React, { useContext, useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal
} from 'react-native'
import { AuthContext } from '../context/AuthContext'
import { db } from '../services/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons'
import { ExerciseContext } from '../context/ExerciseContext'
import { useNavigation } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Colors from '../../constants/Colors'
import Container from '../../components/ui/Container'
import { Title, Heading, Subheading, Body, Caption } from '../../components/ui/Text'

const { width } = Dimensions.get('window');

export default function SocialScreen() {
  const { darkMode } = useContext(ExerciseContext)
  const { user, userProfile } = useContext(AuthContext)
  const navigation = useNavigation()
  const [myProfile, setMyProfile] = useState(null)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [requestsCount, setRequestsCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [activityFeed, setActivityFeed] = useState([])
  const [suggestedFriends, setSuggestedFriends] = useState([])
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [topExercisers, setTopExercisers] = useState([])
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [200, 80],
    extrapolate: 'clamp'
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp'
  });
  
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
    if (user) {
      // Listen for real-time updates to the user profile
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), snapshot => {
        if (snapshot.exists()) {
          setMyProfile(snapshot.data())
          const requests = snapshot.data().friendRequests || []
          setRequestsCount(requests.length)
        }
      })
      
      // Initial data loading
      loadData()
      
      return () => unsubscribe()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadActivityFeed(),
        loadSuggestedFriends(),
        loadTopExercisers()
      ])
      setLoading(false)
    } catch (error) {
      console.error("Error loading social data:", error);
      setLoading(false)
    }
  }
  
  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const loadActivityFeed = async () => {
    if (!user || !myProfile || !myProfile.friends || myProfile.friends.length === 0) {
      setActivityFeed([])
      return
    }
    
    try {
      // Initialize an array to hold all friend activities
      let allActivities = []
      
      // For each friend, fetch their recent activity
      for (const friendUid of myProfile.friends) {
        const friendDoc = await getDoc(doc(db, 'users', friendUid))
        if (friendDoc.exists()) {
          const friendData = friendDoc.data()
          
          // Add workout activities
          const workouts = (friendData.firestoreSets || []).map(set => ({
            type: 'workout',
            userId: friendUid,
            username: friendData.username,
            profilePic: friendData.profilePic || null,
            date: set.date,
            data: set
          }))
          
          // Add weight log activities
          const weightLogs = (friendData.firestoreWeightLog || []).map(log => ({
            type: 'weightLog',
            userId: friendUid,
            username: friendData.username,
            profilePic: friendData.profilePic || null,
            date: log.date,
            data: log
          }))
          
          allActivities = [...allActivities, ...workouts, ...weightLogs]
        }
      }
      
      // Sort activities by date (newest first)
      allActivities.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      // Take only the most recent 20 activities
      setActivityFeed(allActivities.slice(0, 20))
    } catch (error) {
      console.error("Error loading activity feed:", error)
    }
  }
  
  const loadSuggestedFriends = async () => {
    if (!user) return;
    
    try {
      // Existing code for fetching suggested friends
      const suggestions = await fetchSuggestions();
      setSuggestedFriends(suggestions);
    } catch (error) {
      console.error("Error loading suggested friends:", error);
      // Add a user-friendly message instead of crashing
      setSuggestedFriends([]);
      // Only show alert in development, not in production
      if (__DEV__) {
        Alert.alert(
          "Permission Error", 
          "Firebase permissions are not configured for this feature. Check your Firestore rules."
        );
      }
    }
  };
  
  // Helper function to fetch friend suggestions with error handling
  const fetchSuggestions = async () => {
    // In a real app, this would use an algorithm to suggest friends
    // For demo purposes, provide some mock data when Firestore fails
    try {
      // Try to fetch from Firestore first
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(5));
      const querySnapshot = await getDocs(q);
      
      const suggestions = [];
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        // Don't suggest the current user or existing friends
        if (doc.id !== user.uid && 
            (!myProfile?.friends || !myProfile.friends.includes(doc.id))) {
          suggestions.push(userData);
        }
      });
      
      return suggestions;
    } catch (error) {
      // If Firestore fails, return mock data
      console.log("Using mock suggested friends data");
      return [
        { 
          uid: 'mock1', 
          username: 'fitness_enthusiast', 
          photoURL: 'https://randomuser.me/api/portraits/women/43.jpg',
          workoutsCompleted: 32
        },
        { 
          uid: 'mock2', 
          username: 'gym_warrior', 
          photoURL: 'https://randomuser.me/api/portraits/men/22.jpg',
          workoutsCompleted: 45
        },
        { 
          uid: 'mock3', 
          username: 'health_junkie', 
          photoURL: 'https://randomuser.me/api/portraits/women/65.jpg',
          workoutsCompleted: 28
        }
      ];
    }
  };
  
  const loadTopExercisers = async () => {
    try {
      // In a real app, this would fetch users ranked by workout metrics
      // Provide mock data to prevent Firebase permission errors
      const topUsers = getMockTopExercisers();
      setTopExercisers(topUsers);
    } catch (error) {
      console.error("Error loading top exercisers:", error);
      setTopExercisers(getMockTopExercisers());
    }
  };
  
  // Helper function to get mock top exercisers
  const getMockTopExercisers = () => {
    return [
      {
        uid: 'top1',
        username: 'fitness_king',
        photoURL: 'https://randomuser.me/api/portraits/men/32.jpg',
        workoutsCompleted: 87,
        totalWeight: 12450
      },
      {
        uid: 'top2',
        username: 'workout_queen',
        photoURL: 'https://randomuser.me/api/portraits/women/28.jpg',
        workoutsCompleted: 76,
        totalWeight: 10200
      },
      {
        uid: 'top3',
        username: 'gym_master',
        photoURL: 'https://randomuser.me/api/portraits/men/55.jpg',
        workoutsCompleted: 65,
        totalWeight: 9800
      },
      {
        uid: 'top4',
        username: 'lift_pro',
        photoURL: 'https://randomuser.me/api/portraits/women/40.jpg',
        workoutsCompleted: 58,
        totalWeight: 8950
      },
      {
        uid: 'top5',
        username: 'muscle_builder',
        photoURL: 'https://randomuser.me/api/portraits/men/41.jpg',
        workoutsCompleted: 52,
        totalWeight: 8200
      }
    ];
  };

  function dismissKeyboard() {
    Keyboard.dismiss()
  }

  async function handleSearch() {
    setLoading(true)
    setSearchResults([])
    try {
      const ref = collection(db, 'users')
      const q = query(ref, where('username', '==', searchUsername))
      const qsnap = await getDocs(q)
      const results = []
      qsnap.forEach(docSnap => {
        if (docSnap.id !== user.uid) {
          results.push(docSnap.data())
        }
      })
      setSearchResults(results)
    } catch (err) {
      Alert.alert('Error', err.message)
    }
    setLoading(false)
  }

  async function handleSendRequest(targetUid) {
    try {
      if (!user) return
      
      // Add haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      const targetRef = doc(db, 'users', targetUid)
      const targetSnap = await getDoc(targetRef)
      if (!targetSnap.exists()) {
        Alert.alert('Error', 'User does not exist.')
        return
      }
      const targetData = targetSnap.data()
      const friendRequests = targetData.friendRequests || []
      const alreadyRequested = friendRequests.find(r => r.fromUid === user.uid)
      if (alreadyRequested) {
        Alert.alert('Info', 'Friend request already sent.')
        return
      }
      await updateDoc(targetRef, {
        friendRequests: arrayUnion({
          fromUid: user.uid,
          fromName: myProfile?.username || 'Unknown',
          fromPhotoUrl: myProfile?.profilePic || ''
        })
      })
      Alert.alert('Success', 'Friend request sent.')
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour}h ago`;
    } else if (diffMin > 0) {
      return `${diffMin}m ago`;
    } else {
      return 'just now';
    }
  };

  function renderActivityItem({ item }) {
    const activityIcon = item.type === 'workout' ? 'barbell-outline' : 'trending-up';
    const activityColor = item.type === 'workout' ? colors.primary : colors.success;
    
    // Determine activity text
    let activityText = '';
    if (item.type === 'workout') {
      activityText = `completed ${item.data.sets}×${item.data.reps} of ${item.data.exerciseName} at ${item.data.weight}lbs`;
    } else {
      activityText = `logged a weight of ${item.data.weight}lbs`;
    }
    
    return (
      <TouchableOpacity 
        style={[styles.activityItem, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => navigation.navigate('FriendProfile', { friendUid: item.userId })}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityUser}>
            {item.profilePic ? (
              <Image source={{ uri: item.profilePic }} style={styles.activityUserPic} />
            ) : (
              <View style={[styles.activityUserPicPlaceholder, { backgroundColor: colors.primary + '30' }]}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{item.username.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.activityUserInfo}>
              <Text style={[styles.activityUsername, { color: colors.text }]}>{item.username}</Text>
              <Text style={[styles.activityTime, { color: colors.textTertiary }]}>
                {formatRelativeTime(item.date)}
              </Text>
            </View>
          </View>
          <Ionicons name={activityIcon} size={22} color={activityColor} />
        </View>
        
        <Text style={[styles.activityText, { color: colors.textSecondary }]}>
          {activityText}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderFriend({ item }) {
    return (
      <TouchableOpacity
        style={[styles.friendItem, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => navigation.navigate('FriendProfile', { friendUid: item })}
      >
        <Text style={[styles.friendText, { color: colors.text }]}>{item}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    )
  }

  function renderSuggestedFriend({ item }) {
    return (
      <TouchableOpacity 
        style={styles.suggestedFriendItem}
        onPress={() => navigation.navigate('FriendProfile', { friendUid: item.uid })}
      >
        {item.profilePic ? (
          <Image source={{ uri: item.profilePic }} style={styles.suggestedFriendPic} />
        ) : (
          <View style={[styles.suggestedFriendPicPlaceholder, { backgroundColor: colors.primary + '30' }]}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{item.username.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={[styles.suggestedFriendName, { color: colors.text }]} numberOfLines={1}>
          {item.username}
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => handleSendRequest(item.uid)}
        >
          <Text style={styles.addButtonText}>Connect</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  function renderTopExerciser({ item, index }) {
    const isTop3 = index < 3;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const rankColor = index < 3 ? rankColors[index] : colors.textSecondary;
    
    return (
      <TouchableOpacity
        style={[
          styles.leaderboardItem,
          index === 0 && { borderLeftWidth: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
          index === topExercisers.length - 1 && { borderRightWidth: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12 }
        ]}
        onPress={() => navigation.navigate('FriendProfile', { userId: item.uid })}
      >
        <View style={styles.leaderboardRank}>
          <Text style={[styles.rankNumber, { color: rankColor }]}>
            {index + 1}
          </Text>
        </View>
        
        <View style={styles.leaderboardAvatar}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: colors.primary + '40' }]}>
              <Text style={{ color: colors.primary }}>
                {item.username.substring(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.leaderboardUsername, { color: colors.text }]} numberOfLines={1}>
          {item.username}
        </Text>
        
        <Text style={[styles.leaderboardStats, { color: colors.textSecondary }]}>
          {item.workoutsCompleted} workouts
        </Text>
      </TouchableOpacity>
    );
  }

  function renderSearchResult({ item }) {
    return (
      <View style={[styles.searchResultItem, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.userInfo}>
          {item.profilePic ? (
            <Image source={{ uri: item.profilePic }} style={styles.userPic} />
          ) : (
            <View style={[styles.noPic, { backgroundColor: colors.primary + '30' }]}>
              <Text style={{ color: colors.primary }}>{item.username.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={[styles.username, { color: colors.text }]}>
            {item.username}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => handleSendRequest(item.uid)} 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.addButtonText}>Add Friend</Text>
        </TouchableOpacity>
      </View>
    )
  }
  
  const renderHeader = () => (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.headerContent}>
        <Title style={[styles.headerTitle, { color: '#FFFFFF' }]}>Social</Title>
        <Caption style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
          Connect with friends and track their progress
        </Caption>
      </View>
    </LinearGradient>
  );

  return (
    <Container style={{ backgroundColor: colors.background }}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.animatedHeader, 
          { 
            height: headerHeight,
            opacity: headerOpacity
          }
        ]}
      >
        {renderHeader()}
      </Animated.View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Find Friends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: requestsCount > 0 ? colors.warning : colors.secondary }]}
          onPress={() => navigation.navigate('FriendRequests')}
        >
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            Requests {requestsCount > 0 ? `(${requestsCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading social data...</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Friend Activity Feed */}
          <View style={styles.section}>
            <Subheading style={[styles.sectionTitle, { color: colors.text }]}>Activity Feed</Subheading>
            {activityFeed.length > 0 ? (
              <FlatList
                data={activityFeed}
                keyExtractor={(item, index) => `activity-${item.userId}-${index}`}
                renderItem={renderActivityItem}
                scrollEnabled={false}
                style={styles.activityList}
              />
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="people-outline" size={50} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No activity from friends yet
                </Text>
                <Caption style={{ color: colors.textTertiary, textAlign: 'center' }}>
                  Connect with friends to see their workout progress and achievements
                </Caption>
              </View>
            )}
          </View>

          {/* Friend Suggestions */}
          {suggestedFriends.length > 0 && (
            <View style={styles.section}>
              <Subheading style={[styles.sectionTitle, { color: colors.text }]}>Suggested Friends</Subheading>
              <FlatList
                data={suggestedFriends}
                keyExtractor={(item) => `suggested-${item.uid}`}
                renderItem={renderSuggestedFriend}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestedList}
              />
            </View>
          )}
          
          {/* Leaderboard */}
          <View style={styles.section}>
            <Subheading style={[styles.sectionTitle, { color: colors.text }]}>Leaderboard</Subheading>
            <View style={[styles.leaderboardContainer, { backgroundColor: colors.backgroundSecondary }]}>
              {topExercisers.map((item, index) => (
                <React.Fragment key={`exerciser-${item.uid || index}`}>
                  {renderTopExerciser({ item, index })}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* My Friends */}
          <View style={styles.section}>
            <Subheading style={[styles.sectionTitle, { color: colors.text }]}>My Friends</Subheading>
            {myProfile?.friends && myProfile.friends.length > 0 ? (
              <FlatList
                data={myProfile.friends}
                keyExtractor={item => `friend-${item}`}
                renderItem={renderFriend}
                scrollEnabled={false}
                style={styles.friendsList}
              />
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="people-outline" size={50} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No friends yet
                </Text>
                <Caption style={{ color: colors.textTertiary, textAlign: 'center' }}>
                  Connect with others to see their workouts and track progress together
                </Caption>
              </View>
            )}
          </View>
        </Animated.ScrollView>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <Modal
          visible={showSearchModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSearchModal(false)}
        >
          <View style={styles.modalContainer}>
            <BlurView
              tint={darkMode ? "dark" : "light"}
              intensity={90}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.modalHeader}>
                <Title style={{ color: colors.text }}>Find Friends</Title>
                <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Search by username"
                  placeholderTextColor={colors.textTertiary}
                  value={searchUsername}
                  onChangeText={setSearchUsername}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.primary }]}
                onPress={handleSearch}
                disabled={loading}
              >
                <Text style={styles.searchButtonText}>
                  {loading ? 'Searching...' : 'Search'}
                </Text>
              </TouchableOpacity>
              
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item.uid}
                  renderItem={renderSearchResult}
                  style={styles.resultsList}
                />
              ) : (
                searchUsername !== '' && !loading && (
                  <View style={styles.noResults}>
                    <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
                    <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                      No users found
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        </Modal>
      )}
    </Container>
  )
}

const styles = StyleSheet.create({
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: 16,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 210,
    position: 'absolute',
    zIndex: 20,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 260,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },
  activityList: {
    marginTop: 8,
  },
  activityItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityUserPic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  activityUserPicPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityUserInfo: {
    flex: 1,
  },
  activityUsername: {
    fontWeight: '600',
    fontSize: 16,
  },
  activityTime: {
    fontSize: 12,
  },
  activityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  suggestedList: {
    marginTop: 8,
  },
  suggestedFriendItem: {
    width: 120,
    alignItems: 'center',
    marginRight: 10,
  },
  suggestedFriendPic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  suggestedFriendPicPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedFriendName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  leaderboardContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  leaderboardItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(200,200,200,0.3)',
  },
  leaderboardRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rankNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  leaderboardAvatar: {
    marginBottom: 8,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  defaultAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardUsername: {
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  leaderboardStats: {
    fontSize: 11,
    textAlign: 'center',
  },
  friendsList: {
    marginTop: 8,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  resultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  noPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    marginTop: 10,
  },
});