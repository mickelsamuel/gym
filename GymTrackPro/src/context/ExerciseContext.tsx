import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert, AccessibilityInfo, Platform, useColorScheme, Appearance } from 'react-native';
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
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
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
  reducedMotion: false,
  setReducedMotion: () => {},
  themeMode: 'system',
  setThemeMode: () => {},
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
  const [reducedMotion, setReducedMotionState] = useState<boolean>(false);
  const [themeMode, setThemeModeState] = useState<'system' | 'light' | 'dark'>('system');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  
  const { isOnline } = useContext(NetworkContext);

  useEffect(() => {
    // Initialize app data
    const initializeData = async () => {
      await Promise.all([
        loadReducedMotionPreference(),
        loadFavorites(),
        loadRecentExercises()
      ]);
    };

    initializeData();
    
    // Listen for system color scheme changes
    const themeSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme || 'light');
    });
    
    // Listen for system reduced motion setting changes
    const reduceMotionChangeSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChange
    );
    
    // Initial check for system preferences
    checkSystemReducedMotionSetting();
    
    return () => {
      reduceMotionChangeSubscription.remove();
      themeSubscription.remove();
    };
  }, []);
  
  // Load dependencies on initial mount
  useEffect(() => {
    loadThemeModePreference();
    refreshExercises();
  }, []);
  
  // Update dark mode based on system theme changes and theme mode
  useEffect(() => {
    if (themeMode === 'system') {
      setDarkMode(colorScheme === 'dark');
    }
  }, [colorScheme, themeMode]);

  // Load theme mode preference
  const loadThemeModePreference = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem(StorageKeys.THEME_MODE);
      if (savedThemeMode !== null) {
        setThemeModeState(savedThemeMode as 'system' | 'light' | 'dark');
        
        // Apply the theme mode
        if (savedThemeMode === 'system') {
          setDarkMode(colorScheme === 'dark');
        } else {
          setDarkMode(savedThemeMode === 'dark');
        }
      } else {
        // Default to system if not set
        setThemeModeState('system');
        setDarkMode(colorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme mode preference:', error);
    }
  };
  
  // Set theme mode (system, light, or dark)
  const setThemeMode = async (mode: 'system' | 'light' | 'dark') => {
    setThemeModeState(mode);
    
    try {
      await AsyncStorage.setItem(StorageKeys.THEME_MODE, mode);
      
      // Apply the theme mode
      if (mode === 'system') {
        setDarkMode(colorScheme === 'dark');
      } else {
        setDarkMode(mode === 'dark');
      }
    } catch (error) {
      console.error('Error saving theme mode preference:', error);
    }
  };

  // Check system reduced motion setting
  const checkSystemReducedMotionSetting = async () => {
    try {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      // Only update if user hasn't explicitly set a preference
      const userPreference = await AsyncStorage.getItem(StorageKeys.REDUCED_MOTION);
      if (userPreference === null) {
        setReducedMotionState(isReduceMotionEnabled);
        await AsyncStorage.setItem(StorageKeys.REDUCED_MOTION, JSON.stringify(isReduceMotionEnabled));
      }
    } catch (error) {
      console.error('Error checking system motion settings:', error);
    }
  };

  // Handle system reduced motion setting changes
  const handleReduceMotionChange = (isReduceMotionEnabled: boolean) => {
    // Update state based on system setting if the user hasn't set a preference
    AsyncStorage.getItem(StorageKeys.REDUCED_MOTION_USER_SET).then(hasUserSet => {
      if (hasUserSet !== 'true') {
        setReducedMotionState(isReduceMotionEnabled);
        AsyncStorage.setItem(StorageKeys.REDUCED_MOTION, JSON.stringify(isReduceMotionEnabled));
      }
    }).catch(error => {
      console.error('Error handling reduced motion change:', error);
    });
  };

  // Set reduced motion preference (user explicit setting)
  const setReducedMotion = async (value: boolean) => {
    setReducedMotionState(value);
    try {
      await AsyncStorage.setItem(StorageKeys.REDUCED_MOTION, JSON.stringify(value));
      await AsyncStorage.setItem(StorageKeys.REDUCED_MOTION_USER_SET, 'true');
    } catch (error) {
      console.error('Error saving reduced motion preference:', error);
    }
  };

  // Load reduced motion preference
  const loadReducedMotionPreference = async () => {
    try {
      const savedReducedMotion = await AsyncStorage.getItem(StorageKeys.REDUCED_MOTION);
      if (savedReducedMotion !== null) {
        setReducedMotionState(JSON.parse(savedReducedMotion));
      } else {
        // Default to system setting if not explicitly set
        const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setReducedMotionState(isReduceMotionEnabled);
      }
    } catch (error) {
      console.error('Error loading reduced motion preference:', error);
    }
  };

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
    
    // If we're manually toggling, set to explicit light/dark mode (not system)
    setThemeModeState(newValue ? 'dark' : 'light');
    
    try {
      await AsyncStorage.setItem(StorageKeys.DARK_MODE, JSON.stringify(newValue));
      await AsyncStorage.setItem(StorageKeys.THEME_MODE, newValue ? 'dark' : 'light');
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
    reducedMotion,
    setReducedMotion,
    themeMode,
    setThemeMode,
    // Provide backward compatibility for existing code with additional properties/methods
    userGoal: undefined,
    recentWorkouts: [],
    loading: isLoading,
    refreshWorkoutData: async () => {},
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