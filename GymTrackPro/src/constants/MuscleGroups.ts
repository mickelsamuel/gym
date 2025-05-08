import { MuscleGroup } from '../types/global';

/**
 * Predefined muscle groups with detailed information
 */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    id: "chest",
    name: "Chest",
    imageUrl: "assets/images/muscles/chest.png",
    description: "Primarily the pectoralis major and minor, responsible for pushing movements."
  },
  {
    id: "back",
    name: "Back",
    imageUrl: "assets/images/muscles/back.png",
    description: "Includes the latissimus dorsi, rhomboids, and trapezius, used in pulling movements."
  },
  {
    id: "shoulders",
    name: "Shoulders",
    imageUrl: "assets/images/muscles/shoulders.png",
    description: "The deltoid muscles, supporting arm movement in all directions."
  },
  {
    id: "biceps",
    name: "Biceps",
    imageUrl: "assets/images/muscles/biceps.png",
    description: "Located on the front of the upper arm, primarily responsible for elbow flexion."
  },
  {
    id: "triceps",
    name: "Triceps",
    imageUrl: "assets/images/muscles/triceps.png",
    description: "Located on the back of the upper arm, used in pushing and arm extension."
  },
  {
    id: "forearms",
    name: "Forearms",
    imageUrl: "assets/images/muscles/forearms.png",
    description: "Multiple muscles involved in wrist, hand, and finger movements."
  },
  {
    id: "abs",
    name: "Abs",
    imageUrl: "assets/images/muscles/abs.png",
    description: "The rectus abdominis, obliques, and deep core muscles that stabilize the spine."
  },
  {
    id: "quads",
    name: "Quadriceps",
    imageUrl: "assets/images/muscles/quads.png",
    description: "Four muscles at the front of the thigh, crucial for leg extension."
  },
  {
    id: "hamstrings",
    name: "Hamstrings",
    imageUrl: "assets/images/muscles/hamstrings.png",
    description: "Three muscles at the back of the thigh, involved in leg flexion."
  },
  {
    id: "glutes",
    name: "Glutes",
    imageUrl: "assets/images/muscles/glutes.png",
    description: "The gluteus maximus, medius, and minimus, important for hip extension and stability."
  },
  {
    id: "calves",
    name: "Calves",
    imageUrl: "assets/images/muscles/calves.png",
    description: "The gastrocnemius and soleus muscles, used for ankle extension and stability."
  },
  {
    id: "lowerBack",
    name: "Lower Back",
    imageUrl: "assets/images/muscles/lowerBack.png",
    description: "The erector spinae and other muscles that support the spine and posture."
  },
  {
    id: "traps",
    name: "Trapezius",
    imageUrl: "assets/images/muscles/traps.png",
    description: "Large muscle extending from the neck to the middle back, important for shoulder movement."
  },
  {
    id: "obliques",
    name: "Obliques",
    imageUrl: "assets/images/muscles/obliques.png",
    description: "Side abdominal muscles that help with rotation and side bending."
  },
  {
    id: "adductors",
    name: "Adductors",
    imageUrl: "assets/images/muscles/adductors.png",
    description: "Inner thigh muscles that bring the legs toward the body's midline."
  },
  {
    id: "neck",
    name: "Neck",
    imageUrl: "assets/images/muscles/neck.png",
    description: "Muscles supporting head movement and stability."
  },
  {
    id: "fullBody",
    name: "Full Body",
    imageUrl: "assets/images/muscles/fullBody.png",
    description: "Exercises that engage multiple major muscle groups simultaneously."
  }
];

/**
 * Get a muscle group by ID
 * @param id The ID of the muscle group to retrieve
 * @returns The muscle group object or undefined if not found
 */
export const getMuscleGroupById = (id: string): MuscleGroup | undefined => {
  return MUSCLE_GROUPS.find(muscle => muscle.id === id);
};

/**
 * Get all muscle groups
 * @returns Array of all muscle groups
 */
export const getAllMuscleGroups = (): MuscleGroup[] => {
  return MUSCLE_GROUPS;
}; 