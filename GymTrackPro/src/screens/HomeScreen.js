import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import { LineChart } from 'react-native-chart-kit';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { userGoal, getGoalInfo, favorites, getExerciseById } = useContext(ExerciseContext);
  const [profile, setProfile] = useState(null);
  const [recentExercises, setRecentExercises] = useState([]);
  const [progressData, setProgressData] = useState(null);
  
  useEffect(() => {
    // Load user profile
    const loadProfile = async () => {
      try {
        const userProfile = await DatabaseService.getProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile', error);
      }
    };
    
    // Load recent exercises
    const loadRecentExercises = async () => {
      try {
        // This would normally query your database for recent exercises
        // For now, we'll just use the first 3 favorites as a placeholder
        const recentExerciseIds = favorites.slice(0, 3);
        const exercises = recentExerciseIds.map(id => getExerciseById(id)).filter(Boolean);
        setRecentExercises(exercises);
        
        // Generate progress data for the first exercise if available
        if (exercises.length > 0) {
          const historyData = await DatabaseService.getExerciseHistory(exercises[0].id);
          
          if (historyData.length > 0) {
            // Create data for chart
            const dates = historyData.slice(0, 5).map(entry => {
              const date = new Date(entry.date);
              return `${date.getMonth()+1}/${date.getDate()}`;
            }).reverse();
            
            const weights = historyData.slice(0, 5).map(entry => entry.weight).reverse();
            
            setProgressData({
              labels: dates,
              datasets: [
                {
                  data: weights,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  strokeWidth: 2
                }
              ],
              exercise: exercises[0].name
            });
          }
        }
      } catch (error) {
        console.error('Error loading recent exercises', error);
      }
    };
    
    loadProfile();
    loadRecentExercises();
  }, [favorites, getExerciseById]);
  
  const goalInfo = userGoal ? getGoalInfo(userGoal) : null;
  
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 1,
    style: {
      borderRadius: 16
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Welcome{profile?.name ? `, ${profile.name}` : ''}
          </Text>
          <Text style={styles.headerSubtitle}>Let's crush your workout today!</Text>
        </View>
        
        {/* Goal Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Goal</Text>
          <View style={styles.goalCard}>
            <Text style={styles.goalTitle}>{goalInfo?.name || 'Not set'}</Text>
            <Text style={styles.goalDescription}>
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
        
        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Exercises</Text>
          {recentExercises.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentExercises.map(exercise => (
                <TouchableOpacity 
                  key={exercise.id}
                  style={styles.exerciseCard}
                  onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })}
                >
                  <Image 
                    source={{ uri: exercise.imageUri || 'https://via.placeholder.com/100' }} 
                    style={styles.exerciseImage} 
                  />
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No recent exercises</Text>
          )}
        </View>
        
        {/* Progress Chart */}
        {progressData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress: {progressData.exercise}</Text>
            <LineChart
              data={progressData}
              width={320}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}
        
        {/* Diet Tips */}
        {goalInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Tips</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>For {goalInfo.name}</Text>
              <Text style={styles.tipText}>{goalInfo.nutritionTips}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  exerciseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: 120,
    marginRight: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  exerciseImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
    paddingRight: 16,
  },
  tipCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HomeScreen;