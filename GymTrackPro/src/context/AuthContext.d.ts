import { ReactNode } from 'react';
import { User } from 'firebase/auth';
import * as React from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  joinDate: string;
  lastLogin?: string;
  height?: number;
  weight?: number;
  age?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goal?: string;
  customAttributes?: Record<string, any>;
}

export interface AuthContextValue {
  // User state
  currentUser: User | null;
  user: User | null;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: any;
  emailVerified: boolean;
  
  // Network state
  isOnline: boolean;
  
  // Authentication methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    password: string;
    username: string;
    age?: number;
    weight?: number;
    height?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changeEmail: (password: string, newEmail: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  tryAutoLogin: () => Promise<boolean>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export function useAuth(): AuthContextValue;
export const AuthContext: React.Context<AuthContextValue>;
export function AuthProvider(props: AuthProviderProps): React.ReactElement; 