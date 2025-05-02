/**
 * Global Type Definitions for GymTrackPro
 * 
 * This file contains all the shared types used throughout the application.
 * It ensures consistent data structures across the app and proper typing with Firebase.
 */

import { FirebaseTimestamp } from './global';

// ======================================================
// BASE TYPES
// ======================================================

/**
 * Base interface for all Firestore document objects
 */
export interface FirestoreDocument {
  id?: string;
  createdAt?: FirebaseTimestamp | string;
  updatedAt?: FirebaseTimestamp | string;
}

/**
 * API response wrapper interface
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

/**
 * API error interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// ======================================================
// USER RELATED TYPES
// ======================================================

/**
 * User profile interface
 */
export interface User extends FirestoreDocument {
  uid: string;
  email: string;
  username: string;
  profilePic?: string;
  userGoal?: string; 
  streak?: number;
  joinDate?: string;
  lastActive?: string;
  weight?: number;
  height?: number;
  age?: number;
  role?: 'user' | 'admin';
  settings?: AppSettings;
  isEmailVerified?: boolean;
}

/**
 * Authentication credentials for login/signup
 */
export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data for new users
 */
export interface RegistrationData extends AuthCredentials {
  username: string;
  age?: number;
  weight?: number;
  height?: number;
}

/**
 * User stats for tracking progress
 */
export interface UserStats extends FirestoreDocument {
  userId: string;
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  streakDays: number;
  lastWorkout?: string;
  favoriteExercises?: {
    exerciseId: string;
    exerciseName: string;
    usageCount: number;
  }[];
  mostUsedEquipment?: {
    equipmentId: string;
    equipmentName: string;
    usageCount: number;
  }[];
  personalBests?: {
    exerciseId: string;
    exerciseName: string;
    weightValue: number;
    reps: number;
    date: string;
  }[];
}

/**
 * App settings for user preferences
 */
export interface AppSettings {
  darkMode: boolean;
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'ft';
  distanceUnit: 'km' | 'mi';
  useBiometricAuth?: boolean;
  rememberLogin?: boolean;
  colorTheme?: 'system' | 'light' | 'dark' | 'custom';
  language?: string;
  offlineMode?: boolean;
  dataSyncFrequency?: 'always' | 'wifi_only' | 'manual';
}

// ======================================================
// WORKOUT RELATED TYPES
// ======================================================

/**
 * Workout entry representing a completed workout
 */
export interface Workout extends FirestoreDocument {
  userId: string;
  name: string;
  description?: string;
  duration?: number;
  date: string;
  exercises: WorkoutExercise[];
  categoryId?: string;
  categoryName?: string;
}

/**
 * Exercise within a workout
 */
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
  muscleGroups?: string[];
  primaryMuscleGroup?: string;
}

/**
 * Individual set within an exercise
 */
export interface WorkoutSet {
  id?: string;
  weight: number;
  reps: number;
  isCompleted?: boolean;
  notes?: string;
  exerciseName?: string;
  date?: string;
  userId?: string;
}

/**
 * Workout plan template for future workouts
 */
export interface WorkoutPlan extends FirestoreDocument {
  userId: string;
  name: string;
  description?: string;
  exercises: WorkoutPlanExercise[];
  schedule?: {
    days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    startDate?: string;
    endDate?: string;
  };
}

/**
 * Exercise within a workout plan
 */
export interface WorkoutPlanExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  notes?: string;
}

/**
 * Weight log entry for tracking body weight
 */
export interface WeightLogEntry extends FirestoreDocument {
  userId: string;
  weight: number;
  date: string;
  notes?: string;
  change?: number;
}

/**
 * Workout category for organizing workouts
 */
export interface WorkoutCategory extends FirestoreDocument {
  name: string;
  description: string;
  icon: string;
  color: string;
}

// ======================================================
// EXERCISE RELATED TYPES
// ======================================================

/**
 * Exercise definition
 */
export interface Exercise extends FirestoreDocument {
  name: string;
  description: string;
  muscleGroups: string[];
  primaryMuscleGroup: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
}

/**
 * Muscle group definition
 */
export interface MuscleGroup extends FirestoreDocument {
  name: string;
  description: string;
  imageUrl?: string;
  exercises?: string[]; // List of exercise IDs
}

/**
 * Equipment definition
 */
export interface Equipment extends FirestoreDocument {
  name: string;
  description?: string;
  imageUrl?: string;
  exercises?: string[]; // List of exercise IDs
}

// ======================================================
// GOAL RELATED TYPES
// ======================================================

/**
 * Goal definition (e.g., strength, weight loss)
 */
export interface Goal extends FirestoreDocument {
  name: string;
  description: string;
  recommendedExercises?: string[]; // List of exercise IDs
  nutritionTips?: string;
  workoutFrequency?: number;
  duration?: number; // in weeks
}

// ======================================================
// SOCIAL RELATED TYPES
// ======================================================

/**
 * Friend relationship
 */
export interface Friend extends FirestoreDocument {
  userId: string;
  friendId: string;
  username: string;
  profilePic?: string;
}

/**
 * Friend request
 */
export interface FriendRequest extends FirestoreDocument {
  fromUid: string;
  fromUsername: string;
  fromPhotoUrl?: string;
  toUid: string;
  toUsername?: string;
  sentAt: FirebaseTimestamp | string;
  status: 'pending' | 'accepted' | 'rejected';
}

/**
 * Friend suggestion for the user
 */
export interface FriendSuggestion {
  uid: string;
  username: string;
  profilePic?: string;
  mutualFriends?: number;
  reason?: string;
}

// ======================================================
// PROGRESS TRACKING TYPES
// ======================================================

/**
 * Progress entry for tracking various progress metrics
 */
export interface ProgressEntry extends FirestoreDocument {
  userId: string;
  date: string;
  type: 'weight' | 'measurement' | 'photo' | 'custom';
  value: number | string;
  unit?: string;
  notes?: string;
}

/**
 * Body measurement tracking
 */
export interface BodyMeasurement extends FirestoreDocument {
  userId: string;
  date: string;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    thighs?: number;
    arms?: number;
    shoulders?: number;
    calves?: number;
    neck?: number;
    [key: string]: number | undefined;
  };
  unit: 'cm' | 'in';
  notes?: string;
}

// ======================================================
// ACHIEVEMENT TYPES
// ======================================================

/**
 * User achievement
 */
export interface UserAchievement extends FirestoreDocument {
  userId: string;
  title: string;
  description: string;
  dateEarned: string;
  iconName: string;
  progress?: {
    current: number;
    target: number;
  };
}

// ======================================================
// NOTIFICATION TYPES
// ======================================================

/**
 * App notification
 */
export interface AppNotification extends FirestoreDocument {
  userId: string;
  title: string;
  message: string;
  type: 'workout' | 'achievement' | 'friend' | 'system';
  read: boolean;
  data?: any;
}

// ======================================================
// UTILITY TYPES
// ======================================================

/**
 * Network status information
 */
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  lastChecked: string;
}

/**
 * Cache settings
 */
export interface CacheSettings {
  maxAge: number; // in milliseconds
  staleTime: number; // in milliseconds
  retryCount: number;
}

/**
 * Cache entry for in-memory caching
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

/**
 * Cache collection
 */
export interface DataCache {
  [key: string]: CacheEntry<any>;
}

/**
 * Form validation field state
 */
export interface FormField {
  value: any;
  error: string | null;
  touched: boolean;
  valid: boolean;
}

/**
 * Form validation state
 */
export interface FormState {
  [key: string]: FormField;
}

/**
 * App state snapshot for analytics and debugging
 */
export interface AppStateSnapshot {
  timestamp: string;
  screen: string;
  user: {
    loggedIn: boolean;
    hasProfile: boolean;
  };
  network: {
    connected: boolean;
    type?: string;
  };
  dataState: {
    hasWorkouts: boolean;
    hasWeightLog: boolean;
    exercisesLoaded: boolean;
  };
} 