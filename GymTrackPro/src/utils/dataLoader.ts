import { firebaseFirestore, FIREBASE_PATHS, db } from '../services/firebase';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  DocumentData 
} from 'firebase/firestore';
import { Exercise, MuscleGroup, WorkoutCategory, Goal } from '../types/global';
import { logError } from './logging';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Static data imports
import defaultExercises from '../data/exercises';
import defaultMuscleGroups from '../data/muscleGroups';
import defaultWorkoutCategories from '../data/workoutCategories';
import defaultGoals from '../data/goals';

// Storage keys for data migration status
const DATA_MIGRATION_KEY = 'data_migration_status';

/**
 * Check if data has been migrated to Firestore
 */
export const isDataMigrated = async (): Promise<boolean> => {
  try {
    const migrationStatus = await AsyncStorage.getItem(DATA_MIGRATION_KEY);
    return migrationStatus === 'completed';
  } catch (error) {
    console.error('Error checking data migration status:', error);
    return false;
  }
};

/**
 * Save migration status
 */
export const saveMigrationStatus = async (status: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(DATA_MIGRATION_KEY, status);
  } catch (error) {
    console.error('Error saving migration status:', error);
  }
};

/**
 * Convert local data formats to Firestore model
 */
const convertExerciseData = (localExercises: any[]): Exercise[] => {
  return localExercises.map(exercise => {
    // Extract instructions from string or use array directly
    const instructions = typeof exercise.instructions === 'string'
      ? exercise.instructions.split('\n').filter((line: string) => line.trim().length > 0)
      : Array.isArray(exercise.instructions) 
        ? exercise.instructions 
        : [];

    // Determine muscle groups
    const muscleGroups = [
      ...(exercise.primaryMuscles || []), 
      ...(exercise.secondaryMuscles || [])
    ];

    // Determine primary muscle group
    const primaryMuscleGroup = exercise.primaryMuscles && exercise.primaryMuscles.length > 0
      ? exercise.primaryMuscles[0]
      : 'other';

    // Map difficulty
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    if (exercise.difficulty) {
      difficulty = exercise.difficulty;
    } else if (exercise.level) {
      // Map level (1=beginner, 2=intermediate, 3=advanced)
      if (exercise.level === 1) difficulty = 'beginner';
      else if (exercise.level === 3) difficulty = 'advanced';
    }

    return {
      id: exercise.id,
      name: exercise.name,
      description: exercise.description || `${exercise.name} exercise`,
      muscleGroups,
      primaryMuscleGroup,
      equipment: exercise.equipment || 'bodyweight',
      difficulty,
      category: exercise.category || 'other',
      instructions,
      videoUrl: exercise.videoUrl || '',
      imageUrl: exercise.imageUrl || '',
    } as Exercise;
  });
};

/**
 * Migrate exercises data to Firestore
 */
export const migrateExercisesToFirestore = async (): Promise<boolean> => {
  try {
    // Check if already migrated
    if (await isDataMigrated()) {
      console.log('Data already migrated to Firestore');
      return true;
    }

    // Check if exercises exist in Firestore
    const exercisesCollection = collection(db, FIREBASE_PATHS.EXERCISES);
    const snapshot = await getDocs(exercisesCollection);
    
    if (!snapshot.empty) {
      console.log('Exercises already exist in Firestore');
      await saveMigrationStatus('completed');
      return true;
    }

    // Convert exercises to proper format
    const exercises = convertExerciseData(defaultExercises);
    
    // Upload exercises in batches
    const batchSize = 100;
    const totalBatches = Math.ceil(exercises.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = writeBatch(db);
      const start = i * batchSize;
      const end = Math.min(start + batchSize, exercises.length);
      
      console.log(`Migrating exercises batch ${i + 1} of ${totalBatches} (${start} to ${end})`);
      
      for (let j = start; j < end; j++) {
        const exercise = exercises[j];
        const docRef = doc(db, FIREBASE_PATHS.EXERCISES, exercise.id);
        batch.set(docRef, exercise);
      }
      
      await batch.commit();
    }
    
    // Also migrate muscle groups
    const muscleGroupsCollection = collection(db, 'muscleGroups');
    const muscleGroupsSnapshot = await getDocs(muscleGroupsCollection);
    
    if (muscleGroupsSnapshot.empty) {
      const muscleGroups = defaultMuscleGroups;
      const batch = writeBatch(db);
      
      for (const muscleGroup of muscleGroups) {
        const docRef = doc(db, 'muscleGroups', muscleGroup.id);
        batch.set(docRef, muscleGroup);
      }
      
      await batch.commit();
    }
    
    // Migrate workout categories
    const categoriesCollection = collection(db, 'workoutCategories');
    const categoriesSnapshot = await getDocs(categoriesCollection);
    
    if (categoriesSnapshot.empty) {
      const categories = defaultWorkoutCategories;
      const batch = writeBatch(db);
      
      for (const category of categories) {
        const docRef = doc(db, 'workoutCategories', category.id);
        batch.set(docRef, category);
      }
      
      await batch.commit();
    }
    
    // Migrate goals
    const goalsCollection = collection(db, 'goals');
    const goalsSnapshot = await getDocs(goalsCollection);
    
    if (goalsSnapshot.empty) {
      const goals = defaultGoals;
      const batch = writeBatch(db);
      
      for (const goal of goals) {
        const docRef = doc(db, 'goals', goal.id);
        batch.set(docRef, goal);
      }
      
      await batch.commit();
    }
    
    await saveMigrationStatus('completed');
    console.log('Data migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error migrating data to Firestore:', error);
    logError('data_migration_error', error);
    return false;
  }
};

/**
 * Get exercises from Firestore or local storage
 */
export const getExercises = async (): Promise<Exercise[]> => {
  try {
    // Try to fetch from Firestore
    const exercisesCollection = collection(db, FIREBASE_PATHS.EXERCISES);
    const snapshot = await getDocs(exercisesCollection);
    
    if (!snapshot.empty) {
      const exercises = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      })) as Exercise[];
      
      // Save to local cache
      await AsyncStorage.setItem('exercises_cache', JSON.stringify(exercises));
      return exercises;
    }
    
    // If not in Firestore, check local cache
    const cachedExercises = await AsyncStorage.getItem('exercises_cache');
    if (cachedExercises) {
      return JSON.parse(cachedExercises) as Exercise[];
    }
    
    // If not in cache, use default data but convert to proper format
    return convertExerciseData(defaultExercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    logError('fetch_exercises_error', error);
    
    // Fallback to default data
    return convertExerciseData(defaultExercises);
  }
};

/**
 * Get muscle groups from Firestore or local storage
 */
export const getMuscleGroups = async (): Promise<MuscleGroup[]> => {
  try {
    // Try to fetch from Firestore
    const muscleGroupsCollection = collection(db, 'muscleGroups');
    const snapshot = await getDocs(muscleGroupsCollection);
    
    if (!snapshot.empty) {
      const muscleGroups = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      })) as MuscleGroup[];
      
      // Save to local cache
      await AsyncStorage.setItem('muscle_groups_cache', JSON.stringify(muscleGroups));
      return muscleGroups;
    }
    
    // If not in Firestore, check local cache
    const cachedMuscleGroups = await AsyncStorage.getItem('muscle_groups_cache');
    if (cachedMuscleGroups) {
      return JSON.parse(cachedMuscleGroups) as MuscleGroup[];
    }
    
    // If not in cache, use default data
    return defaultMuscleGroups as unknown as MuscleGroup[];
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    logError('fetch_muscle_groups_error', error);
    
    // Fallback to default data
    return defaultMuscleGroups as unknown as MuscleGroup[];
  }
};

/**
 * Get workout categories from Firestore or local storage
 */
export const getWorkoutCategories = async (): Promise<WorkoutCategory[]> => {
  try {
    // Try to fetch from Firestore
    const categoriesCollection = collection(db, 'workoutCategories');
    const snapshot = await getDocs(categoriesCollection);
    
    if (!snapshot.empty) {
      const categories = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      })) as WorkoutCategory[];
      
      // Save to local cache
      await AsyncStorage.setItem('workout_categories_cache', JSON.stringify(categories));
      return categories;
    }
    
    // If not in Firestore, check local cache
    const cachedCategories = await AsyncStorage.getItem('workout_categories_cache');
    if (cachedCategories) {
      return JSON.parse(cachedCategories) as WorkoutCategory[];
    }
    
    // If not in cache, use default data
    return defaultWorkoutCategories as unknown as WorkoutCategory[];
  } catch (error) {
    console.error('Error fetching workout categories:', error);
    logError('fetch_workout_categories_error', error);
    
    // Fallback to default data
    return defaultWorkoutCategories as unknown as WorkoutCategory[];
  }
};

/**
 * Get goals from Firestore or local storage
 */
export const getGoals = async (): Promise<Goal[]> => {
  try {
    // Try to fetch from Firestore
    const goalsCollection = collection(db, 'goals');
    const snapshot = await getDocs(goalsCollection);
    
    if (!snapshot.empty) {
      const goals = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      })) as Goal[];
      
      // Save to local cache
      await AsyncStorage.setItem('goals_cache', JSON.stringify(goals));
      return goals;
    }
    
    // If not in Firestore, check local cache
    const cachedGoals = await AsyncStorage.getItem('goals_cache');
    if (cachedGoals) {
      return JSON.parse(cachedGoals) as Goal[];
    }
    
    // If not in cache, use default data
    return defaultGoals as unknown as Goal[];
  } catch (error) {
    console.error('Error fetching goals:', error);
    logError('fetch_goals_error', error);
    
    // Fallback to default data
    return defaultGoals as unknown as Goal[];
  }
};

/**
 * Initialize app data - call this during app startup
 */
export const initializeAppData = async (): Promise<void> => {
  try {
    // Attempt to migrate data to Firestore if online
    const online = await fetch('https://www.google.com', { method: 'HEAD' })
      .then(() => true)
      .catch(() => false);
      
    if (online) {
      await migrateExercisesToFirestore();
    }
    
    // Prefetch all data to cache
    await Promise.all([
      getExercises(),
      getMuscleGroups(),
      getWorkoutCategories(),
      getGoals()
    ]);
    
    console.log('App data initialized successfully');
  } catch (error) {
    console.error('Error initializing app data:', error);
    logError('init_app_data_error', error);
  }
}; 