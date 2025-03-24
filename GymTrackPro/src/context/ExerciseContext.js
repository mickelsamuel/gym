import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {}
    };
    const loadUserGoal = async () => {
      try {
        const goal = await AsyncStorage.getItem('userGoal');
        if (goal) {
          setUserGoal(goal);
        }
      } catch (error) {}
    };
    loadFavorites();
    loadUserGoal();
  }, []);

  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (error) {}
    };
    saveFavorites();
  }, [favorites]);

  useEffect(() => {
    const saveUserGoal = async () => {
      try {
        await AsyncStorage.setItem('userGoal', userGoal);
      } catch (error) {}
    };
    saveUserGoal();
  }, [userGoal]);

  const getAllExercises = () => {
    return [
      ...exercises.gym,
      ...exercises.dumbbell,
      ...exercises.bodyweight
    ];
  };

  const getExercisesByCategory = (category) => {
    return exercises[category] || [];
  };

  const getExercisesByMuscle = (muscleGroup) => {
    return getAllExercises().filter(
      (exercise) =>
        exercise.primaryMuscles.includes(muscleGroup) ||
        exercise.secondaryMuscles.includes(muscleGroup)
    );
  };

  const getExercisesByGoal = (goal) => {
    const goalData = goals.find((g) => g.id === goal);
    if (!goalData) return getAllExercises();
    return getAllExercises().filter((exercise) => {
      const matchesType = goalData.recommendedExerciseTypes.includes(exercise.type);
      const matchesRepRange = exercise.repRanges.some(
        (range) => range.goal === goal
      );
      return matchesType || matchesRepRange;
    });
  };

  const toggleFavorite = (exerciseId) => {
    setFavorites((prev) => {
      if (prev.includes(exerciseId)) {
        return prev.filter((id) => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const isFavorite = (exerciseId) => {
    return favorites.includes(exerciseId);
  };

  const setGoal = (goal) => {
    setUserGoal(goal);
  };

  const getGoalInfo = (goalId) => {
    return goals.find((g) => g.id === goalId) || null;
  };

  const getExerciseById = (id) => {
    return getAllExercises().find((ex) => ex.id === id) || null;
  };

  const getMuscleInfo = (muscleId) => {
    return muscleGroups.find((m) => m.id === muscleId) || null;
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
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
        darkMode,
        toggleDarkMode
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
};