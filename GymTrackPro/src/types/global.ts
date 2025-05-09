// Global type definitions for Firebase and app data models
// Firebase Timestamp type (from Firestore)
export interface FirebaseTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
  toMillis: () => number;
  isEqual: (other: FirebaseTimestamp) => boolean;
  toJSON: () => { seconds: number; nanoseconds: number };
}
// Base document interface for all Firestore documents
export interface FirestoreDocument {
  id?: string;
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
}
//=================================================
// USER RELATED TYPES
//=================================================
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
}
export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
export interface RegistrationData extends AuthCredentials {
  username: string;
  age?: number;
  weight?: number;
  height?: number;
}
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
//=================================================
// WORKOUT RELATED TYPES
//=================================================
export interface WeightLogEntry extends FirestoreDocument {
  userId: string;
  weight: number;
  date: string;
  notes?: string;
  change?: number;
}
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
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
  muscleGroups?: string[];
  primaryMuscleGroup?: string;
}
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
export interface WorkoutPlanExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  order?: number;
}
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
export interface WorkoutCategory extends FirestoreDocument {
  name: string;
  description: string;
  icon: string;
  color: string;
}
//=================================================
// EXERCISE RELATED TYPES
//=================================================
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
export interface MuscleGroup extends FirestoreDocument {
  name: string;
  description: string;
  imageUrl?: string;
  exercises?: string[]; // List of exercise IDs
  color?: string; // Color code for the muscle group (added as per design spec)
}
export interface Equipment extends FirestoreDocument {
  name: string;
  description?: string;
  imageUrl?: string;
  exercises?: string[]; // List of exercise IDs
}
//=================================================
// GOAL RELATED TYPES
//=================================================
export interface Goal extends FirestoreDocument {
  name: string;
  description: string;
  recommendedExercises?: string[]; // List of exercise IDs
  nutritionTips?: string;
  workoutFrequency?: number;
  duration?: number; // in weeks
}
//=================================================
// SOCIAL RELATED TYPES
//=================================================
export interface Friend extends FirestoreDocument {
  userId: string;
  friendId: string;
  username: string;
  profilePic?: string;
}
export interface FriendRequest extends FirestoreDocument {
  fromUid: string;
  fromUsername: string;
  fromPhotoUrl?: string;
  toUid: string;
  toUsername?: string;
  sentAt: FirebaseTimestamp | string;
  status: 'pending' | 'accepted' | 'rejected';
}
export interface FriendSuggestion {
  uid: string;
  username: string;
  profilePic?: string;
  mutualFriends?: number;
  reason?: string;
}
//=================================================
// ACHIEVEMENT TYPES
//=================================================
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
//=================================================
// ERROR HANDLING TYPES
//=================================================
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}
//=================================================
// APP SETTINGS
//=================================================
export interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
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
//=================================================
// TRACKING PROGRESS TYPES
//=================================================
export interface ProgressEntry extends FirestoreDocument {
  userId: string;
  date: string;
  type: 'weight' | 'measurement' | 'photo' | 'custom';
  value: number | string;
  unit?: string;
  notes?: string;
}
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
//=================================================
// NOTIFICATION TYPES
//=================================================
export interface AppNotification extends FirestoreDocument {
  userId: string;
  title: string;
  message: string;
  type: 'workout' | 'achievement' | 'friend' | 'system';
  read: boolean;
  data?: any;
}
//=================================================
// NETWORK RELATED TYPES
//=================================================
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  lastChecked: string;
}
export interface CacheSettings {
  maxAge: number; // in milliseconds
  staleTime: number; // in milliseconds
  retryCount: number;
} 