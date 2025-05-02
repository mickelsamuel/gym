import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firebaseAuth, db } from '../services/firebase';
import { 
  onAuthStateChanged,
  User,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import DatabaseService from '../services/DatabaseService';
import { NetworkState, useNetworkState } from '../services/NetworkState';
import { StorageKeys, FIREBASE_COLLECTIONS } from '../constants';
import { isValidEmail, isValidPassword, isValidUsername } from '../utils/sanitize';

// Define the Auth context interface
export const AuthContext = createContext();

// Custom hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Network state
  const { isConnected, isInternetReachable } = useNetworkState();
  const isOnline = isConnected && isInternetReachable;
  
  // Storage initialization state
  const [storageInitialized, setStorageInitialized] = useState(false);
  
  // Auth state listener reference
  const authListenerUnsubscribe = useRef(null);

  // Initialize and check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize storage
        await initializeStorage();
        
        // Setup auth state listener
        authListenerUnsubscribe.current = onAuthStateChanged(auth, async (user) => {
          setCurrentUser(user);
          setIsLoggedIn(!!user);
          
          if (user) {
            // Fetch user profile when authenticated
            const profileResponse = await DatabaseService.getProfile(user.uid, isOnline);
            if (profileResponse.success && profileResponse.data) {
              setUserProfile(profileResponse.data);
            } else {
              // Create minimal profile if not found
              const minimalProfile = {
                uid: user.uid,
                email: user.email,
                username: user.displayName || user.email.split('@')[0],
                joinDate: new Date().toISOString()
              };
              setUserProfile(minimalProfile);
              
              // Save minimal profile to database
              await DatabaseService.saveProfile(minimalProfile, isOnline);
            }
          } else {
            setUserProfile(null);
          }
          
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    // Cleanup auth listener on unmount
    return () => {
      if (authListenerUnsubscribe.current) {
        authListenerUnsubscribe.current();
      }
    };
  }, [isOnline]);
  
  // Initialize and migrate AsyncStorage on mount
  const initializeStorage = async () => {
    try {
      // Check for app version/storage version
      const storageVersion = await AsyncStorage.getItem('storage_version');
      
      if (storageVersion !== '1.0') {
        // For first installs or upgrades, clean up old data format
        console.log('Initializing storage or upgrading from version:', storageVersion || 'none');
        await migrateStorage();
        
        // Set new storage version
        await AsyncStorage.setItem('storage_version', '1.0');
      }
      
      setStorageInitialized(true);
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  };

  // Migrate AsyncStorage from old format to new format
  const migrateStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      
      // List of keys to inspect
      const keysToCheck = keys.filter(key => 
        !key.startsWith('storage_version') && 
        !key.startsWith('RN_')
      );
      
      for (const key of keysToCheck) {
        try {
          // Read the stored value
          const value = await AsyncStorage.getItem(key);
          
          // Check if it's a JSON object
          try {
            const parsed = JSON.parse(value);
            
            // Handle specific migrations for known key formats
            if (key === 'profile') {
              // For profile data, ensure it has the new format with lastUpdated
              if (!parsed.lastUpdated) {
                console.log('Migrating profile data to new format');
                
                // Convert to new minimal format
                const newProfile = {
                  uid: parsed.firebaseUid || parsed.uid,
                  email: parsed.email || '',
                  username: parsed.username || '',
                  lastUpdated: new Date().toISOString()
                };
                
                await AsyncStorage.setItem(StorageKeys.PROFILE, JSON.stringify(newProfile));
              }
            } else if (key.startsWith('workout_')) {
              // Workouts are now stored in WORKOUT_HISTORY
              const workouts = await AsyncStorage.getItem(StorageKeys.WORKOUT_HISTORY);
              const parsedWorkouts = workouts ? JSON.parse(workouts) : [];
              
              if (parsed.id && !parsedWorkouts.find(w => w.id === parsed.id)) {
                parsedWorkouts.push(parsed);
                await AsyncStorage.setItem(StorageKeys.WORKOUT_HISTORY, JSON.stringify(parsedWorkouts));
              }
              
              // Remove old workout item
              await AsyncStorage.removeItem(key);
            } else if (key.startsWith('weight_')) {
              // Weight logs are now stored in DAILY_WEIGHT_LOG
              const weightLogs = await AsyncStorage.getItem(StorageKeys.DAILY_WEIGHT_LOG);
              const parsedLogs = weightLogs ? JSON.parse(weightLogs) : [];
              
              if (parsed.date && !parsedLogs.find(log => log.date === parsed.date && log.userId === parsed.userId)) {
                parsedLogs.push(parsed);
                await AsyncStorage.setItem(StorageKeys.DAILY_WEIGHT_LOG, JSON.stringify(parsedLogs));
              }
              
              // Remove old weight log item
              await AsyncStorage.removeItem(key);
            }
          } catch (parseError) {
            // Not a JSON object, skip
          }
        } catch (itemError) {
          console.warn(`Error processing storage key ${key}:`, itemError);
        }
      }
      
      console.log('Storage migration completed');
    } catch (error) {
      console.error('Storage migration error:', error);
    }
  };
  
  // Clear user data from AsyncStorage
  const clearUserDataFromStorage = async () => {
    try {
      await AsyncStorage.removeItem(StorageKeys.PROFILE);
      await AsyncStorage.setItem(StorageKeys.DAILY_WEIGHT_LOG, JSON.stringify([]));
      await AsyncStorage.setItem(StorageKeys.WORKOUT_HISTORY, JSON.stringify([]));
      await AsyncStorage.setItem(StorageKeys.WORKOUT_PLANS, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing user data from storage:', error);
    }
  };
  
  // Register a new user
  const register = async ({ email, password, username, age, weight, height }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate inputs
      if (!email || !password || !username) {
        throw new Error('Email, password, and username are required');
      }
      
      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number');
      }
      
      if (!isValidUsername(username)) {
        throw new Error('Username must be 3-20 characters and can only contain letters, numbers, and underscores');
      }
      
      // Check network connection
      if (!isOnline) {
        throw new Error('Cannot register while offline');
      }
      
      // Register user with Firebase Auth
      const user = await firebaseAuth.register(email, password);
      
      // Create user profile
      const userProfile = {
        uid: user.uid,
        email: email,
        username: username,
        age: age ? parseInt(age) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        joinDate: new Date().toISOString()
      };
      
      // Save profile to Firestore and local storage
      await DatabaseService.saveProfile(userProfile, isOnline);
      
      // Send verification email
      await sendEmailVerification(user);
      
      setCurrentUser(user);
      setUserProfile(userProfile);
      setIsLoggedIn(true);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login with email and password
  const login = async (email, password, rememberMe = true) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Check network connection
      if (!isOnline) {
        throw new Error('Cannot login while offline');
      }
      
      // Sign in with Firebase Auth
      const user = await firebaseAuth.login(email, password);
      
      // Save login state for remember me
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('userEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberMe');
        await AsyncStorage.removeItem('userEmail');
      }
      
      // Update user's last login timestamp
      if (user && isOnline) {
        try {
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, user.uid);
          await updateDoc(userDocRef, {
            lastLogin: serverTimestamp(),
            lastActive: serverTimestamp()
          });
        } catch (firestoreError) {
          console.warn('Failed to update last login time:', firestoreError);
        }
      }
      
      // Fetch user profile
      if (user) {
        const profileResponse = await DatabaseService.getProfile(user.uid, isOnline);
        if (profileResponse.success && profileResponse.data) {
          setUserProfile(profileResponse.data);
        }
      }
      
      setCurrentUser(user);
      setIsLoggedIn(true);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many unsuccessful login attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout the current user
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Sign out from Firebase Auth
      await firebaseAuth.logout();
      
      // Clear user data from state
      setCurrentUser(null);
      setUserProfile(null);
      setIsLoggedIn(false);
      
      // Clear sensitive data from storage
      await clearUserDataFromStorage();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password for an email
  const resetPassword = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate input
      if (!email || !isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Check network connection
      if (!isOnline) {
        throw new Error('Cannot reset password while offline');
      }
      
      // Send password reset email
      await firebaseAuth.resetPassword(email);
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate user is logged in
      if (!currentUser) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Update profile with database service
      const updatedProfile = {
        ...profileData,
        uid: currentUser.uid
      };
      
      const response = await DatabaseService.saveProfile(updatedProfile, isOnline);
      
      if (response.success) {
        setUserProfile(response.data);
        return { success: true, profile: response.data };
      } else {
        throw new Error(response.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Change current user's password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate user is logged in
      if (!currentUser) {
        throw new Error('You must be logged in to change your password');
      }
      
      // Validate new password
      if (!isValidPassword(newPassword)) {
        throw new Error('New password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number');
      }
      
      // Check network connection
      if (!isOnline) {
        throw new Error('Cannot change password while offline');
      }
      
      // Reauthenticate user first
      await firebaseAuth.reauthenticate(currentUser, currentPassword);
      
      // Update password
      await firebaseAuth.updatePassword(currentUser, newPassword);
      
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'This operation is sensitive and requires recent authentication. Please log in again before retrying.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Change current user's email
  const changeEmail = async (password, newEmail) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate user is logged in
      if (!currentUser) {
        throw new Error('You must be logged in to change your email');
      }
      
      // Validate new email
      if (!isValidEmail(newEmail)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Check network connection
      if (!isOnline) {
        throw new Error('Cannot change email while offline');
      }
      
      // Reauthenticate user first
      await firebaseAuth.reauthenticate(currentUser, password);
      
      // Update email
      await firebaseAuth.updateEmail(currentUser, newEmail);
      
      // Update profile
      const updatedProfile = {
        ...userProfile,
        email: newEmail
      };
      
      await DatabaseService.saveProfile(updatedProfile, isOnline);
      setUserProfile(updatedProfile);
      
      return { success: true };
    } catch (error) {
      console.error('Email change error:', error);
      
      let errorMessage = 'Failed to change email. Please try again.';
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password is incorrect.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'This operation is sensitive and requires recent authentication. Please log in again before retrying.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate user is logged in
      if (!currentUser) {
        throw new Error('You must be logged in to verify your email');
      }
      
      // Check network connection
      if (!isOnline) {
        throw new Error('Cannot send verification email while offline');
      }
      
      // Send verification email
      await sendEmailVerification(currentUser);
      
      return { success: true };
    } catch (error) {
      console.error('Verification email error:', error);
      
      let errorMessage = 'Failed to send verification email. Please try again later.';
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Try to log in automatically if user has selected "remember me"
  const tryAutoLogin = async () => {
    try {
      const rememberMe = await AsyncStorage.getItem('rememberMe');
      const email = await AsyncStorage.getItem('userEmail');
      
      if (rememberMe === 'true' && email && isOnline) {
        // Auto login is handled by Firebase's persistence
        console.log('Auto login enabled, waiting for Firebase auth state');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Auto login error:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Context value
  const value = {
    currentUser,
    userProfile,
    isLoggedIn,
    isLoading,
    error,
    isOnline,
    storageInitialized,
    register,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    changePassword,
    changeEmail,
    resendVerificationEmail,
    tryAutoLogin,
    clearError: () => setError(null)
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};