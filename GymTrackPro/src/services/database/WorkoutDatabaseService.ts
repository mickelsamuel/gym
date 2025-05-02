import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy, limit, addDoc } from 'firebase/firestore';
import { BaseDatabaseService } from './BaseDatabaseService';
import { db } from '../firebase';
import { Workout, WorkoutPlan, ApiResponse } from '../../types/global';
import { StorageKeys, FIREBASE_COLLECTIONS, APP_CONSTANTS } from '../../constants';
import { validateWorkout } from '../../utils/sanitize';

/**
 * Service for workout related database operations
 */
export class WorkoutDatabaseService extends BaseDatabaseService {
  /**
   * Get recent workouts for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @param count Number of workouts to retrieve (default: 10)
   * @returns API response with recent workouts
   */
  async getRecentWorkouts(userId: string, isOnline: boolean, count: number = 10): Promise<ApiResponse<Workout[]>> {
    try {
      if (!userId) {
        return this.createErrorResponse('missing_user_id', 'User ID is required');
      }
      
      // Get local workouts
      const localWorkouts = await this.getFromStorage<Workout[]>(StorageKeys.WORKOUT_HISTORY) || [];
      const userLocalWorkouts = localWorkouts
        .filter(workout => workout.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, count);
      
      // If online, try to get from Firestore
      if (isOnline && this.isFirebaseAvailable) {
        try {
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
          const workoutsRef = collection(userDocRef, 'workoutHistory');
          const q = query(workoutsRef, orderBy('date', 'desc'), limit(count));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const remoteWorkouts: Workout[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Workout));
            
            // No need to merge, just return the most recent from remote
            return this.createSuccessResponse(remoteWorkouts);
          }
        } catch (firebaseError) {
          console.error('Error fetching recent workouts from Firestore:', firebaseError);
          // Continue with local storage
        }
      }
      
      // Return local workouts
      return this.createSuccessResponse(userLocalWorkouts);
    } catch (error) {
      console.error('Error in getRecentWorkouts:', error);
      return this.createErrorResponse('get_recent_workouts_error', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Get a specific workout by ID
   * @param workoutId Workout ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with the workout
   */
  async getWorkoutById(workoutId: string, userId: string, isOnline: boolean): Promise<ApiResponse<Workout>> {
    try {
      if (!workoutId) {
        return this.createErrorResponse('missing_workout_id', 'Workout ID is required');
      }
      
      if (!userId) {
        return this.createErrorResponse('missing_user_id', 'User ID is required');
      }
      
      // Get from local storage first
      const localWorkouts = await this.getFromStorage<Workout[]>(StorageKeys.WORKOUT_HISTORY) || [];
      const workout = localWorkouts.find(w => w.id === workoutId && w.userId === userId);
      
      // If online, try to get from Firestore
      if (isOnline && this.isFirebaseAvailable) {
        try {
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
          const workoutDocRef = doc(userDocRef, 'workoutHistory', workoutId);
          const workoutDoc = await getDoc(workoutDocRef);
          
          if (workoutDoc.exists()) {
            const remoteWorkout = {
              id: workoutDoc.id,
              ...workoutDoc.data()
            } as Workout;
            
            // Replace local version if it exists
            if (workout) {
              const index = localWorkouts.findIndex(w => w.id === workoutId);
              if (index >= 0) {
                localWorkouts[index] = remoteWorkout;
                await this.saveToStorage(StorageKeys.WORKOUT_HISTORY, localWorkouts);
              }
            }
            
            return this.createSuccessResponse(remoteWorkout);
          }
        } catch (firebaseError) {
          console.error('Error fetching workout from Firestore:', firebaseError);
          // Continue with local storage
        }
      }
      
      // Return local workout if available
      if (workout) {
        return this.createSuccessResponse(workout);
      }
      
      return this.createErrorResponse('not_found', 'Workout not found');
    } catch (error) {
      console.error('Error in getWorkoutById:', error);
      return this.createErrorResponse('get_workout_error', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Save a workout
   * @param workout Workout data
   * @param isOnline Current online status
   * @returns API response with the saved workout
   */
  async saveWorkout(workout: Workout, isOnline: boolean): Promise<ApiResponse<Workout>> {
    try {
      // Validate workout
      if (!workout.userId) {
        return this.createErrorResponse('missing_user_id', 'User ID is required');
      }
      
      const validationErrors = validateWorkout(workout);
      if (validationErrors.length > 0) {
        return this.createErrorResponse('validation_error', 'Workout validation failed', validationErrors);
      }
      
      // Handle IDs
      let isNewWorkout = false;
      if (!workout.id) {
        workout.id = this.generateId();
        isNewWorkout = true;
      }
      
      // Update local storage
      const workouts = await this.getFromStorage<Workout[]>(StorageKeys.WORKOUT_HISTORY) || [];
      const index = workouts.findIndex(w => w.id === workout.id);
      
      if (index >= 0) {
        workouts[index] = workout;
      } else {
        workouts.push(workout);
      }
      
      await this.saveToStorage(StorageKeys.WORKOUT_HISTORY, workouts);
      
      // Sync with Firestore if online
      if (isOnline && this.isFirebaseAvailable) {
        try {
          this.checkOnlineStatus(isOnline);
          
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, workout.userId);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            return this.createErrorResponse('user_not_found', 'User document not found');
          }
          
          const workoutsRef = collection(userDocRef, 'workoutHistory');
          
          if (isNewWorkout) {
            // Create new document
            const docRef = await addDoc(workoutsRef, {
              ...workout,
              id: undefined, // Firestore will auto-generate ID
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            // Update workout with Firestore ID
            workout.id = docRef.id;
            
            // Update local storage with new ID
            const updatedIndex = workouts.findIndex(w => w.id === workout.id);
            if (updatedIndex >= 0) {
              workouts[updatedIndex].id = docRef.id;
              await this.saveToStorage(StorageKeys.WORKOUT_HISTORY, workouts);
            }
          } else {
            // Update existing document
            const workoutDocRef = doc(workoutsRef, workout.id);
            await updateDoc(workoutDocRef, {
              ...workout,
              id: undefined, // Firestore doesn't store ID field
              updatedAt: serverTimestamp()
            });
          }
        } catch (firebaseError) {
          console.error('Error saving workout to Firestore:', firebaseError);
          // Continue with local storage only
        }
      }
      
      return this.createSuccessResponse(workout);
    } catch (error) {
      console.error('Error in saveWorkout:', error);
      return this.createErrorResponse('save_workout_error', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Delete a workout
   * @param workoutId Workout ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async deleteWorkout(workoutId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    try {
      if (!workoutId) {
        return this.createErrorResponse('missing_workout_id', 'Workout ID is required');
      }
      
      if (!userId) {
        return this.createErrorResponse('missing_user_id', 'User ID is required');
      }
      
      // Update local storage
      const workouts = await this.getFromStorage<Workout[]>(StorageKeys.WORKOUT_HISTORY) || [];
      const updatedWorkouts = workouts.filter(w => !(w.id === workoutId && w.userId === userId));
      
      await this.saveToStorage(StorageKeys.WORKOUT_HISTORY, updatedWorkouts);
      
      // Delete from Firestore if online
      if (isOnline && this.isFirebaseAvailable) {
        try {
          this.checkOnlineStatus(isOnline);
          
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
          const workoutDocRef = doc(userDocRef, 'workoutHistory', workoutId);
          
          await deleteDoc(workoutDocRef);
        } catch (firebaseError) {
          console.error('Error deleting workout from Firestore:', firebaseError);
          // Continue with local delete only
        }
      }
      
      return this.createSuccessResponse(true);
    } catch (error) {
      console.error('Error in deleteWorkout:', error);
      return this.createErrorResponse('delete_workout_error', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Get workout plans for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with workout plans
   */
  async getWorkoutPlans(userId: string, isOnline: boolean): Promise<ApiResponse<WorkoutPlan[]>> {
    try {
      if (!userId) {
        return this.createErrorResponse('missing_user_id', 'User ID is required');
      }
      
      // Get from local storage first
      const localPlans = await this.getFromStorage<WorkoutPlan[]>(StorageKeys.WORKOUT_PLANS) || [];
      const userLocalPlans = localPlans.filter(plan => plan.userId === userId);
      
      // If online, try to get from Firestore
      if (isOnline && this.isFirebaseAvailable) {
        try {
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
          const plansRef = collection(userDocRef, 'workoutPlans');
          const snapshot = await getDocs(plansRef);
          
          if (!snapshot.empty) {
            const remotePlans: WorkoutPlan[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as WorkoutPlan));
            
            // Update local storage with all plans
            const otherUserPlans = localPlans.filter(plan => plan.userId !== userId);
            await this.saveToStorage(StorageKeys.WORKOUT_PLANS, [...otherUserPlans, ...remotePlans]);
            
            return this.createSuccessResponse(remotePlans);
          }
        } catch (firebaseError) {
          console.error('Error fetching workout plans from Firestore:', firebaseError);
          // Continue with local storage
        }
      }
      
      // Return local plans
      return this.createSuccessResponse(userLocalPlans);
    } catch (error) {
      console.error('Error in getWorkoutPlans:', error);
      return this.createErrorResponse('get_workout_plans_error', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Save a workout plan
   * @param plan Workout plan data
   * @param isOnline Current online status
   * @returns API response with the saved plan
   */
  async saveWorkoutPlan(plan: WorkoutPlan, isOnline: boolean): Promise<ApiResponse<WorkoutPlan>> {
    try {
      if (!plan.userId) {
        return this.createErrorResponse('missing_user_id', 'User ID is required');
      }
      
      if (!plan.name || typeof plan.name !== 'string' || plan.name.trim().length < 3) {
        return this.createErrorResponse('invalid_name', 'Plan name is required and must be at least 3 characters');
      }
      
      // Handle IDs
      let isNewPlan = false;
      if (!plan.id) {
        plan.id = this.generateId();
        isNewPlan = true;
      }
      
      // Update local storage
      const plans = await this.getFromStorage<WorkoutPlan[]>(StorageKeys.WORKOUT_PLANS) || [];
      const index = plans.findIndex(p => p.id === plan.id);
      
      if (index >= 0) {
        plans[index] = plan;
      } else {
        plans.push(plan);
      }
      
      await this.saveToStorage(StorageKeys.WORKOUT_PLANS, plans);
      
      // Sync with Firestore if online
      if (isOnline && this.isFirebaseAvailable) {
        try {
          this.checkOnlineStatus(isOnline);
          
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, plan.userId);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            return this.createErrorResponse('user_not_found', 'User document not found');
          }
          
          const plansRef = collection(userDocRef, 'workoutPlans');
          
          if (isNewPlan) {
            // Create new document
            const docRef = await addDoc(plansRef, {
              ...plan,
              id: undefined, // Firestore will auto-generate ID
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            // Update plan with Firestore ID
            plan.id = docRef.id;
            
            // Update local storage with new ID
            const updatedIndex = plans.findIndex(p => p.id === plan.id);
            if (updatedIndex >= 0) {
              plans[updatedIndex].id = docRef.id;
              await this.saveToStorage(StorageKeys.WORKOUT_PLANS, plans);
            }
          } else {
            // Update existing document
            const planDocRef = doc(plansRef, plan.id);
            await updateDoc(planDocRef, {
              ...plan,
              id: undefined, // Firestore doesn't store ID field
              updatedAt: serverTimestamp()
            });
          }
        } catch (firebaseError) {
          console.error('Error saving workout plan to Firestore:', firebaseError);
          // Continue with local storage only
        }
      }
      
      return this.createSuccessResponse(plan);
    } catch (error) {
      console.error('Error in saveWorkoutPlan:', error);
      return this.createErrorResponse('save_workout_plan_error', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Delete a workout plan
   * @param planId Plan ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async deleteWorkoutPlan(planId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    try {
      if (!planId) {
        return this.createErrorResponse('missing_plan_id', 'Plan ID is required');
      }
      
      if (!userId) {
        return this.createErrorResponse('missing_user_id', 'User ID is required');
      }
      
      // Update local storage
      const plans = await this.getFromStorage<WorkoutPlan[]>(StorageKeys.WORKOUT_PLANS) || [];
      const updatedPlans = plans.filter(p => !(p.id === planId && p.userId === userId));
      
      await this.saveToStorage(StorageKeys.WORKOUT_PLANS, updatedPlans);
      
      // Delete from Firestore if online
      if (isOnline && this.isFirebaseAvailable) {
        try {
          this.checkOnlineStatus(isOnline);
          
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, userId);
          const planDocRef = doc(userDocRef, 'workoutPlans', planId);
          
          await deleteDoc(planDocRef);
        } catch (firebaseError) {
          console.error('Error deleting workout plan from Firestore:', firebaseError);
          // Continue with local delete only
        }
      }
      
      return this.createSuccessResponse(true);
    } catch (error) {
      console.error('Error in deleteWorkoutPlan:', error);
      return this.createErrorResponse('delete_workout_plan_error', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Generate a unique ID for local entities
   * @returns A unique string ID
   */
  private generateId(): string {
    return 'local_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
} 