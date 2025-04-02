import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';

export default function CustomWorkoutDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listId } = route.params;
  const { getExerciseById, darkMode } = useContext(ExerciseContext);
  const [workoutList, setWorkoutList] = useState(null);

  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const cardColor = darkMode ? '#2C2C2E' : '#FFF';
  const textColor = darkMode ? '#FFF' : '#333';

  // Function to load the workout list
  const loadWorkout = async () => {
    try {
      const allLists = await DatabaseService.getAllWorkoutLists();
      const found = allLists.find(l => l.id === listId);
      if (found) {
        setWorkoutList(found);
      } else {
        Alert.alert('Error', 'Workout list not found.');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred.');
    }
  };

  // Load workout when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadWorkout();
    }, [listId])
  );

  if (!workoutList) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={{ color: textColor }}>Loading...</Text>
      </View>
    );
  }

  const listExercises = workoutList.exercises
    .map(id => getExerciseById(id))
    .filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: cardColor }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>{workoutList.name}</Text>
      </View>
      <Text style={[styles.subtitle, { color: textColor }]}>Exercises in this list:</Text>
      {listExercises.length > 0 ? (
        <FlatList
          data={listExercises}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.listItem, { backgroundColor: cardColor }]}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
            >
              <Text style={[styles.listItemText, { color: textColor }]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>
          No exercises yet.
        </Text>
      )}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExerciseScreen', { listId })}
        >
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 60, 
    paddingHorizontal: 16, 
    paddingBottom: 40  // Added paddingBottom to lift content above the bottom edge
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
  listItem: { 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 8, 
    elevation: 2 
  },
  listItemText: { 
    fontSize: 16 
  },
  emptyText: { 
    fontSize: 14, 
    fontStyle: 'italic' 
  },
  addButtonContainer: { 
    marginTop: 20, 
    alignItems: 'center', 
    marginBottom: 20  // Added marginBottom to further move the button upward from the very bottom
  },
  addButton: { 
    backgroundColor: '#007AFF', 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 24 
  },
  addButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '600' 
  }
});