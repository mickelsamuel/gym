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
  
  // Transform for header (use translateY instead of height)
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -80],
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
      }, error => {
        console.error("Error getting user profile updates:", error);
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
      setActivityFeed([])
    }
  }
  
  const loadSuggestedFriends = async () => {
    if (!user) return;
    
    try {
      // Get users from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(5));
      const querySnapshot = await getDocs(q);
      
      const suggestions = [];
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        // Don't suggest the current user or existing friends
        if (doc.id !== user.uid && 
            (!myProfile?.friends || !myProfile.friends.includes(doc.id))) {
          suggestions.push({
            id: doc.id,
            ...userData,
          });
        }
      });
      
      setSuggestedFriends(suggestions);
    } catch (error) {
      console.error("Error loading suggested friends:", error);
      setSuggestedFriends([]);
    }
  };
  
  const loadTopExercisers = async () => {
    try {
      // This would typically fetch users with the most workouts/activity
      // For now, we'll just get a few random users from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(3));
      const querySnapshot = await getDocs(q);
      
      const topUsers = [];
      querySnapshot.forEach(doc => {
        if (doc.id !== user?.uid) {
          const userData = doc.data();
          topUsers.push({
            id: doc.id,
            ...userData,
            workoutCount: userData.firestoreSets?.length || 0
          });
        }
      });
      
      setTopExercisers(topUsers);
    } catch (error) {
      console.error("Error loading top exercisers:", error);
      setTopExercisers([]);
    }
  };

  function dismissKeyboard() {
    Keyboard.dismiss()
  }

  async function handleSearch() {
    if (!searchUsername.trim()) {
      Alert.alert('Error', 'Please enter a username to search')
      return
    }
    
    dismissKeyboard()
    setLoading(true)
    
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '>=', searchUsername.trim()), where('username', '<=', searchUsername.trim() + '\uf8ff'))
      const querySnapshot = await getDocs(q)
      
      const results = []
      querySnapshot.forEach(doc => {
        // Don't include current user in search results
        if (doc.id !== user.uid) {
          results.push({
            id: doc.id,
            ...doc.data()
          })
        }
      })
      
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      Alert.alert('Error', 'Failed to search for users')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendRequest(targetUid) {
    if (!user || !targetUid) return
    
    setLoading(true)
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      
      // Add the request to the target user's friendRequests array
      const targetUserRef = doc(db, 'users', targetUid)
      await updateDoc(targetUserRef, {
        friendRequests: arrayUnion({
          uid: user.uid,
          username: myProfile?.username || '',
          timestamp: new Date().toISOString()
        })
      })
      
      Alert.alert('Success', 'Friend request sent!')
      
      // Update local state to reflect the change
      setSearchResults(prev => 
        prev.map(user => 
          user.id === targetUid ? { ...user, requestSent: true } : user
        )
      )
      
      setSuggestedFriends(prev => 
        prev.map(user => 
          user.id === targetUid ? { ...user, requestSent: true } : user
        )
      )
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error) {
      console.error("Error sending friend request:", error)
      Alert.alert('Error', 'Failed to send friend request')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  const formatRelativeTime = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHr / 24)
    
    if (diffDays > 30) {
      return `${Math.floor(diffDays / 30)}mo ago`
    } else if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHr > 0) {
      return `${diffHr}h ago`
    } else if (diffMin > 0) {
      return `${diffMin}m ago`
    } else {
      return 'Just now'
    }
  }

  function renderActivityItem({ item }) {
    return (
      <TouchableOpacity 
        style={[styles.activityItem, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => navigation.navigate('FriendProfile', { userId: item.userId })}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityUser}>
            {item.profilePic ? (
              <Image source={{ uri: item.profilePic }} style={styles.activityAvatar} />
            ) : (
              <View style={[styles.activityAvatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person" size={16} color={colors.primary} />
              </View>
            )}
            <Text style={[styles.activityUsername, { color: colors.text }]}>{item.username}</Text>
          </View>
          <Text style={[styles.activityTime, { color: colors.textTertiary }]}>
            {formatRelativeTime(item.date)}
          </Text>
        </View>
        
        <View style={styles.activityContent}>
          {item.type === 'workout' ? (
            <Text style={{ color: colors.text }}>
              Completed {item.data.sets} sets of {item.data.exerciseName} at {item.data.weight} lbs
            </Text>
          ) : (
            <Text style={{ color: colors.text }}>
              Logged weight: {item.data.weight} lbs
            </Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  function renderFriend({ item }) {
    return (
      <TouchableOpacity 
        style={styles.friendItem}
        onPress={() => navigation.navigate('FriendProfile', { userId: item.id })}
      >
        <View style={[styles.friendAvatar, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>{item.username}</Text>
      </TouchableOpacity>
    )
  }

  function renderSuggestedFriend({ item }) {
    return (
      <View style={[styles.suggestedFriend, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity 
          style={styles.suggestedFriendInfo}
          onPress={() => navigation.navigate('FriendProfile', { userId: item.id })}
        >
          <View style={[styles.friendAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>{item.username}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => handleSendRequest(item.id)}
          disabled={item.requestSent}
        >
          <Text style={[styles.addButtonText, { color: item.requestSent ? colors.textTertiary : '#FFFFFF' }]}>
            {item.requestSent ? 'Sent' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  function renderTopExerciser({ item, index }) {
    const rankColors = [colors.warning, colors.info, colors.success];
    const rankColor = rankColors[index] || colors.primary;
    
    return (
      <TouchableOpacity
        style={[styles.topExerciser, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => navigation.navigate('FriendProfile', { userId: item.id })}
      >
        <View style={styles.topExerciserRank}>
          <View style={[styles.rankBadge, { backgroundColor: rankColor + '30' }]}>
            <Text style={[styles.rankText, { color: rankColor }]}>#{index + 1}</Text>
          </View>
        </View>
        
        <View style={styles.topExerciserInfo}>
          <View style={[styles.friendAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          
          <View style={styles.topExerciserDetails}>
            <Text style={[styles.topExerciserName, { color: colors.text }]} numberOfLines={1}>
              {item.username}
            </Text>
            <Text style={[styles.topExerciserStats, { color: colors.textSecondary }]}>
              {item.workoutCount} workouts
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderSearchResult({ item }) {
    return (
      <View style={[styles.searchResult, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity 
          style={styles.searchResultInfo}
          onPress={() => {
            setShowSearchModal(false)
            navigation.navigate('FriendProfile', { userId: item.id })
          }}
        >
          <View style={[styles.searchResultAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.searchResultName, { color: colors.text }]}>{item.username}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => handleSendRequest(item.id)}
          disabled={item.requestSent}
        >
          <Text style={{ color: '#FFFFFF' }}>{item.requestSent ? 'Sent' : 'Add'}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Animated.View style={[styles.header, { opacity: headerOpacity, height: headerHeight }]}>
        <View style={styles.headerContent}>
          <Title style={{ color: colors.text }}>Social</Title>
          <Text style={{ color: colors.textSecondary }}>Connect with friends and track workouts together</Text>
        </View>
      </Animated.View>
    </View>
  )

  return (
    <Container style={{ backgroundColor: colors.background }}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.animatedHeader, 
          { 
            height: 200, // Fixed height
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }]
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
            { useNativeDriver: false }  // Changed to false since we're animating layout properties
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
                keyExtractor={(item) => `suggested-${item.id}`}
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
                <React.Fragment key={`exerciser-${item.id || index}`}>
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
                  keyExtractor={item => item.id}
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
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  activityAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityUsername: {
    fontWeight: '600',
    fontSize: 16,
  },
  activityTime: {
    fontSize: 12,
  },
  activityContent: {
    marginTop: 4,
  },
  suggestedList: {
    marginTop: 8,
  },
  suggestedFriend: {
    width: 120,
    alignItems: 'center',
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestedFriendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
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
  leaderboardContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  topExerciser: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(200,200,200,0.3)',
  },
  topExerciserRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  topExerciserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topExerciserDetails: {
    flex: 1,
  },
  topExerciserName: {
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  topExerciserStats: {
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
  searchResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  searchResultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
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
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    justifyContent: 'flex-end',
  },
});