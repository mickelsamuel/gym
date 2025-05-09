/**
 * Data Validation Utilities
 * 
 * Comprehensive validation for all data types used in the application
 */
import { 
  User, 
  Workout, 
  WeightLogEntry, 
  Exercise, 
  WorkoutPlan, 
  Friend,
  FriendRequest,
  WorkoutSet
} from '../types/mergedTypes';
import { isValidEmail } from './sanitize';
/**
 * Error class for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
/**
 * Validate required fields in any object
 * @param data Object to validate
 * @param requiredFields Array of required field names
 * @throws ValidationError if any required field is missing
 */
export const validateRequiredFields = <T extends Record<string, any>>(
  data: T, 
  requiredFields: string[]
): void => {
  const missingFields = requiredFields.filter(field => !data || data[field] === undefined || data[field] === null);
  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
};
/**
 * Validate user profile data
 * @param user User data to validate
 * @returns Validated user data
 * @throws ValidationError if validation fails
 */
export const validateUserProfile = (user: Partial<User>): Partial<User> => {
  validateRequiredFields(user, ['uid']);
  if (user.email && !isValidEmail(user.email)) {
    throw new ValidationError('Invalid email format');
  }
  if (user.username && (user.username.length < 3 || user.username.length > 30)) {
    throw new ValidationError('Username must be between 3 and 30 characters');
  }
  if (user.height && (typeof user.height !== 'number' || user.height <= 0 || user.height > 300)) {
    throw new ValidationError('Height must be a positive number less than 300cm');
  }
  if (user.weight && (typeof user.weight !== 'number' || user.weight <= 0 || user.weight > 500)) {
    throw new ValidationError('Weight must be a positive number less than 500kg');
  }
  return user;
};
/**
 * Validate weight log entry
 * @param entry Weight log entry to validate
 * @returns Validated weight log entry
 * @throws ValidationError if validation fails
 */
export const validateWeightLogEntry = (entry: Partial<WeightLogEntry>): Partial<WeightLogEntry> => {
  validateRequiredFields(entry, ['userId', 'weight', 'date']);
  if (typeof entry.weight !== 'number' || entry.weight <= 0 || entry.weight > 500) {
    throw new ValidationError('Weight must be a positive number less than 500kg');
  }
  // Validate date format
  try {
    new Date(entry.date as string).toISOString();
  } catch (error) {
    throw new ValidationError('Invalid date format');
  }
  return entry;
};
/**
 * Validate workout set data
 * @param set Workout set to validate
 * @returns Validated workout set
 * @throws ValidationError if validation fails
 */
export const validateWorkoutSet = (set: Partial<WorkoutSet>): Partial<WorkoutSet> => {
  if (set.weight !== undefined && (typeof set.weight !== 'number' || set.weight < 0)) {
    throw new ValidationError('Weight must be a non-negative number');
  }
  if (set.reps !== undefined && (typeof set.reps !== 'number' || set.reps <= 0 || !Number.isInteger(set.reps))) {
    throw new ValidationError('Reps must be a positive integer');
  }
  if ('duration' in set && set.duration !== undefined && (typeof set.duration !== 'number' || set.duration <= 0)) {
    throw new ValidationError('Duration must be a positive number');
  }
  return set;
};
/**
 * Validate workout data
 * @param workout Workout data to validate
 * @returns Validated workout data
 * @throws ValidationError if validation fails
 */
export const validateWorkout = (workout: Partial<Workout>): Partial<Workout> => {
  validateRequiredFields(workout, ['userId', 'name', 'exercises']);
  if (workout.name && workout.name.length > 100) {
    throw new ValidationError('Workout name must be less than 100 characters');
  }
  // Validate date format if present
  if (workout.date) {
    try {
      new Date(workout.date).toISOString();
    } catch (error) {
      throw new ValidationError('Invalid date format');
    }
  }
  // Validate exercises
  if (workout.exercises) {
    if (!Array.isArray(workout.exercises)) {
      throw new ValidationError('Exercises must be an array');
    }
    if (workout.exercises.length === 0) {
      throw new ValidationError('Workout must have at least one exercise');
    }
    for (const exercise of workout.exercises) {
      if (!exercise.name) {
        throw new ValidationError('Exercise name is required');
      }
      if (!exercise.sets || !Array.isArray(exercise.sets) || exercise.sets.length === 0) {
        throw new ValidationError('Exercise must have at least one set');
      }
      exercise.sets.forEach(validateWorkoutSet);
    }
  }
  return workout;
};
/**
 * Validate workout plan data
 * @param plan Workout plan data to validate
 * @returns Validated workout plan data
 * @throws ValidationError if validation fails
 */
export const validateWorkoutPlan = (plan: Partial<WorkoutPlan>): Partial<WorkoutPlan> => {
  validateRequiredFields(plan, ['userId', 'name']);
  if (plan.name && plan.name.length > 100) {
    throw new ValidationError('Plan name must be less than 100 characters');
  }
  // Validate schedule days if present
  if (plan.schedule && plan.schedule.days) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of plan.schedule.days) {
      if (!validDays.includes(day.toLowerCase())) {
        throw new ValidationError(`Invalid day: ${day}`);
      }
    }
  }
  return plan;
};
/**
 * Validate exercise data
 * @param exercise Exercise data to validate
 * @returns Validated exercise data
 * @throws ValidationError if validation fails
 */
export const validateExercise = (exercise: Partial<Exercise>): Partial<Exercise> => {
  validateRequiredFields(exercise, ['name']);
  if (exercise.name && exercise.name.length > 100) {
    throw new ValidationError('Exercise name must be less than 100 characters');
  }
  return exercise;
};
/**
 * Validate friend data
 * @param friend Friend data to validate
 * @returns Validated friend data
 * @throws ValidationError if validation fails
 */
export const validateFriend = (friend: Partial<Friend>): Partial<Friend> => {
  validateRequiredFields(friend, ['userId', 'friendId']);
  return friend;
};
/**
 * Validate friend request data
 * @param request Friend request data to validate
 * @returns Validated friend request data
 * @throws ValidationError if validation fails
 */
export const validateFriendRequest = (request: Partial<FriendRequest>): Partial<FriendRequest> => {
  validateRequiredFields(request, ['fromUid', 'toUid', 'status']);
  if (request.status && !['pending', 'accepted', 'rejected'].includes(request.status)) {
    throw new ValidationError('Invalid status. Must be pending, accepted, or rejected.');
  }
  return request;
};
/**
 * Get validator for specific data type
 * @param type Data type to validate
 * @returns Validator function for the specified type
 * @throws Error if no validator is available for the specified type
 */
export const getValidator = (
  type: 'profile' | 'workout' | 'weightLog' | 'exercise' | 'plan' | 'friend' | 'friendRequest'
): (<T>(data: T) => T) => {
  switch (type) {
    case 'profile':
      return validateUserProfile as any;
    case 'workout':
      return validateWorkout as any;
    case 'weightLog':
      return validateWeightLogEntry as any;
    case 'exercise':
      return validateExercise as any;
    case 'plan':
      return validateWorkoutPlan as any;
    case 'friend':
      return validateFriend as any;
    case 'friendRequest':
      return validateFriendRequest as any;
    default:
      throw new Error(`No validator available for type: ${type}`);
  }
}; 