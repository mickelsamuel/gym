/**
 * Global Type Definitions for GymTrackPro
 * 
 * This file contains all the shared types used throughout the application.
 * It ensures consistent data structures across the app and proper typing with Firebase.
 */
import { FirebaseTimestamp } from './global';
import { FieldValue } from 'firebase/firestore';
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
  displayName?: string;
  bio?: string;
  fitnessLevel?: FitnessLevel;
  friends?: string[];
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
  notifications?: boolean;
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
  description: string;
  duration: number;
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
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  muscleGroups?: string[];
  primaryMuscleGroup?: string;
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
 * Exercise type - can be one of: 'strength', 'cardio', 'stretching', 'plyometric'
 * Sets consistent type property for exercise
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
  type: 'strength' | 'cardio' | 'stretching' | 'plyometric';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  image?: string;
  video?: string;
  tags?: string[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    source?: string;
  };
  muscle?: string; // For backward compatibility
  restTime?: number;
  repRanges?: { goal: string; min: number; max: number }[];
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
  sentAt: FirebaseTimestamp | string | FieldValue;
  status: 'pending' | 'accepted' | 'declined';
  processedAt?: FirebaseTimestamp | string | FieldValue;
  message?: string;
  fromUserData?: {
    username: string;
    photoURL?: string;
    bio?: string;
  };
  toUserData?: {
    username: string;
    photoURL?: string;
    bio?: string;
  };
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
// User and Profile Types
export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  profilePic?: string;
  joinDate?: string;
  lastActive?: string;
  fitnessLevel?: FitnessLevel;
  goal?: string;
  height?: number;
  weight?: number;
  birthdate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  settings?: UserSettings;
}
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export interface UserSettings {
  darkMode?: boolean;
  notifications?: {
    workoutReminders: boolean;
    friendRequests: boolean;
    achievements: boolean;
    weightReminders: boolean;
  };
  privacySettings?: {
    shareWorkouts: boolean;
    shareWeight: boolean;
    shareProgress: boolean;
    allowFriendRequests: boolean;
  };
  measurementSystem?: 'metric' | 'imperial';
}
// Exercise Types
export interface V2Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  type: 'strength' | 'cardio' | 'stretching' | 'plyometric';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
  muscleGroup: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  image?: string;
  video?: string;
  category: string;
  tags?: string[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    source?: string;
  };
}
export interface V2MuscleGroup {
  id: string;
  name: string;
  displayName: string;
  color: string;
  exercises?: string[];
  bodyPart: 'upper' | 'lower' | 'core';
  image?: string;
}
// Workout Types
export interface V2Workout {
  id: string;
  name: string;
  description: string;
  date: string;
  duration: number;
  calories?: number;
  exercises: WorkoutExercise[];
  userId: string;
  isCompleted: boolean;
  notes?: string;
  category?: string;
  intensity?: 'light' | 'moderate' | 'intense';
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface V2WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
  restTime?: number;
}
export interface V2WorkoutSet {
  id?: string;
  weight: number;
  reps: number;
  time?: number; // For timed exercises (in seconds)
  distance?: number; // For distance exercises (in meters)
  isCompleted?: boolean;
  type?: 'normal' | 'warmup' | 'dropset' | 'failure';
}
export interface V2WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  goal: string;
  duration: number; // In weeks
  frequency: number; // Workouts per week
  level: FitnessLevel;
  workouts: PlanWorkout[];
  userId: string;
  createdAt: string;
  updatedAt?: string;
  isPublic?: boolean;
  category?: string;
  image?: string;
  tags?: string[];
}
export interface PlanWorkout {
  id: string;
  name: string;
  description?: string;
  day: number; // 1-7 for day of week
  week?: number; // For multi-week plans
  exercises: PlanExercise[];
  duration: number; // Estimated minutes
  order: number;
}
export interface PlanExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string; // Can be "8-12" or similar
  restTime?: number;
  notes?: string;
  superset?: string; // ID of exercise to superset with
}
// Weight Logging Types
export interface WeightLog {
  id: string;
  userId: string;
  date: string;
  weight: number;
  unit: 'kg' | 'lb';
  notes?: string;
  bodyFat?: number;
  createdAt: string;
  updatedAt?: string;
}
// Goal Types
export interface V2Goal {
  id: string;
  name: string;
  description: string;
  type: 'strength' | 'muscle' | 'endurance' | 'weight' | 'custom';
  focusAreas?: string[];
  recommendedWorkoutsPerWeek: number;
  recommendedSets: { min: number; max: number };
  recommendedReps: { min: number; max: number };
  recommendedRestTime: { min: number; max: number };
  icon: string;
  color: string;
}
export interface UserGoal {
  id: string;
  userId: string;
  goalId: string;
  startDate: string;
  targetDate?: string;
  startValue?: number;
  targetValue?: number;
  currentValue?: number;
  notes?: string;
  isCompleted?: boolean;
  completedDate?: string;
}
// Achievement Types
export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'workout' | 'weight' | 'social' | 'streak';
  criteria: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedDate?: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
}
// Social Types
export interface V2FriendRequest {
  id: string;
  senderId: string;
  senderName?: string;
  senderProfile?: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  updatedAt?: string;
}
export interface V2Friend {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendProfile?: string;
  status: 'active' | 'blocked';
  createdAt: string;
}
export interface Activity {
  id: string;
  userId: string;
  userName?: string;
  userProfile?: string;
  type: 'workout' | 'weight' | 'achievement' | 'goal' | 'friend';
  data: any;
  isPublic: boolean;
  createdAt: string;
}
// Chart and Statistics Types
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: string | ((opacity: number) => string);
    strokeWidth?: number;
    withDots?: boolean;
  }[];
  legend?: string[];
}
export interface ExerciseStat {
  exerciseId: string;
  personalBest: {
    weight: number;
    reps: number;
    date: string;
  };
  history: {
    date: string;
    weight: number;
    reps: number;
  }[];
  progress: {
    oneMonth: number;
    threeMonths: number;
    sixMonths: number;
    oneYear: number;
  };
}
// Notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'friend' | 'workout' | 'achievement' | 'system' | 'weight';
  data?: any;
  isRead: boolean;
  createdAt: string;
}
// App State Types
export interface AppState {
  isAuthenticated: boolean;
  isLoading: boolean;
  networkStatus: 'online' | 'offline' | 'limited';
  lastSynced?: string;
}
// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: { email?: string };
  EmailVerification: undefined;
  ExerciseDetail: { exerciseId: string };
  WorkoutDetail: { workoutId: string };
  CustomWorkoutDetail: { workoutId: string };
  CustomWorkoutDetailScreen: { workoutId: string };
  AddExercise: { workoutId: string; returnToWorkout?: boolean };
  AddExerciseScreen: { workoutId: string; returnToWorkout?: boolean };
  FriendRequests: undefined;
  FriendProfile: { userId: string };
  WorkoutLogModal: { date?: string; workoutId?: string };
}; 