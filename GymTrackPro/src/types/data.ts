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