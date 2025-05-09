/**
 * Static data for workout categories
 */
export interface WorkoutCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}
export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  {
    id: 'strength',
    name: 'Strength',
    description: 'Build muscle and increase strength',
    icon: 'barbell-outline',
    color: '#0A6CFF'
  },
  {
    id: 'cardio',
    name: 'Cardio',
    description: 'Improve cardiovascular health',
    icon: 'heart-outline',
    color: '#FF3B30'
  },
  {
    id: 'hiit',
    name: 'HIIT',
    description: 'High-intensity interval training',
    icon: 'timer-outline',
    color: '#FF9500'
  },
  {
    id: 'flexibility',
    name: 'Flexibility',
    description: 'Improve range of motion and flexibility',
    icon: 'body-outline',
    color: '#5AC8FA'
  },
  {
    id: 'upperbody',
    name: 'Upper Body',
    description: 'Focus on chest, shoulders, arms, and back',
    icon: 'fitness-outline',
    color: '#007AFF'
  },
  {
    id: 'lowerbody',
    name: 'Lower Body',
    description: 'Focus on legs, glutes, and core',
    icon: 'footsteps-outline',
    color: '#5856D6'
  },
  {
    id: 'fullbody',
    name: 'Full Body',
    description: 'Work all major muscle groups',
    icon: 'body-outline',
    color: '#28A745'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your personalized routine',
    icon: 'cog-outline',
    color: '#8E8E93'
  }
];
/**
 * Get a workout category by ID
 * @param id The ID of the workout category to retrieve
 * @returns The workout category object or undefined if not found
 */
export const getWorkoutCategoryById = (id: string): WorkoutCategory | undefined => {
  return WORKOUT_CATEGORIES.find(category => category.id === id);
};
/**
 * Get all workout categories
 * @returns Array of all workout categories
 */
export const getAllWorkoutCategories = (): WorkoutCategory[] => {
  return WORKOUT_CATEGORIES;
}; 