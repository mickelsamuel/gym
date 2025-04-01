// data/bodyweightExercises.js
const bodyweightExercises = [
  {
    id: "bw_001",
    name: "Push-Up",
    category: "Chest",
    type: "bodyweight",
    image: require("../images/push_up.png"),
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders", "core"],
    instructions:
      "Place your hands slightly wider than shoulder-width. Keep your body straight and lower yourself until your chest nearly touches the floor, then push back up.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 6, maxReps: 8, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 10, maxReps: 15, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 20, maxReps: 30, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 15, maxReps: 20, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_002",
    name: "Pull-Up",
    category: "Back",
    type: "bodyweight",
    image: require("../images/pull_up.png"),
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "shoulders", "core"],
    instructions:
      "Hang from a pull-up bar with an overhand grip. Pull your body up until your chin is above the bar, then lower back down.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_003",
    name: "Bodyweight Squat",
    category: "Legs",
    type: "bodyweight",
    image: require("../images/bodyweight_squat.png"),
    primaryMuscles: ["legs"],
    secondaryMuscles: ["glutes", "core"],
    instructions:
      "Stand with feet shoulder-width apart. Sit your hips back and bend your knees to lower into a squat, then drive up through your heels to return.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 6, maxReps: 8, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 10, maxReps: 15, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 20, maxReps: 25, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 15, maxReps: 20, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_004",
    name: "Plank",
    category: "Core",
    type: "bodyweight",
    image: require("../images/plank.png"),
    primaryMuscles: ["core"],
    secondaryMuscles: ["shoulders", "lowerBack"],
    instructions:
      "Rest your forearms on the floor, elbows under shoulders. Keep your body straight from head to heels, bracing your abs.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 30, maxReps: 45, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 45, maxReps: 60, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 60, maxReps: 90, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 60, maxReps: 90, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_005",
    name: "Bodyweight Lunge",
    category: "Legs",
    type: "bodyweight",
    image: require("../images/bodyweight_lunge.png"),
    primaryMuscles: ["legs"],
    secondaryMuscles: ["glutes", "core"],
    instructions:
      "Stand with feet hip-width apart. Step forward, bending both knees, then push back to the starting position. Alternate legs.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 6, maxReps: 8, restSeconds: 90 },
      { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_006",
    name: "Chin-Up",
    category: "Back",
    type: "bodyweight",
    image: require("../images/chin_up.png"),
    primaryMuscles: ["lats", "biceps"],
    secondaryMuscles: ["shoulders", "core"],
    instructions:
      "Hang from a bar with an underhand grip (palms facing you). Pull your body up until your chin is above the bar, then lower under control.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_007",
    name: "Dips",
    category: "Chest",
    type: "bodyweight",
    image: require("../images/dips.png"),
    primaryMuscles: ["chest", "triceps"],
    secondaryMuscles: ["shoulders"],
    instructions:
      "Support your body on parallel bars with arms straight. Bend your elbows to lower your body, then press back up to the start.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_008",
    name: "Inverted Row",
    category: "Back",
    type: "bodyweight",
    image: require("../images/inverted_row.png"),
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "shoulders", "core"],
    instructions:
      "Position a bar at waist height. Hang underneath it with arms extended, body straight, and heels on the floor. Pull your chest to the bar, then lower back down.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 6, maxReps: 8, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_009",
    name: "Burpee",
    category: "Full Body",
    type: "bodyweight",
    image: require("../images/burpee.png"),
    primaryMuscles: ["chest", "legs", "core"],
    secondaryMuscles: ["shoulders", "triceps"],
    instructions:
      "From a standing position, squat down, place your hands on the floor, kick your feet back into a plank, perform a push-up, then jump your feet forward and explosively jump up.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 5, maxReps: 6, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 15, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_010",
    name: "Mountain Climbers",
    category: "Core",
    type: "bodyweight",
    image: require("../images/mountain_climbers.png"),
    primaryMuscles: ["core", "hipFlexors"],
    secondaryMuscles: ["shoulders", "legs"],
    instructions:
      "Start in a plank position. Drive one knee toward your chest, then quickly switch legs, keeping your hips low and core tight.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 20, maxReps: 30, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 30, maxReps: 40, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 40, maxReps: 60, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 30, maxReps: 50, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_011",
    name: "Side Plank",
    category: "Core",
    type: "bodyweight",
    image: require("../images/side_plank.png"),
    primaryMuscles: ["core", "obliques"],
    secondaryMuscles: ["shoulders", "lowerBack"],
    instructions:
      "Lie on one side, supporting yourself on one forearm with feet stacked. Lift your hips to form a straight line from head to feet. Hold the position.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 30, maxReps: 45, restSeconds: 30 },
      { goal: "hypertrophy", sets: 3, minReps: 45, maxReps: 60, restSeconds: 30 },
      { goal: "endurance", sets: 3, minReps: 60, maxReps: 90, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 45, maxReps: 60, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_012",
    name: "Pike Push-Up",
    category: "Shoulders",
    type: "bodyweight",
    image: require("../images/pike_push_up.png"),
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps", "upperBack"],
    instructions:
      "From a downward dog position, bend your elbows to lower your head toward the floor, then press back up focusing on the shoulders.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 6, maxReps: 10, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_013",
    name: "Glute Bridge",
    category: "Glutes",
    type: "bodyweight",
    image: require("../images/glute_bridge.png"),
    primaryMuscles: ["glutes", "hamstrings"],
    secondaryMuscles: ["core"],
    instructions:
      "Lie on your back with knees bent and feet flat on the floor. Drive through your heels to lift your hips, squeeze your glutes at the top, then lower slowly.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 12, maxReps: 15, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 20, maxReps: 30, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_014",
    name: "Bulgarian Split Squat",
    category: "Legs",
    type: "bodyweight",
    image: require("../images/bulgarian_split_squat.png"),
    primaryMuscles: ["legs", "glutes"],
    secondaryMuscles: ["core"],
    instructions:
      "Place the top of one foot on a bench behind you. Lower into a single-leg squat while keeping your torso upright, then push back up.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 90 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_015",
    name: "Handstand Push-Up",
    category: "Shoulders",
    type: "bodyweight",
    image: require("../images/handstand_push_up.png"),
    primaryMuscles: ["shoulders", "triceps"],
    secondaryMuscles: ["upperBack", "core"],
    instructions:
      "Kick up against a wall into a handstand. Lower your head toward the floor by bending your elbows, then press back up while keeping your core tight.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 6, maxReps: 8, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 },
      { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_016",
    name: "Single-Leg Hip Thrust",
    category: "Glutes",
    type: "bodyweight",
    image: require("../images/single_leg_hip_thrust.png"),
    primaryMuscles: ["glutes", "hamstrings"],
    secondaryMuscles: ["core"],
    instructions:
      "Rest your upper back on a bench. With one foot on the floor, lift your hips by driving through the heel of the planted leg while keeping the other leg raised. Lower under control.",
    repRanges: [
      { goal: "strength", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
      { goal: "hypertrophy", sets: 4, minReps: 12, maxReps: 15, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_017",
    name: "Superman",
    category: "Back",
    type: "bodyweight",
    image: require("../images/superman.png"),
    primaryMuscles: ["lowerBack"],
    secondaryMuscles: ["glutes", "core"],
    instructions:
      "Lie face down on the floor with arms extended. Simultaneously lift your arms, chest, and legs off the ground, squeeze your lower back and glutes, then lower back down.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 8, maxReps: 10, restSeconds: 45 },
      { goal: "hypertrophy", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_018",
    name: "Bear Crawl",
    category: "Full Body",
    type: "bodyweight",
    image: require("../images/bear_crawl.png"),
    primaryMuscles: ["shoulders", "core", "legs"],
    secondaryMuscles: ["back", "hipFlexors"],
    instructions:
      "Start on all fours with knees slightly off the ground. Move forward by simultaneously stepping your right hand and left foot, then alternating.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 20, maxReps: 30, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 30, maxReps: 40, restSeconds: 60 },
      { goal: "endurance", sets: 2, minReps: 50, maxReps: 60, restSeconds: 30 },
      { goal: "tone", sets: 2, minReps: 40, maxReps: 50, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_019",
    name: "Hollow Body Hold",
    category: "Core",
    type: "bodyweight",
    image: require("../images/hollow_body_hold.png"),
    primaryMuscles: ["core"],
    secondaryMuscles: ["hipFlexors"],
    instructions:
      "Lie on your back, press your lower back into the floor, then lift legs and shoulders off the ground with arms extended. Hold the hollow position without arching your back.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 20, maxReps: 30, restSeconds: 45 },
      { goal: "hypertrophy", sets: 3, minReps: 30, maxReps: 40, restSeconds: 30 },
      { goal: "endurance", sets: 2, minReps: 40, maxReps: 60, restSeconds: 30 },
      { goal: "tone", sets: 2, minReps: 30, maxReps: 40, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_020",
    name: "Jumping Jack",
    category: "Full Body",
    type: "bodyweight",
    image: require("../images/jumping_jack.png"),
    primaryMuscles: ["legs", "shoulders"],
    secondaryMuscles: ["cardio"],
    instructions:
      "Stand upright with your legs together and arms at your sides. Jump to spread your legs while raising your arms overhead, then jump back to the starting position.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 20, maxReps: 30, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 30, maxReps: 40, restSeconds: 45 },
      { goal: "endurance", sets: 2, minReps: 40, maxReps: 50, restSeconds: 30 },
      { goal: "tone", sets: 2, minReps: 30, maxReps: 40, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  },
  {
    id: "bw_021",
    name: "Skater",
    category: "Full Body",
    type: "bodyweight",
    image: require("../images/skater.png"),
    primaryMuscles: ["legs", "core"],
    secondaryMuscles: ["glutes"],
    instructions:
      "Stand on one leg and push your other leg behind you in a skating motion while swinging your arms for balance. Alternate sides.",
    repRanges: [
      { goal: "strength", sets: 3, minReps: 15, maxReps: 20, restSeconds: 60 },
      { goal: "hypertrophy", sets: 3, minReps: 20, maxReps: 25, restSeconds: 45 },
      { goal: "endurance", sets: 2, minReps: 25, maxReps: 30, restSeconds: 30 },
      { goal: "tone", sets: 2, minReps: 20, maxReps: 25, restSeconds: 30 }
    ],
    weightUnit: "bodyweight"
  }
];

export default bodyweightExercises;