import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  Auth,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAE-3y2TAD6B_USXcp2iMYUtkbg-EeRJrI",
  authDomain: "gymtrackpro-73899.firebaseapp.com",
  projectId: "gymtrackpro-73899",
  storageBucket: "gymtrackpro-73899.appspot.com",
  messagingSenderId: "204448386581",
  appId: "1:204448386581:web:8699f7aea75849659ac81c",
  measurementId: "G-12C659TBKL"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize auth with appropriate persistence
  // Using a simplified approach for TypeScript compatibility
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
  
  db = getFirestore(app);
  
  // Uncomment this for local development with Firestore emulator
  // if (__DEV__) {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  // }
  
  console.log('Firebase core services initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
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
  }
};

// Call the initialization function
initializeAnalytics();

export { auth, db, analytics };

/* 
Firebase Firestore Rules for Copy/Paste into Firebase Console:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users for testing
    // WARNING: **For testing only**. Replace with proper rules before deployment
    match /{document=**} {
      allow read, write: if true;
    }
    
    // SECURE RULES FOR PRODUCTION:
    // Uncomment these when ready to deploy to production
    
    // match /users/{userId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null && request.auth.uid == userId;
    // }
    
    // match /test/{document=**} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
*/ 