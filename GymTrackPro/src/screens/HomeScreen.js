// screens/HomeScreen.js

import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import { LineChart } from 'react-native-chart-kit';

const HomeScreen = () => {
  const navigation = useNavigation();
  const {
    userGoal,
    getGoalInfo,
    favorites,
    getExerciseById,
    darkMode,
    setGoal  // Make sure setGoal is exported from ExerciseContext
  } = useContext(ExerciseContext);

  const [profile, setProfile] = useState(null);
  const [recentExercises, setRecentExercises] = useState([]);
  const [progressData, setProgressData] = useState(null);

  // State to control showing the goal selection modal
  const [showGoalModal, setShowGoalModal] = useState(false);

  // If userGoal is not set, we show the modal after initial load
  useEffect(() => {
    if (!userGoal) {
      setShowGoalModal(true);
    }
  }, [userGoal]);

  // Load user profile & recent exercises
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await DatabaseService.getProfile();
        setProfile(userProfile);
      } catch (error) {
        // handle or ignore error
      }
    };

    const loadRecentExercises = async () => {
      try {
        const recentExerciseIds = favorites.slice(0, 3);
        const exercises = recentExerciseIds
          .map((id) => getExerciseById(id))
          .filter(Boolean);
        setRecentExercises(exercises);

        if (exercises.length > 0) {
          const historyData = await DatabaseService.getExerciseHistory(
            exercises[0].id
          );
          if (historyData.length > 0) {
            const sliced = historyData.slice(0, 5);
            const dates = sliced
              .map((entry) => {
                const date = new Date(entry.date);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              })
              .reverse();
            const weights = sliced.map((entry) => entry.weight).reverse();
            setProgressData({
              labels: dates,
              datasets: [
                {
                  data: weights,
                  strokeWidth: 2
                }
              ],
              exercise: exercises[0].name
            });
          }
        }
      } catch (error) {
        // handle or ignore error
      }
    };

    loadProfile();
    loadRecentExercises();
  }, [favorites, getExerciseById]);

  // When user picks a goal from the modal
  const handleSelectGoal = (goalId) => {
    setGoal(goalId); // This updates userGoal in context
    setShowGoalModal(false);
  };

  const goalInfo = userGoal ? getGoalInfo(userGoal) : null;
  const screenWidth = Dimensions.get('window').width - 32;
  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const textColor = darkMode ? '#FFFFFF' : '#333';
  const cardColor = darkMode ? '#2C2C2E' : '#FFF';

  const chartConfig = {
    backgroundGradientFrom: cardColor,
    backgroundGradientTo: cardColor,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 1,
    style: {
      borderRadius: 16
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Welcome{profile?.name ? `, ${profile.name}` : ''}
          </Text>
          <Text style={[styles.headerSubtitle, { color: darkMode ? '#ccc' : '#666' }]}>
            Let's crush your workout today!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Your Goal</Text>
          <View style={[styles.goalCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.goalTitle, { color: textColor }]}>
              {goalInfo?.name || 'Not set'}
            </Text>
            <Text style={[styles.goalDescription, { color: darkMode ? '#aaa' : '#666' }]}>
              {goalInfo?.description || 'Set your fitness goal in the profile section'}
            </Text>
            {goalInfo && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('Workout')}
              >
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Exercises</Text>
          {recentExercises.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[styles.exerciseCard, { backgroundColor: cardColor }]}
                  onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })}
                >
                  <Image
                    source={{ uri: exercise.imageUri || 'https://via.placeholder.com/100' }}
                    style={styles.exerciseImage}
                  />
                  <Text style={[styles.exerciseName, { color: textColor }]}>
                    {exercise.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.emptyText, { color: darkMode ? '#999' : '#999' }]}>
              No recent exercises
            </Text>
          )}
        </View>

        {progressData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Progress: {progressData.exercise}
            </Text>
            <LineChart
              data={{
                labels: progressData.labels,
                datasets: progressData.datasets
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {goalInfo && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Nutrition Tips</Text>
            <View style={[styles.tipCard, { backgroundColor: cardColor }]}>
              <Text style={[styles.tipTitle, { color: textColor }]}>For {goalInfo.name}</Text>
              <Text style={[styles.tipText, { color: darkMode ? '#aaa' : '#666' }]}>
                {goalInfo.nutritionTips}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal for picking goal if userGoal is not set */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.goalModal, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Select Your Fitness Goal
            </Text>

            <TouchableOpacity onPress={() => handleSelectGoal('strength')}>
              <Text style={[styles.modalOption, { color: textColor }]}>Strength</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSelectGoal('hypertrophy')}>
              <Text style={[styles.modalOption, { color: textColor }]}>Hypertrophy</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSelectGoal('endurance')}>
              <Text style={[styles.modalOption, { color: textColor }]}>Endurance</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSelectGoal('tone')}>
              <Text style={[styles.modalOption, { color: textColor }]}>Tone</Text>
            </TouchableOpacity>

            {/* You can add more goals if needed */}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 60
  },
  header: {
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  goalCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16
  },
  exerciseCard: {
    borderRadius: 12,
    width: 120,
    marginRight: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center'
  },
  exerciseImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 8
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic'
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8
  },
  tipCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20
  },
  /* Modal styling */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  goalModal: {
    borderRadius: 12,
    padding: 24,
    width: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalOption: {
    fontSize: 18,
    marginVertical: 8,
    textAlign: 'center',
    fontWeight: '500'
  }
});