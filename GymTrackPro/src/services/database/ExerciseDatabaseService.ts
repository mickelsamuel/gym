import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { BaseDatabaseService } from './BaseDatabaseService';
import { db, FIREBASE_PATHS, firebaseFirestore } from '../firebase';
import { ApiResponse, Exercise } from '../../types/globalTypes';
import { StorageKeys } from '../../constants';
import { getExercises, getMuscleGroups, getWorkoutCategories } from '../../utils/dataLoader';
import { validateExercise } from '../../utils/sanitize';
import { logError } from '../../utils/logging';

/**
 * Service for exercise-related database operations
 */
export class ExerciseDatabaseService extends BaseDatabaseService {
  // Cache keys
  private readonly EXERCISES_CACHE_KEY = 'exercises';
  private readonly MUSCLE_GROUPS_CACHE_KEY = 'muscleGroups';
  private readonly WORKOUT_CATEGORIES_CACHE_KEY = 'workoutCategories';
  
  /**
   * Get all exercises
   * @param isOnline Current online status
   * @returns API response with all exercises
   */
  async getAllExercises(isOnline: boolean): Promise<ApiResponse<Exercise[]>> {
    return this.executeOperation(
      async () => {
        // Try to get from cache first
        const cachedExercises = this.getFromCache<Exercise[]>(this.EXERCISES_CACHE_KEY);
        if (cachedExercises) {
          return cachedExercises;
        }
        
        // If online, try to fetch from Firestore
        if (isOnline && this.isFirebaseAvailable) {
          this.checkOnlineStatus(isOnline);
          
          try {
            const exercises = await firebaseFirestore.getCollection<Exercise>(FIREBASE_PATHS.EXERCISES);
            
            // Cache the exercises
            this.addToCache(this.EXERCISES_CACHE_KEY, exercises);
            
            // Also save locally for offline access
            await this.saveToStorage(StorageKeys.EXERCISES_DATA, exercises);
            
            return exercises;
          } catch (error) {
            console.warn('Failed to fetch exercises from Firestore, falling back to local data:', error);
            logError('fetch_exercises_error', error);
          }
        }
        
        // If offline or Firestore failed, use locally stored data
        try {
          // Try to get from local storage first
          const storedExercises = await this.getFromStorage<Exercise[]>(StorageKeys.EXERCISES_DATA);
          if (storedExercises && storedExercises.length > 0) {
            // Cache the exercises
            this.addToCache(this.EXERCISES_CACHE_KEY, storedExercises);
            return storedExercises;
          }
          
          // If no stored exercises, use the default data
          const defaultExercises = await getExercises();
          
          // Cache the exercises
          this.addToCache(this.EXERCISES_CACHE_KEY, defaultExercises);
          
          // Save to local storage for future use
          await this.saveToStorage(StorageKeys.EXERCISES_DATA, defaultExercises);
          
          return defaultExercises;
        } catch (error) {
          console.error('Error loading exercise data:', error);
          logError('load_exercises_error', error);
          throw new Error('Failed to load exercise data');
        }
      },
      'get_exercises_error',
      'Failed to retrieve exercises'
    );
  }
  
  /**
   * Get exercise by ID
   * @param exerciseId Exercise ID
   * @param isOnline Current online status
   * @returns API response with exercise
   */
  async getExerciseById(exerciseId: string, isOnline: boolean): Promise<ApiResponse<Exercise>> {
    return this.executeOperation(
      async () => {
        if (!exerciseId) {
          throw new Error('Exercise ID is required');
        }
        
        // Try to get all exercises first (likely cached)
        const exercisesResponse = await this.getAllExercises(isOnline);
        if (exercisesResponse.success && exercisesResponse.data) {
          const exercise = exercisesResponse.data.find(ex => ex.id === exerciseId);
          if (exercise) {
            return exercise;
          }
        }
        
        // If not found in the list, try to fetch directly from Firestore
        if (isOnline && this.isFirebaseAvailable) {
          try {
            const exercise = await firebaseFirestore.getDocument<Exercise>(FIREBASE_PATHS.EXERCISES, exerciseId);
            if (exercise) {
              return exercise;
            }
          } catch (error) {
            console.warn(`Failed to fetch exercise ${exerciseId} from Firestore:`, error);
            logError('fetch_exercise_error', { exerciseId, error });
          }
        }
        
        throw new Error(`Exercise with ID ${exerciseId} not found`);
      },
      'get_exercise_error',
      `Failed to retrieve exercise with ID ${exerciseId}`
    );
  }
  
  /**
   * Get exercises by muscle group
   * @param muscleGroupId Muscle group ID
   * @param isOnline Current online status
   * @returns API response with exercises
   */
  async getExercisesByMuscleGroup(muscleGroupId: string, isOnline: boolean): Promise<ApiResponse<Exercise[]>> {
    return this.executeOperation(
      async () => {
        if (!muscleGroupId) {
          throw new Error('Muscle group ID is required');
        }
        
        // Try to get all exercises first (likely cached)
        const exercisesResponse = await this.getAllExercises(isOnline);
        if (exercisesResponse.success && exercisesResponse.data) {
          return exercisesResponse.data.filter(ex => 
            ex.muscleGroups && ex.muscleGroups.includes(muscleGroupId)
          );
        }
        
        // If all exercises couldn't be fetched, try to query Firestore directly
        if (isOnline && this.isFirebaseAvailable) {
          try {
            const exercises = await firebaseFirestore.getCollection<Exercise>(
              FIREBASE_PATHS.EXERCISES,
              [{ field: 'muscleGroups', operator: 'array-contains', value: muscleGroupId }]
            );
            return exercises;
          } catch (error) {
            console.warn(`Failed to fetch exercises for muscle group ${muscleGroupId}:`, error);
            logError('fetch_exercises_by_muscle_error', { muscleGroupId, error });
          }
        }
        
        return [];
      },
      'get_exercises_by_muscle_error',
      `Failed to retrieve exercises for muscle group ${muscleGroupId}`
    );
  }
  
  /**
   * Get exercises by category
   * @param categoryId Category ID
   * @param isOnline Current online status
   * @returns API response with exercises
   */
  async getExercisesByCategory(categoryId: string, isOnline: boolean): Promise<ApiResponse<Exercise[]>> {
    return this.executeOperation(
      async () => {
        if (!categoryId) {
          throw new Error('Category ID is required');
        }
        
        // Try to get all exercises first (likely cached)
        const exercisesResponse = await this.getAllExercises(isOnline);
        if (exercisesResponse.success && exercisesResponse.data) {
          return exercisesResponse.data.filter(ex => ex.category === categoryId);
        }
        
        // If all exercises couldn't be fetched, try to query Firestore directly
        if (isOnline && this.isFirebaseAvailable) {
          try {
            const exercises = await firebaseFirestore.getCollection<Exercise>(
              FIREBASE_PATHS.EXERCISES,
              [{ field: 'category', operator: '==', value: categoryId }]
            );
            return exercises;
          } catch (error) {
            console.warn(`Failed to fetch exercises for category ${categoryId}:`, error);
            logError('fetch_exercises_by_category_error', { categoryId, error });
          }
        }
        
        return [];
      },
      'get_exercises_by_category_error',
      `Failed to retrieve exercises for category ${categoryId}`
    );
  }
  
  /**
   * Get all muscle groups
   * @param isOnline Current online status
   * @returns API response with all muscle groups
   */
  async getAllMuscleGroups(isOnline: boolean): Promise<ApiResponse<any[]>> {
    return this.executeOperation(
      async () => {
        // Try to get from cache first
        const cachedMuscleGroups = this.getFromCache<any[]>(this.MUSCLE_GROUPS_CACHE_KEY);
        if (cachedMuscleGroups) {
          return cachedMuscleGroups;
        }
        
        // If online, try to fetch from Firestore
        if (isOnline && this.isFirebaseAvailable) {
          this.checkOnlineStatus(isOnline);
          
          try {
            const muscleGroups = await firebaseFirestore.getCollection(FIREBASE_PATHS.MUSCLE_GROUPS);
            
            // Cache the muscle groups
            this.addToCache(this.MUSCLE_GROUPS_CACHE_KEY, muscleGroups);
            
            // Also save locally for offline access
            await this.saveToStorage(StorageKeys.MUSCLE_GROUPS_DATA, muscleGroups);
            
            return muscleGroups;
          } catch (error) {
            console.warn('Failed to fetch muscle groups from Firestore, falling back to local data:', error);
            logError('fetch_muscle_groups_error', error);
          }
        }
        
        // If offline or Firestore failed, use locally stored data
        try {
          // Try to get from local storage first
          const storedMuscleGroups = await this.getFromStorage<any[]>(StorageKeys.MUSCLE_GROUPS_DATA);
          if (storedMuscleGroups && storedMuscleGroups.length > 0) {
            // Cache the muscle groups
            this.addToCache(this.MUSCLE_GROUPS_CACHE_KEY, storedMuscleGroups);
            return storedMuscleGroups;
          }
          
          // If no stored muscle groups, use the default data
          const defaultMuscleGroups = await getMuscleGroups();
          
          // Cache the muscle groups
          this.addToCache(this.MUSCLE_GROUPS_CACHE_KEY, defaultMuscleGroups);
          
          // Save to local storage for future use
          await this.saveToStorage(StorageKeys.MUSCLE_GROUPS_DATA, defaultMuscleGroups);
          
          return defaultMuscleGroups;
        } catch (error) {
          console.error('Error loading muscle group data:', error);
          logError('load_muscle_groups_error', error);
          throw new Error('Failed to load muscle group data');
        }
      },
      'get_muscle_groups_error',
      'Failed to retrieve muscle groups'
    );
  }
  
  /**
   * Get all workout categories
   * @param isOnline Current online status
   * @returns API response with all workout categories
   */
  async getAllWorkoutCategories(isOnline: boolean): Promise<ApiResponse<any[]>> {
    return this.executeOperation(
      async () => {
        // Try to get from cache first
        const cachedCategories = this.getFromCache<any[]>(this.WORKOUT_CATEGORIES_CACHE_KEY);
        if (cachedCategories) {
          return cachedCategories;
        }
        
        // If online, try to fetch from Firestore
        if (isOnline && this.isFirebaseAvailable) {
          this.checkOnlineStatus(isOnline);
          
          try {
            const categories = await firebaseFirestore.getCollection(FIREBASE_PATHS.WORKOUT_CATEGORIES);
            
            // Cache the categories
            this.addToCache(this.WORKOUT_CATEGORIES_CACHE_KEY, categories);
            
            // Also save locally for offline access
            await this.saveToStorage(StorageKeys.WORKOUT_CATEGORIES_DATA, categories);
            
            return categories;
          } catch (error) {
            console.warn('Failed to fetch workout categories from Firestore, falling back to local data:', error);
            logError('fetch_workout_categories_error', error);
          }
        }
        
        // If offline or Firestore failed, use locally stored data
        try {
          // Try to get from local storage first
          const storedCategories = await this.getFromStorage<any[]>(StorageKeys.WORKOUT_CATEGORIES_DATA);
          if (storedCategories && storedCategories.length > 0) {
            // Cache the categories
            this.addToCache(this.WORKOUT_CATEGORIES_CACHE_KEY, storedCategories);
            return storedCategories;
          }
          
          // If no stored categories, use the default data
          const defaultCategories = await getWorkoutCategories();
          
          // Cache the categories
          this.addToCache(this.WORKOUT_CATEGORIES_CACHE_KEY, defaultCategories);
          
          // Save to local storage for future use
          await this.saveToStorage(StorageKeys.WORKOUT_CATEGORIES_DATA, defaultCategories);
          
          return defaultCategories;
        } catch (error) {
          console.error('Error loading workout category data:', error);
          logError('load_workout_categories_error', error);
          throw new Error('Failed to load workout category data');
        }
      },
      'get_workout_categories_error',
      'Failed to retrieve workout categories'
    );
  }
} 