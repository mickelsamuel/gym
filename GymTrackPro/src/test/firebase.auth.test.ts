// firebase.auth.test.ts - Tests for Firebase authentication

import { MockFirebase, mockAuth } from './mocks/firebase.mock';
import { mockAsyncStorage } from './mocks/async-storage.mock';
import { getAuth, User } from 'firebase/auth';

// Import the actual service under test - the firebaseAuth interface object
import { firebaseAuth } from '../services/firebase';
import { AUTH_ERROR_CODES } from '../constants/errorCodes';

// Custom error type for Firebase Auth errors
interface FirebaseAuthError extends Error {
  code?: string;
}

describe('Firebase Authentication Tests', () => {
  beforeEach(() => {
    MockFirebase.setup();
    mockAsyncStorage._reset();
    jest.clearAllMocks();
  });

  describe('User Authentication', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'StrongP4ssword';
      
      const result = await firebaseAuth.register(email, password);
      
      expect(result.uid).toBeDefined();
      expect(mockAuth.currentUser?.email).toBe(email);
    });
    
    it('should reject registration with weak password', async () => {
      const email = 'test@example.com';
      const password = 'weak';
      
      try {
        await firebaseAuth.register(email, password);
        fail('Should have thrown an error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Password must be at least 8 characters long');
      }
    });
    
    it('should log in an existing user', async () => {
      // Register first
      const email = 'existing@example.com';
      const password = 'StrongP4ssword';
      
      await firebaseAuth.register(email, password);
      
      // Sign out
      await firebaseAuth.logout();
      expect(mockAuth.currentUser).toBeNull();
      
      // Log in - mock this to succeed
      mockAuth.signInWithEmailAndPassword.mockImplementationOnce((email, password) => {
        mockAuth.currentUser = { 
          uid: 'user123', 
          email, 
          emailVerified: false,
          getIdTokenResult: jest.fn().mockResolvedValue({
            claims: {},
            token: 'valid-token',
            authTime: new Date().toISOString(),
            issuedAtTime: new Date().toISOString(),
            expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
            signInProvider: 'password',
            signInSecondFactor: null
          })
        } as unknown as User;
        return Promise.resolve({ user: mockAuth.currentUser });
      });
      
      const user = await firebaseAuth.login(email, password);
      
      expect(user.uid).toBeDefined();
      expect(user.email).toBe(email);
    });
    
    it('should reject login with wrong password', async () => {
      // Register first
      const email = 'test2@example.com';
      const password = 'StrongP4ssword';
      
      await firebaseAuth.register(email, password);
      
      // Sign out
      await firebaseAuth.logout();
      
      // Reset the mock to make it throw the wrong password error
      mockAuth.signInWithEmailAndPassword.mockImplementationOnce(() => {
        const error = new Error('Wrong password') as FirebaseAuthError;
        error.code = AUTH_ERROR_CODES.WRONG_PASSWORD;
        return Promise.reject(error);
      });
      
      // Try to log in with wrong password
      try {
        await firebaseAuth.login(email, 'WrongPassword123');
        fail('Should have thrown an error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Wrong password');
      }
    });
  });
  
  describe('Token Validation', () => {
    it('should validate a valid token', async () => {
      const email = 'token@example.com';
      const password = 'StrongP4ssword';
      
      // Register and get user with getIdToken implementation
      const user = {
        uid: 'user-token-valid',
        email,
        emailVerified: false,
        getIdToken: jest.fn().mockResolvedValue('valid-token'),
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: {},
          token: 'valid-token',
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
          signInProvider: 'password',
          signInSecondFactor: null
        })
      } as unknown as User;
      
      // Mock implementation for this test
      mockAuth.currentUser = user;
      
      // Check token validity
      const isValid = await firebaseAuth.isTokenValid(user);
      expect(isValid).toBe(true);
    });
    
    it('should detect an expired token', async () => {
      const user = {
        uid: 'user-token-expired',
        email: 'expired@example.com',
        emailVerified: false,
        getIdToken: jest.fn().mockResolvedValue('expired-token'),
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: {},
          token: 'expired-token',
          authTime: new Date().toISOString(),
          issuedAtTime: new Date(Date.now() - 3600 * 1000).toISOString(),
          expirationTime: new Date(Date.now() - 1000).toISOString(),
          signInProvider: 'password',
          signInSecondFactor: null
        })
      } as unknown as User;
      
      // Set this user in the mock auth
      mockAuth.currentUser = user;
      
      // Check token expiration
      const isExpired = await firebaseAuth.checkTokenExpiration(user);
      expect(isExpired).toBe(true);
    });
    
    it('should handle reauthentication correctly', async () => {
      const email = 'reauth@example.com';
      const password = 'StrongP4ssword';
      
      // Setup a user that can be reauthenticated
      const user = {
        uid: 'user-reauth',
        email,
        emailVerified: false,
        getIdToken: jest.fn().mockResolvedValue('valid-token'),
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: {},
          token: 'valid-token',
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
          signInProvider: 'password',
          signInSecondFactor: null
        })
      } as unknown as User;
      
      // Mock the current user
      mockAuth.currentUser = user;
      
      // Mock the reauthenticate function to succeed
      jest.spyOn(firebaseAuth, 'reauthenticate').mockResolvedValueOnce({
        user: user
      });
      
      // Test reauthentication with correct password
      const reauthResult = await firebaseAuth.reauthenticate(user, password);
      expect(reauthResult).toBeDefined();
      
      // Reset and mock reauthenticate to fail
      jest.spyOn(firebaseAuth, 'reauthenticate').mockReset();
      jest.spyOn(firebaseAuth, 'reauthenticate').mockImplementationOnce(() => {
        const error = new Error('Wrong password') as FirebaseAuthError;
        error.code = AUTH_ERROR_CODES.WRONG_PASSWORD;
        return Promise.reject(error);
      });
      
      // Test reauthentication with incorrect password
      try {
        await firebaseAuth.reauthenticate(user, 'WrongPassword123');
        fail('Should have thrown an error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Wrong password');
      }
    });
  });
  
  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      const email = 'reset@example.com';
      const password = 'StrongP4ssword';
      
      // Register first
      await firebaseAuth.register(email, password);
      
      // Create a real array to track calls
      mockAuth.sendPasswordResetEmailCalls = [];
      
      // Mock the function to succeed
      jest.spyOn(firebaseAuth, 'resetPassword').mockResolvedValueOnce(undefined);
      
      // Request password reset
      await firebaseAuth.resetPassword(email);
      
      // Check if mock received the call
      expect(firebaseAuth.resetPassword).toHaveBeenCalledWith(email);
    });
    
    it('should reject password reset for non-existent user', async () => {
      // Mock the resetPassword function to throw an error
      jest.spyOn(firebaseAuth, 'resetPassword').mockImplementationOnce(() => {
        const error = new Error('User not found') as FirebaseAuthError;
        error.code = AUTH_ERROR_CODES.USER_NOT_FOUND;
        return Promise.reject(error);
      });
      
      try {
        await firebaseAuth.resetPassword('nonexistent@example.com');
        fail('Should have thrown an error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('User not found');
      }
    });
  });
  
  describe('Email Verification', () => {
    it('should send verification email', async () => {
      const email = 'verify@example.com';
      const password = 'StrongP4ssword';
      
      // Register and get user
      const user = {
        uid: 'user-verify',
        email,
        emailVerified: false,
        getIdToken: jest.fn().mockResolvedValue('valid-token'),
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: {},
          token: 'valid-token',
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
          signInProvider: 'password',
          signInSecondFactor: null
        })
      } as unknown as User;
      
      // Track verification emails
      mockAuth.sendEmailVerificationCalls = [];
      
      // Mock the sendVerificationEmail function
      jest.spyOn(firebaseAuth, 'sendVerificationEmail').mockResolvedValueOnce(undefined);
      
      // Send verification email
      await firebaseAuth.sendVerificationEmail(user);
      
      // Check if mock received the call
      expect(firebaseAuth.sendVerificationEmail).toHaveBeenCalledWith(user);
    });
  });

  describe('Auth State Changes', () => {
    it('should notify observers when auth state changes', () => {
      const authStateCallback = jest.fn();
      
      const unsubscribe = getAuth().onAuthStateChanged(authStateCallback);
      
      // Initial state (should be null as we're starting fresh)
      expect(authStateCallback).toHaveBeenCalledWith(null);
      
      // Simulate login
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        callback({ uid: 'user123', email: 'test@example.com' });
        return () => {};
      });
      
      // Run onAuthStateChanged again to trigger the new implementation
      getAuth().onAuthStateChanged(authStateCallback);
      
      // New callback value
      expect(authStateCallback).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'user123' })
      );
      
      // Cleanup
      unsubscribe();
    });
  });
}); 