import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// Note: In a production app, these should be in environment variables
const firebaseConfig = {
  apiKey: "AIzaSyD-bUvqn82cA3fe4_m5SXXxf7UB4QGfi4g",
  authDomain: "gymtrackpro-e3487.firebaseapp.com",
  projectId: "gymtrackpro-e3487",
  storageBucket: "gymtrackpro-e3487.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "909632717384",
  appId: "1:909632717384:web:e4c73595be52c5dd4bce7d",
  measurementId: "G-N7JKX2X3S4"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };

/* 
Firebase Firestore Rules (to be added in Firebase Console):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/