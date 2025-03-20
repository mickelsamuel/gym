import AsyncStorage from '@react-native-async-storage/async-storage';

class DatabaseService {
  constructor() {
    // Initialize the database on instantiation.
    this.initDatabase();
  }

  /**
   * Initializes the "database" by ensuring required keys exist.
   */
  async initDatabase() {
    try {
      // Initialize the profile if it doesn't exist.
      const profile = await AsyncStorage.getItem('profile');
      if (!profile) {
        await AsyncStorage.setItem('profile', JSON.stringify({}));
      }
      // Initialize the workout history if it doesn't exist.
      const history = await AsyncStorage.getItem('workout_history');
      if (!history) {
        await AsyncStorage.setItem('workout_history', JSON.stringify([]));
      }
      // Initialize the workout plans if they don't exist.
      const plans = await AsyncStorage.getItem('workout_plans');
      if (!plans) {
        await AsyncStorage.setItem('workout_plans', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  /* =====================
     PROFILE METHODS
     ===================== */

  /**
   * Saves the user's profile.
   * @param {Object} profile - The user profile object.
   * @returns {Promise<Object>} The saved profile.
   */
  async saveProfile(profile) {
    try {
      await AsyncStorage.setItem('profile', JSON.stringify(profile));
      return profile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves the user's profile.
   * @returns {Promise<Object|null>} The stored profile or null if not found.
   */
  async getProfile() {
    try {
      const profile = await AsyncStorage.getItem('profile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      throw error;
    }
  }

  /* =====================
     WORKOUT HISTORY METHODS
     ===================== */

  /**
   * Saves a workout set (record) to the workout history.
   * @param {Object} workoutSet - The workout set data.
   * Expected format:
   * {
   *   date: string (ISO date),
   *   exerciseId: string,
   *   sets: number,
   *   reps: number,
   *   weight: number,
   *   notes: string
   * }
   * @returns {Promise<Array>} The updated history array.
   */
  async saveWorkoutSet(workoutSet) {
    try {
      const historyString = await AsyncStorage.getItem('workout_history');
      let history = historyString ? JSON.parse(historyString) : [];
      // Prepend the new workout record so that the most recent is first.
      history.unshift(workoutSet);
      await AsyncStorage.setItem('workout_history', JSON.stringify(history));
      return history;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves the workout history, optionally filtering by exercise ID.
   * @param {string} [exerciseId] - If provided, returns only records for this exercise.
   * @returns {Promise<Array>} An array of workout records.
   */
  async getExerciseHistory(exerciseId) {
    try {
      const historyString = await AsyncStorage.getItem('workout_history');
      let history = historyString ? JSON.parse(historyString) : [];
      if (exerciseId) {
        history = history.filter(entry => entry.exerciseId === exerciseId);
      }
      // Sort records by date (most recent first)
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      return history;
    } catch (error) {
      throw error;
    }
  }

  /* =====================
     WORKOUT PLANS METHODS
     ===================== */

  /**
   * Saves a workout plan.
   * Assumes that each plan has a unique "id" property.
   * @param {Object} plan - The workout plan data.
   * @returns {Promise<Array>} The updated array of workout plans.
   */
  async saveWorkoutPlan(plan) {
    try {
      const plansString = await AsyncStorage.getItem('workout_plans');
      let plans = plansString ? JSON.parse(plansString) : [];
      const index = plans.findIndex(p => p.id === plan.id);
      if (index !== -1) {
        // Update existing plan.
        plans[index] = plan;
      } else {
        // Add new plan.
        plans.push(plan);
      }
      await AsyncStorage.setItem('workout_plans', JSON.stringify(plans));
      return plans;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves all workout plans.
   * @returns {Promise<Array>} An array of workout plans.
   */
  async getWorkoutPlans() {
    try {
      const plansString = await AsyncStorage.getItem('workout_plans');
      return plansString ? JSON.parse(plansString) : [];
    } catch (error) {
      throw error;
    }
  }

  /* =====================
     PROGRESSION CALCULATION
     ===================== */

  /**
   * Calculates the next workout recommendation for a given exercise
   * based on its workout history.
   * @param {string} exerciseId - The ID of the exercise.
   * @returns {Promise<Object>} An object with recommended sets, reps, weight, and a message.
   */
  async calculateNextWorkout(exerciseId) {
    try {
      const history = await this.getExerciseHistory(exerciseId);
      if (history.length === 0) {
        return {
          message:
            "No previous data found. Start with a weight you're comfortable with for 3 sets of 8-12 reps.",
        };
      }

      // Use the most recent workout set.
      const lastWorkout = history[0];

      // Example logic for hypertrophy:
      // - If reps are 12 or more, increase weight by 5% and reset reps to 8.
      // - Otherwise, add 1 rep.
      let newWeight = lastWorkout.weight;
      let newReps = lastWorkout.reps;
      let recommendationMessage = '';

      if (lastWorkout.reps >= 12) {
        newWeight = Math.round(lastWorkout.weight * 1.05 * 100) / 100; // Increase weight by 5%, rounded to 2 decimals.
        newReps = 8; // Reset rep count.
        recommendationMessage = 'Increase weight by 5% and reset reps to 8.';
      } else {
        newReps = lastWorkout.reps + 1;
        recommendationMessage = 'Increase reps by 1.';
      }

      return {
        sets: lastWorkout.sets,
        reps: newReps,
        weight: newWeight,
        message: recommendationMessage,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new DatabaseService();