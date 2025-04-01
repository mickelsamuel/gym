// context/ExerciseContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1) Now we import from a single "exercises.js" file:
import exercisesData from '../data/exercises';
import muscleGroups from '../data/muscleGroups';
import goals from '../data/goals';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
  // Instead of an object with gym/dumbbell/bodyweight,
  // we just store one array of all exercises:
  const [exercises, setExercises] = useState(exercisesData);

  // Keep favorites the same
  const [favorites, setFavorites] = useState([]);

  // The user's chosen fitness goal
  const [userGoal, setUserGoal] = useState('');

  // Dark mode toggle
  const [darkMode, setDarkMode] = useState(false);

  // ---------------------------------------------------------------------------
  // LOAD FROM ASYNCSTORAGE ON MOUNT
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // SAVE Favorites & Goal whenever they change
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------
  // Return array of ALL exercise objects
  const getAllExercises = () => {
    return exercises; // No need to merge from multiple files anymore
  };

  // If you want to filter by 'gym' / 'bodyweight' / 'dumbbell'
  const getExercisesByType = (type) => {
    return exercises.filter((ex) => ex.type === type);
  };

  // Or if you want to filter by the "category" property
  const getExercisesByCategory = (category) => {
    return exercises.filter((ex) => ex.category === category);
  };

  // Return exercises that match a primary or secondary muscle
  const getExercisesByMuscle = (muscleGroup) => {
    return exercises.filter(
      (exercise) =>
        exercise.primaryMuscles.includes(muscleGroup) ||
        exercise.secondaryMuscles.includes(muscleGroup)
    );
  };

  // Return exercises recommended for a given goal 
  // (based on the 'goal' property in exercise.repRanges, or any logic you want)
  const getExercisesByGoal = (goalId) => {
    // Example: if your 'goals' array has recommended types, you can do that
    const goalData = goals.find((g) => g.id === goalId);
    if (!goalData) return exercises;

    // Filter logic: matches recommended type OR has a repRange with that goal
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
  const isFavorite = (exerciseId) => {
    return favorites.includes(exerciseId);
  };

  // Update userGoal
  const setGoal = (goal) => {
    setUserGoal(goal);
  };

  // Return info object for a given goal ID
  const getGoalInfo = (goalId) => {
    return goals.find((g) => g.id === goalId) || null;
  };

  // Return a single exercise object by ID
  const getExerciseById = (id) => {
    return exercises.find((ex) => ex.id === id) || null;
  };

  // Return muscle group info by ID
  const getMuscleInfo = (muscleId) => {
    return muscleGroups.find((m) => m.id === muscleId) || null;
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // ---------------------------------------------------------------------------
  // PROVIDER
  // ---------------------------------------------------------------------------
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
        setGoal,
        getGoalInfo,
        getExerciseById,
        getMuscleInfo,
        darkMode,
        toggleDarkMode
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
};