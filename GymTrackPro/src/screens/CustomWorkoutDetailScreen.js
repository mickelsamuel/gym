import React, { useContext, useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import DatabaseService from '../services/DatabaseService'
import { ExerciseContext } from '../context/ExerciseContext'

export default function CustomWorkoutDetailScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { listId } = route.params
  const { getExerciseById, getAllExercises, darkMode } = useContext(ExerciseContext)
  const [workoutList, setWorkoutList] = useState(null)
  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA'
  const cardColor = darkMode ? '#2C2C2E' : '#FFF'
  const textColor = darkMode ? '#FFF' : '#333'

  useEffect(() => {
    async function loadWorkout() {
      try {
        const allLists = await DatabaseService.getAllWorkoutLists()
        const found = allLists.find(l => l.id === listId)
        if (found) {
          setWorkoutList(found)
        } else {
          Alert.alert('Error', 'Workout list not found.')
          navigation.goBack()
        }
      } catch {}
    }
    loadWorkout()
  }, [])

  const handleAddExercise = async exerciseId => {
    try {
      const updated = await DatabaseService.addExerciseToList(listId, exerciseId)
      setWorkoutList({ ...updated })
      Alert.alert('Success', 'Exercise added to this list.')
    } catch {
      Alert.alert('Error', 'Could not add exercise.')
    }
  }

  const handleRemoveExercise = async exerciseId => {
    try {
      const updated = await DatabaseService.removeExerciseFromList(listId, exerciseId)
      setWorkoutList({ ...updated })
      Alert.alert('Removed', 'Exercise removed from this list.')
    } catch {
      Alert.alert('Error', 'Could not remove exercise.')
    }
  }

  if (!workoutList) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={{ color: textColor }}>Loading...</Text>
      </View>
    )
  }

  const listExercises = workoutList.exercises.map(id => getExerciseById(id)).filter(Boolean)

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: cardColor }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>{workoutList.name}</Text>
      </View>
      <Text style={[styles.subtitle, { color: textColor }]}>Exercises in this list:</Text>
      {listExercises.length > 0 ? (
        <FlatList
          data={listExercises}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.listItem, { backgroundColor: cardColor }]}>
              <Text style={[styles.listItemText, { color: textColor }]}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveExercise(item.id)}>
                <Ionicons name="trash" size={20} color="red" />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>No exercises yet</Text>
      )}
      <Text style={[styles.subtitle, { color: textColor }]}>Add More Exercises:</Text>
      <FlatList
        data={getAllExercises()}
        keyExtractor={ex => ex.id}
        renderItem={({ item }) => {
          const inList = workoutList.exercises.includes(item.id)
          return (
            <View style={[styles.addItem, { backgroundColor: cardColor }]}>
              <Text style={[styles.addItemText, { color: textColor }]}>{item.name}</Text>
              {inList ? (
                <Ionicons name="checkmark-circle" size={20} color="green" />
              ) : (
                <TouchableOpacity onPress={() => handleAddExercise(item.id)}>
                  <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          )
        }}
      />
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
    marginBottom: 16,
    alignItems: 'center'
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 12
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic'
  },
  listItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  listItemText: {
    fontSize: 16
  },
  addItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  addItemText: {
    fontSize: 16
  }
})