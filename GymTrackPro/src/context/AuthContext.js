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
  reauthenticateWithCredential,
  sendEmailVerification,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkState } from '../services/NetworkState';

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
  const [isOnline, setIsOnline] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  
  // Initialize network state monitoring
  useEffect(() => {
    const networkStateListener = NetworkState.addListener(state => {
      setIsOnline(state.isConnected);
    });
    
    NetworkState.init();
    
    return () => {
      networkStateListener.remove();
    };
  }, []);

  // Initialize and migrate AsyncStorage on mount
  useEffect(() => {
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
    
    initializeStorage();
  }, []);
  
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
                  firebaseUid: parsed.firebaseUid || parsed.uid,
                  email: parsed.email || '',
                  username: parsed.username || '',
                  lastUpdated: new Date().toISOString()
                };
                
                await AsyncStorage.setItem('profile', JSON.stringify(newProfile));
              }
            } else if (key.startsWith('workout_')) {
              // Workouts are now stored only on Firestore, remove local copies
              await AsyncStorage.removeItem(key);
            } else if (key.startsWith('weight_')) {
              // Weight logs are now stored only on Firestore, remove local copies
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
  
  // Clear all AsyncStorage data related to a user
  const clearUserDataFromStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userDataKeys = keys.filter(key => 
        key === 'profile' || 
        key === 'loggedInUser' || 
        key === 'rememberMe' || 
        key.startsWith('user_') || 
        key.startsWith('weight_') ||
        key.startsWith('workout_')
      );
      
      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        console.log('Cleared user data from AsyncStorage');
      }
    } catch (error) {
      console.error('Error clearing user data from storage:', error);
    }
  };
  
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          setEmailVerified(firebaseUser.emailVerified);
          
          // Ensure we're not using stale cached data by refreshing Firebase user
          try {
            await firebaseUser.reload();
            // Re-check email verification status after reload
            setEmailVerified(firebaseUser.emailVerified);
          } catch (reloadError) {
            console.warn('Error refreshing user data:', reloadError);
            // Continue with the existing user data
          }
          
          // Get the user's profile data from Firestore
          try {
            const userData = await fetchUserProfile(firebaseUser.uid);
            
            // Store user UID for "Remember Me"
            await AsyncStorage.setItem('loggedInUser', firebaseUser.uid);
            
            // Update Firestore with last login timestamp if we're online
            if (isOnline && userData && !userData.isOfflineData) {
              try {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                await updateDoc(userDocRef, {
                  lastLogin: serverTimestamp()
                });
              } catch (updateError) {
                console.warn('Error updating last login time:', updateError);
                // Continue without updating last login
              }
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Create minimal profile from auth data
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              displayName: firebaseUser.displayName,
              isOfflineData: true
            });
          }
          
          // If email is not verified, log a message
          if (!firebaseUser.emailVerified) {
            console.log('Email not verified. Please check your email and verify your account.');
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setEmailVerified(false);
          await AsyncStorage.removeItem('loggedInUser');
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
        setUser(null);
        setUserProfile(null);
        setEmailVerified(false);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [isOnline]);
  
  // Fetch user profile data from Firestore
  const fetchUserProfile = async (userId) => {
    try {
      // Only try to fetch from Firestore if we're online
      if (isOnline) {
        // Try to get fresh data from Firestore
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserProfile(userData);
          
          // Store minimal profile info in AsyncStorage for offline access only
          await AsyncStorage.setItem(
            'profile',
            JSON.stringify({
              firebaseUid: userId,
              email: userData.email || auth.currentUser?.email || '',
              username: userData.username || auth.currentUser?.displayName || '',
              lastUpdated: new Date().toISOString()
            })
          );
          
          return userData;
        } else {
          // If no Firestore data, create a new user document
          const newUserData = {
            uid: userId,
            email: auth.currentUser?.email || '',
            username: auth.currentUser?.displayName || '',
            age: null,
            height: null,
            weight: null,
            joinedDate: new Date().toISOString(),
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            friends: [],
            firestoreWeightLog: [],
            firestoreSets: [],
            fitnessGoal: null
          };
          
          // Create the document
          await setDoc(userDocRef, newUserData);
          
          setUserProfile(newUserData);
          
          // Store minimal profile info in AsyncStorage for offline access
          await AsyncStorage.setItem(
            'profile',
            JSON.stringify({
              firebaseUid: userId,
              email: newUserData.email,
              username: newUserData.username,
              lastUpdated: new Date().toISOString()
            })
          );
          
          return newUserData;
        }
      } else {
        // Offline mode - try to get cached profile
        const profileJSON = await AsyncStorage.getItem('profile');
        if (profileJSON) {
          try {
            const profile = JSON.parse(profileJSON);
            if (profile.firebaseUid === userId) {
              // Add a flag to indicate this is offline data
              const offlineProfile = {
                ...profile,
                isOfflineData: true
              };
              
              setUserProfile(offlineProfile);
              return offlineProfile;
            }
          } catch (parseError) {
            console.warn('Error parsing cached profile:', parseError);
          }
        }
        
        // Create a minimal offline profile
        const offlineProfile = {
          uid: userId,
          email: auth.currentUser?.email || '',
          username: auth.currentUser?.displayName || '',
          isOfflineData: true
        };
        
        setUserProfile(offlineProfile);
        return offlineProfile;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Create a minimal profile with auth data
      const fallbackProfile = {
        uid: userId,
        email: auth.currentUser?.email || '',
        username: auth.currentUser?.displayName || '',
        isOfflineData: true,
        error: error.message
      };
      
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  // Sign up a new user with email & password
  const register = async ({ email, password, username, age, weight, height }) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, clear any existing data for this account
      await clearUserDataFromStorage();
      
      // 1) Create the user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = result.user;
      
      // Send email verification
      try {
        await sendEmailVerification(result.user);
        console.log('Verification email sent');
      } catch (verifyError) {
        console.warn('Error sending verification email:', verifyError);
      }

      // 2) Ensure any existing document for this user is cleaned up
      try {
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        
        // If a document exists for this user (from a previous account), delete subcollections
        if (userDocSnap.exists()) {
          await deleteUserData(uid);
          console.log('Cleaned up existing user data for new account');
        }
      } catch (cleanupError) {
        console.warn('Error cleaning up existing user data:', cleanupError);
      }

      // 3) Create a fresh document in Firestore "users" collection
      const userData = {
        uid,
        email,
        username,
        age: age || null,
        height: height || null,
        weight: weight || null,
        joinedDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: result.user.emailVerified,
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

      // 4) Store minimal Firebase UID and profile info in AsyncStorage
      await AsyncStorage.setItem(
        'profile',
        JSON.stringify({
          firebaseUid: uid,
          email,
          username,
          lastUpdated: new Date().toISOString()
        })
      );
      
      setUserProfile(userData);
      
      // Alert the user to verify their email
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account.',
        [{ text: 'OK' }]
      );
      
      return result.user;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      
      let errorMessage = 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please use a different email.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      Alert.alert('Registration Failed', errorMessage);
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
      // Clear any existing data before login
      await clearUserDataFromStorage();
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!result.user.emailVerified) {
        // We allow login but show a warning about verification
        console.warn('Email not verified. Functionality may be limited.');
        
        // If we wanted to block login entirely, we could uncomment this:
        // setError('Please verify your email before logging in.');
        // throw new Error('Please verify your email before logging in.');
      }
      
      if (rememberMe) {
        await AsyncStorage.setItem('loggedInUser', result.user.uid);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('rememberMe');
      }
      
      // Fetch fresh profile data from server
      await fetchUserProfile(result.user.uid);
      
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
      
      // Clear all user-related data
      await clearUserDataFromStorage();
      
      setUserProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete account and all associated data
  const deleteAccount = async (password) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('You must be logged in to delete your account');
      
      // Re-authenticate user before deletion
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      await deleteUserData(user.uid);
      
      // Delete user from Firebase Authentication
      await user.delete();
      
      // Clear local storage
      await clearUserDataFromStorage();
      
      Alert.alert('Account Deleted', 'Your account and all associated data have been permanently deleted.');
      
      // State will be cleaned up by the auth state change listener
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err.message);
      
      let errorMessage = 'Failed to delete account.';
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      }
      
      Alert.alert('Account Deletion Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete user data from Firestore
  const deleteUserData = async (userId) => {
    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      // Delete weight logs
      const weightLogsRef = collection(db, 'users', userId, 'weightLog');
      const weightLogsSnapshot = await getDocs(weightLogsRef);
      for (const docSnap of weightLogsSnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
      
      // Delete workout history
      const workoutHistoryRef = collection(db, 'users', userId, 'workoutHistory');
      const workoutHistorySnapshot = await getDocs(workoutHistoryRef);
      for (const docSnap of workoutHistorySnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
      
      // Delete any other subcollections as needed
      
      console.log('All user data deleted from Firestore');
    } catch (error) {
      console.error('Error deleting user data from Firestore:', error);
      throw error;
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

  // Resend verification email
  const resendVerificationEmail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('No user logged in');
      
      await sendEmailVerification(user);
      Alert.alert(
        'Verification Email Sent',
        'Please check your inbox and follow the link to verify your email address.'
      );
    } catch (err) {
      console.error('Email verification error:', err);
      setError(err.message);
      
      let errorMessage = 'Failed to send verification email.';
      if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      }
      
      Alert.alert('Verification Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check email verification status
  const checkVerificationStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('No user logged in');
      
      await user.reload();
      const updatedUser = auth.currentUser;
      setEmailVerified(updatedUser.emailVerified);
      
      return updatedUser.emailVerified;
    } catch (err) {
      console.error('Verification check error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        setError,
        login,
        logout,
        register,
        resetPassword,
        updateUserProfile,
        changePassword,
        changeEmail,
        tryAutoLogin,
        emailVerified,
        resendVerificationEmail,
        checkVerificationStatus,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};