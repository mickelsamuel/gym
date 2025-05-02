import AsyncStorage from '@react-native-async-storage/async-storage';
import { db,auth } from './firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, DocumentReference, DocumentData, collection, query, where, getDocs } from 'firebase/firestore';
import { AuthContext, useAuth } from '../context/AuthContext';
import { sanitizeString } from '../utils/sanitize';
import { StorageKeys } from '../constants';




interface Profile {
  firebaseUid?: string;
  username?: string;
  email?: string;
  weight?: number;
  height?: number;
  goals?: string[];
  [key: string]: any;
}

interface WeightLogEntry {
  date: string;
  weight: number;
  timestamp?: any;
}

interface WorkoutList {
  id: string;
  name: string;
  exercises: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkoutSet {
  id?: string;
  date: string;
  exerciseId: string;
  weight: number;
  reps: number;
  notes?: string;
}

class DatabaseService {
  isFirebaseAvailable: boolean;

  constructor() {
    this.isFirebaseAvailable = false;
    this.initDatabase();
    this.initializeStorage()
  }

  async initializeStorage(): Promise<void> {

  }

  async initDatabase(): Promise<void> {
    try {
      // Initialize local storage
      const keys = [StorageKeys.PROFILE, StorageKeys.WORKOUT_HISTORY, StorageKeys.WORKOUT_PLANS, StorageKeys.DAILY_WEIGHT_LOG];
      const initPromises = keys.map(async (key : any) => {
        try {
          const value = await AsyncStorage.getItem(key);
          if (!value) {
            await AsyncStorage.setItem(key, JSON.stringify(key === StorageKeys.PROFILE ? {} : []));
          }
        } catch (error) {
          console.error(`Error initializing ${key}:`, error);
        }
      });
      
      await Promise.all(initPromises);
      
      // Test Firebase connection with timeout for better reliability
      try {
        
        
        const testPromise = new Promise<boolean>(async (resolve, reject) => {
          try {
            // Create a test document if it doesn't exist
            const testRef = doc(db, 'test', 'connection');
            const testDoc = await getDoc(testRef);
            
            if (!testDoc.exists()) {
              await setDoc(testRef, {
                created: serverTimestamp(),
                message: 'Connection test successful',
                app: 'GymTrackPro',
                isPublic: true
              });
              console.log('Created Firebase test document');
            } else {
              console.log('Firebase test document exists');
              
              // Update the test document to ensure write permissions
              await updateDoc(testRef, {
                lastChecked: serverTimestamp(),
                isPublic: true
              });
              console.log('Updated Firebase test document');
            }
            
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });
        
        // Add a timeout to the test
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Firebase connection timeout')), 5000);
        });
        
        // Wait for either the test to complete or timeout
        this.isFirebaseAvailable = await Promise.race([testPromise, timeoutPromise]);
        
        // Create a public collection for testing
        if (this.isFirebaseAvailable) {
          await this.createPublicTestCollection();
        }
      } catch (firebaseError) {
        if (firebaseError instanceof Error) {
           console.warn('Firebase connection test failed: ', firebaseError.message);
        } else {
           console.warn('Firebase connection test failed: ', firebaseError);
        }
        this.isFirebaseAvailable = false;
      }
    } catch (error : any) {
      console.error('Error initializing database:', error);
    }
  }

   private async checkOnlineStatus() {
    const { isOnline } = useAuth();
    if (!isOnline) {
      throw new Error('Offline: Cannot perform write operations offline.');
    }
  }

  // =====================================
  // PROFILE
  // =====================================
  async saveProfile(profile: Profile): Promise<Profile> {
    try {
      await this.checkOnlineStatus();
      
      if (!profile.firebaseUid) return {};
      

       // Sanitize user-provided string data
      const sanitizedProfile: Profile = {
        ...profile,
        username: profile.username ? sanitizeString(profile.username) : undefined,
        email: profile.email ? sanitizeString(profile.email) : undefined,
        goals: profile.goals?.map(sanitizeString) || [],
        // Add more string fields as needed
      };



      // Save locally first for offline access
      await AsyncStorage.setItem(StorageKeys.PROFILE, JSON.stringify(sanitizedProfile));

      // Sync with Firestore if available
      if (this.isFirebaseAvailable && profile.firebaseUid) {
        try {
          const userRef = doc(db, 'users', profile.firebaseUid);
          await setDoc(userRef, {
            ...profile,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        } catch (firebaseError) {
           if (firebaseError instanceof Error) {
             console.error('Failed to save profile due to Firestore issue:', firebaseError.message);
           } else {
             console.error('Failed to save profile due to Firestore issue', firebaseError);
           }
          // Continue with local storage only
        }
      }
      
      return sanitizedProfile;
    } catch (asyncStorageError: any) {
      console.error('Failed to save profile due to an AsyncStorage issue:', asyncStorageError);
      if (asyncStorageError instanceof Error) {
        console.error('Failed to save profile due to an AsyncStorage issue:', asyncStorageError.message);
      }
    } catch (error) {
      console.error('Error saving profile to AsyncStorage:', error);
      throw error;
    }
  }

  async getProfile(): Promise<Profile> {
    try {
      // First try to get from AsyncStorage
      const profileString = await AsyncStorage.getItem(StorageKeys.PROFILE);
      const localProfile: Profile = profileString ? JSON.parse(profileString) : null;
      
      // If Firebase is available and we have a UID, try to get the latest profile
      if (this.isFirebaseAvailable && localProfile?.firebaseUid) {
        try {
          const userRef = doc(db, 'users', localProfile.firebaseUid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const firebaseProfile = userDoc.data() as Profile;
            
            // Merge and save the updated profile back to AsyncStorage
            const mergedProfile = { ...localProfile, ...firebaseProfile };
            await AsyncStorage.setItem(StorageKeys.PROFILE, JSON.stringify(mergedProfile));
            
            return mergedProfile;
          }
        } catch (firebaseError) {
            if (firebaseError instanceof Error) {
              console.warn('Failed to get profile from Firestore due to :', firebaseError.message);
            } else {
              console.warn('Failed to get profile from Firestore due to :', firebaseError);
            }
        }
      }
       return localProfile || {};
    } catch (asyncStorageError: any) {
        if (asyncStorageError instanceof Error) {
          console.error('Error accessing AsyncStorage:', asyncStorageError.message);
        }
        return {}
    } catch (error) {
      console.error('Error getting profile from AsyncStorage:', error);
      return {}; // Return empty object in case of error
    }
  }

  // =====================================
  // DAILY WEIGHT LOG
  // =====================================
  async logDailyWeight({ date, weight }: { date: string; weight: number | string }): Promise<WeightLogEntry[]> {
    let logs: WeightLogEntry[] = []
    try {
       await this.checkOnlineStatus();

      if (!date || !weight) return []

      const weightNum = this.validateWeight(weight)
      if(!weightNum) return []

       // Sanitize user-provided string data
      const sanitizedDate = sanitizeString(date);


      await this.updateLocalWeightLog(sanitizedDate, weightNum);
      await this.syncWeightToFirestore(sanitizedDate, weightNum);
      logs = await this.retrieveUpdatedWeightLogs();


      return logs;
      
    } catch (error) {
      console.error('Error logging daily weight:', error);
      throw error;
    }
  }

  async getDailyWeightLog(): Promise<WeightLogEntry[]> {
    try {
      const weightString = await AsyncStorage.getItem(StorageKeys.DAILY_WEIGHT_LOG);
      return weightString ? JSON.parse(weightString) : [];
    } catch (error) {
      console.error('Error getting daily weight log:', error);
      return []
    }
  }
  // Helper function to validate weight
  private validateWeight(weight: string | number):number | null{
      const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
      if (isNaN(weightNum) || weightNum <= 0 || weightNum > 700) {
        console.error('Invalid weight value:', weight);
        return null;
      }
      return weightNum;
  }

  // Helper function to update weight log locally
  private async updateLocalWeightLog(date: string, weightNum: number) {
      try {
          const weightString = await AsyncStorage.getItem(StorageKeys.DAILY_WEIGHT_LOG);
          let logs: WeightLogEntry[] = weightString ? JSON.parse(weightString) : [];

          const existingIndex = logs.findIndex(entry => entry.date === date);
          if (existingIndex >= 0) {
              logs[existingIndex].weight = weightNum;
          } else {
              logs.push({ date, weight: weightNum });
          }

          logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          await AsyncStorage.setItem(StorageKeys.DAILY_WEIGHT_LOG, JSON.stringify(logs));
      } catch (storageError) {
          if (storageError instanceof Error) {
              console.error('Error saving weight to AsyncStorage:', storageError.message);
          } else {
              console.error('Error saving weight to AsyncStorage:', storageError);
          }
      }
  }

  // Helper function to retrieve updated weight logs
  private async retrieveUpdatedWeightLogs(): Promise<WeightLogEntry[]> {
      try {
          const weightString = await AsyncStorage.getItem(StorageKeys.DAILY_WEIGHT_LOG);
          const logs: WeightLogEntry[] = weightString ? JSON.parse(weightString) : [];
          
          // Ensure logs is an array
          return Array.isArray(logs) ? logs : [];
      } catch (retrieveError) {
          console.error('Error retrieving updated weight logs:', retrieveError);
          return [];
      }
  }
  //helper functions for logDailyWeight
  private async syncWeightToFirestore(date: string, weightNum: number) {
      if (!this.isFirebaseAvailable) {
        return null;
      }
      return weightNum;
  }
  
  //helper functions for logDailyWeight
    private async syncWeightLogToFirestore(date: string, weightNum: number) {
      if (this.isFirebaseAvailable) {
        try {
          const userProfileString = await AsyncStorage.getItem(StorageKeys.PROFILE);
          const userProfile: Profile = userProfileString ? JSON.parse(userProfileString) : null;
          
          if (userProfile && userProfile.firebaseUid) {
            const userRef = doc(db, 'users', userProfile.firebaseUid);
            const snap = await getDoc(userRef);
            
            if (snap.exists()) {
              const data = snap.data();
              const newEntry: WeightLogEntry = { 
                date, 
                weight: weightNum,
                timestamp: serverTimestamp()
              };
              
              // Ensure firestoreWeightLog is an array
              const firestoreWeightLog = Array.isArray(data.firestoreWeightLog)
                ? [...data.firestoreWeightLog]
                : [];

              // Update or add entry
              const existingEntryIndex = firestoreWeightLog.findIndex((entry: WeightLogEntry) => entry.date === date);
              if (existingEntryIndex >= 0) {
                firestoreWeightLog[existingEntryIndex] = newEntry;
              } else {
                firestoreWeightLog.push(newEntry);
              }

              // If array is too large, trim it
              if (firestoreWeightLog.length > 50) {
                firestoreWeightLog.splice(0, firestoreWeightLog.length - 50);
              }

              await updateDoc(userRef, {
                firestoreWeightLog,
                lastUpdated: serverTimestamp()
              });
            }
          }
        } catch (firebaseError) {
            if (firebaseError instanceof Error) {
              console.warn('Failed to sync weight log to Firestore:', firebaseError.message);
            } else {
              console.warn('Failed to sync weight log to Firestore:', firebaseError);
            }
          
          // Continue with local storage only
        }
      }
    
    }

  // =====================================
  // WORKOUT LISTS & EXERCISES
  // =====================================
  async getAllWorkoutLists(): Promise<WorkoutList[]> {
    try {
      const listString = await AsyncStorage.getItem(StorageKeys.WORKOUT_PLANS);
      return listString ? JSON.parse(listString) : [];
    } catch (error) {
       if (error instanceof Error) {
             console.error('Error getting workout lists:', error.message);
           } else {
             console.error('Error getting workout lists:', error);
           }
      
      return [];
    }
  }

  async createWorkoutList(listName: string): Promise<WorkoutList> {
    try {
      await this.checkOnlineStatus();
      const lists = await this.getAllWorkoutLists();
      const id = Date.now().toString();
      
      const newList: WorkoutList = {
        id,
        name: listName,
        exercises: [],
        userId: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      lists.push(newList);
      await AsyncStorage.setItem(StorageKeys.WORKOUT_PLANS, JSON.stringify(lists));
      return newList;
    } catch (error) {
       if (error instanceof Error) {
             console.error('Error creating workout list:', error.message);
           } else {
             console.error('Error creating workout list:', error);
           }
      throw error;
    }
  }

  async addExerciseToList(listId: string, exerciseId: string): Promise<WorkoutList | null> {
    try {
      await this.checkOnlineStatus();
      const lists = await this.getAllWorkoutLists();
      const listIndex = lists.findIndex(list => list.id === listId);
      
      if (listIndex === -1) {
        return null;
      }
      
      // If the exercise is not already in the list, add it
      if (!lists[listIndex].exercises.includes(exerciseId)) {
        lists[listIndex].exercises.push(exerciseId);
        lists[listIndex].updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(StorageKeys.WORKOUT_PLANS, JSON.stringify(lists));
      }
      
      return lists[listIndex];
    } catch (error) {
       if (error instanceof Error) {
             console.error('Error adding exercise to list:', error.message);
           } else {
             console.error('Error adding exercise to list:', error);
           }
      throw error;
    }
  }

  async removeExerciseFromList(listId: string, exerciseId: string): Promise<WorkoutList | null> {
    try {
       await this.checkOnlineStatus();
      const lists = await this.getAllWorkoutLists();
      const listIndex = lists.findIndex(list => list.id === listId);
      
      if (listIndex === -1) {
        return null;
      }
      
      // Remove the exercise from the list
      lists[listIndex].exercises = lists[listIndex].exercises.filter(id => id !== exerciseId);
      lists[listIndex].updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(StorageKeys.WORKOUT_PLANS, JSON.stringify(lists));
      
      return lists[listIndex];
    } catch (error) {
       if (error instanceof Error) {
             console.error('Error removing exercise from list:', error.message);
           } else {
             console.error('Error removing exercise from list:', error);
           }
      throw error;
    }
  }

  // Mock implementation for workout history
  async getRecentWorkouts(): Promise<any[]> {
    try {
      const historyString = await AsyncStorage.getItem(StorageKeys.WORKOUT_HISTORY);
      const history = historyString ? JSON.parse(historyString) : [];
      return history;
    } catch (error) {
      if (error instanceof Error) {
             console.error('Error getting workout history:', error.message);
           } else {
             console.error('Error getting workout history:', error);
           }
      return [];
    }
  }

  async getWorkoutById(workoutId: string): Promise<any> {
    try {
      // Try to get from local storage first
      const workoutPlansString = await AsyncStorage.getItem(StorageKeys.WORKOUT_PLANS);
      const workoutPlans = workoutPlansString ? JSON.parse(workoutPlansString) : [];
      
      const workout = workoutPlans.find((plan: any) => plan.id === workoutId);
      
      if (workout) {
        return workout;
      }
      
      // If not found locally and Firebase is available, try to get from Firestore
      if (this.isFirebaseAvailable) {
        try {
          const workoutRef = doc(db, 'workouts', workoutId);
          const workoutDoc = await getDoc(workoutRef);
          
          if (workoutDoc.exists()) {
            return { id: workoutDoc.id, ...workoutDoc.data() };
          }
        } catch (firebaseError) {
            if (firebaseError instanceof Error) {
              console.error('Failed to get workout from Firestore:', firebaseError.message);
            } else {
              console.error('Failed to get workout from Firestore:', firebaseError);
            }
        }
      }
      
     console.error('Workout not found');
     return {}
    } catch (error : any) {
      
      if(error instanceof Error) console.error('Error getting workout by ID:', error.message);
      console.error('Error getting workout by ID:', error);
      throw error;
    }
  }

  async getWorkoutHistory(workoutId: string): Promise<any[]> {
    try {
      // Try to get from local storage first
      const historyString = await AsyncStorage.getItem(StorageKeys.WORKOUT_HISTORY);
      const history = historyString ? JSON.parse(historyString) : [];
      
      // Filter history for the specific workout
      const workoutHistory = history.filter((session: any) => session.workoutId === workoutId);
      
      // If Firebase is available, try to get additional history from Firestore
      if (this.isFirebaseAvailable) {
         try {
          const userProfileString = await AsyncStorage.getItem('profile');
          const userProfile: Profile = userProfileString ? JSON.parse(userProfileString) : null;
          
          if (userProfile && userProfile.firebaseUid) {
            const historyRef = collection(db, 'users', userProfile.firebaseUid, 'workoutSessions');
            const q = query(historyRef, where('workoutId', '==', workoutId));
            const querySnapshot = await getDocs(q);
            
            const firestoreHistory: any[] = [];
            querySnapshot.forEach((doc) => {
              firestoreHistory.push({ id: doc.id, ...doc.data() });
            });
            
            // Combine local and Firestore history, avoiding duplicates
            const combined = [...workoutHistory];
            firestoreHistory.forEach((session) => {
              if (!combined.some((s) => s.id === session.id)) {
                combined.push(session);
              }
            });
            
            return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          }
        } catch (firebaseError) {
             if (firebaseError instanceof Error) {
              console.error('Failed to get workout history from Firestore:', firebaseError.message);
            } else {
              console.error('Failed to get workout history from Firestore:', firebaseError);
            }
        }
      }
      
      return workoutHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error: any) {
     if(error instanceof Error) console.error('Error getting workout history:', error.message);
      console.error('Error getting workout history:', error);
      return [];
    }
  }

  async deleteWorkout(workoutId: string): Promise<boolean> {
    try {
      await this.checkOnlineStatus();
      // Get current workout plans
      const workoutPlansString = await AsyncStorage.getItem(StorageKeys.WORKOUT_PLANS);
      let workoutPlans = workoutPlansString ? JSON.parse(workoutPlansString) : [];
      
      // Filter out the workout to delete
      workoutPlans = workoutPlans.filter((plan: any) => plan.id !== workoutId);
      
      // Save updated workout plans
      await AsyncStorage.setItem('workout_plans', JSON.stringify(workoutPlans));

      // If Firebase is available, delete from Firestore as well
      if (this.isFirebaseAvailable) {
        try {
          const userProfileString = await AsyncStorage.getItem('profile');
          const userProfile: Profile = userProfileString ? JSON.parse(userProfileString) : null;
          
          if (userProfile && userProfile.firebaseUid) {
            // Delete the workout document
            const workoutRef = doc(db, 'users', userProfile.firebaseUid, 'workouts', workoutId);
            await updateDoc(workoutRef, { deleted: true });
          }
        } catch (firebaseError) {
            if (firebaseError instanceof Error) {
              console.error('Failed to delete workout from Firestore:', firebaseError.message);
            } else {
              console.error('Failed to delete workout from Firestore:', firebaseError);
            }
          // Continue with local deletion
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  }

  async updateWorkoutSettings(workoutId: string, settings: any): Promise<boolean> {
    try {
      await this.checkOnlineStatus();
      // Get current workout plans
      const workoutPlansString = await AsyncStorage.getItem(StorageKeys.WORKOUT_PLANS);
      let workoutPlans = workoutPlansString ? JSON.parse(workoutPlansString) : [];
      
      // Find the workout to update
      const workoutIndex = workoutPlans.findIndex((plan: any) => plan.id === workoutId);
      
      if (workoutIndex !== -1) {
        // Update settings
        workoutPlans[workoutIndex].settings = {
          ...workoutPlans[workoutIndex].settings,
          ...settings
        };
        
        // Update timestamp
        workoutPlans[workoutIndex].updatedAt = new Date().toISOString();
        
        // Save updated workout plans
        await AsyncStorage.setItem(StorageKeys.WORKOUT_PLANS, JSON.stringify(workoutPlans));
        
        // If Firebase is available, update in Firestore as well
        if (this.isFirebaseAvailable) {
          try {
            const userProfileString = await AsyncStorage.getItem('profile');
            const userProfile: Profile = userProfileString ? JSON.parse(userProfileString) : null;
            
            if (userProfile && userProfile.firebaseUid) {
              // Update the workout document
              const workoutRef = doc(db, 'users', userProfile.firebaseUid, 'workouts', workoutId);
              await updateDoc(workoutRef, { 
                settings: {
                  ...settings
                },
                updatedAt: new Date().toISOString()
              });
            }
          } catch (firebaseError) {
             if (firebaseError instanceof Error) {
              console.error('Failed to update workout settings in Firestore:', firebaseError.message);
            } else {
              console.error('Failed to update workout settings in Firestore:', firebaseError);
            }
            // Continue with local update
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating workout settings:', error);
      return false;
    }
  }

  async createPublicTestCollection(): Promise<void> {
    // Implementation omitted for brevity
  }
}

export default new DatabaseService();