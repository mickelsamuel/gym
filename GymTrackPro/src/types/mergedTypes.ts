/**
 * Merged Type Definitions
 * 
 * This file merges type definitions from global.ts and globalTypes.ts
 * to solve type compatibility issues when working with Database services.
 */
import * as GlobalTypes from './global';
import * as GlobalTypesTS from './globalTypes';
import {Timestamp as FirebaseTimestamp} from 'firebase/firestore';
// Types for Firebase Timestamp
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
  isEqual: (other: Timestamp) => boolean;
  toJSON: () => { seconds: number; nanoseconds: number };
}
// Re-export the FirebaseTimestamp type as alias to Timestamp
export { Timestamp as FirebaseTimestamp };
// Merge FirestoreDocument
export interface FirestoreDocument {
  id?: string;
  createdAt?: FirebaseTimestamp | string;
  updatedAt?: FirebaseTimestamp | string;
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
  firestoreSets?: any[];
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
  isCompleted?: boolean;
  settings?: {
    restTimerEnabled?: boolean;
    restTimerDuration?: number;
    notificationsEnabled?: boolean;
    [key: string]: any;
  };
}
// Merge WorkoutExercise
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
  muscleGroups?: string[];
  primaryMuscleGroup?: string;
  exerciseId?: string;
}
// Merge WorkoutSet
export interface WorkoutSet {
  id?: string;
  exerciseId?: string;
  exerciseName?: string;
  reps: number;
  weight: number;
  setNumber?: number;
  date?: string; 
  notes?: string;
  isCompleted?: boolean;
  duration?: number;
  type?: string;
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
  // Additional fields from globalTypes.ts
  type?: 'strength' | 'cardio' | 'stretching' | 'plyometric';
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  image?: string;
  video?: string;
  tags?: string[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    source?: string;
  };
  muscle?: string; // For backward compatibility
  muscleGroup?: string;
  restTime?: number;
  repRanges?: { goal: string; min: number; max: number }[];
}
export type Friend = GlobalTypesTS.Friend;
export type FriendRequest = GlobalTypesTS.FriendRequest;
export type WeightLogEntry = GlobalTypesTS.WeightLogEntry;
/**
 * Merged TypeScript type definitions for GymTrackPro
 * 
 * This file contains types that handle the conversion between Firebase data formats and our app's types.
 * Firebase Firestore uses custom Timestamp objects that need to be converted to/from JavaScript Dates.
 */
// Define interfaces with Timestamp fields for Firebase data
export interface FirebaseUserProfile extends Omit<GlobalTypesTS.UserProfile, 'joinDate' | 'lastActive'> {
  joinDate?: FirebaseTimestamp | string;
  lastActive?: FirebaseTimestamp | string;
}
export interface FirebaseWorkout extends Omit<Workout, 'date' | 'createdAt' | 'updatedAt'> {
  date: FirebaseTimestamp | string;
  createdAt?: FirebaseTimestamp | string;
  updatedAt?: FirebaseTimestamp | string;
}
export interface FirebaseWeightLog extends Omit<GlobalTypesTS.WeightLog, 'date' | 'createdAt' | 'updatedAt'> {
  date: FirebaseTimestamp | string;
  createdAt: FirebaseTimestamp | string;
  updatedAt?: FirebaseTimestamp | string;
}
export interface FirebaseAchievement extends Omit<GlobalTypesTS.Achievement, 'completedDate' | 'createdAt' | 'updatedAt'> {
  completedDate?: FirebaseTimestamp | string;
  createdAt: FirebaseTimestamp | string;
  updatedAt?: FirebaseTimestamp | string;
}
export interface FirebaseFriendRequest extends Omit<FriendRequest, 'createdAt' | 'updatedAt'> {
  createdAt: FirebaseTimestamp | string;
  updatedAt?: FirebaseTimestamp | string;
}
export interface FirebaseActivity extends Omit<GlobalTypesTS.Activity, 'createdAt'> {
  createdAt: FirebaseTimestamp | string;
}
export interface FirebaseNotification extends Omit<GlobalTypesTS.Notification, 'createdAt'> {
  createdAt: FirebaseTimestamp | string;
}
// Helper functions to convert between Firebase and App data types
/**
 * Converts a Firebase Timestamp to an ISO date string
 */
export function timestampToString(timestamp: FirebaseTimestamp | string | null | undefined): string | undefined {
  if (!timestamp) return undefined;
  if (typeof timestamp === 'string') return timestamp;
  try {
    // Handle Timestamp objects
    return new Date(timestamp.seconds * 1000).toISOString();
  } catch (error) {
    console.error("Error converting timestamp:", error);
    return undefined;
  }
}
/**
 * Converts an ISO date string to a Firebase Timestamp
 */
export function stringToTimestamp(dateString: string): FirebaseTimestamp {
  return FirebaseTimestamp.fromDate(new Date(dateString));
}
/**
 * Converts Firebase user profile to app user profile
 */
export function convertFirebaseProfile(firebaseProfile: FirebaseUserProfile): GlobalTypesTS.UserProfile {
  return {
    ...firebaseProfile,
    joinDate: typeof firebaseProfile.joinDate === 'string' 
      ? firebaseProfile.joinDate 
      : firebaseProfile.joinDate && 'seconds' in firebaseProfile.joinDate 
        ? new Date(firebaseProfile.joinDate.seconds * 1000).toISOString() 
        : undefined,
    lastActive: typeof firebaseProfile.lastActive === 'string'
      ? firebaseProfile.lastActive
      : firebaseProfile.lastActive && 'seconds' in firebaseProfile.lastActive
        ? new Date(firebaseProfile.lastActive.seconds * 1000).toISOString() 
        : undefined
  };
}
/**
 * Converts app user profile to Firebase user profile
 */
export function convertToFirebaseProfile(profile: GlobalTypesTS.UserProfile): FirebaseUserProfile {
  return {
    ...profile,
    joinDate: profile.joinDate ? FirebaseTimestamp.fromDate(new Date(profile.joinDate)) : undefined,
    lastActive: profile.lastActive ? FirebaseTimestamp.fromDate(new Date(profile.lastActive)) : undefined
  };
}
/**
 * Converts Firebase workout to app workout
 */
export function convertFirebaseWorkout(firebaseWorkout: FirebaseWorkout): Workout {
  return {
    ...firebaseWorkout,
    date: typeof firebaseWorkout.date === 'string' 
      ? firebaseWorkout.date 
      : 'seconds' in firebaseWorkout.date
        ? new Date(firebaseWorkout.date.seconds * 1000).toISOString() 
        : new Date().toISOString(),
    createdAt: typeof firebaseWorkout.createdAt === 'string'
      ? firebaseWorkout.createdAt
      : firebaseWorkout.createdAt && 'seconds' in firebaseWorkout.createdAt
        ? new Date(firebaseWorkout.createdAt.seconds * 1000).toISOString() 
        : undefined,
    updatedAt: typeof firebaseWorkout.updatedAt === 'string'
      ? firebaseWorkout.updatedAt
      : firebaseWorkout.updatedAt && 'seconds' in firebaseWorkout.updatedAt
        ? new Date(firebaseWorkout.updatedAt.seconds * 1000).toISOString() 
        : undefined
  };
}
/**
 * Converts app workout to Firebase workout
 */
export function convertToFirebaseWorkout(workout: Workout): FirebaseWorkout {
  return {
    ...workout,
    date: workout.date ? FirebaseTimestamp.fromDate(new Date(workout.date as string)) : FirebaseTimestamp.now(),
    createdAt: workout.createdAt ? FirebaseTimestamp.fromDate(new Date(workout.createdAt as string)) : undefined,
    updatedAt: workout.updatedAt ? FirebaseTimestamp.fromDate(new Date(workout.updatedAt as string)) : undefined
  };
}
/**
 * Converts Firebase weight log to app weight log
 */
export function convertFirebaseWeightLog(firebaseLog: FirebaseWeightLog): GlobalTypesTS.WeightLog {
  return {
    ...firebaseLog,
    date: typeof firebaseLog.date === 'string'
      ? firebaseLog.date
      : 'seconds' in firebaseLog.date
        ? new Date(firebaseLog.date.seconds * 1000).toISOString()
        : new Date().toISOString(),
    createdAt: typeof firebaseLog.createdAt === 'string'
      ? firebaseLog.createdAt
      : 'seconds' in firebaseLog.createdAt
        ? new Date(firebaseLog.createdAt.seconds * 1000).toISOString()
        : new Date().toISOString(),
    updatedAt: typeof firebaseLog.updatedAt === 'string'
      ? firebaseLog.updatedAt
      : firebaseLog.updatedAt && 'seconds' in firebaseLog.updatedAt
        ? new Date(firebaseLog.updatedAt.seconds * 1000).toISOString()
        : undefined
  };
}
/**
 * Converts app weight log to Firebase weight log
 */
export function convertToFirebaseWeightLog(log: GlobalTypesTS.WeightLog): FirebaseWeightLog {
  return {
    ...log,
    date: log.date ? FirebaseTimestamp.fromDate(new Date(log.date as string)) : FirebaseTimestamp.now(),
    createdAt: log.createdAt ? FirebaseTimestamp.fromDate(new Date(log.createdAt as string)) : FirebaseTimestamp.now(),
    updatedAt: log.updatedAt ? FirebaseTimestamp.fromDate(new Date(log.updatedAt as string)) : undefined
  };
}
/**
 * Handles any Firestore document data conversion
 */
export function convertFirestoreData<T>(data: any): T {
  if (!data) return {} as T;
  // Create a new object to avoid modifying the original
  const result: any = { ...data };
  // Convert all timestamp fields to strings
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object' && 'seconds' in result[key] && 'nanoseconds' in result[key]) {
      // Convert Timestamp to ISO string
      result[key] = new Date(result[key].seconds * 1000).toISOString();
    } else if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      // Recursively convert nested objects
      result[key] = convertFirestoreData(result[key]);
    }
  }
  return result as T;
} 