// User Data Types
export interface UserData {
  username?: string;
  email?: string;
  profilePic?: string;
  userGoal?: string;
  firestoreSets?: WorkoutSet[];
  firestoreWeightLog?: WeightLogEntry[];
  streak?: number;
  joinDate?: string;
  uid?: string;
  lastActive?: string;
}

// Workout Types
export interface WorkoutSet {
  exerciseName: string;
  date: string;
  sets: number;
  reps: number;
  weight: number;
  userId?: string;
  notes?: string;
  id?: string;
}

// Weight Log Types
export interface WeightLogEntry {
  weight: number;
  date: string;
  change?: number;
  notes?: string;
  id?: string;
}

// Friend Types
export interface FriendRequest {
  fromUid: string;
  fromUsername: string;
  fromPhotoUrl?: string;
  toUid: string;
  sentAt: string;
  id?: string;
}

export interface SentRequest {
  toUid: string;
  toUsername: string;
  toPhotoUrl?: string;
  fromUid: string;
  sentAt: string;
  id?: string;
}

export interface FriendSuggestion {
  uid: string;
  username: string;
  profilePic?: string;
  mutualFriends?: number;
  reason?: string;
}

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  description: string;
  difficulty: string;
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
}

// Achievement Types
export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  dateEarned: string;
  iconName: string;
  progress?: {
    current: number;
    target: number;
  };
}

// Data transformation and mapping types
// This file should only contain types related to data transformations, temporary data structures,
// or interfaces that are not directly mapped to Firestore documents.

// Types for data migration/conversion
export interface LegacyUserData {
  username?: string;
  email?: string;
  profilePic?: string;
  userGoal?: string;
  firestoreSets?: LegacyWorkoutSet[];
  firestoreWeightLog?: LegacyWeightLogEntry[];
  streak?: number;
  joinDate?: string;
  uid?: string;
  lastActive?: string;
  firebaseUid?: string; // old field name
}

// Legacy types for backward compatibility
export interface LegacyWorkoutSet {
  exerciseName: string;
  date: string;
  sets: number;
  reps: number;
  weight: number;
  userId?: string;
  notes?: string;
  id?: string;
}

// Legacy types for backward compatibility
export interface LegacyWeightLogEntry {
  weight: number;
  date: string;
  change?: number;
  notes?: string;
  id?: string;
}

// Data structures for temporary storage during app operations
export interface TempWorkoutData {
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: {
      weight: number;
      reps: number;
      completed: boolean;
    }[];
  }[];
  startTime?: Date;
  endTime?: Date;
}

// Data structure for exercise filtering
export interface ExerciseFilter {
  type?: string | null;
  category?: string | null;
  muscle?: string | null;
  equipment?: string | null;
  difficulty?: string | null;
  search?: string | null;
  favorites?: boolean;
}

// Data structure for workout history filtering
export interface WorkoutHistoryFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  exercise?: string;
  sortBy?: 'date' | 'name' | 'duration';
  sortDirection?: 'asc' | 'desc';
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: string | ((opacity: number) => string);
    strokeWidth?: number;
  }[];
}

// Export data format for backup/restore
export interface ExportData {
  version: string;
  timestamp: string;
  userId: string;
  user: {
    profile: any;
    settings: any;
  };
  workouts: any[];
  weightLog: any[];
  plans: any[];
  friends: any[];
}

// Data structure for exercise recommendations
export interface ExerciseRecommendation {
  exerciseId: string;
  reason: string;
  confidence: number;
}

// Data structure for workout recommendations
export interface WorkoutRecommendation {
  name: string;
  exercises: string[];
  reason: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// In-memory cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

export interface DataCache {
  [key: string]: CacheEntry<any>;
}

// Form validation state
export interface FormField {
  value: any;
  error: string | null;
  touched: boolean;
  valid: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

// App state snapshot for analytics and debugging
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