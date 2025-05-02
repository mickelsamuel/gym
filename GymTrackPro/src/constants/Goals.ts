import { Goal } from '../types/global';

/**
 * Static data for fitness goals
 */
export const GOALS: Goal[] = [
  {
    id: "strength",
    name: "Strength",
    description: "Focus on lifting heavier weights with lower reps.",
    recommendedExercises: [],
    nutritionTips: "Eat a caloric surplus with adequate protein for strength gains."
  },
  {
    id: "hypertrophy",
    name: "Hypertrophy",
    description: "Build muscle size through moderate weights and higher reps.",
    recommendedExercises: [],
    nutritionTips: "Eat slightly above maintenance calories, focusing on high protein."
  },
  {
    id: "endurance",
    name: "Endurance",
    description: "Perform higher reps and lighter weights to increase muscular endurance.",
    recommendedExercises: [],
    nutritionTips: "Maintain a balanced diet with enough carbs to fuel workouts."
  },
  {
    id: "tone",
    name: "Tone",
    description: "Achieve a lean, defined look with moderate weights and reps.",
    recommendedExercises: [],
    nutritionTips: "Focus on a slight caloric deficit, high protein, and consistent workouts."
  },
  {
    id: "fatLoss",
    name: "Fat Loss",
    description: "Emphasize calorie-burning workouts and a caloric deficit to lose body fat.",
    recommendedExercises: [],
    nutritionTips: "Stay in a moderate calorie deficit with high protein and vegetables. Maintain resistance training to preserve lean mass."
  },
  {
    id: "conditioning",
    name: "Conditioning",
    description: "Combine cardio and functional training to improve overall athletic performance.",
    recommendedExercises: [],
    nutritionTips: "Aim for balanced macros with enough carbs to support high-intensity intervals. Stay hydrated."
  }
];

/**
 * Get a goal by ID
 * @param id The ID of the goal to retrieve
 * @returns The goal object or undefined if not found
 */
export const getGoalById = (id: string): Goal | undefined => {
  return GOALS.find(goal => goal.id === id);
};

/**
 * Get all goals
 * @returns Array of all goals
 */
export const getAllGoals = (): Goal[] => {
  return GOALS;
}; 