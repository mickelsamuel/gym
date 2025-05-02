import { MuscleGroup } from '../types/global';

/**
 * Static data for muscle groups
 */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    id: "chest",
    name: "Chest",
    imageUrl: require('../../assets/images/muscles/chest.png'),
    description: "Primarily the pectoralis major and minor, responsible for pushing movements."
  },
  {
    id: "back",
    name: "Back",
    imageUrl: require('../../assets/images/muscles/back.png'),
    description: "Broad term for upper and mid back musculature including rhomboids and trapezius."
  },
  {
    id: "legs",
    name: "Legs (General)",
    imageUrl: require('../../assets/images/muscles/legs.png'),
    description: "General category for lower-body muscles (quads, hamstrings, glutes)."
  },
  {
    id: "quads",
    name: "Quadriceps",
    imageUrl: require('../../assets/images/muscles/quads.png'),
    description: "The four-part muscle group in the front of the thigh, crucial for knee extension."
  },
  {
    id: "hamstrings",
    name: "Hamstrings",
    imageUrl: require('../../assets/images/muscles/hamstrings.png'),
    description: "Rear thigh muscles responsible for knee flexion and hip extension."
  },
  {
    id: "glutes",
    name: "Glutes",
    imageUrl: require('../../assets/images/muscles/glutes.png'),
    description: "Gluteus maximus, medius, and minimus; key for hip extension, stability."
  },
  {
    id: "calves",
    name: "Calves",
    imageUrl: require('../../assets/images/muscles/calves.png'),
    description: "Gastrocnemius and soleus muscles in lower leg for plantar flexion."
  },
  {
    id: "shoulders",
    name: "Shoulders (Deltoids)",
    imageUrl: require('../../assets/images/muscles/shoulders.png'),
    description: "Front, middle, and rear delts controlling arm elevation and rotation."
  },
  {
    id: "rearDelts",
    name: "Rear Deltoids",
    imageUrl: require('../../assets/images/muscles/rear-delts.png'),
    description: "Posterior portion of the deltoid muscle, involved in shoulder extension and external rotation."
  },
  {
    id: "triceps",
    name: "Triceps",
    imageUrl: require('../../assets/images/muscles/triceps.png'),
    description: "Three-headed muscle on the back of the arm, responsible for elbow extension."
  },
  {
    id: "biceps",
    name: "Biceps",
    imageUrl: require('../../assets/images/muscles/biceps.png'),
    description: "Front of the arm, primarily responsible for elbow flexion and forearm supination."
  },
  {
    id: "lats",
    name: "Latissimus Dorsi",
    imageUrl: require('../../assets/images/muscles/lats.png'),
    description: "Large V-shaped muscles of the back, crucial for pulling movements."
  },
  {
    id: "core",
    name: "Core (Abs)",
    imageUrl: require('../../assets/images/muscles/core.png'),
    description: "Abdominals, including rectus abdominis, transverse abdominis; stabilizes trunk."
  },
  {
    id: "obliques",
    name: "Obliques",
    imageUrl: require('../../assets/images/muscles/obliques.png'),
    description: "Muscles along the sides of the abdomen, responsible for rotation and lateral flexion."
  },
  {
    id: "lowerBack",
    name: "Lower Back",
    imageUrl: require('../../assets/images/muscles/lower-back.png'),
    description: "Erector spinae and surrounding muscles that support spine extension."
  },
  {
    id: "erectorSpinae",
    name: "Erector Spinae",
    imageUrl: require('../../assets/images/muscles/erector-spinae.png'),
    description: "Deep muscles running along the spine, important for posture and back extension."
  },
  {
    id: "forearms",
    name: "Forearms",
    imageUrl: require('../../assets/images/muscles/forearms.png'),
    description: "Responsible for wrist flexion, extension, and grip strength."
  },
  {
    id: "hipFlexors",
    name: "Hip Flexors",
    imageUrl: require('../../assets/images/muscles/hip-flexors.png'),
    description: "Iliopsoas and related muscles that flex the hip joint."
  },
  {
    id: "adductors",
    name: "Adductors",
    imageUrl: require('../../assets/images/muscles/adductors.png'),
    description: "Inner thigh muscles that pull the legs toward the midline of the body."
  },
  {
    id: "abductors",
    name: "Abductors",
    imageUrl: require('../../assets/images/muscles/abductors.png'),
    description: "Outer thigh/hip muscles that move the legs away from the midline."
  },
  {
    id: "traps",
    name: "Trapezius",
    imageUrl: require('../../assets/images/muscles/traps.png'),
    description: "Upper back and neck area muscle for scapular elevation and stabilization."
  },
  {
    id: "neck",
    name: "Neck",
    imageUrl: require('../../assets/images/muscles/neck.png'),
    description: "Various muscles surrounding the cervical spine, stabilizing and moving the neck."
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