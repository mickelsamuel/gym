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
import Colors from '../constants/Colors'
import Container from '../components/ui/Container'
import { Title, Heading, Subheading, Body, Caption } from '../components/ui/Text'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

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

  // Render the SocialScreen
  return (
    <Container>
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslateY }],
            backgroundColor: colors.primary,
            height: headerHeight,
            zIndex: 1000
          }
        ]}
      >
        <Animated.View
          style={[
            styles.headerContent,
            { opacity: headerOpacity }
          ]}
        >
          <Title style={{ color: '#fff' }}>Social</Title>
          <Subheading style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 }}>
            Connect with fitness friends
          </Subheading>
        </Animated.View>
        
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginLeft: 8 }}>
              Search for friends...
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.requestsBadge}
            onPress={() => navigation.navigate('FriendRequests')}
          >
            <Ionicons name="person-add" size={22} color="#fff" />
            {requestsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requestsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Friend Activity Section */}
        <View style={[styles.section, { marginTop: 150 }]}>
          <View style={styles.sectionHeader}>
            <Heading style={{ color: colors.text }}>Friend Activity</Heading>
            <TouchableOpacity>
              <Text style={{ color: colors.primary }}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
          ) : activityFeed.length > 0 ? (
            <FlatList
              data={activityFeed}
              renderItem={renderActivityItem}
              keyExtractor={(item, index) => `activity-${index}`}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyStateCard}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                No friend activity yet.
              </Text>
              <Text style={{ color: colors.textTertiary, marginTop: 4, textAlign: 'center' }}>
                Add friends to see their workout activity.
              </Text>
            </Card>
          )}
        </View>
        
        {/* Leaderboard Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heading style={{ color: colors.text }}>Weekly Leaderboard</Heading>
            <TouchableOpacity>
              <Text style={{ color: colors.primary }}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <Card style={styles.leaderboardCard}>
            {topExercisers.length > 0 ? (
              <FlatList
                data={topExercisers}
                renderItem={renderTopExerciser}
                keyExtractor={(item) => `top-${item.id}`}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyLeaderboard}>
                <Ionicons name="trophy-outline" size={40} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                  Leaderboard data is loading
                </Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.viewChallengesButton}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Join Challenge
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
        
        {/* Suggested Friends Section */}
        <View style={styles.section}>
          <Heading style={{ marginBottom: 16, color: colors.text }}>
            Suggested Friends
          </Heading>
          
          {suggestedFriends.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedFriendsContainer}
            >
              {suggestedFriends.map(friend => renderSuggestedFriend({ item: friend }))}
            </ScrollView>
          ) : (
            <Card style={styles.emptyStateCard}>
              <Ionicons name="person-add-outline" size={40} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                No suggestions right now
              </Text>
              <Text style={{ color: colors.textTertiary, marginTop: 4, textAlign: 'center' }}>
                Check back later for friend suggestions
              </Text>
            </Card>
          )}
        </View>
      </Animated.ScrollView>
      
      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSearchModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={[
          styles.modalContainer, 
          { backgroundColor: colors.backgroundSecondary }
        ]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Title style={{ color: colors.text }}>Find Friends</Title>
            <View style={{ width: 28 }} />
          </View>
          
          <View style={[
            styles.searchInputContainer,
            { backgroundColor: darkMode ? colors.backgroundSecondary : '#f0f0f0' }
          ]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by username"
              placeholderTextColor={colors.textSecondary}
              value={searchUsername}
              onChangeText={setSearchUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchUsername.length > 0 && (
              <TouchableOpacity onPress={() => setSearchUsername('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ListEmptyComponent={() => (
                <View style={styles.emptyResults}>
                  {searchUsername.length > 0 ? (
                    <>
                      <Ionicons name="search" size={40} color={colors.textSecondary} />
                      <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                        No users found with username "{searchUsername}"
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
                      <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                        Search for friends by username
                      </Text>
                    </>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  headerContent: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
  },
  requestsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4E64',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A6CFF',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  emptyStateCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardCard: {
    padding: 0,
    overflow: 'hidden',
  },
  emptyLeaderboard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewChallengesButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  suggestedFriendsContainer: {
    paddingVertical: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 8,
  },
  emptyResults: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profileInitial: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(10, 108, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  topExerciserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestedFriendCard: {
    width: 150,
    marginRight: 12,
    padding: 16,
    alignItems: 'center',
  },
  suggestedFriendImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  suggestedFriendInitial: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(10, 108, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addFriendButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  searchResultInitial: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(10, 108, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
  },
});