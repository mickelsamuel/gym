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

const FriendRequestsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext)
  const { darkMode } = useContext(ExerciseContext)
  const insets = useSafeAreaInsets()
  
  // State
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState([])
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  
  // Theme
  const theme = {
    text: darkMode ? '#FFFFFF' : '#333333',
    background: darkMode ? '#1C1C1E' : '#F8F9FA',
    card: darkMode ? '#2C2C2E' : '#FFFFFF',
    border: darkMode ? '#555555' : '#E5E9F0',
    primary: '#007AFF',
    accent: '#FF9500',
    error: '#FF3B30',
    success: '#34C759'
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
    
    loadRequests()
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
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      Alert.alert('Error', 'Failed to load friend requests. Please try again.')
    } finally {
      setLoading(false)
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

  function renderRequest({ item, index }) {
    const isProcessing = processingIds.includes(item.fromUid)
    
    // Calculate animation delay based on index for staggered appearance
    const animationDelay = index * 100
    
    return (
      <Animated.View 
        style={[
          styles.requestItem, 
          { 
            borderColor: theme.border,
            backgroundColor: theme.card,
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
            <View style={[styles.noPic, { backgroundColor: theme.accent }]}>
              <Text style={styles.avatarText}>
                {item.fromName?.substring(0, 1)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={[styles.username, { color: theme.text }]}>
            {item.fromName}
          </Text>
        </View>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => acceptRequest(item)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#FFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => rejectRequest(item)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="close" size={16} color="#FFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]} 
          onPress={() => {
            Haptics.selectionAsync()
            navigation.goBack()
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Friend Requests</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          {requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={darkMode ? '#555' : '#DDD'} />
              <Text style={[styles.emptyText, { color: darkMode ? '#AAA' : '#999' }]}>
                No friend requests
              </Text>
              <Text style={[styles.emptySubtext, { color: darkMode ? '#888' : '#BBB' }]}>
                When someone sends you a friend request, it will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item, index) => item.fromUid || index.toString()}
              renderItem={renderRequest}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  title: {
    fontSize: 24,
    fontWeight: '700'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  list: {
    flex: 1
  },
  listContent: {
    paddingBottom: 20
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userPic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12
  },
  noPic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF'
  },
  username: {
    fontSize: 16,
    fontWeight: '600'
  },
  buttonsRow: {
    flexDirection: 'row'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 90
  },
  acceptButton: {
    backgroundColor: '#34C759',
    marginRight: 8
  },
  rejectButton: {
    backgroundColor: '#FF3B30'
  },
  buttonIcon: {
    marginRight: 4
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14
  }
})

export default FriendRequestsScreen