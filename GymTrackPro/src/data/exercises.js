// data/exercises.js

const exercises = [
    // ---------------------------------------------------------------------------
    // -------------------- Original Bodyweight Exercises -------------------------
    // ---------------------------------------------------------------------------
    {
      id: "bw_001",
      name: "Push-Up",
      category: "Chest",
      type: "bodyweight",
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
    },
  
    // ---------------------------------------------------------------------------
    // ---------------------- Original Dumbbell Exercises -------------------------
    // ---------------------------------------------------------------------------
    {
      id: "db_001",
      name: "Dumbbell Shoulder Press",
      category: "Shoulders",
      type: "dumbbell",
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
      image: null,
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
    },
    {
      id: "db_024",
      name: "Dumbbell Pullover",
      category: "Chest",
      type: "dumbbell",
      image: null,
      primaryMuscles: ["chest", "lats"],
      secondaryMuscles: ["triceps", "core"],
      instructions:
        "Lie on a bench with a dumbbell held over your chest. Keeping your arms slightly bent, lower the weight behind your head until you feel a stretch, then pull it back over your chest.",
      repRanges: [
        { goal: "strength", sets: 4, minReps: 6, maxReps: 8, restSeconds: 90 },
        { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
        { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 },
        { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "db_025",
      name: "Decline Dumbbell Press",
      category: "Chest",
      type: "dumbbell",
      image: null,
      primaryMuscles: ["chest"],
      secondaryMuscles: ["triceps", "shoulders"],
      instructions:
        "Lie on a decline bench with a dumbbell in each hand. Press the weights upward until arms are extended, then lower them slowly.",
      repRanges: [
        { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 90 },
        { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
        { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
      ],
      weightUnit: "lbs"
    },
  
    // ---------------------------------------------------------------------------
    // ----------------------- Original "Gym" (Barbell/Machine) -------------------
    // ---------------------------------------------------------------------------
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
    },
  
    // ---------------------------------------------------------------------------
    // --------------------------- NEW Exercises Added ----------------------------
    // ---------------------------------------------------------------------------
  
    {
      id: "gym_028",
      name: "T-Bar Row",
      category: "Back",
      type: "gym",
      image: null,
      primaryMuscles: ["back", "lats"],
      secondaryMuscles: ["biceps", "core", "rearDelts"],
      instructions:
        "Position yourself with feet shoulder-width apart, torso leaning forward. Grip the T-bar handle and row the bar up toward your chest, squeezing your shoulder blades together.",
      repRanges: [
        { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 120 },
        { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
        { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_029",
      name: "Machine Rear Delt Fly",
      category: "Shoulders",
      type: "gym",
      image: null,
      primaryMuscles: ["rearDelts"],
      secondaryMuscles: ["upperBack"],
      instructions:
        "Sit facing the rear delt machine with the handles at shoulder height. With arms slightly bent, pull the handles back and outward to target your rear delts, then return slowly.",
      repRanges: [
        { goal: "strength", sets: 3, minReps: 6, maxReps: 8, restSeconds: 60 },
        { goal: "hypertrophy", sets: 3, minReps: 8, maxReps: 10, restSeconds: 45 },
        { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 30 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_030",
      name: "Hack Squat",
      category: "Legs",
      type: "gym",
      image: null,
      primaryMuscles: ["legs", "quads"],
      secondaryMuscles: ["glutes", "hamstrings"],
      instructions:
        "Position yourself on the hack squat machine with your back flat against the pad and feet on the platform. Lower down until your knees are around 90°, then push back up.",
      repRanges: [
        { goal: "strength", sets: 5, minReps: 5, maxReps: 6, restSeconds: 120 },
        { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
        { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_031",
      name: "Smith Machine Bench Press",
      category: "Chest",
      type: "gym",
      image: null,
      primaryMuscles: ["chest"],
      secondaryMuscles: ["triceps", "shoulders"],
      instructions:
        "Lie on a bench under the Smith machine bar. Unrack the bar, lower it to your chest, then press it up while keeping your wrists neutral.",
      repRanges: [
        { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 120 },
        { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
        { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_032",
      name: "Smith Machine Shoulder Press",
      category: "Shoulders",
      type: "gym",
      image: null,
      primaryMuscles: ["shoulders"],
      secondaryMuscles: ["triceps"],
      instructions:
        "Sit or stand under a Smith machine bar set at shoulder height. Unrack the bar and press it overhead until your arms are extended, then lower it back to shoulder height.",
      repRanges: [
        { goal: "strength", sets: 5, minReps: 4, maxReps: 6, restSeconds: 120 },
        { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
        { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_033",
      name: "Pendulum Squat",
      category: "Legs",
      type: "gym",
      image: null,
      primaryMuscles: ["legs", "quads"],
      secondaryMuscles: ["glutes", "core"],
      instructions:
        "Stand on the pendulum squat platform. Brace your core and squat down, keeping your torso upright. Push through your legs to return to the start.",
      repRanges: [
        { goal: "strength", sets: 4, minReps: 5, maxReps: 6, restSeconds: 120 },
        { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 10, restSeconds: 60 },
        { goal: "endurance", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_034",
      name: "Donkey Calf Raise",
      category: "Legs",
      type: "gym",
      image: null,
      primaryMuscles: ["calves"],
      secondaryMuscles: [],
      instructions:
        "Use the donkey calf raise machine or lean forward with hips supported. Press through the balls of your feet to raise your heels as high as possible, then lower back down.",
      repRanges: [
        { goal: "strength", sets: 4, minReps: 6, maxReps: 8, restSeconds: 60 },
        { goal: "hypertrophy", sets: 4, minReps: 10, maxReps: 12, restSeconds: 45 },
        { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_035",
      name: "Seated Calf Raise",
      category: "Legs",
      type: "gym",
      image: null,
      primaryMuscles: ["calves"],
      secondaryMuscles: [],
      instructions:
        "Sit on the calf raise machine with the pad against your thighs. Lift your heels by pushing through the balls of your feet, then lower slowly.",
      repRanges: [
        { goal: "strength", sets: 4, minReps: 6, maxReps: 8, restSeconds: 60 },
        { goal: "hypertrophy", sets: 4, minReps: 10, maxReps: 12, restSeconds: 45 },
        { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_036",
      name: "Barbell Shrug",
      category: "Back",
      type: "gym",
      image: null,
      primaryMuscles: ["traps"],
      secondaryMuscles: ["shoulders", "forearms"],
      instructions:
        "Stand holding a barbell in front of your thighs with an overhand grip. Shrug your shoulders upward toward your ears as high as possible, then lower slowly.",
      repRanges: [
        { goal: "strength", sets: 4, minReps: 6, maxReps: 8, restSeconds: 90 },
        { goal: "hypertrophy", sets: 4, minReps: 10, maxReps: 12, restSeconds: 60 },
        { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 30 }
      ],
      weightUnit: "lbs"
    },
    {
      id: "gym_037",
      name: "Preacher Curl",
      category: "Arms",
      type: "gym",
      image: null,
      primaryMuscles: ["biceps"],
      secondaryMuscles: [],
      instructions:
        "Sit at a preacher bench with your upper arms resting on the pad. Curl the bar or dumbbell upward by bending at the elbows, then lower under control.",
      repRanges: [
        { goal: "strength", sets: 4, minReps: 5, maxReps: 7, restSeconds: 60 },
        { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 45 },
        { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
        { goal: "tone", sets: 3, minReps: 10, maxReps: 12, restSeconds: 45 }
      ],
      weightUnit: "lbs"
    }
  ];
  
  export default exercises;