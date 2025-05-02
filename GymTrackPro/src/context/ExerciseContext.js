// context/ExerciseContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import DatabaseService from '../services/DatabaseService';
import { MUSCLE_GROUPS, GOALS, StorageKeys } from '../constants';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { db, FIREBASE_PATHS } from '../services/firebase';
import { getExercises, getMuscleGroups, getWorkoutCategories, getGoals, initializeAppData } from '../utils/dataLoader';
import { logError } from '../utils/logging';

export const ExerciseContext = createContext();

export const useExercise = () => {
  const context = useContext(ExerciseContext);
  if (context === undefined) {
    throw new Error('useExercise must be used within an ExerciseProvider');
  }
  return context;
};

export const ExerciseProvider = ({ children }) => {
  const { currentUser, isOnline } = useAuth();
  
  // All exercises data
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [workoutCategories, setWorkoutCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    type: null,
    category: null,
    muscle: null,
    equipment: null,
    difficulty: null,
    search: null,
  });
  
  // Fetch exercises from Firebase if available, otherwise use local storage
  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      
      // Initialize app data - this will attempt to migrate data to Firestore
      // and fetch data from the best available source
      await initializeAppData();
      
      // Fetch all data types
      const [exerciseData, muscleGroupData, categoryData, goalData] = await Promise.all([
        getExercises(),
        getMuscleGroups(),
        getWorkoutCategories(),
        getGoals()
      ]);
      
      // Update state
      setExercises(exerciseData);
      setMuscleGroups(muscleGroupData);
      setWorkoutCategories(categoryData);
      setGoals(goalData);
      
      setError(null);
    } catch (error) {
      console.error('Error in fetchExercises:', error);
      logError('fetch_exercises_error', error);
      setError('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }, [isOnline]);
  
  // Load user data on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load exercises
        await fetchExercises();
        
        // Load user settings
        await loadUserSettings();
        
        // Load workout data if user is logged in
        if (currentUser) {
          await loadWorkoutData();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        logError('load_data_error', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, fetchExercises, isOnline]);
  
  // Load user settings from AsyncStorage
  const loadUserSettings = async () => {
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
          logError('parse_favorites_error', parseError);
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
    } catch (error) {
      console.warn('Error loading user settings:', error);
      logError('load_settings_error', error);
    }
  };
  
  // Load workout data from database service
  const loadWorkoutData = async () => {
    try {
      if (currentUser) {
        // Get recent workouts
        const workoutsResponse = await DatabaseService.getRecentWorkouts(currentUser.uid, isOnline, 10);
        
        if (workoutsResponse.success && workoutsResponse.data) {
          setRecentWorkouts(workoutsResponse.data);
          
          // Generate exercise stats
          processExerciseStats(workoutsResponse.data);
        }
      }
    } catch (error) {
      console.warn('Error loading workout data:', error);
      logError('load_workout_data_error', error);
    }
  };
  
  // Save favorites when they change
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (error) {
        console.warn('Error saving favorites:', error);
        logError('save_favorites_error', error);
      }
    };
    
    if (favorites.length > 0) {
      saveFavorites();
    }
  }, [favorites]);
  
  // Save user goal when it changes
  useEffect(() => {
    const saveUserGoal = async () => {
      try {
        await AsyncStorage.setItem('userGoal', userGoal);
      } catch (error) {
        console.warn('Error saving user goal:', error);
        logError('save_user_goal_error', error);
      }
    };
    
    if (userGoal) {
      saveUserGoal();
    }
  }, [userGoal]);
  
  // Save dark mode preference when it changes
  useEffect(() => {
    const saveDarkMode = async () => {
      try {
        await AsyncStorage.setItem('darkMode', darkMode.toString());
      } catch (error) {
        console.warn('Error saving dark mode setting:', error);
        logError('save_dark_mode_error', error);
      }
    };
    
    saveDarkMode();
  }, [darkMode]);
  
  // Process workout data to generate exercise stats
  const processExerciseStats = (workouts) => {
    const stats = {};
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!stats[exercise.id]) {
          stats[exercise.id] = {
            sets: [],
            lastUsed: workout.date,
            frequency: 1
          };
        } else {
          stats[exercise.id].frequency += 1;
          
          // Update last used date if workout is more recent
          if (new Date(workout.date) > new Date(stats[exercise.id].lastUsed)) {
            stats[exercise.id].lastUsed = workout.date;
          }
        }
        
        // Add sets to the stats
        exercise.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) {
            stats[exercise.id].sets.push({
              weight: set.weight,
              reps: set.reps,
              date: workout.date
            });
          }
        });
      });
    });
    
    // Find personal bests for each exercise
    for (const exerciseId in stats) {
      // Sort sets by weight (descending)
      const sortedByWeight = [...stats[exerciseId].sets].sort((a, b) => b.weight - a.weight);
      stats[exerciseId].personalBest = sortedByWeight.length > 0 ? sortedByWeight[0] : null;
      
      // Calculate average weight
      const totalWeight = stats[exerciseId].sets.reduce((sum, set) => sum + set.weight, 0);
      stats[exerciseId].averageWeight = stats[exerciseId].sets.length > 0 
        ? totalWeight / stats[exerciseId].sets.length 
        : 0;
      
      // Calculate average reps
      const totalReps = stats[exerciseId].sets.reduce((sum, set) => sum + set.reps, 0);
      stats[exerciseId].averageReps = stats[exerciseId].sets.length > 0 
        ? totalReps / stats[exerciseId].sets.length 
        : 0;
    }
    
    setExerciseStats(stats);
  };
  
  // Get all exercises
  const getAllExercises = () => exercises;
  
  // Get exercises by type
  const getExercisesByType = (type) => 
    exercises.filter((ex) => ex.type === type);
  
  // Get exercises by category
  const getExercisesByCategory = (category) =>
    exercises.filter((ex) => ex.category === category);
  
  // Get exercises by muscle group
  const getExercisesByMuscle = (muscleGroup) =>
    exercises.filter((ex) => 
      ex.muscleGroups && ex.muscleGroups.includes(muscleGroup));
  
  // Get exercises by equipment
  const getExercisesByEquipment = (equipment) =>
    exercises.filter((ex) => ex.equipment === equipment);
  
  // Get exercises by goal
  const getExercisesByGoal = (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal && goal.recommendedExercises) {
      return exercises.filter(ex => goal.recommendedExercises.includes(ex.id));
    }
    return [];
  };
  
  // Apply active filters to get filtered exercises
  const getFilteredExercises = () => {
    let filtered = [...exercises];
    
    // Apply type filter
    if (activeFilters.type) {
      filtered = filtered.filter((ex) => ex.type === activeFilters.type);
    }
    
    // Apply category filter
    if (activeFilters.category) {
      filtered = filtered.filter((ex) => ex.category === activeFilters.category);
    }
    
    // Apply muscle filter
    if (activeFilters.muscle) {
      filtered = filtered.filter((ex) => 
        ex.muscleGroups && ex.muscleGroups.includes(activeFilters.muscle));
    }
    
    // Apply equipment filter
    if (activeFilters.equipment) {
      filtered = filtered.filter((ex) => ex.equipment === activeFilters.equipment);
    }
    
    // Apply difficulty filter
    if (activeFilters.difficulty) {
      filtered = filtered.filter((ex) => ex.difficulty === activeFilters.difficulty);
    }
    
    // Apply search filter
    if (activeFilters.search) {
      const searchTerm = activeFilters.search.toLowerCase();
      filtered = filtered.filter((ex) => 
        ex.name.toLowerCase().includes(searchTerm) ||
        (ex.description && ex.description.toLowerCase().includes(searchTerm)));
    }
    
    // Apply favorites filter
    if (activeFilters.favorites) {
      filtered = filtered.filter((ex) => favorites.includes(ex.id));
    }
    
    return filtered;
  };
  
  // Set a filter
  const setFilter = (filterType, value) => {
    setActiveFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
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
      search: null,
      favorites: false
    });
  };
  
  // Toggle favorite status of an exercise
  const toggleFavorite = (exerciseId) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.includes(exerciseId)) {
        return prevFavorites.filter(id => id !== exerciseId);
      } else {
        return [...prevFavorites, exerciseId];
      }
    });
  };
  
  // Check if exercise is favorite
  const isFavorite = (exerciseId) => favorites.includes(exerciseId);
  
  // Add to favorites
  const addFavorite = (exerciseId) => {
    if (!favorites.includes(exerciseId)) {
      setFavorites([...favorites, exerciseId]);
    }
  };
  
  // Remove from favorites
  const removeFavorite = (exerciseId) => {
    setFavorites(favorites.filter(id => id !== exerciseId));
  };
  
  // Set user goal
  const setGoal = (goal) => setUserGoal(goal);
  
  // Get goal information
  const getGoalInfo = (goalId) => 
    goals.find((g) => g.id === goalId) || null;
  
  // Get exercise by ID
  const getExerciseById = (id) => 
    exercises.find((ex) => ex.id === id) || null;
  
  // Get muscle group information
  const getMuscleInfo = (muscleId) => 
    muscleGroups.find((m) => m.id === muscleId) || null;
  
  // Toggle dark mode
  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  
  // Get stats for an exercise
  const getExerciseStats = (exerciseId) => 
    exerciseStats[exerciseId] || null;
  
  // Get suggested values for an exercise (weight or reps)
  const getSuggestedValues = (exerciseId, currentValue, isWeight = false) => {
    const stats = exerciseStats[exerciseId];
    
    if (!stats) {
      return [currentValue];
    }
    
    if (isWeight) {
      // Suggest weights
      if (stats.personalBest) {
        // Create an array of 5 suggested weights based on personal best
        const personalBest = stats.personalBest.weight;
        const suggestions = [
          Math.max(personalBest - 5, 0),  // Slightly lower for warm-up
          Math.max(personalBest - 2.5, 0), // Just below PB
          personalBest,                    // Personal best
          personalBest + 2.5,             // New target
          personalBest + 5                // Ambitious target
        ];
        return suggestions;
      }
    } else {
      // Suggest reps
      if (stats.averageReps) {
        // Create an array of rep ranges
        return [
          Math.max(Math.floor(stats.averageReps) - 2, 1),
          Math.floor(stats.averageReps),
          Math.floor(stats.averageReps) + 2
        ];
      }
    }
    
    return [currentValue];
  };
  
  // Shortcut for getting suggested weight
  const getSuggestedWeight = (exerciseId) => 
    getSuggestedValues(exerciseId, 0, true);
  
  // Shortcut for getting suggested reps
  const getSuggestedReps = (exerciseId) => 
    getSuggestedValues(exerciseId, 10, false);
  
  const value = {
    exercises,
    loading,
    error,
    favorites,
    userGoal,
    darkMode,
    recentWorkouts,
    exerciseStats,
    muscleGroups,
    workoutCategories,
    goals,
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
    removeFavorite,
    setGoal,
    getGoalInfo,
    getExerciseById,
    getMuscleInfo,
    toggleDarkMode,
    getExerciseStats,
    getSuggestedWeight,
    getSuggestedReps
  };
  
  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};