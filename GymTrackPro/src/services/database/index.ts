import { UserDatabaseService } from './UserDatabaseService';
import { WeightLogDatabaseService } from './WeightLogDatabaseService';
import { WorkoutDatabaseService } from './WorkoutDatabaseService';
import {ApiResponse, User, Workout, WorkoutPlan, WeightLogEntry, convertToFirebaseWorkout, convertFirebaseWorkout} from '../../types/mergedTypes';
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
    const result = await this.userService.saveProfile(profile, isOnline);
    return {
      ...result,
      data: result.data ? result.data as unknown as User : undefined
    };
  }
  /**
   * Get user profile
   * @param uid User ID
   * @param isOnline Current online status
   * @returns API response with user profile
   */
  async getProfile(uid: string, isOnline: boolean): Promise<ApiResponse<User>> {
    const result = await this.userService.getProfile(uid, isOnline);
    return {
      ...result,
      data: result.data ? result.data as unknown as User : undefined
    };
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
    const result = await this.weightLogService.logWeight(entry, isOnline);
    return {
      ...result,
      data: result.data ? result.data.map(entry => entry as unknown as WeightLogEntry) : undefined
    };
  }
  /**
   * Get all weight log entries for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with weight log entries
   */
  async getWeightLog(userId: string, isOnline: boolean): Promise<ApiResponse<WeightLogEntry[]>> {
    const result = await this.weightLogService.getWeightLog(userId, isOnline);
    return {
      ...result,
      data: result.data ? result.data.map(entry => entry as unknown as WeightLogEntry) : undefined
    };
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
    const result = await this.workoutService.getRecentWorkouts(userId, isOnline, count);
    return {
      ...result,
      data: result.data ? result.data.map(workout => convertFirebaseWorkout(workout)) : undefined
    };
  }
  /**
   * Get a specific workout by ID
   * @param workoutId Workout ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with workout
   */
  async getWorkoutById(workoutId: string, userId: string, isOnline: boolean): Promise<ApiResponse<Workout>> {
    const result = await this.workoutService.getWorkoutById(workoutId, userId, isOnline);
    return {
      ...result,
      data: result.data ? convertFirebaseWorkout(result.data) : undefined
    };
  }
  /**
   * Save a workout
   * @param workout Workout data
   * @param isOnline Current online status
   * @returns API response with saved workout
   */
  async saveWorkout(workout: Workout, isOnline: boolean): Promise<ApiResponse<Workout>> {
    const firebaseWorkout = convertToFirebaseWorkout(workout);
    const result = await this.workoutService.saveWorkout(firebaseWorkout as any, isOnline);
    return {
      ...result,
      data: result.data ? convertFirebaseWorkout(result.data) : undefined
    };
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
    const result = await this.workoutService.getWorkoutPlans(userId, isOnline);
    return result;
  }
  /**
   * Save a workout plan
   * @param plan Workout plan data
   * @param isOnline Current online status
   * @returns API response with saved plan
   */
  async saveWorkoutPlan(plan: WorkoutPlan, isOnline: boolean): Promise<ApiResponse<WorkoutPlan>> {
    const result = await this.workoutService.saveWorkoutPlan(plan, isOnline);
    return result;
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