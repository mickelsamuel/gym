// firebase.security.test.ts - Tests for Firebase security rules

import { MockFirebase } from './mocks/firebase.mock';
import { mockAuth } from './mocks/firebase.mock';
import { FirebaseSecurityRules } from '../services/firebaseSecurityRules';
import { FIREBASE_PATHS } from '../services/firebase';

// Define a user type to match what comes from mockAuth
interface MockUser {
  uid: string;
  email: string;
}

describe('Firebase Security Rules', () => {
  beforeEach(() => {
    MockFirebase.setup();
    jest.clearAllMocks();
  });
  
  describe('User Data Access Permissions', () => {
    // Create test users
    beforeEach(async () => {
      // Create two different users
      const user1Credential = await mockAuth.createUserWithEmailAndPassword('user1@example.com', 'Password123!');
      const user2Credential = await mockAuth.createUserWithEmailAndPassword('user2@example.com', 'Password123!');
      
      // Add some data for both users
      MockFirebase.addDocument('users', user1Credential.user.uid, {
        uid: user1Credential.user.uid,
        email: 'user1@example.com',
        username: 'user1'
      });
      
      MockFirebase.addDocument('users', user2Credential.user.uid, {
        uid: user2Credential.user.uid,
        email: 'user2@example.com',
        username: 'user2'
      });
      
      // Add a workout for user1
      MockFirebase.addDocument(FIREBASE_PATHS.WORKOUT_HISTORY, 'workout-user1', {
        id: 'workout-user1',
        userId: user1Credential.user.uid,
        name: 'User 1 Workout',
        date: new Date().toISOString(),
        exercises: []
      });
    });
    
    it('should allow a user to read their own profile', async () => {
      // Log in as user1
      await mockAuth.signInWithEmailAndPassword('user1@example.com', 'Password123!');
      const currentUser = mockAuth.currentUser as MockUser | null;
      
      // Ensure user is logged in
      expect(currentUser).not.toBeNull();
      if (!currentUser) return; // TypeScript guard
      
      // Security check function
      const canRead = FirebaseSecurityRules.validatePermission(
        currentUser,
        currentUser.uid,
        'read',
        'users',
        currentUser.uid
      );
      
      expect(canRead).toBe(true);
    });
    
    it('should deny a user from reading another user\'s profile', async () => {
      // Log in as user1
      await mockAuth.signInWithEmailAndPassword('user1@example.com', 'Password123!');
      const currentUser = mockAuth.currentUser as MockUser | null;
      
      // Ensure user is logged in
      expect(currentUser).not.toBeNull();
      if (!currentUser) return; // TypeScript guard
      
      // Get user2's ID
      const user2Doc = Object.values(MockFirebase.getAllDocuments('users'))
        .find(user => user.email === 'user2@example.com');
      
      expect(user2Doc).toBeDefined();
      const user2Id = user2Doc.uid;
      
      // Security check function
      const canRead = FirebaseSecurityRules.validatePermission(
        currentUser,
        currentUser.uid,
        'read',
        'users',
        user2Id
      );
      
      expect(canRead).toBe(false);
    });
    
    it('should allow a user to update their own workout', async () => {
      // Log in as user1
      await mockAuth.signInWithEmailAndPassword('user1@example.com', 'Password123!');
      const currentUser = mockAuth.currentUser as MockUser | null;
      
      // Ensure user is logged in
      expect(currentUser).not.toBeNull();
      if (!currentUser) return; // TypeScript guard
      
      // Security check function
      const canUpdate = FirebaseSecurityRules.validatePermission(
        currentUser,
        currentUser.uid,
        'update',
        FIREBASE_PATHS.WORKOUT_HISTORY,
        'workout-user1'
      );
      
      expect(canUpdate).toBe(true);
    });
    
    it('should deny a user from updating another user\'s workout', async () => {
      // Log in as user2
      await mockAuth.signInWithEmailAndPassword('user2@example.com', 'Password123!');
      const currentUser = mockAuth.currentUser as MockUser | null;
      
      // Ensure user is logged in
      expect(currentUser).not.toBeNull();
      if (!currentUser) return; // TypeScript guard
      
      // Get user1's ID
      const user1Doc = Object.values(MockFirebase.getAllDocuments('users'))
        .find(user => user.email === 'user1@example.com');
      
      expect(user1Doc).toBeDefined();
      const user1Id = user1Doc.uid;
      
      // Security check function for user2 trying to update user1's workout
      const canUpdate = FirebaseSecurityRules.validatePermission(
        currentUser,
        user1Id, // This would be the document owner
        'update',
        FIREBASE_PATHS.WORKOUT_HISTORY,
        'workout-user1'
      );
      
      expect(canUpdate).toBe(false);
    });
  });
  
  describe('Public Data Access', () => {
    it('should allow authenticated users to read exercise data', async () => {
      // Log in as a user
      await mockAuth.signInWithEmailAndPassword('user1@example.com', 'Password123!');
      const currentUser = mockAuth.currentUser as MockUser | null;
      
      // Ensure user is logged in
      expect(currentUser).not.toBeNull();
      if (!currentUser) return; // TypeScript guard
      
      // Add some exercise data
      MockFirebase.addDocument(FIREBASE_PATHS.EXERCISES, 'ex-1', {
        id: 'ex-1',
        name: 'Bench Press',
        description: 'A chest exercise'
      });
      
      // Security check function
      const canRead = FirebaseSecurityRules.validatePermission(
        currentUser,
        '',  // Not user-specific
        'read',
        FIREBASE_PATHS.EXERCISES,
        'ex-1'
      );
      
      expect(canRead).toBe(true);
    });
    
    it('should deny unauthenticated users from reading exercise data', async () => {
      // No user logged in
      mockAuth.signOut();
      
      // Add some exercise data
      MockFirebase.addDocument(FIREBASE_PATHS.EXERCISES, 'ex-1', {
        id: 'ex-1',
        name: 'Bench Press',
        description: 'A chest exercise'
      });
      
      // Security check function
      const canRead = FirebaseSecurityRules.validatePermission(
        null,  // No current user
        '',    // Not user-specific
        'read',
        FIREBASE_PATHS.EXERCISES,
        'ex-1'
      );
      
      expect(canRead).toBe(false);
    });
    
    it('should deny users from writing to exercise data', async () => {
      // Log in as a user
      await mockAuth.signInWithEmailAndPassword('user1@example.com', 'Password123!');
      const currentUser = mockAuth.currentUser as MockUser | null;
      
      // Ensure user is logged in
      expect(currentUser).not.toBeNull();
      if (!currentUser) return; // TypeScript guard
      
      // Security check function
      const canWrite = FirebaseSecurityRules.validatePermission(
        currentUser,
        '',  // Not user-specific
        'write',
        FIREBASE_PATHS.EXERCISES,
        'new-exercise'
      );
      
      expect(canWrite).toBe(false);
    });
  });
  
  describe('Friend System Permissions', () => {
    beforeEach(async () => {
      // Create two users
      const user1Credential = await mockAuth.createUserWithEmailAndPassword('user1@example.com', 'Password123!');
      const user2Credential = await mockAuth.createUserWithEmailAndPassword('user2@example.com', 'Password123!');
      
      // Add a friend request from user1 to user2
      MockFirebase.addDocument(FIREBASE_PATHS.FRIEND_REQUESTS, 'req-1', {
        id: 'req-1',
        fromUid: user1Credential.user.uid,
        fromUsername: 'user1',
        toUid: user2Credential.user.uid,
        sentAt: new Date().toISOString(),
        status: 'pending'
      });
    });
    
    it('should allow the recipient to update a friend request', async () => {
      // Log in as user2 (the recipient)
      await mockAuth.signInWithEmailAndPassword('user2@example.com', 'Password123!');
      const currentUser = mockAuth.currentUser as MockUser | null;
      
      // Ensure user is logged in
      expect(currentUser).not.toBeNull();
      if (!currentUser) return; // TypeScript guard
      
      // Get friend request
      const friendRequest = MockFirebase.getDocument(FIREBASE_PATHS.FRIEND_REQUESTS, 'req-1');
      expect(friendRequest).not.toBeNull();
      if (!friendRequest) return; // TypeScript guard
      
      // Security check function for updating the friend request
      const canUpdate = FirebaseSecurityRules.validatePermission(
        currentUser,
        friendRequest.toUid,  // User2 is the recipient
        'update',
        FIREBASE_PATHS.FRIEND_REQUESTS,
        'req-1'
      );
      
      expect(canUpdate).toBe(true);
    });
    
    it('should deny other users from updating a friend request', async () => {
      // Create a third user
      const user3Credential = await mockAuth.createUserWithEmailAndPassword('user3@example.com', 'Password123!');
      
      // Log in as user3 (not involved in the friend request)
      await mockAuth.signInWithEmailAndPassword('user3@example.com', 'Password123!');
      const currentUser = mockAuth.currentUser as MockUser | null;
      
      // Ensure user is logged in
      expect(currentUser).not.toBeNull();
      if (!currentUser) return; // TypeScript guard
      
      // Get friend request
      const friendRequest = MockFirebase.getDocument(FIREBASE_PATHS.FRIEND_REQUESTS, 'req-1');
      expect(friendRequest).not.toBeNull();
      if (!friendRequest) return; // TypeScript guard
      
      // Security check function for updating the friend request
      const canUpdate = FirebaseSecurityRules.validatePermission(
        currentUser,
        friendRequest.toUid,  // User2 is the recipient, not user3
        'update',
        FIREBASE_PATHS.FRIEND_REQUESTS,
        'req-1'
      );
      
      expect(canUpdate).toBe(false);
    });
  });
}); 