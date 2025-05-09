import { migrationService } from '../services/database/migration';
import { auth } from '../services/firebase';
import { logError } from './logging';
/**
 * Run data migrations
 * @param options Configuration options for the migration
 */
export const runMigrations = async (
  options: {
    migrateExercises?: boolean;
    migrateMuscleGroups?: boolean;
    migrateWorkoutCategories?: boolean;
    migrateGoals?: boolean;
    onProgress?: (message: string) => void;
    onComplete?: (results: any) => void;
    onError?: (error: any) => void;
  } = {
    migrateExercises: true,
    migrateMuscleGroups: true,
    migrateWorkoutCategories: true,
    migrateGoals: true,
  }
): Promise<void> => {
  try {
    // Default progress callback
    const onProgress = options.onProgress || ((message: string) => console.log(message));
    // Check if user is admin
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to run migrations');
    }
    // For now, we'll let anyone run migrations for development purposes
    // In a production app, we would check if the user is an admin
    onProgress('Starting data migrations...');
    const results: any = {};
    // Migrate exercises
    if (options.migrateExercises !== false) {
      onProgress('Migrating exercises...');
      results.exercises = await migrationService.migrateExercises();
      onProgress(`Migrated ${results.exercises} exercises successfully.`);
    }
    // Migrate muscle groups
    if (options.migrateMuscleGroups !== false) {
      onProgress('Migrating muscle groups...');
      results.muscleGroups = await migrationService.migrateMuscleGroups();
      onProgress(`Migrated ${results.muscleGroups} muscle groups successfully.`);
    }
    // Migrate workout categories
    if (options.migrateWorkoutCategories !== false) {
      onProgress('Migrating workout categories...');
      results.workoutCategories = await migrationService.migrateWorkoutCategories();
      onProgress(`Migrated ${results.workoutCategories} workout categories successfully.`);
    }
    // Migrate goals
    if (options.migrateGoals !== false) {
      onProgress('Migrating goals...');
      results.goals = await migrationService.migrateGoals();
      onProgress(`Migrated ${results.goals} goals successfully.`);
    }
    onProgress('All migrations completed successfully!');
    // Call the complete callback if provided
    if (options.onComplete) {
      options.onComplete(results);
    }
  } catch (error) {
    console.error('Migration error:', error);
    logError('migration_error', error);
    // Call the error callback if provided
    if (options.onError) {
      options.onError(error);
    }
    throw error;
  }
};
/**
 * Check if the data has already been migrated by querying for exercise count
 */
export const isMigrationNeeded = async (): Promise<boolean> => {
  try {
    const exerciseCount = await migrationService.getExerciseCount();
    return exerciseCount === 0; // If no exercises exist, migration is needed
  } catch (error) {
    console.error('Migration check error:', error);
    logError('migration_check_error', error);
    // If there's an error, default to needing migration
    return true;
  }
}; 