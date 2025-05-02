import { UserDatabaseService } from './UserDatabaseService';
import { WeightLogDatabaseService } from './WeightLogDatabaseService';
import { WorkoutDatabaseService } from './WorkoutDatabaseService';
import { ApiResponse, User, Workout, WorkoutPlan, WeightLogEntry } from '../../types/global';

/**
 * Main DatabaseService that combines all specific services
 */
class DatabaseService {
  private userService: UserDatabaseService;
  private weightLogService: WeightLogDatabaseService;
  private workoutService: WorkoutDatabaseService;
  
  constructor() {
    this.userService = new UserDatabaseService();
    this.weightLogService = new WeightLogDatabaseService();
    this.workoutService = new WorkoutDatabaseService();
  }
  
  // User profile operations
  
  /**
   * Save or update user profile
   * @param profile User profile data
   * @param isOnline Current online status
   * @returns API response with saved profile
   */
  async saveProfile(profile: Partial<User>, isOnline: boolean): Promise<ApiResponse<User>> {
    return this.userService.saveProfile(profile, isOnline);
  }
  
  /**
   * Get user profile
   * @param uid User ID
   * @param isOnline Current online status
   * @returns API response with user profile
   */
  async getProfile(uid: string, isOnline: boolean): Promise<ApiResponse<User>> {
    return this.userService.getProfile(uid, isOnline);
  }
  
  /**
   * Delete user profile
   * @param uid User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async deleteProfile(uid: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.userService.deleteProfile(uid, isOnline);
  }
  
  // Weight log operations
  
  /**
   * Add a new weight log entry
   * @param entry Weight log entry data
   * @param isOnline Current online status
   * @returns API response with saved entry and updated log
   */
  async logWeight(entry: Partial<WeightLogEntry>, isOnline: boolean): Promise<ApiResponse<WeightLogEntry[]>> {
    return this.weightLogService.logWeight(entry, isOnline);
  }
  
  /**
   * Get all weight log entries for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with weight log entries
   */
  async getWeightLog(userId: string, isOnline: boolean): Promise<ApiResponse<WeightLogEntry[]>> {
    return this.weightLogService.getWeightLog(userId, isOnline);
  }
  
  // Workout operations
  
  /**
   * Get recent workouts for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @param count Number of workouts to retrieve
   * @returns API response with recent workouts
   */
  async getRecentWorkouts(userId: string, isOnline: boolean, count?: number): Promise<ApiResponse<Workout[]>> {
    return this.workoutService.getRecentWorkouts(userId, isOnline, count);
  }
  
  /**
   * Get a specific workout by ID
   * @param workoutId Workout ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with workout
   */
  async getWorkoutById(workoutId: string, userId: string, isOnline: boolean): Promise<ApiResponse<Workout>> {
    return this.workoutService.getWorkoutById(workoutId, userId, isOnline);
  }
  
  /**
   * Save a workout
   * @param workout Workout data
   * @param isOnline Current online status
   * @returns API response with saved workout
   */
  async saveWorkout(workout: Workout, isOnline: boolean): Promise<ApiResponse<Workout>> {
    return this.workoutService.saveWorkout(workout, isOnline);
  }
  
  /**
   * Delete a workout
   * @param workoutId Workout ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async deleteWorkout(workoutId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.workoutService.deleteWorkout(workoutId, userId, isOnline);
  }
  
  /**
   * Get workout plans for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with workout plans
   */
  async getWorkoutPlans(userId: string, isOnline: boolean): Promise<ApiResponse<WorkoutPlan[]>> {
    return this.workoutService.getWorkoutPlans(userId, isOnline);
  }
  
  /**
   * Save a workout plan
   * @param plan Workout plan data
   * @param isOnline Current online status
   * @returns API response with saved plan
   */
  async saveWorkoutPlan(plan: WorkoutPlan, isOnline: boolean): Promise<ApiResponse<WorkoutPlan>> {
    return this.workoutService.saveWorkoutPlan(plan, isOnline);
  }
  
  /**
   * Delete a workout plan
   * @param planId Plan ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async deleteWorkoutPlan(planId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.workoutService.deleteWorkoutPlan(planId, userId, isOnline);
  }
}

// Export as a singleton instance
export default new DatabaseService(); 