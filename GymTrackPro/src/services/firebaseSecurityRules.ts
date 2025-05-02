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
 * Firebase Security Rules for GymTrackPro
 * 
 * This file contains the security rules that should be deployed to Firebase Firestore.
 * These rules ensure that users can only access the data they're authorized to access.
 */

// Export the security rules as a string that can be used for deployment
export const firestoreSecurityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isUserAuthenticated(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidTimestamp(timestamp) {
      return timestamp is timestamp && timestamp <= request.time;
    }

    function userExists(userId) {
      return exists(/databases/$(database)/documents/users/$(userId));
    }

    function hasAllRequiredFields(requiredFields) {
      return requiredFields.all(field => request.resource.data[field] != null);
    }

    function unchangedField(field) {
      return request.resource.data[field] == resource.data[field];
    }

    // Allow read of public app data to any authenticated user
    match /muscleGroups/{document=**} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admins can write (via admin SDK)
    }

    match /workoutCategories/{document=**} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admins can write (via admin SDK)
    }

    match /exercises/{document=**} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admins can write (via admin SDK)
    }

    match /goals/{document=**} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admins can write (via admin SDK)
    }

    // User data - only accessible by the user themselves
    match /users/{userId} {
      allow read: if isUserAuthenticated(userId);
      allow create: if isUserAuthenticated(userId) && 
                     hasAllRequiredFields(['uid', 'email', 'username']) &&
                     request.resource.data.uid == userId;
      allow update: if isUserAuthenticated(userId) && 
                     unchangedField('uid');
      allow delete: if false; // Users shouldn't be deleted, only marked as inactive

      // User subcollections
      match /weightLog/{entry} {
        allow read: if isUserAuthenticated(userId);
        allow create: if isUserAuthenticated(userId) && 
                       hasAllRequiredFields(['weight', 'date', 'userId']) &&
                       request.resource.data.userId == userId;
        allow update: if isUserAuthenticated(userId) && 
                       unchangedField('userId');
        allow delete: if isUserAuthenticated(userId);
      }

      match /workoutHistory/{workout} {
        allow read: if isUserAuthenticated(userId);
        allow create: if isUserAuthenticated(userId) && 
                       hasAllRequiredFields(['userId', 'name', 'date', 'exercises']) &&
                       request.resource.data.userId == userId;
        allow update: if isUserAuthenticated(userId) && 
                       unchangedField('userId');
        allow delete: if isUserAuthenticated(userId);
      }

      match /workoutPlans/{plan} {
        allow read: if isUserAuthenticated(userId);
        allow create: if isUserAuthenticated(userId) && 
                       hasAllRequiredFields(['userId', 'name', 'exercises']) &&
                       request.resource.data.userId == userId;
        allow update: if isUserAuthenticated(userId) && 
                       unchangedField('userId');
        allow delete: if isUserAuthenticated(userId);
      }

      match /achievements/{achievement} {
        allow read: if isUserAuthenticated(userId);
        allow write: if false; // Only server-side code should write achievements
      }

      match /notifications/{notification} {
        allow read: if isUserAuthenticated(userId);
        allow update: if isUserAuthenticated(userId) && 
                       unchangedField('userId') &&
                       unchangedField('title') &&
                       unchangedField('message') &&
                       unchangedField('type');
        allow create, delete: if false; // Only server-side code should create/delete notifications
      }
    }

    // Friend system
    match /friends/{document} {
      allow read: if isUserAuthenticated(resource.data.userId) || 
                   isUserAuthenticated(resource.data.friendId);
      allow create: if isUserAuthenticated(request.resource.data.userId) && 
                     userExists(request.resource.data.friendId);
      allow delete: if isUserAuthenticated(resource.data.userId) || 
                     isUserAuthenticated(resource.data.friendId);
      allow update: if false; // Friend records shouldn't be updated, only created/deleted
    }

    match /friendRequests/{document} {
      allow read: if isUserAuthenticated(resource.data.fromUid) || 
                   isUserAuthenticated(resource.data.toUid);
      allow create: if isUserAuthenticated(request.resource.data.fromUid) && 
                     userExists(request.resource.data.toUid) &&
                     request.resource.data.status == 'pending';
      allow update: if isUserAuthenticated(resource.data.toUid) && 
                     unchangedField('fromUid') && 
                     unchangedField('toUid') &&
                     unchangedField('sentAt') &&
                     (request.resource.data.status == 'accepted' || 
                      request.resource.data.status == 'rejected');
      allow delete: if isUserAuthenticated(resource.data.fromUid) || 
                     isUserAuthenticated(resource.data.toUid);
    }

    // Test connection document for checking Firebase availability
    match /test/connection {
      allow read, write: if isAuthenticated();
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

// Function to get the security rules programmatically
export const getFirestoreSecurityRules = (): string => {
  return firestoreSecurityRules;
};

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
    if (userId && currentUser.uid !== userId) {
      // Check if user is admin (this is a simplified example)
      // In a real app, this would fetch the user's role from Firestore
      const isAdmin = false; // Replace with actual admin check
      if (!isAdmin) return false;
    }
    
    // Collection-specific permissions
    if (collectionPath === FIREBASE_PATHS.USERS) {
      if (action === 'read') return true;
      if (['write', 'update', 'delete'].includes(action)) {
        return currentUser.uid === documentId;
      }
    }
    
    if (collectionPath === FIREBASE_PATHS.WORKOUT_PLANS) {
      if (action === 'read') return true;
      // For write/update/delete, we'd need to check if the workout belongs to the user
      // This is a simplified implementation
      return userId === currentUser.uid;
    }
    
    if ([FIREBASE_PATHS.EXERCISES, FIREBASE_PATHS.MUSCLE_GROUPS, 
         FIREBASE_PATHS.WORKOUT_CATEGORIES, FIREBASE_PATHS.GOALS].includes(collectionPath)) {
      if (action === 'read') return true;
      // Only admins can modify these collections
      return false; // Replace with actual admin check
    }
    
    // Default to denying permission
    return false;
  }
}; 