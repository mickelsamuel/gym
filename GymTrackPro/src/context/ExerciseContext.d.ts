import { ReactNode } from 'react';

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
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // Exercise data
  exercises: Exercise[];
  muscleGroups: any[];
  workoutCategories: any[];
  goals: any[];
  loading: boolean;
  error: Error | null;
  
  // Favorites
  favorites: string[];
  toggleFavorite: (exerciseId: string) => void;
  isFavorite: (exerciseId: string) => boolean;
  addFavorite: (exerciseId: string) => void;
  removeFavorite: (exerciseId: string) => void;
  
  // Goals
  userGoal: string;
  setGoal: (goal: string) => void;
  getGoalInfo: (goalId: string) => any;
  
  // Workout data
  recentWorkouts: Workout[];
  refreshWorkoutData: () => Promise<void>;
  
  // Exercise stats and suggestions
  exerciseStats: Record<string, ExerciseStat>;
  getExerciseStats: (exerciseId: string) => ExerciseStat | null;
  getSuggestedWeight: (exerciseId: string) => number;
  getSuggestedReps: (exerciseId: string) => number;
  
  // Filters
  activeFilters: {
    type: string | null;
    category: string | null;
    muscle: string | null;
    equipment: string | null;
    difficulty: string | null;
    search: string | null;
  };
  setFilter: (filterType: string, value: string | null) => void;
  clearFilters: () => void;
  
  // Utility methods
  getAllExercises: () => Exercise[];
  getExercisesByType: (type: string) => Exercise[];
  getExercisesByCategory: (category: string) => Exercise[];
  getExercisesByMuscle: (muscleGroup: string) => Exercise[];
  getExercisesByEquipment: (equipment: string) => Exercise[];
  getExercisesByGoal: (goalId: string) => Exercise[];
  getFilteredExercises: () => Exercise[];
  getExerciseById: (id: string) => Exercise | null;
  getMuscleInfo: (muscleId: string) => any;
}

export interface ExerciseProviderProps {
  children: ReactNode;
}

export function useExercise(): ExerciseContextValue;
export const ExerciseContext: React.Context<ExerciseContextValue>;
export function ExerciseProvider(props: ExerciseProviderProps): JSX.Element; 