import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { Exercise } from '../types/mergedTypes';
import DatabaseService from '../services/DatabaseService';
import { NetworkContext } from './NetworkContext';
import { StorageKeys } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
export interface ExerciseContextValue {
  exercises: Exercise[];
  favorites: string[];
  recentExercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  refreshExercises: () => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  getAllExercises: () => Exercise[];
  darkMode: boolean;
  toggleDarkMode: () => void;
  isFavorite: (id: string) => boolean;
  // Additional backward compatibility properties/methods
  userGoal?: string;
  getMuscleInfo?: (id: string) => any;
  toggleFavorite?: (id: string) => void;
  getGoalInfo?: () => any;
  setGoal?: (goal: string) => void;
  recentWorkouts?: any[];
  loading?: boolean;
  refreshWorkoutData?: () => Promise<void>;
  getExerciseStats?: () => any;
  getSuggestedWeight?: (exerciseId: string) => number;
  getSuggestedReps?: (exerciseId: string) => number;
}
export const ExerciseContext = createContext<ExerciseContextValue>({
  exercises: [],
  favorites: [],
  recentExercises: [],
  isLoading: false,
  error: null,
  refreshExercises: async () => {},
  getExerciseById: () => undefined,
  addFavorite: () => {},
  removeFavorite: () => {},
  getAllExercises: () => [],
  darkMode: false,
  toggleDarkMode: () => {},
  isFavorite: () => false,
});
export const useExercise = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExercise must be used within an ExerciseProvider');
  }
  return context;
};
export const ExerciseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const { isOnline } = useContext(NetworkContext);
  // Load data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadDarkModePreference(),
        loadFavorites(),
        loadRecentExercises(),
        refreshExercises()
      ]);
    };
    initializeData();
  }, []);
  // Load dark mode preference
  const loadDarkModePreference = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem(StorageKeys.DARK_MODE);
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      } else {
        // Default to false if not set
        setDarkMode(false);
      }
    } catch (error) {
      console.error('Error loading dark mode preference:', error);
    }
  };
  // Load favorites from storage
  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(StorageKeys.FAVORITES);
      if (savedFavorites !== null) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };
  // Load recent exercises from storage
  const loadRecentExercises = async () => {
    try {
      const savedRecent = await AsyncStorage.getItem(StorageKeys.RECENT_EXERCISES);
      if (savedRecent !== null) {
        setRecentExercises(JSON.parse(savedRecent));
      }
    } catch (error) {
      console.error('Error loading recent exercises:', error);
    }
  };
  // Toggle dark mode
  const toggleDarkMode = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    try {
      await AsyncStorage.setItem(StorageKeys.DARK_MODE, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };
  // Refresh exercises from API
  const refreshExercises = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await DatabaseService.getAllExercises(isOnline);
      if (response.success && response.data) {
        setExercises(response.data);
        // Cache exercises locally
        try {
          await AsyncStorage.setItem(StorageKeys.EXERCISES, JSON.stringify(response.data));
        } catch (storageError) {
          console.error('Error caching exercises:', storageError);
        }
      } else {
        // Try to load from local storage if API fails
        const cachedData = await AsyncStorage.getItem(StorageKeys.EXERCISES);
        if (cachedData) {
          setExercises(JSON.parse(cachedData));
        } else {
          throw new Error(response.error?.message || 'Failed to load exercises');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      Alert.alert('Error', 'Failed to load exercises. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  // Get exercise by ID
  const getExerciseById = (id: string): Exercise | undefined => {
    return exercises.find(exercise => exercise.id === id);
  };
  // Add an exercise to favorites
  const addFavorite = async (id: string) => {
    if (favorites.includes(id)) {
      return; // Already a favorite
    }
    const newFavorites = [...favorites, id];
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem(StorageKeys.FAVORITES, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };
  // Remove an exercise from favorites
  const removeFavorite = async (id: string) => {
    if (!favorites.includes(id)) {
      return; // Not a favorite
    }
    const newFavorites = favorites.filter(fav => fav !== id);
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem(StorageKeys.FAVORITES, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };
  // Get all exercises
  const getAllExercises = (): Exercise[] => {
    return exercises;
  };
  const contextValue: ExerciseContextValue = {
    exercises,
    favorites,
    recentExercises,
    isLoading,
    error,
    refreshExercises,
    getExerciseById,
    addFavorite,
    removeFavorite,
    getAllExercises,
    darkMode,
    toggleDarkMode,
    isFavorite: (id: string) => favorites.includes(id),
    // Backward compatibility implementations
    userGoal: 'strength',
    getMuscleInfo: (id: string) => ({ name: 'Generic Muscle', id }),
    toggleFavorite: (id: string) => {
      if (favorites.includes(id)) {
        removeFavorite(id);
      } else {
        addFavorite(id);
      }
    },
    getGoalInfo: () => ({ name: 'Strength', description: 'Building muscle mass' }),
    setGoal: (goal: string) => console.log('Setting goal to:', goal),
    recentWorkouts: [],
    loading: isLoading,
    refreshWorkoutData: async () => await refreshExercises(),
    getExerciseStats: () => ({ 
      total: exercises.length, 
      favorites: favorites.length,
      recentCount: recentExercises.length 
    }),
    getSuggestedWeight: (exerciseId: string) => 50,  // Default 50 lbs
    getSuggestedReps: (exerciseId: string) => 10,    // Default 10 reps
  };
  return (
    <ExerciseContext.Provider value={contextValue}>
      {children}
    </ExerciseContext.Provider>
  );
};
export default ExerciseProvider; 