import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';

const ExerciseDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { exerciseId } = route.params;
  const { getExerciseById, getMuscleInfo, toggleFavorite, isFavorite, userGoal } = useContext(ExerciseContext);
  
  const exercise = getExerciseById(exerciseId);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [notes, setNotes] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [nextWorkout, setNextWorkout] = useState(null);
  
  useEffect(() => {
    // Load exercise history
    const loadHistory = async () => {
      try {
        setExerciseHistory(history);
        
        // Get next workout recommendation
        const recommendation = await DatabaseService.calculateNextWorkout(exerciseId);
        setNextWorkout(recommendation);
      } catch (error) {
        console.error('Error loading exercise history', error);
      }
    };
    
    if (exercise) {
      loadHistory();
    }
  }, [exerciseId]);
  
  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text>Exercise not found</Text>
      </View>
    );
  }
  
  // Get muscle information
  const primaryMuscles = exercise.primaryMuscles.map(id => getMuscleInfo(id));
  const secondaryMuscles = exercise.secondaryMuscles.map(id => getMuscleInfo(id));
  
  // Get recommended rep range based on user goal
  const goalRepRange = exercise.repRanges.find(range => range.goal === userGoal) || exercise.repRanges[0];
  
  const handleLogWorkout = async () => {
    // Validate inputs
    if (!weight || !reps || !sets) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }
    
    try {
      const weightNum = parseFloat(weight);
      const repsNum = parseInt(reps);
      const setsNum = parseInt(sets);
      
      if (isNaN(weightNum) || isNaN(repsNum) || isNaN(setsNum)) {
        Alert.alert('Invalid Input', 'Please enter valid numbers');
        return;
      }
      
      // Save workout data
      await DatabaseService.saveWorkoutSet({
        date: new Date().toISOString(),
        exerciseId: exercise.id,
        sets: setsNum,
        reps: repsNum,
        weight: weightNum,
        notes: notes
      });
      
      // Refresh data
      const history = await DatabaseService.getExerciseHistory(exerciseId);
      setExerciseHistory(history);
      
      // Get updated recommendation
      const recommendation = await DatabaseService.calculateNextWorkout(exerciseId);
      setNextWorkout(recommendation);
      
      // Close modal and reset fields
      setLogModalVisible(false);
      setWeight('');
      setReps('');
      setSets('');
      setNotes('');
      
      Alert.alert('Success', 'Workout logged successfully!');
    } catch (error) {
      console.error('Error logging workout', error);
      Alert.alert('Error', 'Failed to log workout');
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(exercise.id)}
          >
            <Ionicons 
              name={isFavorite(exercise.id) ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite(exercise.id) ? "#FF3B30" : "#333"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Exercise Image */}
        <Image 
          source={{ uri: exercise.imageUri || 'https://via.placeholder.com/300' }} 
          style={styles.exerciseImage} 
        />
        
        {/* Exercise Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseCategory}>{exercise.category}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Target Muscles</Text>
          <View style={styles.muscleContainer}>
            <View style={styles.muscleGroup}>
              <Text style={styles.muscleGroupTitle}>Primary</Text>
              {primaryMuscles.map(muscle => (
                <View key={muscle.id} style={styles.muscleItem}>
                  <View style={[styles.muscleDot, { backgroundColor: muscle.color }]} />
                  <Text style={styles.muscleName}>{muscle.name}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.muscleGroup}>
              <Text style={styles.muscleGroupTitle}>Secondary</Text>
              {secondaryMuscles.map(muscle => (
                <View key={muscle.id} style={styles.muscleItem}>
                  <View style={[styles.muscleDot, { backgroundColor: muscle.color }]} />
                  <Text style={styles.muscleName}>{muscle.name}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>How to Perform</Text>
          <Text style={styles.instructionsText}>{exercise.instructions}</Text>
          
          <View style={styles.divider} />
          
          {/* Recommendations based on goal */}
          <Text style={styles.sectionTitle}>Recommended for {userGoal}</Text>
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationText}>
              Sets: {goalRepRange.sets}
            </Text>
            <Text style={styles.recommendationText}>
              Reps: {goalRepRange.minReps}-{goalRepRange.maxReps}
            </Text>
            <Text style={styles.recommendationText}>
              Rest: {goalRepRange.restSeconds} seconds
            </Text>
          </View>
          
          {/* Next Workout Recommendation */}
          {nextWorkout && (
            <View style={styles.nextWorkoutContainer}>
              <Text style={styles.sectionTitle}>Your Next Workout</Text>
              <View style={styles.nextWorkoutCard}>
                {nextWorkout.weight && (
                  <Text style={styles.nextWorkoutText}>
                    Weight: {nextWorkout.weight} {exercise.weightUnit || 'lbs'}
                  </Text>
                )}
                {nextWorkout.sets && (
                  <Text style={styles.nextWorkoutText}>
                    Sets: {nextWorkout.sets}
                  </Text>
                )}
                {nextWorkout.reps && (
                  <Text style={styles.nextWorkoutText}>
                    Reps: {nextWorkout.reps}
                  </Text>
                )}
                <Text style={styles.nextWorkoutMessage}>{nextWorkout.message}</Text>
              </View>
            </View>
          )}
          
          {/* History */}
          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>History</Text>
            {exerciseHistory.length > 0 ? (
              exerciseHistory.slice(0, 5).map((entry, index) => {
                const date = new Date(entry.date);
                return (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyDate}>
                      {date.toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyDetails}>
                      {entry.sets} × {entry.reps} @ {entry.weight} {exercise.weightUnit || 'lbs'}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No workout history yet</Text>
            )}
          </View>
          
          {/* Log Workout Button */}
          <TouchableOpacity 
            style={styles.logButton}
            onPress={() => setLogModalVisible(true)}
          >
            <Text style={styles.logButtonText}>Log Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Log Workout Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={logModalVisible}
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log {exercise.name}</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Weight ({exercise.weightUnit || 'lbs'})</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="0.0"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.input}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Sets</Text>
                <TextInput
                  style={styles.input}
                  value={sets}
                  onChangeText={setSets}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about your workout..."
              multiline={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleLogWorkout}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 16,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  muscleContainer: {
    flexDirection: 'row',
  },
  muscleGroup: {
    flex: 1,
  },
  muscleGroupTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  muscleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  muscleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  muscleName: {
    fontSize: 14,
    color: '#333',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  recommendationCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  nextWorkoutContainer: {
    marginTop: 8,
  },
  nextWorkoutCard: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
  },
  nextWorkoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 8,
  },
  nextWorkoutMessage: {
    fontSize: 14,
    color: '#FFF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  historyContainer: {
    marginTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  logButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExerciseDetailScreen;const history = await DatabaseService.getExerciseHistory(exerciseId);