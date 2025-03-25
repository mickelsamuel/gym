import React, { useContext, useState, useEffect } from 'react'
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
  Keyboard
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
  onSnapshot
} from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons'
import { ExerciseContext } from '../context/ExerciseContext'
import { useNavigation } from '@react-navigation/native'

export default function SocialScreen() {
  const { darkMode } = useContext(ExerciseContext)
  const { user } = useContext(AuthContext)
  const navigation = useNavigation()
  const [myProfile, setMyProfile] = useState(null)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [requestsCount, setRequestsCount] = useState(0)

  const theme = {
    text: darkMode ? '#FFFFFF' : '#333333',
    background: darkMode ? '#1C1C1E' : '#F8F9FA',
    card: darkMode ? '#2C2C2E' : '#FFFFFF',
    border: darkMode ? '#555555' : '#E0E0E0',
    primary: '#007AFF'
  }

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), snapshot => {
        if (snapshot.exists()) {
          setMyProfile(snapshot.data())
          const requests = snapshot.data().friendRequests || []
          setRequestsCount(requests.length)
        }
      })
      return () => unsubscribe()
    }
  }, [user])

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

  function renderFriend({ item }) {
    return (
      <TouchableOpacity
        style={[styles.friendItem, { borderColor: theme.border }]}
        onPress={() => navigation.navigate('FriendProfile', { friendUid: item })}
      >
        <Text style={[styles.friendText, { color: theme.text }]}>{item}</Text>
      </TouchableOpacity>
    )
  }

  function renderSearchResult({ item }) {
    return (
      <View style={[styles.searchResultItem, { borderColor: theme.border }]}>
        <View style={styles.userInfo}>
          {item.profilePic ? (
            <Image source={{ uri: item.profilePic }} style={styles.userPic} />
          ) : (
            <View style={[styles.noPic, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.text }}>No Photo</Text>
            </View>
          )}
          <Text style={[styles.username, { color: theme.text }]}>
            {item.username}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleSendRequest(item.uid)} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Friend</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Social</Text>
          <TouchableOpacity
            style={styles.requestsIcon}
            onPress={() => navigation.navigate('FriendRequests')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
            {requestsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requestsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.friendsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Friends</Text>
          {myProfile?.friends && myProfile.friends.length > 0 ? (
            <FlatList
              data={myProfile.friends}
              keyExtractor={item => item}
              renderItem={renderFriend}
              style={styles.friendsList}
            />
          ) : (
            <Text style={[styles.noFriendsText, { color: darkMode ? '#999' : '#999' }]}>
              No friends yet
            </Text>
          )}
        </View>

        <View style={styles.searchSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Find Users</Text>
          <View
            style={[
              styles.searchBox,
              { borderColor: theme.border, backgroundColor: theme.card }
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Username"
              placeholderTextColor={darkMode ? '#888888' : '#999999'}
              value={searchUsername}
              onChangeText={setSearchUsername}
            />
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>
              {loading ? 'Searching...' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>

        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.uid}
            renderItem={renderSearchResult}
            style={styles.resultsList}
          />
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600'
  },
  requestsIcon: {
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600'
  },
  friendsSection: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  friendsList: {
    maxHeight: 150
  },
  friendItem: {
    padding: 12,
    borderBottomWidth: 1
  },
  friendText: {
    fontSize: 16
  },
  noFriendsText: {
    fontSize: 14,
    fontStyle: 'italic'
  },
  searchSection: {
    marginTop: 20
  },
  searchBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  input: {
    height: 40,
    fontSize: 16
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600'
  },
  resultsList: {
    marginTop: 16,
    maxHeight: 200
  },
  searchResultItem: {
    borderBottomWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8
  },
  noPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  username: {
    fontSize: 16
  },
  addButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600'
  }
})