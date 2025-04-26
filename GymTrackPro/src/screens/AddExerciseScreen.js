import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';

const AddExerciseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { listId } = route.params;
  const { getAllExercises, favorites, addFavorite, darkMode } = useContext(ExerciseContext);
  
  // State
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutList, setWorkoutList] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Theme
  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const cardColor = darkMode ? '#2C2C2E' : '#FFF';
  const textColor = darkMode ? '#FFF' : '#333';
  const secondaryTextColor = darkMode ? '#BBBBBB' : '#666';
  const accentColor = '#007AFF';

  useEffect(() => {
    async function loadWorkout() {
      setLoading(true);
      try {
        const allLists = await DatabaseService.getAllWorkoutLists();
        const found = allLists.find(l => l.id === listId);
        if (found) {
          setWorkoutList(found);
          
          // Run animations after data is loaded
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          Alert.alert('Error', 'Workout list not found.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading workout:', error);
        Alert.alert('Error', 'An error occurred while loading the workout.');
      } finally {
        setLoading(false);
      }
    }
    loadWorkout();
  }, [listId]);

  const allExercises = getAllExercises();

  // Filter exercises based on search query
  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.primaryMuscles && ex.primaryMuscles.some(muscle => 
      muscle.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  const toggleSelection = (exerciseId) => {
    Haptics.selectionAsync();
    
    if (selectedExercises.includes(exerciseId)) {
      setSelectedExercises(selectedExercises.filter(id => id !== exerciseId));
    } else {
      if (workoutList && workoutList.exercises.includes(exerciseId)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Already Added', 'This exercise is already in your workout list.');
      } else {
        setSelectedExercises([...selectedExercises, exerciseId]);
      }
    }
  };

  const handleDone = async () => {
    if (selectedExercises.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No Selection', 'Please select at least one exercise.');
      return;
    }
    
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Loop through selected exercises and add each one.
      for (const exerciseId of selectedExercises) {
        if (!favorites.includes(exerciseId)) {
          addFavorite(exerciseId);
        }
        await DatabaseService.addExerciseToList(listId, exerciseId);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success', 
        `${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''} added to your workout.`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not add selected exercises.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>Loading exercises...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0062CC" />
      
      <LinearGradient
        colors={['#0062CC', '#0096FF']}
        style={styles.headerBackground}
      />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          Add to {workoutList?.name || 'Workout'}
        </Text>
        
        <View style={styles.selectionCount}>
          <Text style={styles.selectionCountText}>
            {selectedExercises.length} selected
          </Text>
        </View>
      </View>
      
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={secondaryTextColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search exercises or muscle groups..."
            placeholderTextColor={secondaryTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                Haptics.selectionAsync();
              }}
            >
              <Ionicons name="close-circle" size={20} color={secondaryTextColor} />
            </TouchableOpacity>
          )}
        </View>
        
        {filteredExercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={darkMode ? '#555' : '#DDD'} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              No exercises found
            </Text>
            <Text style={[styles.emptySubtext, { color: darkMode ? '#888' : '#BBB' }]}>
              Try a different search term
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => {
              const alreadyAdded = workoutList && workoutList.exercises.includes(item.id);
              const isSelected = selectedExercises.includes(item.id);
              
              return (
                <Animated.View
                  style={{ 
                    opacity: fadeAnim, 
                    transform: [{ 
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }) 
                    }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.exerciseItem, 
                      { backgroundColor: cardColor },
                      alreadyAdded && styles.disabledItem,
                      isSelected && styles.selectedItem
                    ]}
                    onPress={() => toggleSelection(item.id)}
                    disabled={alreadyAdded}
                    activeOpacity={0.7}
                  >
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exerciseName, { color: textColor }]}>
                        {item.name}
                      </Text>
                      {item.primaryMuscles && (
                        <Text style={[styles.muscleGroupText, { color: secondaryTextColor }]}>
                          {item.primaryMuscles.join(', ')}
                        </Text>
                      )}
                    </View>
                    
                    {alreadyAdded ? (
                      <View style={styles.addedBadge}>
                        <Text style={styles.addedText}>Added</Text>
                      </View>
                    ) : (
                      isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        </View>
                      )
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
      
      <View style={[styles.doneButtonContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity 
          style={[
            styles.doneButton,
            (selectedExercises.length === 0 || submitting) && styles.buttonDisabled
          ]} 
          onPress={handleDone}
          disabled={selectedExercises.length === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.doneButtonText}>
              Add {selectedExercises.length > 0 ? `${selectedExercises.length} Exercise${selectedExercises.length > 1 ? 's' : ''}` : 'Exercises'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  header: {
    paddingHorizontal: 16,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  selectionCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectionCountText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  disabledItem: {
    opacity: 0.6,
  },
  selectedItem: {
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  muscleGroupText: {
    fontSize: 14,
  },
  addedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  addedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  checkmarkContainer: {
    width: 40,
    alignItems: 'center',
  },
  doneButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#97C1F7',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default AddExerciseScreen;