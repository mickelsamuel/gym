import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import { Ionicons } from '@expo/vector-icons';

const WorkoutScreen = () => {
  const navigation = useNavigation();
  const {
    userGoal,
    getExerciseById,
    favorites,
    getAllExercises,
    darkMode
  } = useContext(ExerciseContext);
  const [workoutLists, setWorkoutLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);

  const loadAllWorkouts = async () => {
    try {
      const lists = await DatabaseService.getAllWorkoutLists();
      setWorkoutLists(lists);
    } catch (error) {
      // Handle error as needed
    }
  };

  useEffect(() => {
    loadAllWorkouts();
  }, []);

  // Refresh workout lists when screen regains focus.
  useFocusEffect(
    useCallback(() => {
      loadAllWorkouts();
    }, [])
  );

  const handleCreateList = async () => {
    if (!newListName) {
      Alert.alert('Error', 'Enter a name for your new workout list.');
      return;
    }
    try {
      const newPlan = await DatabaseService.createWorkoutList(newListName);
      setNewListName('');
      loadAllWorkouts();
      Alert.alert('Success', `Created new workout list: ${newPlan.name}`);
    } catch (error) {
      Alert.alert('Error', 'Could not create new workout list.');
    }
  };

  const handleOpenList = (list) => {
    navigation.navigate('CustomWorkoutDetailScreen', { listId: list.id });
  };

  const favoriteExercises = favorites
    .map((favId) => getExerciseById(favId))
    .filter(Boolean);

  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const cardColor = darkMode ? '#2C2C2E' : '#FFFFFF';
  const textColor = darkMode ? '#FFFFFF' : '#333333';
  const borderColor = darkMode ? '#555555' : '#E0E0E0';

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>My Workout Lists</Text>
      <View style={styles.createRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cardColor,
              borderColor,
              color: textColor
            }
          ]}
          placeholder="e.g. Chest and Triceps"
          placeholderTextColor={darkMode ? '#888' : '#999'}
          value={newListName}
          onChangeText={setNewListName}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreateList}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
      {workoutLists.length > 0 ? (
        workoutLists.map((list) => (
          <TouchableOpacity
            key={list.id}
            style={[styles.listCard, { backgroundColor: cardColor }]}
            onPress={() => handleOpenList(list)}
          >
            <Text style={[styles.listName, { color: textColor }]}>{list.name}</Text>
            <Text style={[styles.listCount, { color: textColor }]}>
              {list.exercises.length} exercises
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>
          No custom workouts yet
        </Text>
      )}
      <TouchableOpacity
        style={[styles.toggleBar, { backgroundColor: darkMode ? '#3A3A3C' : '#EEE' }]}
        onPress={() => setShowFavorites(!showFavorites)}
      >
        <Text style={[styles.toggleBarText, { color: textColor }]}>My Favorite Exercises</Text>
        <Ionicons
          name={showFavorites ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={textColor}
        />
      </TouchableOpacity>
      {showFavorites && favoriteExercises.length > 0 && (
        <View style={styles.favoritesContainer}>
          {favoriteExercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              style={[styles.exerciseCard, { backgroundColor: cardColor }]}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
            >
              <Text style={[styles.exerciseName, { color: textColor }]}>{ex.name}</Text>
              <Text style={[styles.exerciseCategory, { color: darkMode ? '#bbb' : '#666' }]}>
                {ex.category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showFavorites && favoriteExercises.length === 0 && (
        <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>
          No favorite exercises yet
        </Text>
      )}
    </ScrollView>
  );
};

export default WorkoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8
  },
  createRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16
  },
  listCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2
  },
  listName: {
    fontSize: 16,
    fontWeight: '600'
  },
  listCount: {
    fontSize: 14
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 12
  },
  toggleBar: {
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  toggleBarText: {
    fontSize: 16,
    fontWeight: '600'
  },
  favoritesContainer: {
    marginTop: 8
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600'
  },
  exerciseCategory: {
    fontSize: 14,
    marginTop: 4
  }
});