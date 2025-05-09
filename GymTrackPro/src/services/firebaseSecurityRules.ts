import { FIREBASE_PATHS } from './firebase';
/**
 * Get the subcollection path for a user
 * @param subcollection The subcollection name
 * @returns The path string
 */
const getUserSubcollectionPath = (subcollection: keyof typeof FIREBASE_PATHS.USER_SUBCOLLECTIONS): string => {
  return FIREBASE_PATHS.USER_SUBCOLLECTIONS[subcollection];
};
/**
 * GymTrackPro Firebase Security Rules
 * These rules should be deployed to Firebase to secure the application
 */
export const firestoreSecurityRules = `
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    // Function to check if user is the owner of a document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    // Function to check if a user is a friend
    function isFriend(userId) {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)/friends/$(userId));
    }
    // Function to validate fields
    function validateFields(requiredFields, optionalFields) {
      let allFields = requiredFields.concat(optionalFields);
      return request.resource.data.keys().hasOnly(allFields) &&
             requiredFields.hasAll(request.resource.data.keys());
    }
    // Global rate limiting for creation
    function notRateLimited() {
      return request.time > get(/databases/$(database)/documents/users/$(request.auth.uid)).data.lastCreate + duration.value(10, 's');
    }
    // Test document for connection check
    match /test/connection {
      allow read: if true;
      allow write: if false;
    }
    // Users collection
    match /users/{userId} {
      // User profiles are readable by the owner and friends
      allow read: if isOwner(userId) || isFriend(userId);
      // User profile creation and updates only by owner
      allow create: if isOwner(userId) &&
                     validateFields(['email', 'username', 'createdAt'], 
                    ['displayName', 'bio', 'profilePic', 'goal', 'fitnessLevel', 'lastActive', 'settings']);
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
      // Friend subcollection
      match /friends/{friendId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }
      // Workout history subcollection
      match /workoutHistory/{workoutId} {
        allow read: if isOwner(userId) || (isFriend(userId) && resource.data.isPublic == true);
        allow create, update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }
      // Weight logs are private to the user
      match /weightLog/{logId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }
      // Workout plans can be shared
      match /workoutPlans/{planId} {
        allow read: if isOwner(userId) || (isFriend(userId) && resource.data.isShared == true);
        allow write: if isOwner(userId);
      }
      // User achievements
      match /achievements/{achievementId} {
        allow read: if isOwner(userId) || isFriend(userId);
        allow write: if isOwner(userId);
      }
    }
    // Friend requests
    match /friendRequests/{requestId} {
      allow read: if isAuthenticated() && 
                  (request.auth.uid == resource.data.senderId || 
                   request.auth.uid == resource.data.receiverId);
      allow create: if isAuthenticated() && 
                     request.auth.uid == request.resource.data.senderId &&
                     notRateLimited();
      allow update, delete: if isAuthenticated() && 
                            (request.auth.uid == resource.data.senderId || 
                             request.auth.uid == resource.data.receiverId);
    }
    // Global exercise library - readable by all authenticated users
    match /exercises/{exerciseId} {
      allow read: if isAuthenticated();
      // Only allow admin writes (handled via Firebase Admin SDK)
      allow write: if false;
    }
    // Muscle groups - readable by all authenticated users
    match /muscleGroups/{muscleId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    // Workout categories - readable by all authenticated users
    match /workoutCategories/{categoryId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    // Global workout templates - readable by all authenticated users
    match /workoutTemplates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    // Goals - readable by all authenticated users
    match /goals/{goalId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    // Shared workouts collection
    match /sharedWorkouts/{workoutId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
      allow update, delete: if isAuthenticated() && request.auth.uid == resource.data.userId;
    }
  }
}
`;
export const getFirestoreSecurityRules = () => {
  return firestoreSecurityRules;
};
export default firestoreSecurityRules;
/**
 * Firebase Security Rules for Firestore
 */
export const FirebaseSecurityRules = {
  /**
   * Client-side permission validator
   * @param userId The user ID
   * @param action The action to check (read, write, update, delete)
   * @param collectionPath The Firestore collection path
   * @param documentId The document ID
   * @returns True if the action is allowed, false otherwise
   */
  validatePermission: (
    currentUser: any, 
    userId: string, 
    action: 'read' | 'write' | 'update' | 'delete', 
    collectionPath: string, 
    documentId: string
  ): boolean => {
    // This function is used to check permissions client-side before performing operations
    // This doesn't replace server-side rules but helps prevent unnecessary failed operations
    if (!currentUser) return false;
    // Basic permission checks based on user identity
    if (collectionPath === FIREBASE_PATHS.USERS) {
      // For users collection, only the user can access their own document
      if (action === 'read' || action === 'update') {
        return currentUser.uid === documentId;
      }
      return false;
    }
    if (collectionPath === FIREBASE_PATHS.WORKOUT_HISTORY) {
      // For workout history, only the owner can access their workouts
      return currentUser.uid === userId;
    }
    if (collectionPath === FIREBASE_PATHS.FRIEND_REQUESTS) {
      if (action === 'update') {
        // For friend requests, recipient can update to accept/reject
        return currentUser.uid === userId;
      }
      return false;
    }
    if ([FIREBASE_PATHS.EXERCISES, FIREBASE_PATHS.MUSCLE_GROUPS, 
         FIREBASE_PATHS.WORKOUT_CATEGORIES, FIREBASE_PATHS.GOALS].includes(collectionPath)) {
      if (action === 'read') return true;
      // Only admins can modify these collections
      return false;
    }
    // Default to denying permission
    return false;
  }
}; 