import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
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
  Modal,
  ViewStyle,
  TextStyle,
  ImageStyle
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/firebase';
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
  limit,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseContext } from '../context/ExerciseContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Text, Button, Card, Container } from '../components/ui';
import { Colors, Theme, Typography, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { formatDistance } from 'date-fns';

const { width } = Dimensions.get('window');

// Types and interfaces
interface UserProfile {
  id?: string;
  uid?: string;
  username: string;
  email?: string;
  profilePic?: string;
  bio?: string;
  friends?: string[];
  friendRequests?: string[];
  sentRequests?: string[];
  firestoreSets?: WorkoutSet[];
  firestoreWeightLog?: WeightLog[];
  workoutCount?: number;
  joinDate?: string;
}

interface WorkoutSet {
  id?: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  notes?: string;
}

interface WeightLog {
  id?: string;
  date: string;
  weight: number;
  notes?: string;
}

interface ActivityItem {
  type: 'workout' | 'weightLog';
  userId: string;
  username: string;
  profilePic?: string | null;
  date: string;
  data: WorkoutSet | WeightLog;
}

const SocialScreen: React.FC = () => {
  const { darkMode } = useContext(ExerciseContext);
  const { user, userProfile } = useContext(AuthContext);
  const navigation = useNavigation();
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [searchUsername, setSearchUsername] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<UserProfile[]>([]);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [topExercisers, setTopExercisers] = useState<UserProfile[]>([]);
  
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
  
  // Theme based on dark mode
  const theme = darkMode ? Theme.dark : Theme.light;

  useEffect(() => {
    if (user) {
      // Listen for real-time updates to the user profile
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setMyProfile({
            id: snapshot.id,
            ...data,
          } as UserProfile);
          const requests = data.friendRequests || [];
          setRequestsCount(requests.length);
        }
      }, error => {
        console.error("Error getting user profile updates:", error);
      });
      
      // Initial data loading
      loadData();
      
      return () => unsubscribe();
    }
  }, [user]);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      await Promise.all([
        loadActivityFeed(),
        loadSuggestedFriends(),
        loadTopExercisers()
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Error loading social data:", error);
      setLoading(false);
    }
  };
  
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadActivityFeed = async (): Promise<void> => {
    if (!user || !myProfile || !myProfile.friends || myProfile.friends.length === 0) {
      setActivityFeed([]);
      return;
    }
    
    try {
      // Initialize an array to hold all friend activities
      let allActivities: ActivityItem[] = [];
      
      // For each friend, fetch their recent activity
      for (const friendUid of myProfile.friends) {
        const friendDoc = await getDoc(doc(db, 'users', friendUid));
        if (friendDoc.exists()) {
          const friendData = friendDoc.data() as UserProfile;
          
          // Add workout activities
          const workouts = (friendData.firestoreSets || []).map(set => ({
            type: 'workout' as const,
            userId: friendUid,
            username: friendData.username,
            profilePic: friendData.profilePic || null,
            date: set.date,
            data: set
          }));
          
          // Add weight log activities
          const weightLogs = (friendData.firestoreWeightLog || []).map(log => ({
            type: 'weightLog' as const,
            userId: friendUid,
            username: friendData.username,
            profilePic: friendData.profilePic || null,
            date: log.date,
            data: log
          }));
          
          allActivities = [...allActivities, ...workouts, ...weightLogs];
        }
      }
      
      // Sort activities by date (newest first)
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Take only the most recent 20 activities
      setActivityFeed(allActivities.slice(0, 20));
    } catch (error) {
      console.error("Error loading activity feed:", error);
      setActivityFeed([]);
    }
  };
  
  const loadSuggestedFriends = async (): Promise<void> => {
    if (!user) return;
    
    try {
      // Get users from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(5));
      const querySnapshot = await getDocs(q);
      
      const suggestions: UserProfile[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const userData = doc.data() as Omit<UserProfile, 'id'>;
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
  
  const loadTopExercisers = async (): Promise<void> => {
    try {
      // This would typically fetch users with the most workouts/activity
      // For now, we'll just get a few random users from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(5));
      const querySnapshot = await getDocs(q);
      
      const topUsers: UserProfile[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        if (doc.id !== user?.uid) {
          topUsers.push({
            id: doc.id,
            ...doc.data() as Omit<UserProfile, 'id'>,
            workoutCount: Math.floor(Math.random() * 100) + 10 // Demo data for ranking
          });
        }
      });
      
      // Sort by workout count (descending)
      topUsers.sort((a, b) => (b.workoutCount || 0) - (a.workoutCount || 0));
      
      setTopExercisers(topUsers);
    } catch (error) {
      console.error("Error loading top exercisers:", error);
      setTopExercisers([]);
    }
  };

  const dismissKeyboard = (): void => {
    Keyboard.dismiss();
  };

  const handleSearch = async (): Promise<void> => {
    if (!searchUsername.trim()) {
      Alert.alert("Please enter a username to search");
      return;
    }
    
    setLoading(true);
    dismissKeyboard();
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("username", "==", searchUsername.trim()));
      const querySnapshot = await getDocs(q);
      
      const results: UserProfile[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        // Don't include current user in search results
        if (doc.id !== user?.uid) {
          results.push({
            id: doc.id,
            ...doc.data() as Omit<UserProfile, 'id'>
          });
        }
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching for users:", error);
      Alert.alert("Error", "Failed to search for users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (targetUid: string): Promise<void> => {
    if (!user || !targetUid) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const targetUserRef = doc(db, 'users', targetUid);
      const currentUserRef = doc(db, 'users', user.uid);
      
      // Add request to target user's friendRequests array
      await updateDoc(targetUserRef, {
        friendRequests: arrayUnion(user.uid)
      });
      
      // Add to current user's sentRequests array
      await updateDoc(currentUserRef, {
        sentRequests: arrayUnion(targetUid)
      });
      
      // Optionally, update the local state
      if (myProfile) {
        setMyProfile({
          ...myProfile,
          sentRequests: [...(myProfile.sentRequests || []), targetUid]
        });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Friend request sent successfully");
    } catch (error) {
      console.error("Error sending friend request:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to send friend request. Please try again.");
    }
  };

  const renderActivityItem = ({ item, index }: { item: ActivityItem; index: number }) => {
    const isWorkout = item.type === 'workout';
    const workoutSet = isWorkout ? item.data as WorkoutSet : null;
    const weightLog = !isWorkout ? item.data as WeightLog : null;
    
    return (
      <Card 
        style={{
          marginBottom: 12,
          backgroundColor: theme.card
        }}
      >
        <View style={styles.activityItem}>
          <TouchableOpacity 
            style={styles.activityHeader}
            onPress={() => {
              if (item.userId) {
                navigation.navigate('FriendProfileScreen', { userId: item.userId });
              }
            }}
          >
            {item.profilePic ? (
              <Image source={{ uri: item.profilePic }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}>
                <Ionicons name="person" size={24} color={theme.textSecondary} />
              </View>
            )}
            
            <View style={styles.activityUserInfo}>
              <Text 
                variant="subtitle" 
                style={{ 
                  color: theme.text 
                }}
              >
                {item.username}
              </Text>
              <Text 
                variant="caption" 
                style={{ 
                  color: theme.textSecondary 
                }}
              >
                {formatRelativeTime(item.date)}
              </Text>
            </View>
            
            <View style={styles.activityTypeTag}>
              <Text 
                variant="caption" 
                style={{ 
                  color: isWorkout ? Colors.accentSuccess : Colors.accentPurple,
                  fontWeight: '600'
                }}
              >
                {isWorkout ? 'Workout' : 'Weight Log'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.activityContent}>
            {isWorkout && workoutSet ? (
              <View style={styles.workoutDetails}>
                <View style={styles.workoutStat}>
                  <Text 
                    variant="caption" 
                    style={{ 
                      color: theme.textSecondary 
                    }}
                  >
                    Exercise
                  </Text>
                  <Text 
                    variant="body" 
                    style={{ 
                      color: theme.text 
                    }}
                  >
                    {workoutSet.exerciseName}
                  </Text>
                </View>
                
                <View style={styles.workoutStats}>
                  <View style={styles.workoutStat}>
                    <Text 
                      variant="caption" 
                      style={{ 
                        color: theme.textSecondary 
                      }}
                    >
                      Weight
                    </Text>
                    <Text 
                      variant="body" 
                      style={{ 
                        color: theme.text 
                      }}
                    >
                      {workoutSet.weight} kg
                    </Text>
                  </View>
                  
                  <View style={styles.workoutStat}>
                    <Text 
                      variant="caption" 
                      style={{ 
                        color: theme.textSecondary 
                      }}
                    >
                      Reps
                    </Text>
                    <Text 
                      variant="body" 
                      style={{ 
                        color: theme.text 
                      }}
                    >
                      {workoutSet.reps}
                    </Text>
                  </View>
                </View>
              </View>
            ) : weightLog ? (
              <View style={styles.weightLogDetails}>
                <View style={styles.workoutStat}>
                  <Text 
                    variant="caption" 
                    style={{ 
                      color: theme.textSecondary 
                    }}
                  >
                    New Weight
                  </Text>
                  <Text 
                    variant="body" 
                    style={{ 
                      color: theme.text 
                    }}
                  >
                    {weightLog.weight} kg
                  </Text>
                </View>
                
                {weightLog.notes && (
                  <View style={styles.workoutStat}>
                    <Text 
                      variant="caption" 
                      style={{ 
                        color: theme.textSecondary 
                      }}
                    >
                      Notes
                    </Text>
                    <Text 
                      variant="body" 
                      style={{ 
                        color: theme.text 
                      }}
                    >
                      {weightLog.notes}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <Container>
      {/* Fixed header with search bar */}
      <Animated.View 
        style={[
          styles.fixedHeader,
          {
            backgroundColor: theme.background,
            transform: [{ translateY: headerTranslateY }],
            borderBottomColor: theme.border
          }
        ]}
      >
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={22} color={theme.textSecondary} />
            <Text 
              variant="body" 
              style={{ 
                marginLeft: Spacing.sm,
                color: theme.textSecondary,
                flex: 1
              }}
            >
              Search for friends...
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.requestsButton}
            onPress={() => navigation.navigate('FriendRequestsScreen')}
          >
            <Ionicons name="people" size={22} color={theme.text} />
            {requestsCount > 0 && (
              <View style={styles.badge}>
                <Text 
                  variant="tiny" 
                  style={{ 
                    color: '#FFFFFF',
                    fontWeight: '600' 
                  }}
                >
                  {requestsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main content */}
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Content will go here... */}
        <View style={{ height: 800 }}>
          <Text variant="heading2">Social Feed</Text>
        </View>
      </Animated.ScrollView>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.modalOverlay}>
            <View 
              style={[
                styles.modalContent,
                { 
                  backgroundColor: theme.card,
                  ...createElevation(4)
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text 
                  variant="heading3" 
                  style={{ color: theme.text }}
                >
                  Find Friends
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowSearchModal(false);
                    setSearchUsername('');
                    setSearchResults([]);
                  }}
                >
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={[
                    styles.searchInput,
                    { 
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: theme.text,
                      borderColor: theme.border
                    }
                  ]}
                  placeholder="Enter username"
                  placeholderTextColor={theme.textSecondary}
                  value={searchUsername}
                  onChangeText={setSearchUsername}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity 
                  style={[
                    styles.searchInputButton,
                    { backgroundColor: theme.primary }
                  ]} 
                  onPress={handleSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="search" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id || item.uid || item.username}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.searchResultItem,
                        { borderBottomColor: theme.border }
                      ]}
                      onPress={() => {
                        if (item.id) {
                          navigation.navigate('FriendProfileScreen', { userId: item.id });
                        }
                      }}
                    >
                      <Image 
                        source={
                          item.profilePic 
                            ? { uri: item.profilePic } 
                            : require('../../assets/default-avatar.png')
                        }
                        style={styles.searchResultAvatar}
                      />
                      <View style={styles.searchResultInfo}>
                        <Text 
                          variant="body" 
                          style={{ 
                            fontWeight: '600',
                            color: theme.text
                          }}
                        >
                          {item.username}
                        </Text>
                        <Text 
                          variant="caption" 
                          style={{ color: theme.textSecondary }}
                        >
                          {item.bio ? item.bio.substring(0, 30) + (item.bio.length > 30 ? '...' : '') : 'No bio provided'}
                        </Text>
                      </View>
                      {myProfile?.sentRequests?.includes(item.id || '') ? (
                        <Button
                          title="Requested"
                          type="disabled"
                          size="small"
                          disabled
                        />
                      ) : myProfile?.friends?.includes(item.id || '') ? (
                        <Button
                          title="Friends"
                          type="success"
                          size="small"
                          disabled
                        />
                      ) : (
                        <Button
                          title="Add Friend"
                          type="primary"
                          size="small"
                          onPress={() => {
                            if (item.id) {
                              handleSendRequest(item.id);
                            }
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View style={styles.emptyResults}>
                  <Text 
                    variant="body" 
                    style={{ 
                      textAlign: 'center',
                      color: theme.textSecondary
                    }}
                  >
                    {searchUsername.length > 0 
                      ? 'No users found. Try another username.' 
                      : 'Search for friends by entering their username.'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  return formatDistance(date, new Date(), { addSuffix: true });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 150, // Space for fixed header
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: 'flex-end',
    zIndex: 10,
    borderBottomWidth: 1,
    ...createElevation(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    flex: 1,
    marginRight: Spacing.sm,
  },
  requestsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.accentDanger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.body,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  searchInputButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  searchResultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  searchResultInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  emptyResults: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    padding: Spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  activityUserInfo: {
    flex: 1,
  },
  activityTypeTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.xs,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  activityContent: {
    marginTop: Spacing.sm,
  },
  workoutDetails: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  workoutStat: {
    marginRight: Spacing.lg,
  },
  weightLogDetails: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
});

export default SocialScreen; 