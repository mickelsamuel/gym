// src/screens/ExerciseDetailScreen.js
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import WorkoutLogModal from './WorkoutLogModal';

function ExerciseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { exerciseId } = route.params;
  const {
    getExerciseById,
    getMuscleInfo,
    toggleFavorite,
    isFavorite,
    userGoal,
    darkMode
  } = useContext(ExerciseContext);
  const exercise = getExerciseById(exerciseId);

  // States for logging and history
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [nextWorkout, setNextWorkout] = useState(null);

  // States for progress filtering & chart metric
  const [timeRange, setTimeRange] = useState('30'); // options: '7', '30', or 'all'
  const [chartMetric, setChartMetric] = useState('volume'); // options: 'volume', 'weight', 'reps'
  const [isLoading, setIsLoading] = useState(true);

  // Theming
  const textColor = darkMode ? '#FFF' : '#333';
  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const cardColor = darkMode ? '#2C2C2E' : '#FFF';

  // Dimensions
  const screenWidth = Dimensions.get('window').width - 32;

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await DatabaseService.getExerciseHistory(exerciseId);
        setExerciseHistory(history);

        const recommendation = await DatabaseService.calculateNextWorkout(exerciseId);
        setNextWorkout(recommendation);
      } catch (error) {
        console.warn(error);
      } finally {
        setIsLoading(false);
      }
    }
    if (exercise) {
      loadHistory();
    }
  }, [exerciseId, exercise]);

  // Utility: Filter history based on timeRange selection.
  const getFilteredHistory = () => {
    const now = new Date();
    if (timeRange === 'all') {
      return exerciseHistory;
    }
    return exerciseHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      const daysDiff = (now - entryDate) / (1000 * 3600 * 24);
      return daysDiff <= Number(timeRange);
    });
  };

  // Sort the filtered history in ascending order (oldest first)
  const sortedHistory = getFilteredHistory().sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Prepare labels and dataset based on selected metric.
  const rawLabels = sortedHistory.map(entry => {
    const d = new Date(entry.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const rawData = sortedHistory.map(entry => {
    let value = 0;
    if (chartMetric === 'volume') {
      value = Number(entry.reps) * Number(entry.weight);
    } else if (chartMetric === 'weight') {
      value = Number(entry.weight);
    } else if (chartMetric === 'reps') {
      value = Number(entry.reps);
    }
    return Number.isFinite(value) ? value : 0;
  });

  // If there's only one data point, duplicate it to avoid division-by-zero errors
  const chartLabels = rawData.length === 1 ? [...rawLabels, ...rawLabels] : rawLabels;
  const chartDatasetData = rawData.length === 1 ? [...rawData, ...rawData] : rawData;

  const chartData =
    sortedHistory.length > 0
      ? {
          labels: chartLabels,
          datasets: [{ data: chartDatasetData, strokeWidth: 2 }]
        }
      : null;

  // Compute summary metrics for performance
  const totalVolume = sortedHistory.reduce(
    (sum, entry) => sum + (Number(entry.reps) * Number(entry.weight)),
    0
  );
  const avgWeight =
    sortedHistory.length > 0
      ? (
          sortedHistory.reduce((sum, entry) => sum + Number(entry.weight), 0) /
          sortedHistory.length
        ).toFixed(2)
      : 0;
  const avgReps =
    sortedHistory.length > 0
      ? (
          sortedHistory.reduce((sum, entry) => sum + Number(entry.reps), 0) /
          sortedHistory.length
        ).toFixed(2)
      : 0;
  const setCount = sortedHistory.length;
  const maxWeight =
    sortedHistory.length > 0
      ? Math.max(...sortedHistory.map(entry => Number(entry.weight)))
      : 0;

  if (!exercise) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={{ color: textColor }}>Exercise not found</Text>
      </View>
    );
  }

  // De-structure data for muscles and rep ranges
  const primaryMuscles = exercise.primaryMuscles.map(id => getMuscleInfo(id));
  const secondaryMuscles = exercise.secondaryMuscles.map(id => getMuscleInfo(id));
  const goalRepRange =
    exercise.repRanges.find(range => range.goal === userGoal) || exercise.repRanges[0];

  const handleSaveWorkoutSet = async (setData) => {
    try {
      if (editingSet) {
        await DatabaseService.updateWorkoutSet({
          id: editingSet.id,
          date: setData.date,
          exerciseId: exercise.id,
          reps: setData.reps,
          weight: setData.weight,
          notes: setData.notes
        });
        Alert.alert('Success', 'Workout set updated successfully!');
      } else {
        await DatabaseService.saveWorkoutSet({
          date: setData.date,
          exerciseId: exercise.id,
          reps: setData.reps,
          weight: setData.weight,
          notes: setData.notes
        });
        Alert.alert('Success', 'Workout set logged successfully!');
      }
      const history = await DatabaseService.getExerciseHistory(exerciseId);
      setExerciseHistory(history);
      const recommendation = await DatabaseService.calculateNextWorkout(exerciseId);
      setNextWorkout(recommendation);
    } catch (error) {
      Alert.alert(
        'Error',
        editingSet ? 'Failed to update workout set' : 'Failed to log workout set'
      );
    }
    setEditingSet(null);
    setLogModalVisible(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardColor }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.favoriteButton, { backgroundColor: cardColor }]}
            onPress={() => toggleFavorite(exercise.id)}
          >
            <Ionicons
              name={isFavorite(exercise.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite(exercise.id) ? '#FF3B30' : textColor}
            />
          </TouchableOpacity>
        </View>

        {/* Exercise Image */}
        <Image source={exercise.image} style={styles.exerciseImage} />

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.exerciseName, { color: textColor }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseCategory, { color: darkMode ? '#ccc' : '#666' }]}>
            {exercise.category}
          </Text>
          <View style={styles.divider} />

          {/* Muscles */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>Target Muscles</Text>
          <View style={styles.muscleContainer}>
            <View style={styles.muscleGroup}>
              <Text style={[styles.muscleGroupTitle, { color: darkMode ? '#ccc' : '#666' }]}>
                Primary
              </Text>
              {primaryMuscles.map(muscle => (
                <View key={muscle?.id} style={styles.muscleItem}>
                  <View style={[styles.muscleDot, { backgroundColor: muscle?.color || '#000' }]} />
                  <Text style={[styles.muscleName, { color: textColor }]}>{muscle?.name}</Text>
                </View>
              ))}
            </View>
            <View style={styles.muscleGroup}>
              <Text style={[styles.muscleGroupTitle, { color: darkMode ? '#ccc' : '#666' }]}>
                Secondary
              </Text>
              {secondaryMuscles.map(muscle => (
                <View key={muscle?.id} style={styles.muscleItem}>
                  <View style={[styles.muscleDot, { backgroundColor: muscle?.color || '#000' }]} />
                  <Text style={[styles.muscleName, { color: textColor }]}>{muscle?.name}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.divider} />

          {/* Instructions */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>How to Perform</Text>
          <Text style={[styles.instructionsText, { color: textColor }]}>{exercise.instructions}</Text>
          <View style={styles.divider} />

          {/* Recommended Rep Range */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Recommended for {userGoal || 'general'}
          </Text>
          {goalRepRange ? (
            <View style={[styles.recommendationCard, { backgroundColor: darkMode ? '#3A3A3C' : '#F0F7FF' }]}>
              <Text style={[styles.recommendationText, { color: darkMode ? '#FFF' : '#333' }]}>
                Sets: {goalRepRange.sets}
              </Text>
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

          {/* Next Workout Recommendation */}
          {nextWorkout && (
            <View style={styles.nextWorkoutContainer}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Your Next Workout</Text>
              <View style={[styles.nextWorkoutCard, { backgroundColor: '#007AFF' }]}>
                {nextWorkout.weight && (
                  <Text style={styles.nextWorkoutText}>Weight: {nextWorkout.weight}</Text>
                )}
                {nextWorkout.reps && (
                  <Text style={styles.nextWorkoutText}>Reps: {nextWorkout.reps}</Text>
                )}
                <Text style={styles.nextWorkoutMessage}>{nextWorkout.message}</Text>
              </View>
            </View>
          )}

          {/* Performance Metrics */}
          <View style={[styles.metricsCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.metricsTitle, { color: textColor }]}>Performance Metrics</Text>
            <View style={styles.metricsRow}>
              <Text style={[styles.metricsLabel, { color: textColor }]}>Sets:</Text>
              <Text style={[styles.metricsValue, { color: textColor }]}>{setCount}</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={[styles.metricsLabel, { color: textColor }]}>Total Volume:</Text>
              <Text style={[styles.metricsValue, { color: textColor }]}>{totalVolume}</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={[styles.metricsLabel, { color: textColor }]}>Avg Weight:</Text>
              <Text style={[styles.metricsValue, { color: textColor }]}>{avgWeight}</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={[styles.metricsLabel, { color: textColor }]}>Avg Reps:</Text>
              <Text style={[styles.metricsValue, { color: textColor }]}>{avgReps}</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={[styles.metricsLabel, { color: textColor }]}>Max Weight:</Text>
              <Text style={[styles.metricsValue, { color: textColor }]}>{maxWeight}</Text>
            </View>
          </View>

          {/* Time Range & Metric Selector */}
          <View style={styles.selectorContainer}>
            <Text style={[styles.selectorTitle, { color: textColor }]}>Time Range:</Text>
            <View style={styles.selectorRow}>
              {['7', '30', 'all'].map(range => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.selectorButton,
                    {
                      backgroundColor:
                        timeRange === range ? '#007AFF' : darkMode ? '#444' : '#F0F0F0'
                    }
                  ]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text style={{ color: timeRange === range ? '#FFF' : textColor }}>
                    {range === 'all' ? 'All Time' : `${range} Days`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.selectorTitle, { color: textColor, marginTop: 8 }]}>
              Chart Metric:
            </Text>
            <View style={styles.selectorRow}>
              {['volume', 'weight', 'reps'].map(metric => (
                <TouchableOpacity
                  key={metric}
                  style={[
                    styles.selectorButton,
                    {
                      backgroundColor:
                        chartMetric === metric ? '#007AFF' : darkMode ? '#444' : '#F0F0F0'
                    }
                  ]}
                  onPress={() => setChartMetric(metric)}
                >
                  <Text style={{ color: chartMetric === metric ? '#FFF' : textColor }}>
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Progress Chart */}
          {chartData && (
            <>
              <Text style={[styles.sectionTitle, { color: textColor, marginTop: 16 }]}>
                Progress Over Time ({chartMetric.charAt(0).toUpperCase() + chartMetric.slice(1)})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={chartData}
                  width={Math.max(screenWidth, chartLabels.length * 40)}
                  height={220}
                  chartConfig={{
                    backgroundGradientFrom: cardColor,
                    backgroundGradientTo: cardColor,
                    color: opacity => `rgba(0,122,255,${opacity})`,
                    strokeWidth: 2,
                    decimalPlaces: 1,
                    style: { borderRadius: 16 }
                  }}
                  bezier
                  style={{ borderRadius: 16, marginTop: 8 }}
                />
              </ScrollView>
            </>
          )}

          {/* History */}
          <View style={styles.historyContainer}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>History</Text>
            {exerciseHistory.length > 0 ? (
              exerciseHistory.slice(0, 5).map((entry, index) => {
                const date = new Date(entry.date);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => {
                      setEditingSet(entry);
                      setLogModalVisible(true);
                    }}
                  >
                    <Text style={[styles.historyDate, { color: darkMode ? '#ccc' : '#666' }]}>
                      {date.toLocaleDateString()}
                    </Text>
                    <Text style={[styles.historyDetails, { color: textColor }]}>
                      Reps: {entry.reps} | Weight: {entry.weight}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>
                No workout history yet
              </Text>
            )}
          </View>

          {/* Log Button */}
          <TouchableOpacity
            style={[styles.logButton, { backgroundColor: '#007AFF' }]}
            onPress={() => {
              setEditingSet(null);
              setLogModalVisible(true);
            }}
          >
            <Text style={styles.logButtonText}>
              {editingSet ? 'Edit Workout Set' : 'Log Workout Set'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <WorkoutLogModal
        visible={logModalVisible}
        onClose={() => {
          setEditingSet(null);
          setLogModalVisible(false);
        }}
        onSave={handleSaveWorkoutSet}
        exerciseName={exercise.name}
        darkMode={darkMode}
        cardColor={cardColor}
        textColor={textColor}
        initialData={editingSet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center'
  },
  favoriteButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center'
  },
  exerciseImage: {
    width: '100%', height: 250, resizeMode: 'cover'
  },
  infoContainer: { padding: 16 },
  exerciseName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  exerciseCategory: { fontSize: 16, marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  muscleContainer: { flexDirection: 'row' },
  muscleGroup: { flex: 1 },
  muscleGroupTitle: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  muscleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  muscleDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  muscleName: { fontSize: 14 },
  instructionsText: { fontSize: 14, lineHeight: 22 },
  recommendationCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  recommendationText: { fontSize: 14, marginBottom: 8 },
  nextWorkoutContainer: { marginTop: 8 },
  nextWorkoutCard: { borderRadius: 12, padding: 16 },
  nextWorkoutText: { fontSize: 16, fontWeight: '500', color: '#FFF', marginBottom: 8 },
  nextWorkoutMessage: { fontSize: 14, color: '#FFF', fontStyle: 'italic', marginTop: 4 },
  metricsCard: { borderRadius: 12, padding: 16, marginVertical: 12, elevation: 2 },
  metricsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  metricsLabel: { fontSize: 14 },
  metricsValue: { fontSize: 14, fontWeight: '500' },
  selectorContainer: { marginVertical: 12 },
  selectorTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  selectorRow: { flexDirection: 'row', justifyContent: 'space-around' },
  selectorButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginHorizontal: 4 },
  chartContainer: { marginTop: 24, borderRadius: 12, padding: 12, elevation: 2 },
  historyContainer: { marginTop: 16 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  historyDate: { fontSize: 14 },
  historyDetails: { fontSize: 14, fontWeight: '500' },
  emptyText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: 16 },
  logButton: { borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  logButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});

export default ExerciseDetailScreen;