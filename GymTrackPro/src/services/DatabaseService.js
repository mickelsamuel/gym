import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore'

class DatabaseService {
  constructor() {
    this.initDatabase()
  }

  async initDatabase() {
    try {
      const profile = await AsyncStorage.getItem('profile')
      if (!profile) {
        await AsyncStorage.setItem('profile', JSON.stringify({}))
      }
      const history = await AsyncStorage.getItem('workout_history')
      if (!history) {
        await AsyncStorage.setItem('workout_history', JSON.stringify([]))
      }
      const plans = await AsyncStorage.getItem('workout_plans')
      if (!plans) {
        await AsyncStorage.setItem('workout_plans', JSON.stringify([]))
      }
      const weightLog = await AsyncStorage.getItem('daily_weight_log')
      if (!weightLog) {
        await AsyncStorage.setItem('daily_weight_log', JSON.stringify([]))
      }
    } catch (error) {
      // You could log or handle the error here if desired
    }
  }

  // =====================================
  // PROFILE
  // =====================================
  async saveProfile(profile) {
    try {
      await AsyncStorage.setItem('profile', JSON.stringify(profile))
      return profile
    } catch (error) {
      throw error
    }
  }

  async getProfile() {
    try {
      const profileString = await AsyncStorage.getItem('profile')
      return profileString ? JSON.parse(profileString) : null
    } catch (error) {
      throw error
    }
  }

  // =====================================
  // DAILY WEIGHT LOG
  // =====================================
  async logDailyWeight({ date, weight }) {
    try {
      // 1) Store in local AsyncStorage
      const weightString = await AsyncStorage.getItem('daily_weight_log')
      let logs = weightString ? JSON.parse(weightString) : []
      const existingIndex = logs.findIndex(entry => entry.date === date)
      if (existingIndex >= 0) {
        logs[existingIndex].weight = weight
      } else {
        logs.push({ date, weight })
      }
      logs.sort((a, b) => new Date(a.date) - new Date(b.date))
      await AsyncStorage.setItem('daily_weight_log', JSON.stringify(logs))

      // 2) Push to Firestore for friend viewing (if we have a firebaseUid)
      try {
        const userProfileString = await AsyncStorage.getItem('profile')
        const userProfile = userProfileString ? JSON.parse(userProfileString) : null
        if (userProfile && userProfile.firebaseUid) {
          const userRef = doc(db, 'users', userProfile.firebaseUid)
          const snap = await getDoc(userRef)
          if (snap.exists()) {
            const data = snap.data()
            const newEntry = { date, weight }
            const firestoreWeightLog = Array.isArray(data.firestoreWeightLog)
              ? [...data.firestoreWeightLog]
              : []

            firestoreWeightLog.push(newEntry)
            // If array is too large, trim it
            if (firestoreWeightLog.length > 50) {
              firestoreWeightLog.splice(0, firestoreWeightLog.length - 50)
            }

            await updateDoc(userRef, {
              firestoreWeightLog
            })
          }
        }
      } catch {
        // ignore Firestore update errors
      }

      return logs
    } catch (error) {
      throw error
    }
  }

  async getDailyWeightLog() {
    try {
      const weightString = await AsyncStorage.getItem('daily_weight_log')
      return weightString ? JSON.parse(weightString) : []
    } catch (error) {
      throw error
    }
  }

  // =====================================
  // WORKOUT HISTORY
  // =====================================
  async saveWorkoutSet(workoutSet) {
    try {
      // 1) Save locally
      const historyString = await AsyncStorage.getItem('workout_history')
      let history = historyString ? JSON.parse(historyString) : []
      history.unshift(workoutSet)
      await AsyncStorage.setItem('workout_history', JSON.stringify(history))

      // 2) Push to Firestore
      try {
        const userProfileString = await AsyncStorage.getItem('profile')
        const userProfile = userProfileString ? JSON.parse(userProfileString) : null
        if (userProfile && userProfile.firebaseUid) {
          const userRef = doc(db, 'users', userProfile.firebaseUid)
          const snap = await getDoc(userRef)
          if (snap.exists()) {
            const data = snap.data()
            const exerciseName = workoutSet.exerciseName || workoutSet.exerciseId || 'Unknown'

            const newEntry = {
              date: workoutSet.date,
              exerciseName,
              sets: workoutSet.sets,
              reps: workoutSet.reps,
              weight: workoutSet.weight
            }

            const firestoreSets = Array.isArray(data.firestoreSets)
              ? [...data.firestoreSets]
              : []

            firestoreSets.push(newEntry)
            // Trim length if too large
            if (firestoreSets.length > 50) {
              firestoreSets.splice(0, firestoreSets.length - 50)
            }

            await updateDoc(userRef, {
              firestoreSets
            })
          }
        }
      } catch {
        // ignore Firestore update errors
      }

      return history
    } catch (error) {
      throw error
    }
  }

  async getExerciseHistory(exerciseId) {
    try {
      const historyString = await AsyncStorage.getItem('workout_history')
      let history = historyString ? JSON.parse(historyString) : []
      if (exerciseId) {
        history = history.filter(entry => entry.exerciseId === exerciseId)
      }
      // sort newest first
      history.sort((a, b) => new Date(b.date) - new Date(a.date))
      return history
    } catch (error) {
      throw error
    }
  }

  // =====================================
  // CUSTOM WORKOUT PLANS
  // =====================================
  async getAllWorkoutLists() {
    const plans = await this.getWorkoutPlans()
    return plans
  }

  async createWorkoutList(listName) {
    try {
      let plansString = await AsyncStorage.getItem('workout_plans')
      let plans = plansString ? JSON.parse(plansString) : []
      const newPlan = {
        id: Date.now().toString(),
        name: listName,
        exercises: []
      }
      plans.push(newPlan)
      await AsyncStorage.setItem('workout_plans', JSON.stringify(plans))
      return newPlan
    } catch (error) {
      throw error
    }
  }

  async addExerciseToList(listId, exerciseId) {
    try {
      const plansString = await AsyncStorage.getItem('workout_plans')
      let plans = plansString ? JSON.parse(plansString) : []
      const index = plans.findIndex(p => p.id === listId)
      if (index >= 0) {
        if (!plans[index].exercises.includes(exerciseId)) {
          plans[index].exercises.push(exerciseId)
        }
      }
      await AsyncStorage.setItem('workout_plans', JSON.stringify(plans))
      return plans[index]
    } catch (error) {
      throw error
    }
  }

  async removeExerciseFromList(listId, exerciseId) {
    try {
      const plansString = await AsyncStorage.getItem('workout_plans')
      let plans = plansString ? JSON.parse(plansString) : []
      const index = plans.findIndex(p => p.id === listId)
      if (index >= 0) {
        plans[index].exercises = plans[index].exercises.filter(id => id !== exerciseId)
      }
      await AsyncStorage.setItem('workout_plans', JSON.stringify(plans))
      return plans[index]
    } catch (error) {
      throw error
    }
  }

  async getWorkoutPlans() {
    try {
      const plansString = await AsyncStorage.getItem('workout_plans')
      return plansString ? JSON.parse(plansString) : []
    } catch (error) {
      throw error
    }
  }

  // =====================================
  // NEXT WORKOUT RECOMMENDATION
  // =====================================
  async calculateNextWorkout(exerciseId) {
    try {
      const history = await this.getExerciseHistory(exerciseId)
      if (history.length === 0) {
        return {
          message: "No previous data found. Start with a weight you're comfortable with for 3 sets of 8-12 reps."
        }
      }
      const lastWorkout = history[0]
      let newWeight = lastWorkout.weight
      let newReps = lastWorkout.reps
      let message = ''

      if (lastWorkout.reps >= 12) {
        newWeight = Math.round(lastWorkout.weight * 1.05 * 100) / 100
        newReps = 8
        message = 'Increased weight by ~5% and reset reps to 8.'
      } else {
        newReps += 1
        message = 'Increase your reps by 1.'
      }

      return {
        sets: lastWorkout.sets,
        reps: newReps,
        weight: newWeight,
        message
      }
    } catch (error) {
      throw error
    }
  }
}

export default new DatabaseService()