import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your exercise databases
import gymExercises from '../data/gymExercises.json';
import dumbbellExercises from '../data/dumbbellExercises.json';
import bodyweightExercises from '../data/bodyweightExercises.json';
import muscleGroups from '../data/muscleGroups.json';
import goals from '../data/goals.json';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
  const [exercises, setExercises] = useState({
    gym: gymExercises,
    dumbbell: dumbbellExercises,
    bodyweight: bodyweightExercises,
  });

  const [favorites, setFavorites] = useState([]);
  const [userGoal, setUserGoal] = useState('');

  // Load user favorites from storage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites', error);
      }
    };

    const loadUserGoal = async () => {
      try {
        const goal = await AsyncStorage.getItem('userGoal');
        if (goal) {
          setUserGoal(goal);
        }
      } catch (error) {
        console.error('Error loading user goal', error);
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
        console.error('Error saving favorites', error);
      }
    };
    saveFavorites();
  }, [favorites]);

  // Save user goal when it changes
  useEffect(() => {
    const saveUserGoal = async () => {
      try {
        await AsyncStorage.setItem('userGoal', userGoal);
      } catch (error) {
        console.error('Error saving user goal', error);
      }
    };
    saveUserGoal();
  }, [userGoal]);

  // Get all exercises
  const getAllExercises = () => {
    return [
      ...exercises.gym,
      ...exercises.dumbbell,
      ...exercises.bodyweight,
    ];
  };

  // Get exercises by category
  const getExercisesByCategory = (category) => {
    return exercises[category] || [];
  };

  // Get exercises by muscle group
  const getExercisesByMuscle = (muscleGroup) => {
    return getAllExercises().filter(
      (exercise) =>
        exercise.primaryMuscles.includes(muscleGroup) ||
        exercise.secondaryMuscles.includes(muscleGroup)
    );
  };

  // Get exercises by goal
  const getExercisesByGoal = (goal) => {
    const goalData = goals.find((g) => g.id === goal);
    if (!goalData) return getAllExercises();

    // Filter exercises based on goal recommendations
    return getAllExercises().filter((exercise) => {
      // Check if exercise matches recommended types for goal
      const matchesType = goalData.recommendedExerciseTypes.includes(
        exercise.type
      );
      // Check if target rep range matches goal
      const matchesRepRange = exercise.repRanges.some(
        (range) => range.goal === goal
      );

      return matchesType || matchesRepRange;
    });
  };

  // Toggle favorite status for an exercise
  const toggleFavorite = (exerciseId) => {
    setFavorites((prevFavorites) => {
      if (prevFavorites.includes(exerciseId)) {
        return prevFavorites.filter((id) => id !== exerciseId);
      } else {
        return [...prevFavorites, exerciseId];
      }
    });
  };

  // Check if an exercise is a favorite
  const isFavorite = (exerciseId) => {
    return favorites.includes(exerciseId);
  };

  // Set user goal
  const setGoal = (goal) => {
    setUserGoal(goal);
  };

  // Get information about a specific goal
  const getGoalInfo = (goalId) => {
    return goals.find((g) => g.id === goalId) || null;
  };

  // Get exercise details by ID
  const getExerciseById = (id) => {
    return getAllExercises().find((exercise) => exercise.id === id) || null;
  };

  // Get information about a muscle group
  const getMuscleInfo = (muscleId) => {
    return muscleGroups.find((m) => m.id === muscleId) || null;
  };

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
        setGoal,
        getGoalInfo,
        getExerciseById,
        getMuscleInfo,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
};