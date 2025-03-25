import React, { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image
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
import { useNavigation } from '@react-navigation/native'

export default function FriendRequestsScreen() {
  const navigation = useNavigation()
  const { user } = useContext(AuthContext)
  const { darkMode } = useContext(ExerciseContext)
  const [requests, setRequests] = useState([])
  const theme = {
    text: darkMode ? '#FFFFFF' : '#333333',
    background: darkMode ? '#1C1C1E' : '#F8F9FA',
    card: darkMode ? '#2C2C2E' : '#FFFFFF',
    border: darkMode ? '#555555' : '#E0E0E0',
    primary: '#007AFF'
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    if (!user) return
    const myRef = doc(db, 'users', user.uid)
    const snap = await getDoc(myRef)
    if (snap.exists()) {
      const data = snap.data()
      setRequests(data.friendRequests || [])
    }
  }

  async function acceptRequest(request) {
    if (!user) return
    const myRef = doc(db, 'users', user.uid)
    const theirRef = doc(db, 'users', request.fromUid)
    const mySnap = await getDoc(myRef)
    const theirSnap = await getDoc(theirRef)
    if (!mySnap.exists() || !theirSnap.exists()) return
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
  }

  async function rejectRequest(request) {
    if (!user) return
    const myRef = doc(db, 'users', user.uid)
    await updateDoc(myRef, {
      friendRequests: arrayRemove(request)
    })
    loadRequests()
  }

  function renderRequest({ item }) {
    return (
      <View style={[styles.requestItem, { borderColor: theme.border }]}>
        <View style={styles.userInfo}>
          {item.fromPhotoUrl ? (
            <Image source={{ uri: item.fromPhotoUrl }} style={styles.userPic} />
          ) : (
            <View style={[styles.noPic, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.text }}>No Photo</Text>
            </View>
          )}
          <Text style={[styles.username, { color: theme.text }]}>
            {item.fromName}
          </Text>
        </View>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.acceptButton]}
            onPress={() => acceptRequest(item)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectButton]}
            onPress={() => rejectRequest(item)}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>
            &lt; Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Friend Requests</Text>
      </View>
      {requests.length === 0 && (
        <Text style={[styles.noRequestsText, { color: darkMode ? '#999' : '#999' }]}>
          No friend requests
        </Text>
      )}
      {requests.length > 0 && (
        <FlatList
          data={requests}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderRequest}
          style={styles.list}
        />
      )}
    </View>
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
    alignItems: 'center',
    marginBottom: 16
  },
  backButton: {
    marginRight: 16
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    fontSize: 20,
    fontWeight: '600'
  },
  list: {
    marginTop: 16
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: 12,
    alignItems: 'center'
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
  buttonsRow: {
    flexDirection: 'row'
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600'
  },
  noRequestsText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8
  }
})