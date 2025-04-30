// src/data/workoutCategories.js
// Workout categories for the GymTrackPro app

const workoutCategories = [
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

export default workoutCategories; 