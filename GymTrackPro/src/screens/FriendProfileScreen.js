import React, { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView
} from 'react-native'
import { db } from '../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { AuthContext } from '../context/AuthContext'
import { ExerciseContext } from '../context/ExerciseContext'
import { useNavigation, useRoute } from '@react-navigation/native'

export default function FriendProfileScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { friendUid } = route.params
  const { user } = useContext(AuthContext)
  const { darkMode } = useContext(ExerciseContext)
  const [friendData, setFriendData] = useState(null)
  const theme = {
    text: darkMode ? '#FFFFFF' : '#333333',
    background: darkMode ? '#1C1C1E' : '#F8F9FA',
    card: darkMode ? '#2C2C2E' : '#FFFFFF'
  }

  useEffect(() => {
    loadFriendProfile()
  }, [])

  async function loadFriendProfile() {
    if (!user) return
    const ref = doc(db, 'users', friendUid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      setFriendData(snap.data())
    } else {
      Alert.alert('Error', 'Friend profile not found.')
      navigation.goBack()
    }
  }

  if (!friendData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        {friendData.profilePic ? (
          <Image source={{ uri: friendData.profilePic }} style={styles.profilePic} />
        ) : (
          <View style={[styles.noPic, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text }}>No Photo</Text>
          </View>
        )}
        <Text style={[styles.username, { color: theme.text }]}>
          {friendData.username}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Workouts</Text>
        {friendData.firestoreSets && friendData.firestoreSets.length > 0 ? (
          friendData.firestoreSets.map((entry, index) => {
            return (
              <View key={index} style={[styles.entryCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.entryText, { color: theme.text }]}>
                  {entry.exerciseName}: {entry.sets}x{entry.reps} @ {entry.weight} on{' '}
                  {new Date(entry.date).toLocaleDateString()}
                </Text>
              </View>
            )
          })
        ) : (
          <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>
            No workout data
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Weight Log</Text>
        {friendData.firestoreWeightLog && friendData.firestoreWeightLog.length > 0 ? (
          friendData.firestoreWeightLog.map((w, idx) => (
            <View key={idx} style={[styles.entryCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.entryText, { color: theme.text }]}>
                {w.weight} on {new Date(w.date).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>
            No weight logs
          </Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12
  },
  noPic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  username: {
    fontSize: 20,
    fontWeight: '600'
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  entryCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  entryText: {
    fontSize: 14
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic'
  }
})