// data/dumbbellExercises.js
const dumbbellExercises = [
  {
    id: "db_001",
    name: "Dumbbell Shoulder Press",
    category: "Shoulders",
    type: "dumbbell",
    image: require("../images/dumbbell_shoulder_press.png"),
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps"],
    instructions:
      "Sit or stand holding dumbbells at shoulder height. Press the dumbbells upward until your arms are extended, then lower them back down.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_002",
    name: "Dumbbell Curl",
    category: "Arms",
    type: "dumbbell",
    image: require("../images/dumbbell_curl.png"),
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
    instructions:
      "Stand with dumbbells at your sides, palms facing forward. Curl the weights up to your shoulders, then lower slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_003",
    name: "Dumbbell Row",
    category: "Back",
    type: "dumbbell",
    image: require("../images/dumbbell_row.png"),
    primaryMuscles: ["lats", "back"],
    secondaryMuscles: ["biceps", "shoulders"],
    instructions:
      "Place one hand on a bench for support while holding a dumbbell in the other hand. Keeping your back flat, row the dumbbell up and then lower it under control.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_004",
    name: "Dumbbell Bench Press",
    category: "Chest",
    type: "dumbbell",
    image: require("../images/dumbbell_bench_press.png"),
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    instructions:
      "Lie on a flat bench holding a dumbbell in each hand. Press the weights upward until your arms are fully extended, then lower them back down.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_022",
    name: "Incline Dumbbell Press",
    category: "Chest",
    type: "dumbbell",
    image: require("../images/dumbbell_incline_press.png"),
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders", "triceps"],
    instructions:
      "Lie on an incline bench with a dumbbell in each hand. Press the weights upward until your arms are fully extended, then lower them slowly until your elbows reach about 90°.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_023",
    name: "Incline Dumbbell Fly",
    category: "Chest",
    type: "dumbbell",
    image: require("../images/dumbbell_incline_fly.png"),
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders"],
    instructions:
      "Lie on an incline bench with a dumbbell in each hand. With a slight bend in your elbows, lower the dumbbells out to the sides until you feel a stretch in your chest, then bring them back together.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 90 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 10, maxReps: 12, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 8, maxReps: 10, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_005",
    name: "Dumbbell Lunge",
    category: "Legs",
    type: "dumbbell",
    image: require("../images/dumbbell_lunge.png"),
    primaryMuscles: ["legs"],
    secondaryMuscles: ["glutes", "core"],
    instructions:
      "Hold a dumbbell in each hand. Step forward into a lunge by bending both knees, then push back to the starting position. Alternate legs.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_006",
    name: "Dumbbell Fly",
    category: "Chest",
    type: "dumbbell",
    image: require("../images/dumbbell_fly.png"),
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders"],
    instructions:
      "Lie on a flat bench holding dumbbells above your chest with a slight bend in your elbows. Lower your arms out to the sides until you feel a stretch, then bring them back together.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_007",
    name: "Hammer Curl",
    category: "Arms",
    type: "dumbbell",
    image: require("../images/hammer_curl.png"),
    primaryMuscles: ["biceps", "forearms"],
    secondaryMuscles: [],
    instructions:
      "Stand holding dumbbells with your palms facing your sides. Curl the weights upward while keeping your palms facing inward, then lower slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_008",
    name: "Dumbbell Skull Crusher",
    category: "Arms",
    type: "dumbbell",
    image: require("../images/dumbbell_skull_crusher.png"),
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    instructions:
      "Lie on a bench holding dumbbells overhead with your arms straight. Lower the weights by bending your elbows until they are near your head, then extend back up.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_009",
    name: "Dumbbell Triceps Kickback",
    category: "Arms",
    type: "dumbbell",
    image: require("../images/dumbbell_triceps_kickback.png"),
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["shoulders"],
    instructions:
      "Bend over with a flat back, keeping your upper arm parallel to your torso. Extend your forearm backward while squeezing the triceps, then return to start.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 2, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 2, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_010",
    name: "Dumbbell Lateral Raise",
    category: "Shoulders",
    type: "dumbbell",
    image: require("../images/dumbbell_lateral_raise.png"),
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
    instructions:
      "Stand upright with dumbbells at your sides. Raise your arms out to the sides until they reach shoulder height, then lower them under control.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 10, maxReps: 12, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_011",
    name: "Dumbbell Front Raise",
    category: "Shoulders",
    type: "dumbbell",
    image: require("../images/dumbbell_front_raise.png"),
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
    instructions:
      "Hold dumbbells in front of your thighs with palms facing your body. Raise your arms forward to shoulder height, then lower them slowly.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 5, maxReps: 6, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 12, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_012",
    name: "Goblet Squat",
    category: "Legs",
    type: "dumbbell",
    image: require("../images/goblet_squat.png"),
    primaryMuscles: ["legs", "glutes"],
    secondaryMuscles: ["core"],
    instructions:
      "Hold a dumbbell vertically against your chest. Squat down with your feet shoulder-width apart, then push back up through your heels.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_013",
    name: "Dumbbell Step-Up",
    category: "Legs",
    type: "dumbbell",
    image: require("../images/dumbbell_step_up.png"),
    primaryMuscles: ["legs", "glutes"],
    secondaryMuscles: ["core"],
    instructions:
      "Hold dumbbells at your sides. Step onto a bench or sturdy platform with one foot, then drive through that leg to stand. Step back down and alternate.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_014",
    name: "Dumbbell Calf Raise",
    category: "Legs",
    type: "dumbbell",
    image: require("../images/dumbbell_calf_raise.png"),
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    instructions:
      "Stand holding dumbbells at your sides. Raise your heels off the ground as high as possible, then lower them slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 6, maxReps: 8, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 10, maxReps: 12, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_015",
    name: "Dumbbell Romanian Deadlift",
    category: "Legs",
    type: "dumbbell",
    image: require("../images/dumbbell_romanian_deadlift.png"),
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["lowerBack"],
    instructions:
      "Hold dumbbells in front of your thighs. With a slight bend in your knees, hinge at the hips to lower the weights along your legs, then return to standing by extending your hips.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_016",
    name: "Dumbbell Bulgarian Split Squat",
    category: "Legs",
    type: "dumbbell",
    image: require("../images/dumbbell_bulgarian_split_squat.png"),
    primaryMuscles: ["legs", "glutes"],
    secondaryMuscles: ["core"],
    instructions:
      "With one foot elevated behind you on a bench, lower your body into a squat with the front leg until the knee is near 90°, then push back up.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_017",
    name: "Dumbbell Farmer's Walk",
    category: "Full Body",
    type: "dumbbell",
    image: require("../images/dumbbell_farmers_walk.png"),
    primaryMuscles: ["forearms", "core"],
    secondaryMuscles: ["shoulders", "legs"],
    instructions:
      "Hold heavy dumbbells at your sides and walk for a set distance while keeping your torso upright and core engaged.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 30, maxReps: 40, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 40, maxReps: 60, restSeconds: 60 },
      { goal: "endurance", sets: 2, minReps: 60, maxReps: 90, restSeconds: 45 },
      { goal: "tone", sets: 2, minReps: 50, maxReps: 60, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_018",
    name: "Dumbbell Thruster",
    category: "Full Body",
    type: "dumbbell",
    image: require("../images/dumbbell_thruster.png"),
    primaryMuscles: ["legs", "shoulders"],
    secondaryMuscles: ["core", "triceps"],
    instructions:
      "Hold dumbbells at shoulder level. Squat down and then explosively stand up while pressing the weights overhead in one fluid motion.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_019",
    name: "Dumbbell Snatch",
    category: "Full Body",
    type: "dumbbell",
    image: require("../images/dumbbell_snatch.png"),
    primaryMuscles: ["legs", "shoulders", "back"],
    secondaryMuscles: ["core", "traps"],
    instructions:
      "Place a dumbbell on the floor between your feet. In one explosive movement, drive through your legs and pull the weight overhead, finishing with your arm fully extended. Lower it back under control.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 3, maxReps: 5, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 6, maxReps: 8, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_020",
    name: "Dumbbell Upright Row",
    category: "Shoulders",
    type: "dumbbell",
    image: require("../images/dumbbell_upright_row.png"),
    primaryMuscles: ["shoulders", "trapezius"],
    secondaryMuscles: ["biceps"],
    instructions:
      "Stand with dumbbells in front of your thighs. Pull the weights straight up along your body to chest level, then lower them under control.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 10, maxReps: 12, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 8, maxReps: 10, restSeconds: 30 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "db_021",
    name: "Dumbbell Reverse Fly",
    category: "Shoulders",
    type: "dumbbell",
    image: require("../images/dumbbell_reverse_fly.png"),
    primaryMuscles: ["rearDelts"],
    secondaryMuscles: ["upperBack"],
    instructions:
      "Bend over slightly with a flat back while holding dumbbells. With a slight bend in your elbows, raise the weights out to the sides until your arms are parallel to the floor, then lower slowly.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 10, maxReps: 12, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 8, maxReps: 10, restSeconds: 30 }
    ],
    weightUnit: "lbs"
  }
];

export default dumbbellExercises;