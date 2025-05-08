/**
 * Merged Type Definitions
 * 
 * This file merges type definitions from global.ts and globalTypes.ts
 * to solve type compatibility issues when working with Database services.
 */

import * as GlobalTypes from './global';
import * as GlobalTypesTS from './globalTypes';
import { FieldValue } from 'firebase/firestore';

// Re-export the FirebaseTimestamp type
export type FirebaseTimestamp = GlobalTypes.FirebaseTimestamp;

// Merge FirestoreDocument
export interface FirestoreDocument {
  id?: string;
  createdAt?: FirebaseTimestamp | string | FieldValue;
  updatedAt?: FirebaseTimestamp | string | FieldValue;
}

// Merge User interface
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

// Merge AppSettings
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
  notifications: boolean;  // Make it required to satisfy both interfaces
}

// Merge Workout interface
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

// Merge WorkoutExercise
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
  muscleGroups?: string[];
  primaryMuscleGroup?: string;
}

// Merge WorkoutSet
export interface WorkoutSet {
  id?: string;
  weight: number;
  reps: number;
  duration?: number;
  isCompleted?: boolean;
  notes?: string;
  exerciseName?: string;
  date?: string;
  userId?: string;
}

// Merge WorkoutPlan
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

// Use WorkoutPlanExercise from globalTypes
export interface WorkoutPlanExercise extends GlobalTypesTS.WorkoutPlanExercise {}

// Merge ApiResponse
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Merge ApiError
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Merge NetworkStatus
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  lastChecked: string;
}

// Re-export other types
export type Exercise = GlobalTypesTS.Exercise;
export type Friend = GlobalTypesTS.Friend;
export type FriendRequest = GlobalTypesTS.FriendRequest;
export type WeightLogEntry = GlobalTypesTS.WeightLogEntry; 