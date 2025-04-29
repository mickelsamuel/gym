// src/services/MockDataService.js
// This service provides empty data structures when Firebase permissions fail or in offline mode

class MockDataService {
  static getUserProfile() {
    return {
      username: '',
      email: '',
      fitnessGoal: null,
      joinDate: null,
      weight: null,
      height: null,
      age: null
    };
  }

  static getWeightLogs() {
    return [];
  }

  static getWorkoutHistory() {
    return {};
  }
}

export default MockDataService; 