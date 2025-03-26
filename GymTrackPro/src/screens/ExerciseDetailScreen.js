import React, { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LineChart } from 'react-native-chart-kit'
import { ExerciseContext } from '../context/ExerciseContext'
import DatabaseService from '../services/DatabaseService'

export default function ExerciseDetailScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { exerciseId } = route.params
  const { getExerciseById, getMuscleInfo, toggleFavorite, isFavorite, userGoal, darkMode } = useContext(ExerciseContext)
  const exercise = getExerciseById(exerciseId)
  const [logModalVisible, setLogModalVisible] = useState(false)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [notes, setNotes] = useState('')
  const [exerciseHistory, setExerciseHistory] = useState([])
  const [nextWorkout, setNextWorkout] = useState(null)
  const [chartData, setChartData] = useState(null)
  const textColor = darkMode ? '#FFF' : '#333'
  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA'
  const cardColor = darkMode ? '#2C2C2E' : '#FFF'

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await DatabaseService.getExerciseHistory(exerciseId)
        setExerciseHistory(history)
        if (history.length > 0) {
          const reversed = [...history].reverse()
          const dates = reversed.map(entry => {
            const d = new Date(entry.date)
            return `${d.getMonth() + 1}/${d.getDate()}`
          })
          const volumes = reversed.map(entry => entry.sets * entry.reps * entry.weight)
          setChartData({
            labels: dates,
            datasets: [{ data: volumes, strokeWidth: 2 }]
          })
        } else {
          setChartData(null)
        }
        const recommendation = await DatabaseService.calculateNextWorkout(exerciseId)
        setNextWorkout(recommendation)
      } catch {}
    }
    if (exercise) {
      loadHistory()
    }
  }, [exerciseId])

  if (!exercise) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={{ color: textColor }}>Exercise not found</Text>
      </View>
    )
  }

  const primaryMuscles = exercise.primaryMuscles.map(id => getMuscleInfo(id))
  const secondaryMuscles = exercise.secondaryMuscles.map(id => getMuscleInfo(id))
  const goalRepRange = exercise.repRanges.find(range => range.goal === userGoal) || exercise.repRanges[0]
  const screenWidth = Dimensions.get('window').width - 32

  const handleLogWorkout = async () => {
    if (!weight || !reps || !sets) {
      Alert.alert('Missing Information', 'Please fill in all fields')
      return
    }
    try {
      const weightNum = parseFloat(weight)
      const repsNum = parseInt(reps)
      const setsNum = parseInt(sets)
      if (isNaN(weightNum) || isNaN(repsNum) || isNaN(setsNum)) {
        Alert.alert('Invalid Input', 'Please enter valid numbers')
        return
      }
      await DatabaseService.saveWorkoutSet({
        date: new Date().toISOString(),
        exerciseId: exercise.id,
        sets: setsNum,
        reps: repsNum,
        weight: weightNum,
        notes
      })
      const history = await DatabaseService.getExerciseHistory(exerciseId)
      setExerciseHistory(history)
      const recommendation = await DatabaseService.calculateNextWorkout(exerciseId)
      setNextWorkout(recommendation)
      if (history.length > 0) {
        const reversed = [...history].reverse()
        const dates = reversed.map(entry => {
          const d = new Date(entry.date)
          return `${d.getMonth() + 1}/${d.getDate()}`
        })
        const volumes = reversed.map(entry => entry.sets * entry.reps * entry.weight)
        setChartData({
          labels: dates,
          datasets: [{ data: volumes, strokeWidth: 2 }]
        })
      } else {
        setChartData(null)
      }
      setLogModalVisible(false)
      setWeight('')
      setReps('')
      setSets('')
      setNotes('')
      Alert.alert('Success', 'Workout logged successfully!')
    } catch {
      Alert.alert('Error', 'Failed to log workout')
    }
  }

  const chartConfig = {
    backgroundGradientFrom: cardColor,
    backgroundGradientTo: cardColor,
    color: opacity => `rgba(0,122,255,${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 1,
    style: { borderRadius: 16 }
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: cardColor }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.favoriteButton, { backgroundColor: cardColor }]} onPress={() => toggleFavorite(exercise.id)}>
            <Ionicons
              name={isFavorite(exercise.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite(exercise.id) ? '#FF3B30' : textColor}
            />
          </TouchableOpacity>
        </View>
        <Image source={exercise.image || require('../images/barbell-bench-press.png')} style={styles.exerciseImage} />
        <View style={styles.infoContainer}>
          <Text style={[styles.exerciseName, { color: textColor }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseCategory, { color: darkMode ? '#ccc' : '#666' }]}>{exercise.category}</Text>
          <View style={styles.divider} />
          <Text style={[styles.sectionTitle, { color: textColor }]}>Target Muscles</Text>
          <View style={styles.muscleContainer}>
            <View style={styles.muscleGroup}>
              <Text style={[styles.muscleGroupTitle, { color: darkMode ? '#ccc' : '#666' }]}>Primary</Text>
              {primaryMuscles.map(muscle => (
                <View key={muscle?.id} style={styles.muscleItem}>
                  <View style={[styles.muscleDot, { backgroundColor: muscle?.color || '#000' }]} />
                  <Text style={[styles.muscleName, { color: textColor }]}>{muscle?.name}</Text>
                </View>
              ))}
            </View>
            <View style={styles.muscleGroup}>
              <Text style={[styles.muscleGroupTitle, { color: darkMode ? '#ccc' : '#666' }]}>Secondary</Text>
              {secondaryMuscles.map(muscle => (
                <View key={muscle?.id} style={styles.muscleItem}>
                  <View style={[styles.muscleDot, { backgroundColor: muscle?.color || '#000' }]} />
                  <Text style={[styles.muscleName, { color: textColor }]}>{muscle?.name}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={[styles.sectionTitle, { color: textColor }]}>How to Perform</Text>
          <Text style={[styles.instructionsText, { color: textColor }]}>{exercise.instructions}</Text>
          <View style={styles.divider} />
          <Text style={[styles.sectionTitle, { color: textColor }]}>Recommended for {userGoal || 'general'}</Text>
          {goalRepRange ? (
            <View style={[styles.recommendationCard, { backgroundColor: darkMode ? '#3A3A3C' : '#F0F7FF' }]}>
              <Text style={[styles.recommendationText, { color: darkMode ? '#FFF' : '#333' }]}>Sets: {goalRepRange.sets}</Text>
              <Text style={[styles.recommendationText, { color: darkMode ? '#FFF' : '#333' }]}>
                Reps: {goalRepRange.minReps}-{goalRepRange.maxReps}
              </Text>
              <Text style={[styles.recommendationText, { color: darkMode ? '#FFF' : '#333' }]}>
                Rest: {goalRepRange.restSeconds} seconds
              </Text>
            </View>
          ) : (
            <Text style={{ color: textColor }}>No rep range data available</Text>
          )}
          {nextWorkout && (
            <View style={styles.nextWorkoutContainer}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Your Next Workout</Text>
              <View style={[styles.nextWorkoutCard, { backgroundColor: '#007AFF' }]}>
                {nextWorkout.weight && <Text style={styles.nextWorkoutText}>Weight: {nextWorkout.weight}</Text>}
                {nextWorkout.sets && <Text style={styles.nextWorkoutText}>Sets: {nextWorkout.sets}</Text>}
                {nextWorkout.reps && <Text style={styles.nextWorkoutText}>Reps: {nextWorkout.reps}</Text>}
                <Text style={styles.nextWorkoutMessage}>{nextWorkout.message}</Text>
              </View>
            </View>
          )}
          {chartData && (
            <View style={[styles.chartContainer, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Progress Over Time (Volume)</Text>
              <LineChart
                data={chartData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 16, marginTop: 8 }}
              />
            </View>
          )}
          <View style={styles.historyContainer}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>History</Text>
            {exerciseHistory.length > 0 ? (
              exerciseHistory.slice(0, 5).map((entry, index) => {
                const date = new Date(entry.date)
                return (
                  <View key={index} style={styles.historyItem}>
                    <Text style={[styles.historyDate, { color: darkMode ? '#ccc' : '#666' }]}>{date.toLocaleDateString()}</Text>
                    <Text style={[styles.historyDetails, { color: textColor }]}>
                      {entry.sets} × {entry.reps} @ {entry.weight}
                    </Text>
                  </View>
                )
              })
            ) : (
              <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>No workout history yet</Text>
            )}
          </View>
          <TouchableOpacity style={[styles.logButton, { backgroundColor: '#007AFF' }]} onPress={() => setLogModalVisible(true)}>
            <Text style={styles.logButtonText}>Log Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal animationType="slide" transparent visible={logModalVisible} onRequestClose={() => setLogModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Log {exercise.name}</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: darkMode ? '#ccc' : '#666' }]}>Weight</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: darkMode ? '#555' : '#E0E0E0', backgroundColor: cardColor }]}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="0.0"
                  placeholderTextColor={darkMode ? '#888' : '#999'}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: darkMode ? '#ccc' : '#666' }]}>Reps</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: darkMode ? '#555' : '#E0E0E0', backgroundColor: cardColor }]}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="0"
                  placeholderTextColor={darkMode ? '#888' : '#999'}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: darkMode ? '#ccc' : '#666' }]}>Sets</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: darkMode ? '#555' : '#E0E0E0', backgroundColor: cardColor }]}
                  value={sets}
                  onChangeText={setSets}
                  placeholder="0"
                  placeholderTextColor={darkMode ? '#888' : '#999'}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <Text style={[styles.inputLabel, { color: darkMode ? '#ccc' : '#666', marginTop: 16 }]}>Notes</Text>
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                { color: textColor, borderColor: darkMode ? '#555' : '#E0E0E0', backgroundColor: cardColor }
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor={darkMode ? '#888' : '#999'}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: darkMode ? '#444' : '#F0F0F0' }]} onPress={() => setLogModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: darkMode ? '#FFF' : '#333' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#007AFF' }]} onPress={handleLogWorkout}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContainer: {
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  exerciseImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover'
  },
  infoContainer: {
    padding: 16
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  exerciseCategory: {
    fontSize: 16,
    marginBottom: 16
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  muscleContainer: {
    flexDirection: 'row'
  },
  muscleGroup: {
    flex: 1
  },
  muscleGroupTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8
  },
  muscleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  muscleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  muscleName: {
    fontSize: 14
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22
  },
  recommendationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  recommendationText: {
    fontSize: 14,
    marginBottom: 8
  },
  nextWorkoutContainer: {
    marginTop: 8
  },
  nextWorkoutCard: {
    borderRadius: 12,
    padding: 16
  },
  nextWorkoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 8
  },
  nextWorkoutMessage: {
    fontSize: 14,
    color: '#FFF',
    fontStyle: 'italic',
    marginTop: 4
  },
  chartContainer: {
    marginTop: 24,
    borderRadius: 12,
    padding: 12,
    elevation: 2
  },
  historyContainer: {
    marginTop: 16
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  historyDate: {
    fontSize: 14
  },
  historyDetails: {
    fontSize: 14,
    fontWeight: '500'
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16
  },
  logButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24
  },
  logButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between'
  },
  inputContainer: {
    flex: 1,
    marginRight: 8
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  }
})