// context/ExerciseContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import gymExercises from "../data/gymExercises";
import dumbbellExercises from '../data/dumbbellExercises';
import bodyweightExercises from '../data/bodyweightExercises';
import muscleGroups from '../data/muscleGroups';
import goals from '../data/goals';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
  // Store all exercise data in memory
  const [exercises, setExercises] = useState({
    gym: gymExercises,
    dumbbell: dumbbellExercises,
    bodyweight: bodyweightExercises,
  });

  // Favorite (bookmarked) exercise IDs
  const [favorites, setFavorites] = useState([]);

  // The user's chosen fitness goal, e.g. "strength", "hypertrophy", etc.
  const [userGoal, setUserGoal] = useState('');

  // Dark mode toggle
  const [darkMode, setDarkMode] = useState(false);

  /* =================================
   * LOAD (on mount)
   * ================================= */
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

  /* =================================
   * SAVE Favorites & Goal
   * ================================= */
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

  /* =================================
   * HELPER METHODS
   * ================================= */
  // Return array of all exercise objects
  const getAllExercises = () => {
    return [
      ...exercises.gym,
      ...exercises.dumbbell,
      ...exercises.bodyweight
    ];
  };

  // Return all exercises for a specific category: 'gym', 'dumbbell', 'bodyweight'
  const getExercisesByCategory = (category) => {
    return exercises[category] || [];
  };

  // Return exercises that match a primary or secondary muscle
  const getExercisesByMuscle = (muscleGroup) => {
    return getAllExercises().filter(
      (exercise) =>
        exercise.primaryMuscles.includes(muscleGroup) ||
        exercise.secondaryMuscles.includes(muscleGroup)
    );
  };

  // Return exercises recommended for a given goal (based on type or rep range)
  const getExercisesByGoal = (goal) => {
    const goalData = goals.find((g) => g.id === goal);
    if (!goalData) return getAllExercises();

    return getAllExercises().filter((exercise) => {
      const matchesType = goalData.recommendedExerciseTypes.includes(exercise.type);
      const matchesRepRange = exercise.repRanges.some(
        (range) => range.goal === goal
      );
      // If an exercise matches at least the recommended type OR has a rep range for that goal
      return matchesType || matchesRepRange;
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

  // Update the user's goal and persist it in AsyncStorage
  const setGoal = (goal) => {
    setUserGoal(goal);
  };

  // Return info object for a given goal ID (e.g. {id, name, description, ...})
  const getGoalInfo = (goalId) => {
    return goals.find((g) => g.id === goalId) || null;
  };

  // Return a single exercise object by its ID
  const getExerciseById = (id) => {
    return getAllExercises().find((ex) => ex.id === id) || null;
  };

  // Return muscle group info for a given muscle ID
  const getMuscleInfo = (muscleId) => {
    return muscleGroups.find((m) => m.id === muscleId) || null;
  };

  // Toggle light/dark mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  /* =================================
   * PROVIDER
   * ================================= */
  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        favorites,
        userGoal,
        getAllExercises,
        getExercisesByCategory,
        getExercisesByMuscle,
        getExercisesByGoal,
        toggleFavorite,
        isFavorite,
        setGoal, // used by HomeScreen's modal
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