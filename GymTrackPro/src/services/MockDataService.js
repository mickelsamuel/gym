// src/services/MockDataService.js
// This service provides mock data when Firebase permissions fail or in offline mode

class MockDataService {
  static getUserProfile() {
    return {
      username: 'Demo User',
      email: 'demo@example.com',
      fitnessGoal: 'hypertrophy',
      joinDate: new Date(),
      weight: 75,
      height: 175,
      age: 30
    };
  }

  static getWeightLogs() {
    const now = new Date();
    const days = 14; // Two weeks of data
    
    return Array.from({ length: days }).map((_, index) => {
      const date = new Date();
      date.setDate(now.getDate() - (days - index));
      
      // Generate some realistic fluctuating weight data
      const baseWeight = 75;
      const randomVariation = ((Math.random() - 0.5) * 2);
      const weight = baseWeight + randomVariation;
      
      return {
        id: `mock-weight-${index}`,
        weight: parseFloat(weight.toFixed(1)),
        date: date
      };
    });
  }

  static getWorkoutHistory() {
    const now = new Date();
    const days = 30; // A month of data
    const workoutDates = {};
    
    // Create some random workout days (roughly 3-4 workouts per week)
    for (let i = 0; i < days; i++) {
      if (Math.random() > 0.5) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        workoutDates[dateStr] = { 
          marked: true, 
          dotColor: '#5E17EB'
        };
      }
    }
    
    return workoutDates;
  }
}

export default MockDataService; 