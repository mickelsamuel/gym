// Export all constants from this barrel file
export * from './StorageKeys';
export * from './MuscleGroups';
export * from './Goals';
export * from './WorkoutCategories';
export * from './Colors';
export * from './Theme';
export * from './Animations';
export * from './errorCodes';
// Firebase collection paths
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  EXERCISES: 'exercises',
  WORKOUTS: 'workouts',
  WEIGHT_LOGS: 'weightLogs',
  FRIEND_REQUESTS: 'friendRequests',
  TEST: 'test'
};
// App-wide constants
export const APP_CONSTANTS = {
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
  DEFAULT_CACHE_TTL: 60 * 60 * 1000, // 1 hour in milliseconds
  MIN_PASSWORD_LENGTH: 8,
  MAX_USERNAME_LENGTH: 20
};
// Export related constants that might not be directly imported through the files above
export const APP_CONFIG = {
  APP_NAME: 'GymTrackPro',
  VERSION: '1.0.0',
  BUILD: '100',
  API_VERSION: 'v1',
  ENVIRONMENT: process.env.NODE_ENV || 'development'
};
// Common constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const DEFAULT_AVATAR = 'https://firebasestorage.googleapis.com/v0/b/gymtrackpro.appspot.com/o/defaults%2Fdefault_avatar.png?alt=media';
export const MAX_WORKOUT_DAYS = 7;
export const DEFAULT_PAGINATION_LIMIT = 20;
export const DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
export const MAX_HISTORY_ITEMS = 100;
// Workout related constants
export const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner', color: '#4CAF50' },
  { id: 'intermediate', name: 'Intermediate', color: '#FFC107' },
  { id: 'advanced', name: 'Advanced', color: '#F44336' }
];
export const EQUIPMENT_TYPES = [
  { id: 'bodyweight', name: 'Body Weight' },
  { id: 'dumbbell', name: 'Dumbbell' },
  { id: 'barbell', name: 'Barbell' },
  { id: 'cable', name: 'Cable' },
  { id: 'machine', name: 'Machine' },
  { id: 'kettlebell', name: 'Kettlebell' },
  { id: 'resistance_band', name: 'Resistance Band' },
  { id: 'medicine_ball', name: 'Medicine Ball' },
  { id: 'other', name: 'Other' }
];
export const EXERCISE_CATEGORIES = [
  { id: 'strength', name: 'Strength' },
  { id: 'cardio', name: 'Cardio' },
  { id: 'stretching', name: 'Stretching' },
  { id: 'plyometric', name: 'Plyometric' },
  { id: 'sport_specific', name: 'Sport Specific' },
  { id: 'functional', name: 'Functional' },
  { id: 'calisthenics', name: 'Calisthenics' },
  { id: 'rehabilitation', name: 'Rehabilitation' },
  { id: 'other', name: 'Other' }
];
export const WEEKDAYS = [
  { id: 'monday', name: 'Monday', short: 'Mon' },
  { id: 'tuesday', name: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', name: 'Wednesday', short: 'Wed' },
  { id: 'thursday', name: 'Thursday', short: 'Thu' },
  { id: 'friday', name: 'Friday', short: 'Fri' },
  { id: 'saturday', name: 'Saturday', short: 'Sat' },
  { id: 'sunday', name: 'Sunday', short: 'Sun' }
];
export const WEIGHT_UNITS = [
  { id: 'kg', name: 'Kilograms (kg)', conversionFactor: 1 },
  { id: 'lbs', name: 'Pounds (lbs)', conversionFactor: 0.45359237 }
];
export const HEIGHT_UNITS = [
  { id: 'cm', name: 'Centimeters (cm)', conversionFactor: 1 },
  { id: 'ft', name: 'Feet (ft)', conversionFactor: 30.48 }
];
// Weight conversion helpers
export const convertWeight = (weight: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return weight;
  const fromUnitData = WEIGHT_UNITS.find(unit => unit.id === fromUnit);
  const toUnitData = WEIGHT_UNITS.find(unit => unit.id === toUnit);
  if (!fromUnitData || !toUnitData) return weight;
  // Convert to kg first (base unit)
  const weightInKg = weight * fromUnitData.conversionFactor;
  // Then convert to target unit
  return weightInKg / toUnitData.conversionFactor;
};
// Height conversion helpers
export const convertHeight = (height: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return height;
  const fromUnitData = HEIGHT_UNITS.find(unit => unit.id === fromUnit);
  const toUnitData = HEIGHT_UNITS.find(unit => unit.id === toUnit);
  if (!fromUnitData || !toUnitData) return height;
  // Convert to cm first (base unit)
  const heightInCm = height * fromUnitData.conversionFactor;
  // Then convert to target unit
  return heightInCm / toUnitData.conversionFactor;
}; 