// context/ExerciseContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import exercises and related data
import exercisesData from '../data/exercises';
import muscleGroups from '../data/muscleGroups';
import goals from '../data/goals';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
  // All exercises data
  const [exercises, setExercises] = useState(exercisesData);

  // Favorites
  const [favorites, setFavorites] = useState([]);

  // User's chosen goal
  const [userGoal, setUserGoal] = useState('');

  // Dark mode setting
  const [darkMode, setDarkMode] = useState(false);

  // Load favorites and userGoal from AsyncStorage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.warn('Error loading favorites:', error);
      }
    };

    const loadUserGoal = async () => {
      try {
        const goal = await AsyncStorage.getItem('userGoal');
        if (goal) {
          setUserGoal(goal);
        }
      } catch (error) {
        console.warn('Error loading userGoal:', error);
      }
    };

    loadFavorites();
    loadUserGoal();
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

  // NEW: Add an exercise to favorites if it's not already there
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

  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        favorites,
        userGoal,
        getAllExercises,
        getExercisesByType,
        getExercisesByCategory,
        getExercisesByMuscle,
        getExercisesByGoal,
        toggleFavorite,
        isFavorite,
        addFavorite, // Added function for adding favorites
        setGoal,
        getGoalInfo,
        getExerciseById,
        getMuscleInfo,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
};