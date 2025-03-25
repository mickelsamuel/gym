// context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
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
        // Optionally store user in AsyncStorage for "Remember Me"
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
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = result.user;
    // Store user profile in Firestore:
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      username,
      age,
      friends: [],
      // ...any other default fields you want
    });
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

  // Try to auto-login from AsyncStorage (if “Remember Me” was set)
  // NOTE: This is a naive example. Usually you'd store a token or re-auth user.
  const tryAutoLogin = async () => {
    const storedUid = await AsyncStorage.getItem('loggedInUser');
    if (storedUid) {
      // If we want to check if user is valid, we could do so here:
      // But onAuthStateChanged should do the heavy lifting automatically.
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
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};