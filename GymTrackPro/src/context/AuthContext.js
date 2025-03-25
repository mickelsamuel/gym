import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // The logged-in Firebase user
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Store user UID for "Remember Me"
        await AsyncStorage.setItem('loggedInUser', firebaseUser.uid);
      } else {
        setUser(null);
        await AsyncStorage.removeItem('loggedInUser');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sign up a new user with email & password
  const register = async ({ email, password, username, age }) => {
    // 1) Create the user in Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = result.user;

    // 2) Create a document in Firestore "users" collection
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      username,
      age,
      friends: [],
      friendRequests: [],
      profilePic: '',
      firestoreSets: [],
      firestoreWeightLog: []
    });

    // 3) Store the Firebase UID and profile info in AsyncStorage
    await AsyncStorage.setItem(
      'profile',
      JSON.stringify({
        firebaseUid: uid,
        email,
        username,
        age
      })
    );

    return result.user;
  };

  // Sign in existing user
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Log out user
  const logout = async () => {
    await signOut(auth);
  };

  // Reset password
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Try to auto-login from AsyncStorage (naively)
  const tryAutoLogin = async () => {
    const storedUid = await AsyncStorage.getItem('loggedInUser');
    if (storedUid) {
      // onAuthStateChanged handles user state automatically.
    }
  };

  useEffect(() => {
    tryAutoLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};