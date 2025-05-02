// Utility functions for data sanitization and validation
import { Exercise, Workout, WorkoutExercise, WorkoutSet, WeightLogEntry, User, Friend, FriendRequest, WorkoutPlan } from '../types/global';

/**
 * Sanitizes a string by escaping HTML special characters
 * @param str The string to sanitize
 * @returns The sanitized string
 */
export const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

/**
 * Validates an email address
 * @param email The email to validate
 * @returns True if the email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password strength
 * @param password The password to validate
 * @returns True if the password meets the strength requirements, false otherwise
 */
export const isValidPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false;
  
  // At least 8 characters, one lowercase letter, one uppercase letter, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Checks if password contains special characters
 * @param password The password to check
 * @returns True if the password contains special characters
 */
export const hasSpecialCharacters = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false;
  
  const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  return specialCharsRegex.test(password);
};

/**
 * Validates a username
 * @param username The username to validate
 * @returns True if the username is valid, false otherwise
 */
export const isValidUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') return false;
  
  // Alphanumeric with underscores, 3-20 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validates a number input
 * @param value The value to validate
 * @param min The minimum allowed value (optional)
 * @param max The maximum allowed value (optional)
 * @returns The validated number or null if invalid
 */
export const validateNumber = (value: any, min?: number, max?: number): number | null => {
  if (value === null || value === undefined || value === '') return null;
  
  let num: number;
  
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleanedValue = value.replace(/[^\d.-]/g, '');
    num = parseFloat(cleanedValue);
  } else if (typeof value === 'number') {
    num = value;
  } else {
    return null;
  }
  
  if (isNaN(num)) return null;
  
  // Apply min/max constraints if provided
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  return num;
};

/**
 * Validates a date string
 * @param dateStr The date string to validate
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (dateStr: string): boolean => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  
  const date = new Date(dateStr);
  const timestamp = date.getTime();
  
  if (isNaN(timestamp)) return false;
  
  // Additional check: date should be reasonably recent (not before 1900)
  // and not too far in the future (not more than 1 year from now)
  const minDate = new Date('1900-01-01').getTime();
  const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).getTime();
  
  return timestamp >= minDate && timestamp <= maxDate;
};

/**
 * Validates if a string is a valid URL
 * @param url The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Sanitizes and validates an object's properties
 * @param data The object to sanitize
 * @param allowedFields Array of allowed field names
 * @returns The sanitized object
 */
export const sanitizeObject = <T extends Record<string, any>>(data: T, allowedFields: string[]): Partial<T> => {
  if (!data || typeof data !== 'object') return {};
  
  const sanitizedData: Partial<T> = {};
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'string') {
        sanitizedData[field as keyof T] = sanitizeString(data[field]) as any;
      } else {
        sanitizedData[field as keyof T] = data[field];
      }
    }
  }
  
  return sanitizedData;
};

/**
 * Sanitizes firebase data to prevent injection attacks
 * @param data The data to sanitize
 * @returns The sanitized data
 */
export const sanitizeFirestoreData = <T extends Record<string, any>>(data: T): T => {
  if (!data || typeof data !== 'object') return {} as T;
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeFirestoreData(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeFirestoreData(item) : 
        item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Validates a workout
 * @param workout The workout to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateWorkout = (workout: Partial<Workout>): string[] => {
  const errors: string[] = [];
  
  if (!workout.userId) {
    errors.push('User ID is required');
  }
  
  if (!workout.name || typeof workout.name !== 'string' || workout.name.trim().length < 3) {
    errors.push('Workout name is required and must be at least 3 characters');
  }
  
  if (!workout.date || !isValidDate(workout.date)) {
    errors.push('Valid workout date is required');
  }
  
  if (!Array.isArray(workout.exercises) || workout.exercises.length === 0) {
    errors.push('At least one exercise is required');
  } else {
    workout.exercises.forEach((exercise: WorkoutExercise, index: number) => {
      if (!exercise.id) {
        errors.push(`Exercise at position ${index + 1} is missing an ID`);
      }
      
      if (!exercise.name || exercise.name.trim().length === 0) {
        errors.push(`Exercise at position ${index + 1} is missing a name`);
      }
      
      if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
        errors.push(`Exercise "${exercise.name || index + 1}" must have at least one set`);
      } else {
        exercise.sets.forEach((set: WorkoutSet, setIndex: number) => {
          const weight = validateNumber(set.weight, 0);
          const reps = validateNumber(set.reps, 0);
          
          if (weight === null) {
            errors.push(`Set ${setIndex + 1} for exercise "${exercise.name || index + 1}" has invalid weight`);
          }
          
          if (reps === null) {
            errors.push(`Set ${setIndex + 1} for exercise "${exercise.name || index + 1}" has invalid reps`);
          }
        });
      }
    });
  }
  
  return errors;
};

/**
 * Validates a workout plan
 * @param plan The workout plan to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateWorkoutPlan = (plan: Partial<WorkoutPlan>): string[] => {
  const errors: string[] = [];
  
  if (!plan.userId) {
    errors.push('User ID is required');
  }
  
  if (!plan.name || typeof plan.name !== 'string' || plan.name.trim().length < 3) {
    errors.push('Plan name is required and must be at least 3 characters');
  }
  
  if (!Array.isArray(plan.exercises) || plan.exercises.length === 0) {
    errors.push('At least one exercise is required in the plan');
  }
  
  return errors;
};

/**
 * Validates a weight log entry
 * @param entry The weight log entry to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateWeightLogEntry = (entry: Partial<WeightLogEntry>): string[] => {
  const errors: string[] = [];
  
  if (!entry.userId) {
    errors.push('User ID is required');
  }
  
  if (!entry.date || !isValidDate(entry.date)) {
    errors.push('Valid date is required');
  }
  
  const weight = validateNumber(entry.weight, 0);
  if (weight === null) {
    errors.push('Weight must be a positive number');
  }
  
  return errors;
};

/**
 * Validates a user profile
 * @param profile The user profile to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateUserProfile = (profile: Partial<User>): string[] => {
  const errors: string[] = [];
  
  if (!profile.uid) {
    errors.push('User ID is required');
  }
  
  if (profile.email !== undefined && !isValidEmail(profile.email)) {
    errors.push('Invalid email address');
  }
  
  if (profile.username !== undefined && !isValidUsername(profile.username)) {
    errors.push('Username must be 3-20 characters and contain only letters, numbers, and underscores');
  }
  
  if (profile.weight !== undefined) {
    const weight = validateNumber(profile.weight, 0);
    if (weight === null) {
      errors.push('Weight must be a positive number');
    }
  }
  
  if (profile.height !== undefined) {
    const height = validateNumber(profile.height, 0);
    if (height === null) {
      errors.push('Height must be a positive number');
    }
  }
  
  if (profile.age !== undefined) {
    const age = validateNumber(profile.age, 0, 120);
    if (age === null) {
      errors.push('Age must be a number between 0 and 120');
    }
  }
  
  if (profile.profilePic !== undefined && profile.profilePic !== '' && !isValidUrl(profile.profilePic)) {
    errors.push('Profile picture URL is invalid');
  }
  
  return errors;
};

/**
 * Validates an exercise
 * @param exercise The exercise to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateExercise = (exercise: Partial<Exercise>): string[] => {
  const errors: string[] = [];
  
  if (!exercise.id) {
    errors.push('Exercise ID is required');
  }
  
  if (!exercise.name || exercise.name.trim().length < 2) {
    errors.push('Exercise name is required and must be at least 2 characters');
  }
  
  if (!exercise.description || exercise.description.trim().length < 5) {
    errors.push('Exercise description is required and must be at least 5 characters');
  }
  
  if (!Array.isArray(exercise.muscleGroups) || exercise.muscleGroups.length === 0) {
    errors.push('At least one muscle group is required');
  }
  
  if (!exercise.primaryMuscleGroup) {
    errors.push('Primary muscle group is required');
  }
  
  if (!exercise.equipment) {
    errors.push('Equipment type is required');
  }
  
  if (!exercise.difficulty || !['beginner', 'intermediate', 'advanced'].includes(exercise.difficulty)) {
    errors.push('Valid difficulty level is required (beginner, intermediate, or advanced)');
  }
  
  if (!exercise.category) {
    errors.push('Exercise category is required');
  }
  
  if (!Array.isArray(exercise.instructions) || exercise.instructions.length === 0) {
    errors.push('Exercise instructions are required');
  }
  
  if (exercise.videoUrl && !isValidUrl(exercise.videoUrl)) {
    errors.push('Video URL is invalid');
  }
  
  if (exercise.imageUrl && !isValidUrl(exercise.imageUrl)) {
    errors.push('Image URL is invalid');
  }
  
  return errors;
};

/**
 * Validates a friend request
 * @param request The friend request to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateFriendRequest = (request: Partial<FriendRequest>): string[] => {
  const errors: string[] = [];
  
  if (!request.fromUid) {
    errors.push('Sender user ID is required');
  }
  
  if (!request.toUid) {
    errors.push('Recipient user ID is required');
  }
  
  if (!request.fromUsername) {
    errors.push('Sender username is required');
  }
  
  if (request.fromUid === request.toUid) {
    errors.push('Cannot send a friend request to yourself');
  }
  
  if (request.status && !['pending', 'accepted', 'rejected'].includes(request.status)) {
    errors.push('Invalid status value');
  }
  
  return errors;
};

/**
 * Validates a friend relationship
 * @param friend The friend data to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateFriend = (friend: Partial<Friend>): string[] => {
  const errors: string[] = [];
  
  if (!friend.userId) {
    errors.push('User ID is required');
  }
  
  if (!friend.friendId) {
    errors.push('Friend ID is required');
  }
  
  if (!friend.username) {
    errors.push('Friend username is required');
  }
  
  if (friend.userId === friend.friendId) {
    errors.push('User cannot be friends with themselves');
  }
  
  return errors;
};

/**
 * Validate ID format - checks if the ID matches expected pattern for Firebase IDs
 * @param id The ID to validate
 * @returns True if valid, false otherwise
 */
export const isValidId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  
  // Firebase auto IDs are 20 characters, alphanumeric
  // User IDs (from auth) are typically 28 characters
  // Allow custom IDs (but with reasonable length and chars)
  const idRegex = /^[a-zA-Z0-9_-]{4,40}$/;
  return idRegex.test(id);
};

/**
 * Strips any sensitive data from an object before storing or sending
 * @param data The data object to clean
 * @returns The cleaned data object
 */
export const stripSensitiveData = <T extends Record<string, any>>(data: T): Partial<T> => {
  if (!data || typeof data !== 'object') return {};
  
  const result = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  
  sensitiveFields.forEach(field => {
    if (field in result) {
      delete result[field];
    }
  });
  
  return result;
};