// src/services/MockDataService.ts
// This service provides empty data structures when Firebase permissions fail or in offline mode
export interface UserProfile {
  username: string;
  email: string;
  fitnessGoal: string | null;
  joinDate: string | null;
  weight: number | null;
  height: number | null;
  age: number | null;
}
export interface WeightLog {
  date: string;
  weight: number;
  notes?: string;
}
export interface WorkoutHistory {
  [date: string]: any[];
}
class MockDataService {
  static getUserProfile(): UserProfile {
    return {
      username: '',
      email: '',
      fitnessGoal: null,
      joinDate: null,
      weight: null,
      height: null,
      age: null
    };
  }
  static getWeightLogs(): WeightLog[] {
    return [];
  }
  static getWorkoutHistory(): WorkoutHistory {
    return {};
  }
}
export default MockDataService; 