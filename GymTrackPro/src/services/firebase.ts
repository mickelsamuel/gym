import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  Auth,
  browserLocalPersistence,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  Firestore,
  CollectionReference,
  DocumentReference,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  runTransaction,
  WhereFilterOp,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  FirestoreDataConverter
} from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { Platform } from 'react-native';
import { logError } from '../utils/logging';
import { AUTH_ERROR_CODES, FIRESTORE_ERROR_CODES, getErrorMessage as getErrorMessageFromCodes } from '../constants/errorCodes';
import { firestoreSecurityRules, getFirestoreSecurityRules } from './firebaseSecurityRules';

// Firebase configuration 
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAE-3y2TAD6B_USXcp2iMYUtkbg-EeRJrI",
  authDomain: "gymtrackpro-73899.firebaseapp.com",
  projectId: "gymtrackpro-73899",
  storageBucket: "gymtrackpro-73899.firebasestorage.app",
  messagingSenderId: "204448386581",
  appId: "1:204448386581:web:8699f7aea75849659ac81c",
  measurementId: "G-12C659TBKL"
};

// Define all Firebase paths to prevent typos and ensure consistency
export const FIREBASE_PATHS = {
  // Collections
  USERS: 'users',
  WEIGHT_LOG: 'weightLog',
  WORKOUT_HISTORY: 'workoutHistory',
  WORKOUT_PLANS: 'workoutPlans',
  EXERCISES: 'exercises',
  FRIENDS: 'friends',
  FRIEND_REQUESTS: 'friendRequests',
  USER_STATS: 'userStats',
  USER_ACHIEVEMENTS: 'userAchievements',
  NOTIFICATIONS: 'notifications',
  MUSCLE_GROUPS: 'muscleGroups',
  WORKOUT_CATEGORIES: 'workoutCategories',
  GOALS: 'goals',
  TEST: 'test',
  CONNECTION: 'connection',
  
  // Subcollections
  USER_SUBCOLLECTIONS: {
    WEIGHT_LOG: 'weightLog',
    WORKOUT_HISTORY: 'workoutHistory',
    PLANS: 'plans',
    FRIENDS: 'friends',
    ACHIEVEMENTS: 'achievements',
    NOTIFICATIONS: 'notifications'
  },
  
  // Document fields
  FIELDS: {
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    USER_ID: 'userId',
    UID: 'uid',
    EMAIL: 'email',
    USERNAME: 'username',
    DELETED: 'deleted',
    DELETED_AT: 'deletedAt'
  }
};

// Firebase initialization interface
export interface FirebaseInitConfig {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  analytics: Analytics | null;
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

// Create interfaces for Firebase operations
export interface FirebaseAuthInterface {
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (user: User, newPassword: string) => Promise<void>;
  updateEmail: (user: User, newEmail: string) => Promise<void>;
  reauthenticate: (user: User, password: string) => Promise<any>;
  getCurrentUser: () => User | null;
  isTokenValid: (user: User) => Promise<boolean>;
  checkTokenExpiration: (user: User) => Promise<boolean>;
  isUserLoggedIn: () => boolean;
  sendVerificationEmail: (user: User) => Promise<void>;
}

export interface FirebaseFirestoreInterface {
  getDocument: <T>(path: string, id: string) => Promise<T | null>;
  setDocument: <T>(path: string, id: string, data: T, merge?: boolean) => Promise<void>;
  updateDocument: <T>(path: string, id: string, data: Partial<T>) => Promise<void>;
  deleteDocument: (path: string, id: string) => Promise<void>;
  addDocument: <T>(path: string, data: T) => Promise<string>;
  getCollection: <T>(path: string, conditions?: {field: string, operator: WhereFilterOp, value: any}[]) => Promise<T[]>;
  getSubcollection: <T>(parentPath: string, parentId: string, subPath: string) => Promise<T[]>;
  runTransaction: <T>(updateFunction: (transaction: any) => Promise<T>) => Promise<T>;
  batchWrite: <T>(operations: Array<{type: 'set' | 'update' | 'delete', path: string, id: string, data?: any}>) => Promise<void>;
  createConverter: <T>() => FirestoreDataConverter<T>;
}

// Function to initialize Firebase
export const initializeFirebase = async (): Promise<FirebaseInitConfig> => {
  try {
    app = initializeApp(firebaseConfig);
    
    // Initialize auth with appropriate persistence
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
    
    db = getFirestore(app);
    
    console.log('Firebase core services initialized successfully');
    
    // Initialize analytics if possible
    try {
      // Check if Analytics is supported in current environment
      if (Platform.OS === 'web' && await isSupported()) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      } else {
        console.log('Firebase Analytics not supported in this environment');
      }
    } catch (error) {
      console.warn('Analytics initialization error:', error);
      logError('analytics_init_error', error);
    }
    
    return { app, auth, db, analytics };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    logError('firebase_init_error', error);
    throw error; // Re-throw to prevent using uninitialized services
  }
};

// Initialize Firebase on app startup
try {
  app = initializeApp(firebaseConfig);
  
  // Initialize auth with appropriate persistence
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
  
  db = getFirestore(app);
  
  console.log('Firebase core services initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  logError('firebase_init_error', error);
  throw error; // Re-throw to prevent using uninitialized services
}

// Only initialize analytics on web platforms
const initializeAnalytics = async (): Promise<void> => {
  try {
    // Check if Analytics is supported in current environment
    if (Platform.OS === 'web' && await isSupported()) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } else {
      console.log('Firebase Analytics not supported in this environment');
    }
  } catch (error) {
    console.warn('Analytics initialization error:', error);
    logError('analytics_init_error', error);
  }
};

// Call the initialization function
initializeAnalytics();

// Helper function to map Firebase error codes to user-friendly messages
export const getErrorMessage = (error: any): string => {
  const errorCode = error.code || '';
  return getErrorMessageFromCodes(errorCode) || error.message || 'An unknown error occurred';
};

// Generic type converter for Firestore documents
const createConverter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T) => {
    // Remove any undefined fields as Firestore doesn't handle them well
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        sanitizedData[key] = value;
      }
    }
    return sanitizedData;
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): T => {
    const data = snapshot.data(options);
    return { id: snapshot.id, ...data } as T;
  }
});

// Implement the Firebase Auth Interface
const firebaseAuth: FirebaseAuthInterface = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      logError('login_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  register: async (email: string, password: string): Promise<User> => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      logError('registration_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      logError('logout_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  resetPassword: async (email: string): Promise<void> => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      logError('password_reset_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  updatePassword: async (user: User, newPassword: string): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User is required');
      }
      
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      await updatePassword(user, newPassword);
    } catch (error: any) {
      console.error('Update password error:', error);
      logError('update_password_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  updateEmail: async (user: User, newEmail: string): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User is required');
      }
      
      if (!newEmail) {
        throw new Error('Email is required');
      }
      
      await updateEmail(user, newEmail);
    } catch (error: any) {
      console.error('Update email error:', error);
      logError('update_email_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  reauthenticate: async (user: User, password: string): Promise<any> => {
    try {
      if (!user || !user.email) {
        throw new Error('User with email is required');
      }
      
      if (!password) {
        throw new Error('Password is required');
      }
      
      const credential = EmailAuthProvider.credential(user.email, password);
      return await reauthenticateWithCredential(user, credential);
    } catch (error: any) {
      console.error('Reauthentication error:', error);
      logError('reauthentication_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },
  
  isTokenValid: async (user: User): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Get a fresh token to check validity
      const token = await user.getIdToken(true);
      return !!token;
    } catch (error) {
      console.error('Token validation error:', error);
      logError('token_validation_error', error);
      return false;
    }
  },
  
  checkTokenExpiration: async (user: User): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // This will force a refresh if the token is expired
      const token = await user.getIdToken(true);
      return !!token;
    } catch (error) {
      console.error('Token expiration check error:', error);
      logError('token_expiration_check_error', error);
      return false;
    }
  },
  
  isUserLoggedIn: (): boolean => {
    return !!auth.currentUser;
  },
  
  sendVerificationEmail: async (user: User): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, user.email || '');
    } catch (error) {
      console.error('Error sending verification email:', error);
      logError('verification_email_error', error);
      throw new Error(getErrorMessage(error));
    }
  }
};

// Implement the Firebase Firestore Interface
const firebaseFirestore: FirebaseFirestoreInterface = {
  getDocument: async <T>(path: string, id: string): Promise<T | null> => {
    try {
      if (!path || !id) {
        throw new Error('Path and ID are required');
      }
      
      const docRef = doc(db, path, id).withConverter(createConverter<T>());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return null;
    } catch (error: any) {
      console.error(`Error getting document ${path}/${id}:`, error);
      logError('get_document_error', { path, id, error });
      throw new Error(getErrorMessage(error));
    }
  },
  
  setDocument: async <T>(path: string, id: string, data: T, merge: boolean = true): Promise<void> => {
    try {
      if (!path || !id) {
        throw new Error('Path and ID are required');
      }
      
      if (!data) {
        throw new Error('Data is required');
      }
      
      // Add timestamps
      const docData = {
        ...data,
        updatedAt: serverTimestamp(),
      } as T & { updatedAt: any; createdAt?: any };
      
      // Only add createdAt if this is a new document or merge is false
      if (!merge) {
        docData.createdAt = serverTimestamp();
      }
      
      const docRef = doc(db, path, id).withConverter(createConverter<T & { updatedAt: any; createdAt?: any }>());
      await setDoc(docRef, docData, { merge });
    } catch (error: any) {
      console.error(`Error setting document ${path}/${id}:`, error);
      logError('set_document_error', { path, id, error });
      throw new Error(getErrorMessage(error));
    }
  },
  
  updateDocument: async <T>(path: string, id: string, data: Partial<T>): Promise<void> => {
    try {
      if (!path || !id) {
        throw new Error('Path and ID are required');
      }
      
      if (!data) {
        throw new Error('Data is required');
      }
      
      // Add updated timestamp
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      const docRef = doc(db, path, id);
      await updateDoc(docRef, updateData as Partial<DocumentData>);
    } catch (error: any) {
      console.error(`Error updating document ${path}/${id}:`, error);
      logError('update_document_error', { path, id, error });
      throw new Error(getErrorMessage(error));
    }
  },
  
  deleteDocument: async (path: string, id: string): Promise<void> => {
    try {
      if (!path || !id) {
        throw new Error('Path and ID are required');
      }
      
      const docRef = doc(db, path, id);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error(`Error deleting document ${path}/${id}:`, error);
      logError('delete_document_error', { path, id, error });
      throw new Error(getErrorMessage(error));
    }
  },
  
  addDocument: async <T>(path: string, data: T): Promise<string> => {
    try {
      if (!path) {
        throw new Error('Path is required');
      }
      
      if (!data) {
        throw new Error('Data is required');
      }
      
      // Add timestamps
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const collectionRef = collection(db, path).withConverter(createConverter<T & { createdAt: any; updatedAt: any }>());
      const docRef = await addDoc(collectionRef, docData as T & { createdAt: any; updatedAt: any });
      return docRef.id;
    } catch (error: any) {
      console.error(`Error adding document to ${path}:`, error);
      logError('add_document_error', { path, error });
      throw new Error(getErrorMessage(error));
    }
  },
  
  getCollection: async <T>(path: string, conditions?: {field: string, operator: WhereFilterOp, value: any}[]): Promise<T[]> => {
    try {
      if (!path) {
        throw new Error('Path is required');
      }
      
      const collectionRef = collection(db, path).withConverter(createConverter<T>());
      
      if (conditions && conditions.length > 0) {
        // Create a query with conditions
        const queryConstraints = conditions.map(c => where(c.field, c.operator, c.value));
        const q = query(collectionRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data());
      } else {
        // Just get all documents in the collection
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => doc.data());
      }
    } catch (error: any) {
      console.error(`Error getting collection ${path}:`, error);
      logError('get_collection_error', { path, error });
      throw new Error(getErrorMessage(error));
    }
  },
  
  getSubcollection: async <T>(parentPath: string, parentId: string, subPath: string): Promise<T[]> => {
    try {
      if (!parentPath || !parentId || !subPath) {
        throw new Error('Parent path, parent ID, and subcollection path are required');
      }
      
      const subCollectionRef = collection(db, parentPath, parentId, subPath).withConverter(createConverter<T>());
      const querySnapshot = await getDocs(subCollectionRef);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error: any) {
      console.error(`Error getting subcollection ${parentPath}/${parentId}/${subPath}:`, error);
      logError('get_subcollection_error', { parentPath, parentId, subPath, error });
      throw new Error(getErrorMessage(error));
    }
  },
  
  runTransaction: async <T>(updateFunction: (transaction: any) => Promise<T>): Promise<T> => {
    try {
      return await runTransaction(db, updateFunction);
    } catch (error: any) {
      console.error('Error running transaction:', error);
      logError('transaction_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  batchWrite: async <T>(operations: Array<{type: 'set' | 'update' | 'delete', path: string, id: string, data?: any}>): Promise<void> => {
    try {
      if (!operations || operations.length === 0) {
        throw new Error('Operations array is required and must not be empty');
      }
      
      const batch = writeBatch(db);
      
      for (const op of operations) {
        const { type, path, id, data } = op;
        const docRef = doc(db, path, id);
        
        switch (type) {
          case 'set':
            if (!data) throw new Error('Data is required for set operation');
            const setData = {
              ...data,
              updatedAt: serverTimestamp()
            };
            if (!('createdAt' in data)) {
              setData.createdAt = serverTimestamp();
            }
            batch.set(docRef, setData);
            break;
          case 'update':
            if (!data) throw new Error('Data is required for update operation');
            const updateData = {
              ...data,
              updatedAt: serverTimestamp()
            };
            batch.update(docRef, updateData);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
          default:
            throw new Error(`Unsupported operation type: ${type}`);
        }
      }
      
      await batch.commit();
    } catch (error: any) {
      console.error('Error performing batch write:', error);
      logError('batch_write_error', error);
      throw new Error(getErrorMessage(error));
    }
  },
  
  createConverter: <T>(): FirestoreDataConverter<T> => createConverter<T>()
};

// Helper function to check if Firestore connection is available
export const checkConnection = async (): Promise<boolean> => {
  try {
    // Attempt to access a small document to test connection
    const connectionRef = doc(db, FIREBASE_PATHS.TEST, FIREBASE_PATHS.CONNECTION);
    await setDoc(connectionRef, { timestamp: serverTimestamp() });
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

// Function to apply security rules to Firebase
export const applySecurityRules = (): string => {
  return getFirestoreSecurityRules();
};

// Export Firebase instances and interfaces
export { app, auth, db, analytics, firebaseAuth, firebaseFirestore };