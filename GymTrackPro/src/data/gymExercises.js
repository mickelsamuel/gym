const gymExercises = [
  {
    id: "gym_001",
    name: "Barbell Bench Press",
    category: "Chest",
    type: "gym",
    image: require("../images/barbell-bench-press.png"),
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    instructions:
      "Lie on a flat bench with feet on the floor. Grip the bar slightly wider than shoulder-width. Lower to your chest, then press back up.",
    repRanges: [
      { goal: "strength", sets: 5, minReps: 3, maxReps: 5, restSeconds: 120 },
      { goal: "hypertrophy", sets: 4, minReps: 8, maxReps: 12, restSeconds: 60 },
      { goal: "endurance", sets: 3, minReps: 15, maxReps: 20, restSeconds: 30 },
      { goal: "tone", sets: 3, minReps: 12, maxReps: 15, restSeconds: 45 }
    ],
    weightUnit: "lbs"
  },
  // Repeat above pattern with `require("../images/placeholder.png")` for all other exercises
  // You can replace the placeholder with the actual file name once you have the images
];

export default gymExercises;