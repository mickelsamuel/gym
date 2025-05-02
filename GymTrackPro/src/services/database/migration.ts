import { firebaseFirestore, FIREBASE_PATHS } from '../firebase';
import exercises from '../../data/exercises.js';
import muscleGroups from '../../data/muscleGroups.js';
import workoutCategories from '../../data/workoutCategories.js';
import goals from '../../data/goals.js';
import { Exercise, MuscleGroup, WorkoutCategory, Goal } from '../../types/global';
import { sanitizeString } from '../../utils/sanitize';
import { logError } from '../../utils/logging';

// Define interfaces that match the actual structure of the data files
interface RawExercise {
  id: string;
  name: string;
  category: string;
  type: string;
  image?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string;
  repRanges?: Array<{
    goal: string;
    sets: number;
    minReps: number;
    maxReps: number;
    restSeconds: number;
  }>;
}

interface RawMuscleGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  image?: string; // Some might have image instead of imageUrl
}

interface RawWorkoutCategory {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface RawGoal {
  id: string;
  name: string;
  description: string;
  nutritionTips: string;
  recommendedExerciseTypes: string[];
}

/**
 * Migration service to move static data to Firestore
 */
class MigrationService {
  /**
   * Migrate exercises from local data to Firestore
   * @returns Promise resolving to the count of exercises migrated
   */
  async migrateExercises(): Promise<number> {
    try {
      let count = 0;
      
      // Process exercises in batches
      const batchSize = 20;
      for (let i = 0; i < exercises.length; i += batchSize) {
        const batch = exercises.slice(i, i + batchSize) as RawExercise[];
        const promises = batch.map(exercise => {
          const formattedExercise: Exercise = {
            id: exercise.id,
            name: sanitizeString(exercise.name),
            description: sanitizeString(exercise.instructions || ''),
            muscleGroups: exercise.secondaryMuscles || [],
            primaryMuscleGroup: exercise.primaryMuscles?.[0] || '',
            equipment: exercise.type || 'bodyweight',
            difficulty: this.determineDifficulty(exercise),
            category: exercise.category || '',
            instructions: [sanitizeString(exercise.instructions || '')],
            imageUrl: exercise.image || '',
          };
          
          return firebaseFirestore.setDocument<Exercise>(
            FIREBASE_PATHS.EXERCISES, 
            exercise.id, 
            formattedExercise
          ).then(() => {
            count++;
          }).catch(error => {
            console.error(`Error migrating exercise ${exercise.id}:`, error);
            logError('exercise_migration_error', { exerciseId: exercise.id, error });
          });
        });
        
        await Promise.all(promises);
      }
      
      console.log(`Successfully migrated ${count} exercises to Firestore`);
      return count;
    } catch (error) {
      console.error('Error in exercise migration:', error);
      logError('exercise_migration_error', error);
      throw error;
    }
  }
  
  /**
   * Migrate muscle groups from local data to Firestore
   * @returns Promise resolving to the count of muscle groups migrated
   */
  async migrateMuscleGroups(): Promise<number> {
    try {
      let count = 0;
      
      const typedMuscleGroups = muscleGroups as RawMuscleGroup[];
      const promises = typedMuscleGroups.map(group => {
        const id = group.id || `muscle_${group.name.toLowerCase().replace(/\s+/g, '_')}`;
        const formattedGroup: MuscleGroup = {
          id: id,
          name: sanitizeString(group.name),
          description: sanitizeString(group.description || ''),
          imageUrl: group.image || '',
          exercises: [],
        };
        
        return firebaseFirestore.setDocument<MuscleGroup>(
          FIREBASE_PATHS.MUSCLE_GROUPS, 
          id, 
          formattedGroup
        ).then(() => {
          count++;
        }).catch(error => {
          console.error(`Error migrating muscle group ${group.name}:`, error);
          logError('muscle_group_migration_error', { groupName: group.name, error });
        });
      });
      
      await Promise.all(promises);
      console.log(`Successfully migrated ${count} muscle groups to Firestore`);
      return count;
    } catch (error) {
      console.error('Error in muscle group migration:', error);
      logError('muscle_group_migration_error', error);
      throw error;
    }
  }
  
  /**
   * Migrate workout categories from local data to Firestore
   * @returns Promise resolving to the count of categories migrated
   */
  async migrateWorkoutCategories(): Promise<number> {
    try {
      let count = 0;
      
      const typedCategories = workoutCategories as RawWorkoutCategory[];
      const promises = typedCategories.map(category => {
        // Create ID from name if not provided
        const categoryId = category.id || `category_${category.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        const formattedCategory: WorkoutCategory = {
          id: categoryId,
          name: sanitizeString(category.name),
          description: sanitizeString(category.description || ''),
          icon: category.icon || 'barbell-outline',
          color: category.color || '#4CAF50',
        };
        
        return firebaseFirestore.setDocument<WorkoutCategory>(
          FIREBASE_PATHS.WORKOUT_CATEGORIES, 
          categoryId, 
          formattedCategory
        ).then(() => {
          count++;
        }).catch(error => {
          console.error(`Error migrating workout category ${category.name}:`, error);
          logError('workout_category_migration_error', { categoryName: category.name, error });
        });
      });
      
      await Promise.all(promises);
      console.log(`Successfully migrated ${count} workout categories to Firestore`);
      return count;
    } catch (error) {
      console.error('Error in workout category migration:', error);
      logError('workout_category_migration_error', error);
      throw error;
    }
  }
  
  /**
   * Migrate goals from local data to Firestore
   * @returns Promise resolving to the count of goals migrated
   */
  async migrateGoals(): Promise<number> {
    try {
      let count = 0;
      
      const typedGoals = goals as RawGoal[];
      const promises = typedGoals.map(goal => {
        // Convert the recommendedExerciseTypes to recommendedExercises array
        const goalId = goal.id || `goal_${goal.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        const formattedGoal: Goal = {
          id: goalId,
          name: sanitizeString(goal.name),
          description: sanitizeString(goal.description || ''),
          recommendedExercises: goal.recommendedExerciseTypes || [],
          nutritionTips: sanitizeString(goal.nutritionTips || ''),
          workoutFrequency: 3, // Default to 3 times per week
          duration: 8, // Default to 8 weeks
        };
        
        return firebaseFirestore.setDocument<Goal>(
          FIREBASE_PATHS.GOALS, 
          goalId, 
          formattedGoal
        ).then(() => {
          count++;
        }).catch(error => {
          console.error(`Error migrating goal ${goal.name}:`, error);
          logError('goal_migration_error', { goalName: goal.name, error });
        });
      });
      
      await Promise.all(promises);
      console.log(`Successfully migrated ${count} goals to Firestore`);
      return count;
    } catch (error) {
      console.error('Error in goal migration:', error);
      logError('goal_migration_error', error);
      throw error;
    }
  }
  
  /**
   * Migrate all static data to Firestore
   * @returns Promise resolving when all migrations are complete
   */
  async migrateAllData(): Promise<{
    exercises: number;
    muscleGroups: number;
    workoutCategories: number;
    goals: number;
  }> {
    try {
      const exerciseCount = await this.migrateExercises();
      const muscleGroupCount = await this.migrateMuscleGroups();
      const categoryCount = await this.migrateWorkoutCategories();
      const goalCount = await this.migrateGoals();
      
      return {
        exercises: exerciseCount,
        muscleGroups: muscleGroupCount,
        workoutCategories: categoryCount,
        goals: goalCount,
      };
    } catch (error) {
      console.error('Error in data migration:', error);
      logError('data_migration_error', error);
      throw error;
    }
  }
  
  /**
   * Helper function to determine exercise difficulty based on rep ranges
   * @param exercise The exercise data
   * @returns Difficulty level
   */
  private determineDifficulty(exercise: RawExercise): 'beginner' | 'intermediate' | 'advanced' {
    if (!exercise.repRanges || !exercise.repRanges.length) {
      return 'intermediate';
    }
    
    // Look at the strength goal rep range
    const strengthRange = exercise.repRanges.find(range => range.goal === 'strength');
    if (!strengthRange) {
      return 'intermediate';
    }
    
    // Determine difficulty based on max reps for strength
    const maxReps = strengthRange.maxReps || 0;
    
    if (maxReps <= 6) {
      return 'advanced';
    } else if (maxReps <= 10) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  /**
   * Get the current count of exercises in Firestore
   * @returns Promise resolving to the number of exercises
   */
  async getExerciseCount(): Promise<number> {
    try {
      const exercises = await firebaseFirestore.getCollection(FIREBASE_PATHS.EXERCISES);
      return exercises.length;
    } catch (error) {
      console.error('Error getting exercise count:', error);
      logError('get_exercise_count_error', error);
      return 0;
    }
  }
}

export const migrationService = new MigrationService(); 