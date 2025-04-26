import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert, Platform } from 'react-native';
import { auth, db } from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // The logged-in Firebase user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Get the user's profile data from Firestore
          await fetchUserProfile(firebaseUser.uid);
          
          // Store user UID for "Remember Me"
          await AsyncStorage.setItem('loggedInUser', firebaseUser.uid);
        } else {
          setUser(null);
          setUserProfile(null);
          await AsyncStorage.removeItem('loggedInUser');
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Fetch user profile data from Firestore
  const fetchUserProfile = async (userId) => {
    try {
      // First, try to get cached profile from AsyncStorage
      const cachedProfile = await AsyncStorage.getItem('profile');
      let profileData = cachedProfile ? JSON.parse(cachedProfile) : null;
      
      // Set basic user profile from cache while we attempt to fetch fresh data
      if (profileData) {
        setUserProfile({
          uid: userId,
          email: profileData.email,
          username: profileData.username,
          age: profileData.age || null,
          profilePic: profileData.profilePic || null,
          // Add default values for other fields
          friends: [],
          friendRequests: [],
          firestoreSets: [],
          firestoreWeightLog: [],
          settings: {
            unitSystem: 'metric',
            notifications: true,
            darkMode: false,
            privacyLevel: 'friends-only',
          }
        });
      }

      // Try to get fresh data from Firestore
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserProfile(userData);
        
        // Store basic profile info in AsyncStorage for offline access
        await AsyncStorage.setItem(
          'profile',
          JSON.stringify({
            firebaseUid: userId,
            email: userData.email,
            username: userData.username,
            age: userData.age,
            profilePic: userData.profilePic || null
          })
        );
      } else if (!profileData) {
        // If no Firestore data and no cached data, create a new user document
        const newUserData = {
          uid: userId,
          email: user?.email || '',
          username: '',
          age: null,
          height: null,
          weight: null,
          joinedDate: new Date().toISOString(),
          friends: [],
          friendRequests: [],
          profilePic: '',
          firestoreSets: [],
          firestoreWeightLog: [],
          settings: {
            unitSystem: 'metric',
            notifications: true,
            darkMode: false,
            privacyLevel: 'friends-only',
          }
        };
        
        try {
          await setDoc(doc(db, 'users', userId), newUserData);
          setUserProfile(newUserData);
        } catch (docError) {
          console.error('Error creating user document:', docError);
          // Still set the profile in state even if we can't save to Firestore
          setUserProfile(newUserData);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      
      // Handle offline mode - try to load from AsyncStorage as fallback
      try {
        const offlineProfile = await AsyncStorage.getItem('profile');
        if (offlineProfile) {
          const parsedProfile = JSON.parse(offlineProfile);
          // Create a minimal profile with the cached data
          setUserProfile({
            uid: userId,
            email: parsedProfile.email || '',
            username: parsedProfile.username || '',
            age: parsedProfile.age || null,
            profilePic: parsedProfile.profilePic || null,
            // Add default values for other fields
            friends: [],
            friendRequests: [],
            firestoreSets: [],
            firestoreWeightLog: [],
            settings: {
              unitSystem: 'metric',
              notifications: true,
              darkMode: false,
              privacyLevel: 'friends-only',
            }
          });
        }
      } catch (storageErr) {
        console.error('Error loading offline profile:', storageErr);
      }
    }
  };

  // Sign up a new user with email & password
  const register = async ({ email, password, username, age, weight, height }) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1) Create the user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = result.user;

      // 2) Create a document in Firestore "users" collection
      const userData = {
        uid,
        email,
        username,
        age: age || null,
        height: height || null,
        weight: weight || null,
        joinedDate: new Date().toISOString(),
        friends: [],
        friendRequests: [],
        profilePic: '',
        firestoreSets: [],
        firestoreWeightLog: [],
        settings: {
          unitSystem: 'metric', // 'metric' or 'imperial'
          notifications: true,
          darkMode: false,
          privacyLevel: 'friends-only', // 'public', 'friends-only', 'private'
        }
      };
      
      await setDoc(doc(db, 'users', uid), userData);

      // 3) Store the Firebase UID and profile info in AsyncStorage
      await AsyncStorage.setItem(
        'profile',
        JSON.stringify({
          firebaseUid: uid,
          email,
          username,
          age,
          weight,
          height
        })
      );
      
      setUserProfile(userData);
      return result.user;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in existing user
  const login = async (email, password, rememberMe = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (rememberMe) {
        await AsyncStorage.setItem('loggedInUser', result.user.uid);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('rememberMe');
      }
      
      return result.user;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      }
      
      Alert.alert('Authentication Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Log out user
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      await AsyncStorage.multiRemove([
        'loggedInUser', 
        'rememberMe',
        // Don't remove 'profile' to maintain offline capabilities
      ]);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password.'
      );
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message);
      
      let errorMessage = 'Failed to send password reset email.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Password Reset Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update user profile in Firestore
  const updateUserProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('You must be logged in to update your profile');
      
      const userRef = doc(db, 'users', user.uid);
      
      // Update Firestore document
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      
      // Update local user profile
      const updatedProfile = { ...userProfile, ...profileData };
      setUserProfile(updatedProfile);
      
      // Update AsyncStorage
      const storedProfile = JSON.parse(await AsyncStorage.getItem('profile')) || {};
      const updatedStoredProfile = { ...storedProfile, ...profileData };
      await AsyncStorage.setItem('profile', JSON.stringify(updatedStoredProfile));
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update password
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('You must be logged in to change your password');
      
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      Alert.alert('Success', 'Password updated successfully');
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message);
      
      let errorMessage = 'Failed to update password.';
      
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please use a stronger password.';
      }
      
      Alert.alert('Password Update Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update email
  const changeEmail = async (password, newEmail) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('You must be logged in to change your email');
      
      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update email in Auth
      await updateEmail(user, newEmail);
      
      // Update email in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        email: newEmail,
        updatedAt: new Date().toISOString()
      });
      
      // Update local storage
      const storedProfile = JSON.parse(await AsyncStorage.getItem('profile')) || {};
      storedProfile.email = newEmail;
      await AsyncStorage.setItem('profile', JSON.stringify(storedProfile));
      
      // Update context
      setUserProfile(prev => ({ ...prev, email: newEmail }));
      
      Alert.alert('Success', 'Email updated successfully');
    } catch (err) {
      console.error('Email change error:', err);
      setError(err.message);
      
      let errorMessage = 'Failed to update email.';
      
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Password is incorrect.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Email Update Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Try to auto-login from AsyncStorage
  const tryAutoLogin = async () => {
    try {
      const storedUid = await AsyncStorage.getItem('loggedInUser');
      const rememberMe = await AsyncStorage.getItem('rememberMe');
      
      if (storedUid && rememberMe === 'true') {
        // onAuthStateChanged handles user state automatically
        // This is just for awareness that auto-login is supported
        return true;
      }
      return false;
    } catch (err) {
      console.error('Auto-login error:', err);
      return false;
    }
  };

  useEffect(() => {
    tryAutoLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        register,
        login,
        logout,
        resetPassword,
        updateUserProfile,
        changePassword,
        changeEmail,
        tryAutoLogin,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};