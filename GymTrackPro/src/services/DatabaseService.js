// src/services/DatabaseService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system'; // optional if you want to handle images
import * as ImagePicker from 'expo-image-picker'; // optional for picking profile images

/**
 * DatabaseService:
 *  - Manages user profile (profile, including name, etc. + profilePic)
 *  - Manages workout history (workout_history)
 *  - Manages custom workout plans (workout_plans)
 *  - Manages daily weight logs (daily_weight_log)
 *  - Provides next workout calculation
 */
class DatabaseService {
  constructor() {
    this.initDatabase();
  }

  /**
   * Ensures required AsyncStorage keys exist.
   */
  async initDatabase() {
    try {
      // Profile
      const profile = await AsyncStorage.getItem('profile');
      if (!profile) {
        await AsyncStorage.setItem('profile', JSON.stringify({}));
      }
      // Workout history
      const history = await AsyncStorage.getItem('workout_history');
      if (!history) {
        await AsyncStorage.setItem('workout_history', JSON.stringify([]));
      }
      // Workout plans
      const plans = await AsyncStorage.getItem('workout_plans');
      if (!plans) {
        await AsyncStorage.setItem('workout_plans', JSON.stringify([]));
      }
      // Daily weight log
      const weightLog = await AsyncStorage.getItem('daily_weight_log');
      if (!weightLog) {
        await AsyncStorage.setItem('daily_weight_log', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  /* =====================
   * PROFILE
   * ===================== */
  async saveProfile(profile) {
    try {
      // profile can include { name, age, weight, height, goal, experience, profilePic }
      await AsyncStorage.setItem('profile', JSON.stringify(profile));
      return profile;
    } catch (error) {
      throw error;
    }
  }

  async getProfile() {
    try {
      const profileString = await AsyncStorage.getItem('profile');
      return profileString ? JSON.parse(profileString) : null;
    } catch (error) {
      throw error;
    }
  }

  /* =====================
   * WEIGHT LOG
   * ===================== */
  async logDailyWeight({ date, weight }) {
    try {
      const weightString = await AsyncStorage.getItem('daily_weight_log');
      let logs = weightString ? JSON.parse(weightString) : [];
      // see if there's an entry for the same date
      const existingIndex = logs.findIndex((entry) => entry.date === date);
      if (existingIndex >= 0) {
        logs[existingIndex].weight = weight;
      } else {
        logs.push({ date, weight });
      }
      // sort by ascending date
      logs.sort((a, b) => new Date(a.date) - new Date(b.date));
      await AsyncStorage.setItem('daily_weight_log', JSON.stringify(logs));
      return logs;
    } catch (error) {
      throw error;
    }
  }

  async getDailyWeightLog() {
    try {
      const weightString = await AsyncStorage.getItem('daily_weight_log');
      return weightString ? JSON.parse(weightString) : [];
    } catch (error) {
      throw error;
    }
  }

  /* =====================
   * WORKOUT HISTORY
   * ===================== */
  async saveWorkoutSet(workoutSet) {
    try {
      const historyString = await AsyncStorage.getItem('workout_history');
      let history = historyString ? JSON.parse(historyString) : [];
      // newest first
      history.unshift(workoutSet);
      await AsyncStorage.setItem('workout_history', JSON.stringify(history));
      return history;
    } catch (error) {
      throw error;
    }
  }

  async getExerciseHistory(exerciseId) {
    try {
      const historyString = await AsyncStorage.getItem('workout_history');
      let history = historyString ? JSON.parse(historyString) : [];
      if (exerciseId) {
        history = history.filter((entry) => entry.exerciseId === exerciseId);
      }
      // sort newest first
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      return history;
    } catch (error) {
      throw error;
    }
  }

  /* =====================
   * CUSTOM WORKOUT PLANS
   * ===================== */
  // 1) getAllWorkoutLists -> just a convenience wrapper for getWorkoutPlans
  async getAllWorkoutLists() {
    const plans = await this.getWorkoutPlans();
    return plans;
  }

  // 2) createWorkoutList
  async createWorkoutList(listName) {
    try {
      let plansString = await AsyncStorage.getItem('workout_plans');
      let plans = plansString ? JSON.parse(plansString) : [];
      const newPlan = {
        id: Date.now().toString(),
        name: listName,
        exercises: []
      };
      plans.push(newPlan);
      await AsyncStorage.setItem('workout_plans', JSON.stringify(plans));
      return newPlan;
    } catch (error) {
      throw error;
    }
  }

  // addExerciseToList
  async addExerciseToList(listId, exerciseId) {
    try {
      const plansString = await AsyncStorage.getItem('workout_plans');
      let plans = plansString ? JSON.parse(plansString) : [];
      const index = plans.findIndex((p) => p.id === listId);
      if (index >= 0) {
        if (!plans[index].exercises.includes(exerciseId)) {
          plans[index].exercises.push(exerciseId);
        }
      }
      await AsyncStorage.setItem('workout_plans', JSON.stringify(plans));
      return plans[index];
    } catch (error) {
      throw error;
    }
  }

  // removeExerciseFromList
  async removeExerciseFromList(listId, exerciseId) {
    try {
      const plansString = await AsyncStorage.getItem('workout_plans');
      let plans = plansString ? JSON.parse(plansString) : [];
      const index = plans.findIndex((p) => p.id === listId);
      if (index >= 0) {
        plans[index].exercises = plans[index].exercises.filter((id) => id !== exerciseId);
      }
      await AsyncStorage.setItem('workout_plans', JSON.stringify(plans));
      return plans[index];
    } catch (error) {
      throw error;
    }
  }

  // 3) getWorkoutPlans
  async getWorkoutPlans() {
    try {
      const plansString = await AsyncStorage.getItem('workout_plans');
      return plansString ? JSON.parse(plansString) : [];
    } catch (error) {
      throw error;
    }
  }

  /* =====================
   * NEXT WORKOUT RECOMMENDATION
   * ===================== */
  async calculateNextWorkout(exerciseId) {
    try {
      const history = await this.getExerciseHistory(exerciseId);
      if (history.length === 0) {
        return {
          message: "No previous data found. Start with a weight you're comfortable with for 3 sets of 8-12 reps."
        };
      }
      // newest first
      const lastWorkout = history[0];
      let newWeight = lastWorkout.weight;
      let newReps = lastWorkout.reps;
      let message = '';

      if (lastWorkout.reps >= 12) {
        newWeight = Math.round(lastWorkout.weight * 1.05 * 100) / 100;
        newReps = 8;
        message = 'Increased weight by ~5% and reset reps to 8.';
      } else {
        newReps += 1;
        message = 'Increase your reps by 1.';
      }

      return {
        sets: lastWorkout.sets,
        reps: newReps,
        weight: newWeight,
        message
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new DatabaseService();