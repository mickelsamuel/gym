// DatabaseService.ts - Main service for database operations
import { UserDatabaseService } from './database/UserDatabaseService';
import { WorkoutDatabaseService } from './database/WorkoutDatabaseService';
import { WeightLogDatabaseService } from './database/WeightLogDatabaseService';
import { ExerciseDatabaseService } from './database/ExerciseDatabaseService';
import { FriendDatabaseService } from './database/FriendDatabaseService';
import { 
  ApiResponse, 
  User, 
  Workout, 
  WorkoutPlan, 
  WeightLogEntry, 
  Exercise, 
  Friend, 
  FriendRequest 
} from '../types/globalTypes';
import { NetworkStatus } from '../services/NetworkState';

/**
 * DatabaseService - Main service that coordinates all database operations
 * This class provides a unified interface for all database operations
 * while delegating the actual implementation to specialized services.
 */
class DatabaseService {
  private userService: UserDatabaseService;
  private workoutService: WorkoutDatabaseService;
  private weightLogService: WeightLogDatabaseService;
  private exerciseService: ExerciseDatabaseService;
  private friendService: FriendDatabaseService;
  
  constructor() {
    this.userService = new UserDatabaseService();
    this.weightLogService = new WeightLogDatabaseService();
    this.workoutService = new WorkoutDatabaseService();
    this.exerciseService = new ExerciseDatabaseService();
    this.friendService = new FriendDatabaseService();
  }
  
  // ======================================================
  // USER PROFILE OPERATIONS
  // ======================================================
  
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
   * Get multiple user profiles by IDs
   * @param uids Array of user IDs
   * @param isOnline Current online status
   * @returns API response with array of user profiles
   */
  async getMultipleProfiles(uids: string[], isOnline: boolean): Promise<ApiResponse<User[]>> {
    return this.userService.getMultipleProfiles(uids, isOnline);
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
  
  /**
   * Update user settings
   * @param uid User ID
   * @param settings Settings to update
   * @param isOnline Current online status
   * @returns API response with updated settings
   */
  async updateUserSettings(uid: string, settings: any, isOnline: boolean): Promise<ApiResponse<any>> {
    return this.userService.updateUserSettings(uid, settings, isOnline);
  }
  
  // ======================================================
  // WEIGHT LOG OPERATIONS
  // ======================================================
  
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
  
  /**
   * Update a weight log entry
   * @param entryId Entry ID
   * @param userId User ID
   * @param data Updated data
   * @param isOnline Current online status
   * @returns API response with updated entry
   */
  async updateWeightLogEntry(
    entryId: string, 
    userId: string,
    data: Partial<WeightLogEntry>,
    isOnline: boolean
  ): Promise<ApiResponse<WeightLogEntry>> {
    return this.weightLogService.updateWeightLogEntry(entryId, userId, data, isOnline);
  }
  
  /**
   * Delete a weight log entry
   * @param entryId Entry ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async deleteWeightLogEntry(
    entryId: string,
    userId: string,
    isOnline: boolean
  ): Promise<ApiResponse<boolean>> {
    return this.weightLogService.deleteWeightLogEntry(entryId, userId, isOnline);
  }
  
  // ======================================================
  // WORKOUT OPERATIONS
  // ======================================================
  
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
   * Get all workouts for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with all workouts
   */
  async getAllWorkouts(userId: string, isOnline: boolean): Promise<ApiResponse<Workout[]>> {
    return this.workoutService.getAllWorkouts(userId, isOnline);
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
   * Update a workout
   * @param workoutId Workout ID
   * @param userId User ID
   * @param data Updated data
   * @param isOnline Current online status
   * @returns API response with updated workout
   */
  async updateWorkout(
    workoutId: string,
    userId: string,
    data: Partial<Workout>,
    isOnline: boolean
  ): Promise<ApiResponse<Workout>> {
    return this.workoutService.updateWorkout(workoutId, userId, data, isOnline);
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
   * Get a specific workout plan by ID
   * @param planId Plan ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with workout plan
   */
  async getWorkoutPlanById(planId: string, userId: string, isOnline: boolean): Promise<ApiResponse<WorkoutPlan>> {
    return this.workoutService.getWorkoutPlanById(planId, userId, isOnline);
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
   * Update a workout plan
   * @param planId Plan ID
   * @param userId User ID
   * @param data Updated data
   * @param isOnline Current online status
   * @returns API response with updated plan
   */
  async updateWorkoutPlan(
    planId: string,
    userId: string,
    data: Partial<WorkoutPlan>,
    isOnline: boolean
  ): Promise<ApiResponse<WorkoutPlan>> {
    return this.workoutService.updateWorkoutPlan(planId, userId, data, isOnline);
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
  
  // ======================================================
  // EXERCISE OPERATIONS
  // ======================================================
  
  /**
   * Get all exercises
   * @param isOnline Current online status
   * @returns API response with all exercises
   */
  async getAllExercises(isOnline: boolean): Promise<ApiResponse<Exercise[]>> {
    return this.exerciseService.getAllExercises(isOnline);
  }
  
  /**
   * Get exercise by ID
   * @param exerciseId Exercise ID
   * @param isOnline Current online status
   * @returns API response with exercise
   */
  async getExerciseById(exerciseId: string, isOnline: boolean): Promise<ApiResponse<Exercise>> {
    return this.exerciseService.getExerciseById(exerciseId, isOnline);
  }
  
  /**
   * Get exercises by muscle group
   * @param muscleGroupId Muscle group ID
   * @param isOnline Current online status
   * @returns API response with exercises
   */
  async getExercisesByMuscleGroup(muscleGroupId: string, isOnline: boolean): Promise<ApiResponse<Exercise[]>> {
    return this.exerciseService.getExercisesByMuscleGroup(muscleGroupId, isOnline);
  }
  
  /**
   * Get exercises by category
   * @param categoryId Category ID
   * @param isOnline Current online status
   * @returns API response with exercises
   */
  async getExercisesByCategory(categoryId: string, isOnline: boolean): Promise<ApiResponse<Exercise[]>> {
    return this.exerciseService.getExercisesByCategory(categoryId, isOnline);
  }
  
  /**
   * Get all muscle groups
   * @param isOnline Current online status
   * @returns API response with all muscle groups
   */
  async getAllMuscleGroups(isOnline: boolean): Promise<ApiResponse<any[]>> {
    return this.exerciseService.getAllMuscleGroups(isOnline);
  }
  
  /**
   * Get all workout categories
   * @param isOnline Current online status
   * @returns API response with all workout categories
   */
  async getAllWorkoutCategories(isOnline: boolean): Promise<ApiResponse<any[]>> {
    return this.exerciseService.getAllWorkoutCategories(isOnline);
  }
  
  // ======================================================
  // SOCIAL / FRIENDS OPERATIONS
  // ======================================================
  
  /**
   * Get friends for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with friends
   */
  async getFriends(userId: string, isOnline: boolean): Promise<ApiResponse<Friend[]>> {
    return this.friendService.getFriends(userId, isOnline);
  }
  
  /**
   * Send friend request
   * @param fromUserId Sender user ID
   * @param toUserId Recipient user ID
   * @param username Sender username
   * @param photoUrl Sender photo URL (optional)
   * @param isOnline Current online status
   * @returns API response with friend request
   */
  async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
    username: string,
    photoUrl: string | undefined,
    isOnline: boolean
  ): Promise<ApiResponse<FriendRequest>> {
    return this.friendService.sendFriendRequest(fromUserId, toUserId, username, photoUrl, isOnline);
  }
  
  /**
   * Get received friend requests
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with friend requests
   */
  async getReceivedFriendRequests(userId: string, isOnline: boolean): Promise<ApiResponse<FriendRequest[]>> {
    return this.friendService.getReceivedFriendRequests(userId, isOnline);
  }
  
  /**
   * Get sent friend requests
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with sent friend requests
   */
  async getSentFriendRequests(userId: string, isOnline: boolean): Promise<ApiResponse<FriendRequest[]>> {
    return this.friendService.getSentFriendRequests(userId, isOnline);
  }
  
  /**
   * Accept friend request
   * @param requestId Request ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async acceptFriendRequest(requestId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.friendService.acceptFriendRequest(requestId, userId, isOnline);
  }
  
  /**
   * Reject friend request
   * @param requestId Request ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async rejectFriendRequest(requestId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.friendService.rejectFriendRequest(requestId, userId, isOnline);
  }
  
  /**
   * Remove friend
   * @param friendshipId Friendship ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async removeFriend(friendshipId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.friendService.removeFriend(friendshipId, userId, isOnline);
  }
  
  // ======================================================
  // DATA SYNCHRONIZATION
  // ======================================================
  
  /**
   * Synchronize all user data
   * @param userId User ID
   * @param networkStatus Current network status
   * @returns API response indicating success or failure
   */
  async syncAllData(userId: string, networkStatus: NetworkStatus): Promise<ApiResponse<boolean>> {
    if (!userId || !networkStatus.isConnected || !networkStatus.isInternetReachable) {
      return {
        success: false,
        error: {
          code: 'network_error',
          message: 'Cannot sync data while offline'
        }
      };
    }
    
    try {
      // Sync user profile
      await this.userService.syncUserData(userId, true);
      
      // Sync workout data
      await this.workoutService.syncWorkoutData(userId, true);
      
      // Sync weight log
      await this.weightLogService.syncWeightLogData(userId, true);
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'sync_error',
          message: 'Failed to synchronize data',
          details: error
        }
      };
    }
  }
}

// Export a singleton instance
const databaseService = new DatabaseService();
export default databaseService;

// Also export individual services for direct access when needed
export const userService = new UserDatabaseService();
export const workoutService = new WorkoutDatabaseService();
export const weightLogService = new WeightLogDatabaseService();
export const exerciseService = new ExerciseDatabaseService();
export const friendService = new FriendDatabaseService();