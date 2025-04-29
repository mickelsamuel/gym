import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { db } from './firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'

class DatabaseService {
  constructor() {
    this.isFirebaseAvailable = false
    this.initDatabase()
  }

  async initDatabase() {
    try {
      // Initialize local storage
      const keys = ['profile', 'workout_history', 'workout_plans', 'daily_weight_log']
      const initPromises = keys.map(async (key) => {
        try {
          const value = await AsyncStorage.getItem(key)
          if (!value) {
            await AsyncStorage.setItem(key, JSON.stringify(key === 'profile' ? {} : []))
          }
        } catch (error) {
          console.warn(`Error initializing ${key}:`, error)
        }
      })
      
      await Promise.all(initPromises)
      
      // Test Firebase connection with timeout for better reliability
      try {
        this.isFirebaseAvailable = false
        
        const testPromise = new Promise(async (resolve, reject) => {
          try {
            // Create a test document if it doesn't exist
            const testRef = doc(db, 'test', 'connection')
            const testDoc = await getDoc(testRef)
            
            if (!testDoc.exists()) {
              await setDoc(testRef, {
                created: serverTimestamp(),
                message: 'Connection test successful',
                app: 'GymTrackPro',
                isPublic: true
              })
              console.log('Created Firebase test document')
            } else {
              console.log('Firebase test document exists')
              
              // Update the test document to ensure write permissions
              await updateDoc(testRef, {
                lastChecked: serverTimestamp(),
                isPublic: true
              })
              console.log('Updated Firebase test document')
            }
            
            resolve(true)
          } catch (error) {
            reject(error)
          }
        })
        
        // Add a timeout to the test
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Firebase connection timeout')), 5000)
        })
        
        // Wait for either the test to complete or timeout
        this.isFirebaseAvailable = await Promise.race([testPromise, timeoutPromise])
        
        // Create a public collection for testing
        if (this.isFirebaseAvailable) {
          await this.createPublicTestCollection()
        }
      } catch (firebaseError) {
        console.warn('Firebase connection test failed:', firebaseError)
        this.isFirebaseAvailable = false
      }
    } catch (error) {
      console.error('Error initializing database:', error)
    }
  }

  // =====================================
  // PROFILE
  // =====================================
  async saveProfile(profile) {
    try {
      if (!profile) {
        throw new Error('Invalid profile data')
      }
      
      // Save locally first for offline access
      await AsyncStorage.setItem('profile', JSON.stringify(profile))
      
      // Sync with Firestore if available
      if (this.isFirebaseAvailable && profile.firebaseUid) {
        try {
          const userRef = doc(db, 'users', profile.firebaseUid)
          await setDoc(userRef, {
            ...profile,
            lastUpdated: serverTimestamp()
          }, { merge: true })
        } catch (firebaseError) {
          console.error('Failed to save profile to Firestore:', firebaseError)
          // Continue with local storage only
        }
      }
      
      return profile
    } catch (error) {
      console.error('Error saving profile to AsyncStorage:', error)
      throw error
    }
  }

  async getProfile() {
    try {
      // First try to get from AsyncStorage
      const profileString = await AsyncStorage.getItem('profile')
      const localProfile = profileString ? JSON.parse(profileString) : null
      
      // If Firebase is available and we have a UID, try to get the latest profile
      if (this.isFirebaseAvailable && localProfile?.firebaseUid) {
        try {
          const userRef = doc(db, 'users', localProfile.firebaseUid)
          const userDoc = await getDoc(userRef)
          
          if (userDoc.exists()) {
            const firebaseProfile = userDoc.data()
            
            // Merge and save the updated profile back to AsyncStorage
            const mergedProfile = { ...localProfile, ...firebaseProfile }
            await AsyncStorage.setItem('profile', JSON.stringify(mergedProfile))
            
            return mergedProfile
          }
        } catch (firebaseError) {
          console.warn('Failed to get profile from Firestore:', firebaseError)
          // Continue with local profile
        }
      }
      
      return localProfile || {}
    } catch (error) {
      console.error('Error getting profile from AsyncStorage:', error)
      return {} // Return empty object in case of error
    }
  }

  // =====================================
  // DAILY WEIGHT LOG
  // =====================================
  async logDailyWeight({ date, weight }) {
    try {
      if (!date || !weight) {
        throw new Error('Invalid weight log data')
      }
      
      // Validate weight
      const weightNum = parseFloat(weight)
      if (isNaN(weightNum) || weightNum <= 0 || weightNum > 700) {
        throw new Error('Invalid weight value')
      }
      
      // 1) Store in local AsyncStorage
      try {
        const weightString = await AsyncStorage.getItem('daily_weight_log')
        let logs = weightString ? JSON.parse(weightString) : []
        
        // Ensure logs is an array
        if (!Array.isArray(logs)) {
          logs = []
        }
        
        const existingIndex = logs.findIndex(entry => entry.date === date)
        if (existingIndex >= 0) {
          logs[existingIndex].weight = weightNum
        } else {
          logs.push({ date, weight: weightNum })
        }
        
        logs.sort((a, b) => new Date(a.date) - new Date(b.date))
        await AsyncStorage.setItem('daily_weight_log', JSON.stringify(logs))
      } catch (storageError) {
        console.error('Error saving weight to AsyncStorage:', storageError)
      }

      // 2) Push to Firestore for friend viewing (if we have a firebaseUid)
      if (this.isFirebaseAvailable) {
        try {
          const userProfileString = await AsyncStorage.getItem('profile')
          const userProfile = userProfileString ? JSON.parse(userProfileString) : null
          
          if (userProfile && userProfile.firebaseUid) {
            const userRef = doc(db, 'users', userProfile.firebaseUid)
            const snap = await getDoc(userRef)
            
            if (snap.exists()) {
              const data = snap.data()
              const newEntry = { 
                date, 
                weight: weightNum,
                timestamp: serverTimestamp()
              }
              
              // Ensure firestoreWeightLog is an array
              const firestoreWeightLog = Array.isArray(data.firestoreWeightLog)
                ? [...data.firestoreWeightLog]
                : []

              // Update or add entry
              const existingEntryIndex = firestoreWeightLog.findIndex(entry => entry.date === date)
              if (existingEntryIndex >= 0) {
                firestoreWeightLog[existingEntryIndex] = newEntry
              } else {
                firestoreWeightLog.push(newEntry)
              }

              // If array is too large, trim it
              if (firestoreWeightLog.length > 50) {
                firestoreWeightLog.splice(0, firestoreWeightLog.length - 50)
              }

              await updateDoc(userRef, {
                firestoreWeightLog,
                lastUpdated: serverTimestamp()
              })
            }
          }
        } catch (firebaseError) {
          console.warn('Failed to sync weight log to Firestore:', firebaseError)
          // Continue with local storage only
        }
      }

      // Retrieve updated logs to return
      try {
        const weightString = await AsyncStorage.getItem('daily_weight_log')
        return weightString ? JSON.parse(weightString) : []
      } catch (retrieveError) {
        console.error('Error retrieving updated weight logs:', retrieveError)
        return [] // Return empty array if retrieval fails
      }
    } catch (error) {
      console.error('Error logging daily weight:', error)
      throw error
    }
  }

  async getDailyWeightLog() {
    try {
      const weightString = await AsyncStorage.getItem('daily_weight_log')
      return weightString ? JSON.parse(weightString) : []
    } catch (error) {
      console.error('Error getting daily weight log:', error)
      return [] // Return empty array in case of error
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

  // Create a public collection for testing Firebase permissions
  async createPublicTestCollection() {
    try {
      // Create a public document that anyone can read
      const publicRef = doc(db, 'public', 'test')
      await setDoc(publicRef, {
        created: serverTimestamp(),
        message: 'This is a public test document',
        lastUpdated: new Date().toISOString()
      }, { merge: true })
      
      console.log('Public test document created/updated successfully')
      return true
    } catch (error) {
      console.error('Error creating public test document:', error)
      return false
    }
  }

  // =====================================
  // RECENT WORKOUTS
  // =====================================
  async getRecentWorkouts() {
    try {
      // Get the exercise history first
      const history = await this.getExerciseHistory();
      
      // If no history, return empty array
      if (!history || !Array.isArray(history) || history.length === 0) {
        return [];
      }
      
      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Return the most recent entries
      return history.slice(0, 10);
    } catch (error) {
      console.error('Error getting recent workouts:', error);
      return []; // Return empty array in case of error
    }
  }
}

export default new DatabaseService()