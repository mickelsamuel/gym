import React, { useContext, useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  StatusBar,
  Animated,
  ActivityIndicator
} from 'react-native'
import { AuthContext } from '../context/AuthContext'
import { db } from '../services/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  arrayUnion
} from 'firebase/firestore'
import { ExerciseContext } from '../context/ExerciseContext'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors as ThemeColors, Typography, Spacing, BorderRadius, createNeumorphism } from '../constants/Theme'
import { BlurView } from 'expo-blur'

const FriendRequestsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext)
  const { darkMode } = useContext(ExerciseContext)
  const insets = useSafeAreaInsets()
  
  // State
  const [requests, setRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState([])
  const [suggestions, setSuggestions] = useState([])
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  
  // Theme
  const theme = darkMode ? ThemeColors.dark : ThemeColors.light;
  const neumorphism = createNeumorphism(!darkMode, 4);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
    
    loadRequests()
    loadSuggestions()
  }, [])

  async function loadRequests() {
    setLoading(true)
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      const myRef = doc(db, 'users', user.uid)
      const snap = await getDoc(myRef)
      if (snap.exists()) {
        const data = snap.data()
        setRequests(data.friendRequests || [])
        setSentRequests(data.sentRequests || [])
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      Alert.alert('Error', 'Failed to load friend requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadSuggestions() {
    if (!user) return;
    
    try {
      // This would normally be a more sophisticated algorithm based on mutual friends,
      // similar workout preferences, etc. For now, we'll just grab some random users.
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(query(usersRef, limit(5)));
      
      let suggestionList = [];
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        // Don't suggest the current user or people they're already friends with
        if (doc.id !== user.uid && 
            (!myProfile?.friends || !myProfile.friends.includes(doc.id)) &&
            (!sentRequests || !sentRequests.some(req => req.toUid === doc.id))) {
          suggestionList.push({
            uid: doc.id,
            username: userData.username || 'User',
            profilePic: userData.profilePic || null,
            reason: 'Similar workout interests'
          });
        }
      });
      
      setSuggestions(suggestionList);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }

  async function acceptRequest(request) {
    if (!user) return
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setProcessingIds(prev => [...prev, request.fromUid])
    
    try {
      const myRef = doc(db, 'users', user.uid)
      const theirRef = doc(db, 'users', request.fromUid)
      
      const [mySnap, theirSnap] = await Promise.all([
        getDoc(myRef),
        getDoc(theirRef)
      ])
      
      if (!mySnap.exists() || !theirSnap.exists()) {
        Alert.alert('Error', 'User data could not be found.')
        setProcessingIds(prev => prev.filter(id => id !== request.fromUid))
        return
      }
      
      const myData = mySnap.data()
      const theirData = theirSnap.data()
      const myFriends = myData.friends || []
      const theirFriends = theirData.friends || []
      
      await updateDoc(myRef, {
        friendRequests: arrayRemove(request),
        friends: myFriends.includes(request.fromUid)
          ? myFriends
          : [...myFriends, request.fromUid]
      })
      
      await updateDoc(theirRef, {
        friends: theirFriends.includes(user.uid)
          ? theirFriends
          : [...theirFriends, user.uid]
      })
      
      loadRequests()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error) {
      console.error('Error accepting request:', error)
      Alert.alert('Error', 'Failed to accept request. Please try again.')
      setProcessingIds(prev => prev.filter(id => id !== request.fromUid))
    }
  }

  async function rejectRequest(request) {
    if (!user) return
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setProcessingIds(prev => [...prev, request.fromUid])
    
    try {
      const myRef = doc(db, 'users', user.uid)
      await updateDoc(myRef, {
        friendRequests: arrayRemove(request)
      })
      
      loadRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      Alert.alert('Error', 'Failed to reject request. Please try again.')
      setProcessingIds(prev => prev.filter(id => id !== request.fromUid))
    }
  }

  async function cancelSentRequest(request) {
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProcessingIds(prev => [...prev, request.toUid]);
    
    try {
      const myRef = doc(db, 'users', user.uid);
      await updateDoc(myRef, {
        sentRequests: arrayRemove(request)
      });
      
      // Also remove the request from the recipient's friendRequests
      const theirRef = doc(db, 'users', request.toUid);
      const theirSnap = await getDoc(theirRef);
      
      if (theirSnap.exists()) {
        const theirData = theirSnap.data();
        const theirRequests = theirData.friendRequests || [];
        
        const requestToRemove = theirRequests.find(req => req.fromUid === user.uid);
        if (requestToRemove) {
          await updateDoc(theirRef, {
            friendRequests: arrayRemove(requestToRemove)
          });
        }
      }
      
      loadRequests();
    } catch (error) {
      console.error('Error canceling request:', error);
      Alert.alert('Error', 'Failed to cancel request. Please try again.');
      setProcessingIds(prev => prev.filter(id => id !== request.toUid));
    }
  }

  async function sendRequest(suggestion) {
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingIds(prev => [...prev, suggestion.uid]);
    
    try {
      const myRef = doc(db, 'users', user.uid);
      const mySnap = await getDoc(myRef);
      const myData = mySnap.data();
      
      const request = {
        fromUid: user.uid,
        fromName: myData.username || 'User',
        fromPhotoUrl: myData.profilePic || null,
        sentAt: new Date().toISOString()
      };
      
      const sentRequest = {
        toUid: suggestion.uid,
        toName: suggestion.username,
        toPhotoUrl: suggestion.profilePic,
        sentAt: new Date().toISOString()
      };
      
      // Update my sent requests
      await updateDoc(myRef, {
        sentRequests: arrayUnion(sentRequest)
      });
      
      // Add to their friend requests
      const theirRef = doc(db, 'users', suggestion.uid);
      await updateDoc(theirRef, {
        friendRequests: arrayUnion(request)
      });
      
      loadRequests();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
      setProcessingIds(prev => prev.filter(id => id !== suggestion.uid));
    }
  }

  function renderRequest({ item, index }) {
    const isProcessing = processingIds.includes(item.fromUid)
    
    // Calculate animation delay based on index for staggered appearance
    const animationDelay = index * 100
    
    return (
      <Animated.View 
        style={[
          styles.requestItem, 
          neumorphism,
          { 
            backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground,
            opacity: fadeAnim,
            transform: [{ 
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
                extrapolate: 'clamp'
              }) 
            }],
          }
        ]}
      >
        <View style={styles.userInfo}>
          {item.fromPhotoUrl ? (
            <Image source={{ uri: item.fromPhotoUrl }} style={styles.userPic} />
          ) : (
            <View style={[styles.noPic, { backgroundColor: ThemeColors.secondaryGreen }]}>
              <Text style={styles.avatarText}>
                {item.fromName?.substring(0, 1)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={[styles.username, { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }]}>
            {item.fromName}
          </Text>
        </View>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => acceptRequest(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <LinearGradient
                colors={[ThemeColors.accentSuccess, ThemeColors.accentSuccess]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Accept</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => rejectRequest(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={darkMode ? "#AAA" : "#666"} />
            ) : (
              <>
                <Ionicons name="close" size={20} color={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight} />
                <Text style={[styles.rejectText, { color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight }]}>
                  Decline
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    )
  }

  function renderSentRequest({ item, index }) {
    const isProcessing = processingIds.includes(item.toUid);
    
    return (
      <Animated.View 
        style={[
          styles.requestItem, 
          neumorphism,
          { 
            backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground,
            opacity: fadeAnim,
            transform: [{ 
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
                extrapolate: 'clamp'
              }) 
            }],
          }
        ]}
      >
        <View style={styles.userInfo}>
          {item.toPhotoUrl ? (
            <Image source={{ uri: item.toPhotoUrl }} style={styles.userPic} />
          ) : (
            <View style={[styles.noPic, { backgroundColor: ThemeColors.secondaryGreen }]}>
              <Text style={styles.avatarText}>
                {item.toName?.substring(0, 1)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.username, { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }]}>
              {item.toName}
            </Text>
            <Text style={[styles.pendingText, { color: ThemeColors.accentWarning }]}>
              Request Pending
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => cancelSentRequest(item)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={darkMode ? "#AAA" : "#666"} />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={18} color={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight} />
              <Text style={[styles.cancelText, { color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight }]}>
                Cancel
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  function renderSuggestion({ item, index }) {
    const isProcessing = processingIds.includes(item.uid);
    
    return (
      <Animated.View 
        style={[
          styles.requestItem, 
          neumorphism,
          { 
            backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground,
            opacity: fadeAnim,
            transform: [{ 
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
                extrapolate: 'clamp'
              }) 
            }],
          }
        ]}
      >
        <View style={styles.userInfo}>
          {item.profilePic ? (
            <Image source={{ uri: item.profilePic }} style={styles.userPic} />
          ) : (
            <View style={[styles.noPic, { backgroundColor: ThemeColors.primaryBlue }]}>
              <Text style={styles.avatarText}>
                {item.username?.substring(0, 1)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.username, { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }]}>
              {item.username}
            </Text>
            <Text style={[styles.suggestionReason, { color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight }]}>
              {item.reason}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={() => sendRequest(item)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <LinearGradient
              colors={[ThemeColors.primaryBlue, ThemeColors.primaryDarkBlue]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="person-add" size={18} color="#FFF" />
              <Text style={styles.buttonText}>Add</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: darkMode ? ThemeColors.darkBackground : ThemeColors.lightBackground,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.selectionAsync()
            navigation.goBack()
          }}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { 
          color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
        }]}>
          Friend Requests
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={ThemeColors.primaryBlue} 
          />
        </View>
      ) : (
        <FlatList
          data={[]}
          ListHeaderComponent={() => (
            <>
              {requests.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { 
                    color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
                  }]}>
                    Pending Requests
                  </Text>
                  <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.fromUid}
                    contentContainerStyle={styles.requestsContainer}
                    scrollEnabled={false}
                  />
                </>
              )}
              
              {sentRequests.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { 
                    color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight,
                    marginTop: requests.length > 0 ? Spacing.xl : 0
                  }]}>
                    Sent Requests
                  </Text>
                  <FlatList
                    data={sentRequests}
                    renderItem={renderSentRequest}
                    keyExtractor={(item) => item.toUid}
                    contentContainerStyle={styles.requestsContainer}
                    scrollEnabled={false}
                  />
                </>
              )}
              
              {suggestions.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { 
                    color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight,
                    marginTop: (requests.length > 0 || sentRequests.length > 0) ? Spacing.xl : 0
                  }]}>
                    Suggestions
                  </Text>
                  <FlatList
                    data={suggestions}
                    renderItem={renderSuggestion}
                    keyExtractor={(item) => item.uid}
                    contentContainerStyle={styles.requestsContainer}
                    scrollEnabled={false}
                  />
                </>
              )}
              
              {requests.length === 0 && sentRequests.length === 0 && suggestions.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons 
                    name="people" 
                    size={60} 
                    color={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight} 
                  />
                  <Text style={[styles.emptyText, { 
                    color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
                  }]}>
                    No friend requests
                  </Text>
                  <Text style={[styles.emptySubtext, { 
                    color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight 
                  }]}>
                    When someone sends you a request, it will appear here
                  </Text>
                  <TouchableOpacity 
                    style={styles.findFriendsButton}
                    onPress={() => navigation.navigate('Social')}
                  >
                    <LinearGradient
                      colors={[ThemeColors.primaryBlue, ThemeColors.primaryDarkBlue]}
                      style={styles.findFriendsGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.findFriendsText}>Find Friends</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          renderItem={() => null}
          keyExtractor={() => 'spacer'}
          contentContainerStyle={styles.flatListContainer}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.title,
    fontWeight: Typography.bold,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatListContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
  },
  requestsContainer: {
    gap: Spacing.md,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  noPic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  username: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
  },
  pendingText: {
    fontSize: Typography.small,
    marginTop: 4,
  },
  suggestionReason: {
    fontSize: Typography.small,
    marginTop: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: Typography.semibold,
    marginLeft: 4,
    fontSize: Typography.caption,
  },
  acceptButton: {
    marginRight: 4,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.md,
  },
  rejectText: {
    marginLeft: 4,
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.md,
  },
  cancelText: {
    marginLeft: 4,
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
  },
  addButton: {
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.semibold,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  findFriendsButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  findFriendsGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  findFriendsText: {
    color: '#FFF',
    fontWeight: Typography.semibold,
    fontSize: Typography.button,
  },
})

export default FriendRequestsScreen