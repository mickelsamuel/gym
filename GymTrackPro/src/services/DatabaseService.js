import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

class DatabaseService {
  constructor() {
    this.db = SQLite.openDatabase('gymtrack.db');
    this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Create User Profile Table
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY NOT NULL, name TEXT, age INTEGER, weight REAL, height REAL, goal TEXT, experience TEXT);'
        );
        
        // Create Workout History Table
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS workout_history (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, exercise_id TEXT, sets INTEGER, reps INTEGER, weight REAL, notes TEXT);'
        );
        
        // Create Workout Plans Table
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS workout_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, goal TEXT, days_per_week INTEGER, experience_level TEXT, plan_data TEXT);'
        );
      }, reject, resolve);
    });
  }

  // User Profile Methods
  saveProfile(profile) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT OR REPLACE INTO profile (id, name, age, weight, height, goal, experience) VALUES (1, ?, ?, ?, ?, ?, ?);',
          [profile.name, profile.age, profile.weight, profile.height, profile.goal, profile.experience],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  getProfile() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM profile WHERE id = 1;',
          [],
          (_, { rows }) => resolve(rows._array[0]),
          (_, error) => reject(error)
        );
      });
    });
  }

  // Workout History Methods
  saveWorkoutSet(exerciseData) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO workout_history (date, exercise_id, sets, reps, weight, notes) VALUES (?, ?, ?, ?, ?, ?);',
          [
            exerciseData.date, 
            exerciseData.exerciseId, 
            exerciseData.sets, 
            exerciseData.reps, 
            exerciseData.weight, 
            exerciseData.notes
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  getExerciseHistory(exerciseId) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM workout_history WHERE exercise_id = ? ORDER BY date DESC;',
          [exerciseId],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  // Progression calculation methods
  async calculateNextWorkout(exerciseId) {
    const history = await this.getExerciseHistory(exerciseId);
    
    if (history.length === 0) {
      return { message: "No previous data found. Start with a weight you're comfortable with for 3 sets of 8-12 reps." };
    }
    
    // Get user profile to determine goal
    const profile = await this.getProfile();
    const goal = profile?.goal || 'strength';
    
    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get most recent workout
    const lastWorkout = history[0];
    
    // Calculate new recommendation based on goal
    let recommendation = {
      sets: lastWorkout.sets,
      reps: lastWorkout.reps,
      weight: lastWorkout.weight,
      message: ""
    };
    
    // Progressive overload logic based on goal
    switch (goal) {
      case 'strength':
        // If completed all sets at target reps, increase weight
        if (history.length >= 2 && lastWorkout.reps >= 5) {
          recommendation.weight = Math.round((lastWorkout.weight * 1.05) * 2) / 2; // Round to nearest 0.5
          recommendation.reps = 5;
          recommendation.message = "Great progress! Increase weight and start at 5 reps.";
        } else {
          recommendation.reps = Math.min(lastWorkout.reps + 1, 6);
          recommendation.message = "Aim to increase reps before adding weight.";
        }
        break;
        
      case 'hypertrophy':
        // For muscle growth: when you reach upper rep range, increase weight
        if (history.length >= 2 && lastWorkout.reps >= 12) {
          recommendation.weight = Math.round((lastWorkout.weight * 1.025) * 2) / 2; // Smaller weight increase
          recommendation.reps = 8;
          recommendation.message = "You've reached your rep target! Increase weight and start at 8 reps.";
        } else {
          recommendation.reps = Math.min(lastWorkout.reps + 1, 12);
          recommendation.message = "Focus on controlled form and mind-muscle connection.";
        }
        break;
        
      case 'endurance':
        // For endurance: higher reps before increasing weight
        if (history.length >= 2 && lastWorkout.reps >= 15) {
          recommendation.weight = Math.round((lastWorkout.weight * 1.02) * 2) / 2;
          recommendation.reps = 12;
          recommendation.message = "Great endurance work! Slightly increase weight and reset reps.";
        } else {
          recommendation.reps = Math.min(lastWorkout.reps + 1, 15);
          recommendation.message = "Focus on maintaining good form with shorter rest periods.";
        }
        break;
        
      case 'tone':
        // For toning: moderate weight, higher reps
        if (history.length >= 2 && lastWorkout.reps >= 15) {
          recommendation.weight = Math.round((lastWorkout.weight * 1.02) * 2) / 2;
          recommendation.reps = 10;
          recommendation.message = "Great job! Increase weight slightly for continued progress.";
        } else {
          recommendation.reps = Math.min(lastWorkout.reps + 1, 15);
          recommendation.message = "Maintain controlled tempo with minimal rest between sets.";
        }
        break;
        
      default:
        recommendation.reps = lastWorkout.reps;
        recommendation.message = "Continue with your current weight and reps.";
    }
    
    return recommendation;
  }
}

export default new DatabaseService();