// data/gymExercises.js

const gymExercises = [
  {
    id: "gym_001",
    name: "Barbell Bench Press",
    category: "Chest",
    type: "gym",
    image: null,
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    instructions:
      "Lie on a flat bench with feet planted on the floor. Grip the bar slightly wider than shoulder-width, lower the bar to your chest, then press upward until your arms are fully extended.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_002",
    name: "Barbell Squat",
    category: "Legs",
    type: "gym",
    image: null,
    primaryMuscles: ["legs"],
    secondaryMuscles: ["glutes", "core"],
    instructions:
      "Position a barbell on your upper back. With your feet shoulder-width apart, squat down by bending your knees and hips, then return to standing.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 5, maxReps: 6, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_003",
    name: "Deadlift",
    category: "Back/Legs",
    type: "gym",
    image: null,
    primaryMuscles: ["back", "legs"],
    secondaryMuscles: ["glutes", "core"],
    instructions:
      "Stand with your feet hip-width apart. With a barbell in front of you, bend at the hips and knees to grip the bar. Keeping your back flat, lift the bar by extending your hips and knees until standing upright, then lower it back down.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 6, maxReps: 8, restSeconds: 90 },
      { goal: "endurance", sets: 3, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "tone", sets: 3, minReps: 6, maxReps: 8, restSeconds: 90 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_004",
    name: "Overhead Press",
    category: "Shoulders",
    type: "gym",
    image: null,
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps", "chest"],
    instructions:
      "Stand with a barbell at shoulder height. Press the bar overhead until your arms are fully extended, then lower it back to shoulder height.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_005",
    name: "Barbell Row",
    category: "Back",
    type: "gym",
    image: null,
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps", "shoulders"],
    instructions:
      "With a barbell in hand and a slight bend in your knees, hinge forward at the hips and row the bar toward your lower chest, then lower it back down.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_006",
    name: "Lat Pulldown",
    category: "Back",
    type: "gym",
    image: null,
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "upperBack"],
    instructions:
      "Sit at a lat pulldown machine. Grip the bar wider than shoulder-width and pull it down toward your chest, then slowly return to the starting position.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_007",
    name: "Leg Press",
    category: "Legs",
    type: "gym",
    image: null,
    primaryMuscles: ["legs"],
    secondaryMuscles: ["glutes"],
    instructions:
      "Sit on a leg press machine with your feet shoulder-width apart on the platform. Lower the platform until your knees form a 90° angle, then push back up.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 5, maxReps: 6, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_008",
    name: "Leg Extension",
    category: "Legs",
    type: "gym",
    image: null,
    primaryMuscles: ["legs"],
    secondaryMuscles: [],
    instructions:
      "Sit on a leg extension machine. Adjust the pad so that it rests on your lower leg just above your feet. Extend your legs fully, then lower slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_009",
    name: "Leg Curl",
    category: "Legs",
    type: "gym",
    image: null,
    primaryMuscles: ["legs", "hamstrings"],
    secondaryMuscles: [],
    instructions:
      "Lie face down on a leg curl machine with the pad against your calves. Curl your legs upward, then slowly lower them back down.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_010",
    name: "Cable Fly",
    category: "Chest",
    type: "gym",
    image: null,
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders"],
    instructions:
      "Stand in the center of a cable crossover machine. With cables in each hand, extend your arms out to your sides and bring them together in front of you while keeping a slight bend in the elbows, then return slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_011",
    name: "Seated Cable Row",
    category: "Back",
    type: "gym",
    image: null,
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps", "shoulders"],
    instructions:
      "Sit at a cable row machine with your feet planted. Grab the handle and pull it toward your torso while keeping your back straight, then extend your arms fully.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_012",
    name: "Smith Machine Squat",
    category: "Legs",
    type: "gym",
    image: null,
    primaryMuscles: ["legs"],
    secondaryMuscles: ["glutes"],
    instructions:
      "Position yourself under the Smith machine. With your feet shoulder-width apart, perform a squat by lowering yourself until your knees are at about 90°, then push back up.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 5, maxReps: 7, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_013",
    name: "Cable Bicep Curl",
    category: "Arms",
    type: "gym",
    image: null,
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
    instructions:
      "Stand facing a cable machine with a low pulley. With an underhand grip, curl the handle upward towards your shoulders, then lower it slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_014",
    name: "Cable Triceps Pushdown",
    category: "Arms",
    type: "gym",
    image: null,
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    instructions:
      "Stand facing a cable machine with a high pulley. Grip the bar with your palms down and push the bar downward until your arms are fully extended, then slowly return.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_015",
    name: "Pec Deck Machine",
    category: "Chest",
    type: "gym",
    image: null,
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders"],
    instructions:
      "Sit on the pec deck machine with your back against the pad. With your arms bent, bring the handles together in front of you, then slowly let them return to the start position.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_016",
    name: "Assisted Pull-Up Machine",
    category: "Back",
    type: "gym",
    image: null,
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "shoulders"],
    instructions:
      "Using an assisted pull-up machine, grip the handles and pull yourself up until your chin clears the bar, then lower slowly.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_017",
    name: "Chest Press Machine",
    category: "Chest",
    type: "gym",
    image: null,
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    instructions:
      "Sit at the chest press machine, adjust the seat so that the handles are at chest level, then press outward until your arms are extended before slowly returning.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_018",
    name: "Seated Dumbbell Shoulder Press",
    category: "Shoulders",
    type: "gym",
    image: null,
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps"],
    instructions:
      "Sit on a bench with back support holding dumbbells at shoulder height. Press the weights overhead until your arms are fully extended, then lower them back down.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_019",
    name: "Abdominal Crunch Machine",
    category: "Core",
    type: "gym",
    image: null,
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    instructions:
      "Sit at the abdominal crunch machine with your back against the pad. Grip the handles, then contract your abs to bring your torso toward your knees, and slowly return.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 10, maxReps: 15, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 15, maxReps: 20, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 20, maxReps: 25, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 15, maxReps: 20, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_020",
    name: "Calf Raise Machine",
    category: "Legs",
    type: "gym",
    image: null,
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    instructions:
      "Stand on the calf raise machine with your shoulders under the pads. Raise your heels as high as possible, then lower them slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 6, maxReps: 8, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 10, maxReps: 12, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_021",
    name: "Bicep 21",
    category: "Arms",
    type: "gym",
    image: null,
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
    instructions:
      "Hold a barbell or EZ bar with an underhand grip. Perform 7 reps in the bottom half of the range, 7 reps in the top half, and 7 reps through the full range for a total of 21 reps.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 21, maxReps: 21, restSeconds: 90 },
      { goal: "hypertrophy", sets: 3, minReps: 21, maxReps: 21, restSeconds: 60 },
      { goal: "endurance", sets: 2, minReps: 21, maxReps: 21, restSeconds: 45 },
      { goal: "tone", sets: 2, minReps: 21, maxReps: 21, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_022",
    name: "Machine Bicep Curl",
    category: "Arms",
    type: "gym",
    image: null,
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
    instructions:
      "Sit at a bicep curl machine with your arms on the pad. Curl the handles upward by bending your elbows, then lower slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_023",
    name: "Cable Rear Delt Fly",
    category: "Shoulders",
    type: "gym",
    image: null,
    primaryMuscles: ["rearDelts"],
    secondaryMuscles: ["upperBack"],
    instructions:
      "Stand in the center of a cable crossover with cables set at chest height. Cross your arms in front, gripping opposite cables. With a slight bend in your elbows, pull the cables out and back, focusing on your rear delts.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 5, maxReps: 7, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 10, maxReps: 12, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 8, maxReps: 10, restSeconds: 30 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_024",
    name: "Close-Grip Cable Row",
    category: "Back",
    type: "gym",
    image: null,
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "shoulders"],
    instructions:
      "Sit at a cable row station with a close-grip handle. Pull the handle to your abdomen while keeping your back straight, then extend your arms fully.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_025",
    name: "Reverse-Grip Lat Pulldown",
    category: "Back",
    type: "gym",
    image: null,
    primaryMuscles: ["lats", "biceps"],
    secondaryMuscles: ["upperBack", "forearms"],
    instructions:
      "Sit at a lat pulldown machine with an underhand (supinated) grip. Pull the bar down toward your chest, then slowly return to the start.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_026",
    name: "Machine Shoulder Press",
    category: "Shoulders",
    type: "gym",
    image: null,
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps"],
    instructions:
      "Sit at the shoulder press machine. Grip the handles at shoulder level, then press upward until your arms are extended, returning slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  {
    id: "gym_027",
    name: "Wide-Grip Cable Row",
    category: "Back",
    type: "gym",
    image: null,
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "shoulders"],
    instructions:
      "Sit at a cable row station with a wide-grip bar. Pull the bar to your abdomen while keeping your back straight, then extend your arms fully.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  }
];

export default gymExercises;