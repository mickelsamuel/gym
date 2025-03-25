// services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD-bUvqn82cA3fe4_m5SXXxf7UB4QGfi4g",
    authDomain: "gymtrackpro-e3487.firebaseapp.com",
    projectId: "gymtrackpro-e3487",
    storageBucket: "gymtrackpro-e3487.firebasestorage.app",
    messagingSenderId: "909632717384",
    appId: "1:909632717384:web:e4c73595be52c5dd4bce7d",
    measurementId: "G-N7JKX2X3S4"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);