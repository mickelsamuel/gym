// context/ExerciseContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import exercises and related data
import exercisesData from '../data/exercises';
import muscleGroups from '../data/muscleGroups';
import goals from '../data/goals';
import DatabaseService from '../services/DatabaseService';

export const ExerciseContext = createContext();

export const useExercise = () => {
  const context = useContext(ExerciseContext);
  if (context === undefined) {
    throw new Error('useExercise must be used within an ExerciseProvider');
  }
  return context;
};

export const ExerciseProvider = ({ children }) => {
  // All exercises data
  const [exercises, setExercises] = useState(exercisesData);

  // Favorites
  const [favorites, setFavorites] = useState([]);

  // User's chosen goal
  const [userGoal, setUserGoal] = useState('');

  // Dark mode setting
  const [darkMode, setDarkMode] = useState(false);
  
  // Recent workouts
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  
  // Exercise history stats
  const [exerciseStats, setExerciseStats] = useState({});
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    type: null,
    category: null,
    muscle: null,
    equipment: null,
    difficulty: null,
  });

  // Load favorites and userGoal from AsyncStorage on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [
          storedFavorites, 
          goal, 
          theme
        ] = await Promise.all([
          AsyncStorage.getItem('favorites'),
          AsyncStorage.getItem('userGoal'),
          AsyncStorage.getItem('darkMode')
        ]);
        
        // Set favorites if they exist
        if (storedFavorites) {
          try {
            const parsedFavorites = JSON.parse(storedFavorites);
            if (Array.isArray(parsedFavorites)) {
              setFavorites(parsedFavorites);
            }
          } catch (parseError) {
            console.warn('Error parsing favorites:', parseError);
            // Reset favorites if corrupt
            await AsyncStorage.setItem('favorites', JSON.stringify([]));
            setFavorites([]);
          }
        }
        
        // Set goal if it exists
        if (goal) {
          setUserGoal(goal);
        }
        
        // Set theme
        if (theme) {
          setDarkMode(theme === 'true');
        }
        
        try {
          // Get exercise history from database service
          const workoutHistory = await DatabaseService.getExerciseHistory();
          
          if (workoutHistory && Array.isArray(workoutHistory) && workoutHistory.length > 0) {
            const sortedWorkouts = [...workoutHistory].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            );
            setRecentWorkouts(sortedWorkouts.slice(0, 10));
            
            // Generate exercise stats
            processExerciseStats(workoutHistory);
          }
        } catch (historyError) {
          console.warn('Error loading workout history:', historyError);
          // Continue with empty workouts
          setRecentWorkouts([]);
        }
      } catch (error) {
        console.warn('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Save favorites when they change
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (error) {
        console.warn('Error saving favorites:', error);
      }
    };
    saveFavorites();
  }, [favorites]);

  // Save userGoal when it changes
  useEffect(() => {
    const saveUserGoal = async () => {
      try {
        await AsyncStorage.setItem('userGoal', userGoal);
      } catch (error) {
        console.warn('Error saving userGoal:', error);
      }
    };
    saveUserGoal();
  }, [userGoal]);
  
  // Save darkMode when it changes
  useEffect(() => {
    const saveDarkMode = async () => {
      try {
        await AsyncStorage.setItem('darkMode', darkMode.toString());
      } catch (error) {
        console.warn('Error saving theme setting:', error);
      }
    };
    saveDarkMode();
  }, [darkMode]);
  
  // Generate exercise stats from workout history
  const processExerciseStats = useCallback(workoutHistory => {
    if (!Array.isArray(workoutHistory)) {
      console.warn('Workout history is not an array:', workoutHistory);
      return;
    }
    
    const stats = {};
    
    workoutHistory.forEach(workout => {
      if (!workout) return;
      const { exerciseId, exerciseName, weight, reps, sets, date } = workout;
      if (!exerciseId) return;

      if (!stats[exerciseId]) {
        stats[exerciseId] = {
          name: exerciseName || 'Unknown Exercise',
          totalSets: 0,
          totalReps: 0,
          maxWeight: 0,
          lastPerformed: null,
          history: [],
        };
      }

      const currentStats = stats[exerciseId];
      currentStats.totalSets += sets || 0;
      currentStats.totalReps += (reps || 0) * (sets || 0);
      currentStats.maxWeight = Math.max(currentStats.maxWeight, weight || 0);

      if (date) {
        currentStats.history.push({
          date,
          weight: weight || 0,
          reps: reps || 0,
          sets: sets || 0,
          volume: (weight || 0) * (reps || 0) * (sets || 0)
        });
      }

      currentStats.history.sort((a, b) => {
        let dateA = new Date(a.date || 0);
        let dateB = new Date(b.date || 0);
        if (isNaN(dateA.getTime())) dateA = new Date(0);
        if (isNaN(dateB.getTime())) dateB = new Date(0);
        return dateB - dateA;
        });
      
      // Set last performed date
      if (!stats[exerciseId].lastPerformed || 
          (date && new Date(date) > new Date(stats[exerciseId].lastPerformed))) {
        stats[exerciseId].lastPerformed = date;
      }
    });
    
    // Calculate improvement rates (if the exercise has 2 or more workouts)
    Object.values(stats).forEach(exerciseStats => {
      if (exerciseStats.history.length < 2) {
        exerciseStats.improvementRate = 0;
        return;
      }

      const sortedHistory = [...exerciseStats.history].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
      const firstEntry = sortedHistory[0];
      const lastEntry = sortedHistory[sortedHistory.length - 1];

      if (firstEntry.volume > 0) {
        const volumeImprovement = lastEntry.volume - firstEntry.volume;
        const percentImprovement = (volumeImprovement / firstEntry.volume) * 100;
        exerciseStats.improvementRate = Math.round(percentImprovement);
        }
      }
    });
    
    setExerciseStats(stats);
  }, []);
  
  // Refresh workout data
  const refreshWorkoutData = useCallback(async () => {
    setLoading(true);
    try {
      const workoutHistory = await DatabaseService.getExerciseHistory();
      
      if (workoutHistory && workoutHistory.length > 0) {
        const sortedWorkouts = [...workoutHistory].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setRecentWorkouts(sortedWorkouts.slice(0, 10));
        
        // Generate exercise stats
        processExerciseStats(workoutHistory);
      }
    } catch (error) {
      console.warn('Error refreshing workout data:', error);
    } finally {
      setLoading(false);
    }
  }, [processExerciseStats]);

  // Helper methods

  // Return array of ALL exercise objects
  const getAllExercises = () => exercises;

  // Filter exercises by type
  const getExercisesByType = (type) => exercises.filter((ex) => ex.type === type);

  // Filter exercises by category
  const getExercisesByCategory = (category) =>
    exercises.filter((ex) => ex.category === category);

  // Filter exercises by muscle (primary or secondary)
  const getExercisesByMuscle = (muscleGroup) =>
    exercises.filter(
      (exercise) =>
        exercise.primaryMuscles.includes(muscleGroup) ||
        exercise.secondaryMuscles.includes(muscleGroup)
    );

  // Filter exercises by equipment
  const getExercisesByEquipment = (equipment) =>
    exercises.filter((ex) => ex.equipment === equipment);

  // Return exercises recommended for a given goal
  const getExercisesByGoal = (goalId) => {
    const goalData = goals.find((g) => g.id === goalId);
    if (!goalData) return exercises;
    return exercises.filter((exercise) => {
      const matchesType = goalData.recommendedExerciseTypes.includes(exercise.type);
      const hasGoalRange = exercise.repRanges.some((range) => range.goal === goalId);
      return matchesType || hasGoalRange;
    });
  };
  
  // Return exercises by combined filters
  const getFilteredExercises = () => {
    let result = [...exercises];
    
    if (activeFilters.type) {
      result = result.filter(ex => ex.type === activeFilters.type);
    }
    
    if (activeFilters.category) {
      result = result.filter(ex => ex.category === activeFilters.category);
    }
    
    if (activeFilters.muscle) {
      result = result.filter(
        ex => ex.primaryMuscles.includes(activeFilters.muscle) || 
              ex.secondaryMuscles.includes(activeFilters.muscle)
      );
    }
    
    if (activeFilters.equipment) {
      result = result.filter(ex => ex.equipment === activeFilters.equipment);
    }
    
    if (activeFilters.difficulty) {
      result = result.filter(ex => ex.difficulty === activeFilters.difficulty);
    }
    
    return result;
  };
  
  // Set a specific filter
  const setFilter = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      type: null,
      category: null,
      muscle: null,
      equipment: null,
      difficulty: null,
    });
  };

  // Toggle an exercise's favorite status
  const toggleFavorite = (exerciseId) => {
    setFavorites((prev) => {
      if (prev.includes(exerciseId)) {
        return prev.filter((id) => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  // Check if an exercise is favorited
  const isFavorite = (exerciseId) => favorites.includes(exerciseId);

  // Add an exercise to favorites if it's not already there
  const addFavorite = (exerciseId) => {
    setFavorites((prev) => {
      if (!prev.includes(exerciseId)) {
        return [...prev, exerciseId];
      }
      return prev;
    });
  };

  // Update userGoal
  const setGoal = (goal) => setUserGoal(goal);

  // Return info object for a given goal ID
  const getGoalInfo = (goalId) => goals.find((g) => g.id === goalId) || null;

  // Return a single exercise object by ID
  const getExerciseById = (id) => exercises.find((ex) => ex.id === id) || null;

  // Return muscle group info by ID
  const getMuscleInfo = (muscleId) => muscleGroups.find((m) => m.id === muscleId) || null;

  // Toggle dark mode
  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  
  // Get stats for a specific exercise
  const getExerciseStats = (exerciseId) => exerciseStats[exerciseId] || null;
  
  // Get suggested values for next workout based on history and performance
  const getSuggestedValues = (exerciseId, currentValue, isWeight = false) => {
    const stats = exerciseStats[exerciseId];
  
    if (!stats || !stats.history || stats.history.length === 0) {
      return null;
    }
  
    if (stats.history.length === 1) {
      return isWeight ? { min: currentValue, max: currentValue } : { min: currentValue, max: currentValue };
    }
  
    const latestWorkout = stats.history[0];
    const { reps, sets } = latestWorkout;
    const averageVolume = currentValue * reps * sets;
  
    const lastThreeWorkouts = stats.history.slice(0, 3);
    const sumOfLastVolumes = lastThreeWorkouts.reduce((sum, workout) => sum + workout.volume, 0);
    const averageVolumeOfLastThree = lastThreeWorkouts.length > 0 ? sumOfLastVolumes / lastThreeWorkouts.length : 0;
  
    const improvementPercentage = averageVolumeOfLastThree > 0 ? (averageVolume - averageVolumeOfLastThree) / averageVolumeOfLastThree * 100 : 0;
  
    // Adjust value based on recent performance trend
    let suggestedValue = currentValue;
    if (reps > 12 && improvementPercentage >= 0) {
      suggestedValue = Math.round(currentValue * 1.05); // Increase 5%
    } else if (reps < 6 || improvementPercentage < 0) {
      suggestedValue = Math.round(currentValue * 0.95); // Decrease 5%
    }
    
    // Calculate the range, ensuring the current value is within it
    let minWeight = Math.min(currentValue, Math.max(suggestedValue - 5, suggestedValue - (suggestedValue * 0.1)));
    let maxWeight = Math.max(currentValue, Math.min(suggestedValue + 5, suggestedValue + (suggestedValue * 0.1)));
  
    // Ensure the range is not wider than 10
    if (maxWeight - minWeight > 10) {
      const diff = (maxWeight - minWeight) - 10;
      maxWeight -= Math.round(diff / 2);
      minWeight += Math.round(diff / 2);
    }
  
    //For weight, ensure the min value is at least 1
    if (isWeight) minWeight = Math.max(1, minWeight)
  
    return { min: Math.round(minWeight), max: Math.round(maxWeight) };
  };
  
  // Get suggested weight for next workout based on history
  const getSuggestedWeight = (exerciseId) => {
    const stats = exerciseStats[exerciseId];

    if (!stats || !stats.history || stats.history.length === 0) {
      return null;
    }
    
    const latestWorkout = stats.history[0];
    const { weight } = latestWorkout;
    return getSuggestedValues(exerciseId, weight, true)
  };
  
  // Get suggested reps for next workout based on history and goal
  const getSuggestedReps = (exerciseId) => {
    const stats = exerciseStats[exerciseId];
  
    if (!stats || !stats.history || stats.history.length === 0) {
      return null;
    }
    
    // If no goal is set, return a default range
    if (!userGoal) {
      return { min: 8, max: 12 };
    }
    
    const goalData = getGoalInfo(userGoal);
    
    if (!goalData) {
      return { min: 8, max: 12 };
    }
      // Return appropriate rep ranges based on the goal
      let suggestedReps = 10
      switch (userGoal) {
        case 'strength':
          suggestedReps = 5;
          break;
        case 'hypertrophy':
          suggestedReps = 10;
          break;
        case 'endurance':
          suggestedReps = 13;
          break;
        case 'tone':
          suggestedReps = 12;
          break;
      }
    
    return getSuggestedValues(exerciseId, suggestedReps) || { min: 8, max: 12 };
  };

  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        favorites,
        userGoal,
        darkMode,
        loading,
        recentWorkouts,
        exerciseStats,
        activeFilters,
        getAllExercises,
        getExercisesByType,
        getExercisesByCategory,
        getExercisesByMuscle,
        getExercisesByEquipment,
        getExercisesByGoal,
        getFilteredExercises,
        setFilter,
        clearFilters,
        toggleFavorite,
        isFavorite,
        addFavorite,
        setGoal,
        getGoalInfo,
        getExerciseById,
        getMuscleInfo,
        toggleDarkMode,
        refreshWorkoutData,
        getExerciseStats,
        getSuggestedWeight,
        getSuggestedReps,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
};