import React, { createContext, useEffect, useState, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { User } from '../types/mergedTypes';
import DatabaseService from '../services/DatabaseService';
import { NetworkContext } from './NetworkContext';
// Define the shape of the auth context
export interface AuthContextValue {
  currentUser: FirebaseUser | null;
  userData: User | null;
  user: FirebaseUser | null; // Alias for currentUser for backward compatibility
  userProfile: User | null; // Alias for userData for backward compatibility
  loading: boolean;
  emailVerified: boolean;
  isOnline: boolean;
  errorMessage: string | null;
  error: string | null; // Alias for errorMessage for backward compatibility
  signIn: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>; // Alias for signIn for backward compatibility
  signUp: (email: string, password: string, username: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>; // Alias for signUp for backward compatibility
  logOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for logOut for backward compatibility
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  deleteAccount: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  userData: null,
  user: null,
  userProfile: null,
  loading: true,
  emailVerified: false,
  isOnline: true,
  errorMessage: null,
  error: null,
  signIn: async () => {},
  login: async () => {},
  signUp: async () => {},
  register: async () => {},
  logOut: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  sendVerificationEmail: async () => {},
  updateUserData: async () => {},
  clearError: () => {},
  deleteAccount: async () => {}
});
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isOnline } = useContext(NetworkContext);
  // Check if email is verified
  const emailVerified = currentUser?.emailVerified || false;
  // Clear any error messages
  const clearError = () => setErrorMessage(null);
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      clearError();
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Sign up with email, password, and username
  const signUp = async (email: string, password: string, username: string) => {
    try {
      clearError();
      setLoading(true);
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Create user profile in Firestore
      await DatabaseService.saveProfile(
        {
          uid: user.uid,
          email: user.email || email,
          username,
          joinDate: new Date().toISOString()
        },
        isOnline
      );
      // Send verification email
      await sendEmailVerification(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Log out user
  const logOut = async () => {
    try {
      clearError();
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to log out');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Send password reset email
  const resetPassword = async (email: string) => {
    try {
      clearError();
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send reset email');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Send email verification
  const sendVerificationEmail = async () => {
    try {
      clearError();
      if (!currentUser) throw new Error('No authenticated user');
      await sendEmailVerification(currentUser);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send verification email');
      throw error;
    }
  };
  // Update user data
  const updateUserData = async (data: Partial<User>) => {
    try {
      clearError();
      setLoading(true);
      if (!currentUser) throw new Error('No authenticated user');
      const response = await DatabaseService.saveProfile(
        {
          ...data,
          uid: currentUser.uid
        },
        isOnline
      );
      if (response.success && response.data) {
        setUserData(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to update user data');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update user data');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Delete user account
  const deleteAccount = async () => {
    try {
      clearError();
      setLoading(true);
      if (!currentUser) throw new Error('No authenticated user');
      // Delete user data from Firestore
      await DatabaseService.deleteProfile(currentUser.uid, isOnline);
      // Delete Firebase Auth user
      await currentUser.delete();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete account');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Load user profile data from Firestore
          const userDataResponse = await DatabaseService.getProfile(user.uid, isOnline);
          if (userDataResponse.success && userDataResponse.data) {
            setUserData(userDataResponse.data);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [isOnline]);
  // Context value
  const value: AuthContextValue = {
    currentUser,
    userData,
    user: currentUser, // Alias
    userProfile: userData, // Alias
    loading,
    emailVerified,
    isOnline,
    errorMessage,
    error: errorMessage, // Alias
    signIn,
    login: signIn, // Alias
    signUp,
    register: signUp, // Alias
    logOut,
    logout: logOut, // Alias
    resetPassword,
    sendVerificationEmail,
    updateUserData,
    clearError,
    deleteAccount
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider; 