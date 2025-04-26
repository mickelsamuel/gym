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
          theme,
          workoutHistory
        ] = await Promise.all([
          AsyncStorage.getItem('favorites'),
          AsyncStorage.getItem('userGoal'),
          AsyncStorage.getItem('darkMode'),
          DatabaseService.getExerciseHistory()
        ]);
        
        // Set favorites if they exist
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
        
        // Set goal if it exists
        if (goal) {
          setUserGoal(goal);
        }
        
        // Set theme
        if (theme) {
          setDarkMode(theme === 'true');
        }
        
        // Process workouts to get recent ones
        if (workoutHistory && workoutHistory.length > 0) {
          const sortedWorkouts = [...workoutHistory].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          setRecentWorkouts(sortedWorkouts.slice(0, 10));
          
          // Generate exercise stats
          processExerciseStats(workoutHistory);
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
  const processExerciseStats = useCallback((workoutHistory) => {
    const stats = {};
    
    workoutHistory.forEach(workout => {
      const { exerciseId, exerciseName, weight, reps, sets, date } = workout;
      
      if (!exerciseId) return;
      
      if (!stats[exerciseId]) {
        stats[exerciseId] = {
          name: exerciseName,
          totalSets: 0,
          totalReps: 0,
          maxWeight: 0,
          history: [],
          lastPerformed: null,
          improvementRate: 0, // percentage improvement over time
        };
      }
      
      // Sum totals
      stats[exerciseId].totalSets += sets || 0;
      stats[exerciseId].totalReps += reps * sets || 0;
      
      // Track max weight
      if (weight > stats[exerciseId].maxWeight) {
        stats[exerciseId].maxWeight = weight;
      }
      
      // Add to history
      stats[exerciseId].history.push({
        date,
        weight,
        reps,
        sets,
        volume: weight * reps * sets,
      });
      
      // Sort history by date (newest first)
      stats[exerciseId].history.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Set last performed date
      if (!stats[exerciseId].lastPerformed || new Date(date) > new Date(stats[exerciseId].lastPerformed)) {
        stats[exerciseId].lastPerformed = date;
      }
    });
    
    // Calculate improvement rates
    Object.keys(stats).forEach(id => {
      const { history } = stats[id];
      
      if (history.length >= 2) {
        // Sort by date (oldest first)
        const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Take first and last entry
        const firstEntry = sortedHistory[0];
        const lastEntry = sortedHistory[sortedHistory.length - 1];
        
        // Calculate improvement in volume
        const volumeImprovement = lastEntry.volume - firstEntry.volume;
        const percentImprovement = (volumeImprovement / firstEntry.volume) * 100;
        
        stats[id].improvementRate = Math.round(percentImprovement);
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
  
  // Get suggested weight for next workout based on history
  const getSuggestedWeight = (exerciseId) => {
    const stats = exerciseStats[exerciseId];
    
    if (!stats || !stats.history || stats.history.length === 0) {
      return null;
    }
    
    // Get the latest workout
    const latestWorkout = stats.history[0];
    const { weight, reps } = latestWorkout;
    
    // If user completed more than 12 reps in their last workout, suggest increasing weight
    if (reps > 12) {
      return Math.round(weight * 1.05); // 5% increase
    }
    
    // If user completed less than 6 reps, suggest decreasing weight
    if (reps < 6) {
      return Math.round(weight * 0.95); // 5% decrease
    }
    
    // Otherwise, suggest the same weight
    return weight;
  };
  
  // Get suggested reps for next workout based on history and goal
  const getSuggestedReps = (exerciseId) => {
    // If no goal is set, return a default range
    if (!userGoal) {
      return { min: 8, max: 12 };
    }
    
    const goalData = getGoalInfo(userGoal);
    
    if (!goalData) {
      return { min: 8, max: 12 };
    }
    
    // Return appropriate rep ranges based on the goal
    switch (userGoal) {
      case 'strength':
        return { min: 4, max: 6 };
      case 'hypertrophy':
        return { min: 8, max: 12 };
      case 'endurance':
        return { min: 12, max: 15 };
      case 'tone':
        return { min: 10, max: 15 };
      default:
        return { min: 8, max: 12 };
    }
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