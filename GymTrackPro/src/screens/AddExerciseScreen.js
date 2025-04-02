import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';

export default function AddExerciseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listId } = route.params;
  const { getAllExercises, favorites, addFavorite, darkMode } = useContext(ExerciseContext);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutList, setWorkoutList] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadWorkout() {
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
    }
    loadWorkout();
  }, [listId]);

  const allExercises = getAllExercises();

  // Filter exercises based on search query
  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (exerciseId) => {
    if (selectedExercises.includes(exerciseId)) {
      setSelectedExercises(selectedExercises.filter(id => id !== exerciseId));
    } else {
      if (workoutList && workoutList.exercises.includes(exerciseId)) {
        Alert.alert('Info', 'This exercise is already in your list.');
      } else {
        setSelectedExercises([...selectedExercises, exerciseId]);
      }
    }
  };

  const handleDone = async () => {
    if (selectedExercises.length === 0) {
      Alert.alert('No Selection', 'Please select at least one exercise.');
      return;
    }
    try {
      // Loop through selected exercises and add each one.
      for (const exerciseId of selectedExercises) {
        if (!favorites.includes(exerciseId)) {
          addFavorite(exerciseId);
        }
        await DatabaseService.addExerciseToList(listId, exerciseId);
      }
      Alert.alert('Success', 'Exercises added to your list.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not add selected exercises.');
    }
  };

  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const cardColor = darkMode ? '#2C2C2E' : '#FFF';
  const textColor = darkMode ? '#FFF' : '#333';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.header, { color: textColor }]}>Select Exercises</Text>
        <View style={[styles.searchContainer, { backgroundColor: cardColor }]}>
          <Ionicons name="search" size={20} color={textColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search exercises..."
            placeholderTextColor={darkMode ? '#888' : '#666'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <FlatList
          data={filteredExercises}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const alreadyAdded = workoutList && workoutList.exercises.includes(item.id);
            const isSelected = selectedExercises.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.item, alreadyAdded ? styles.disabledItem : null]}
                onPress={() => toggleSelection(item.id)}
                disabled={alreadyAdded}
              >
                <Text style={[styles.itemText, { color: textColor }]}>{item.name}</Text>
                {alreadyAdded ? (
                  <Ionicons name="checkmark-circle" size={20} color="green" />
                ) : (
                  isSelected && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1 },
  item: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  disabledItem: { opacity: 0.5 },
  itemText: { fontSize: 16 },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  doneButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});