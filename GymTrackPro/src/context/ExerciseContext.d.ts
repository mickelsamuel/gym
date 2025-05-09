import React, { ReactNode } from 'react';
import { Exercise as ExerciseType } from '../types/mergedTypes';

export interface Exercise {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  instructions: string[];
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  secondaryMuscles: string[];
  image?: string;
  videoUrl?: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  type?: 'normal' | 'warmup' | 'dropset' | 'failure';
}

export interface ExerciseSet {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  date: string;
  duration: number;
  exercises: ExerciseSet[];
  notes?: string;
  completed: boolean;
  caloriesBurned?: number;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  schedule: Record<string, ExerciseSet[]>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  goals: string[];
  public: boolean;
  image?: string;
}

export interface WeightLog {
  id: string;
  userId: string;
  weight: number;
  date: string;
  notes?: string;
}

export interface ExerciseStat {
  sets: WorkoutSet[];
  lastUsed: string;
  frequency: number;
}

export interface ExerciseContextValue {
  exercises: ExerciseType[];
  favorites: string[];
  recentExercises: ExerciseType[];
  isLoading: boolean;
  error: string | null;
  refreshExercises: () => Promise<void>;
  getExerciseById: (id: string) => ExerciseType | undefined;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  getAllExercises: () => ExerciseType[];
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

export interface ExerciseProviderProps {
  children: ReactNode;
}

export function useExercise(): ExerciseContextValue;
export const ExerciseContext: React.Context<ExerciseContextValue>;
export function ExerciseProvider(props: ExerciseProviderProps): React.ReactElement; 