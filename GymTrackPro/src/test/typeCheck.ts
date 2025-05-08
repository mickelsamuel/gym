/**
 * Simple Type Check to verify our fixes
 */

import { Workout, WorkoutPlan, User, FirebaseTimestamp } from '../types/mergedTypes';
import { prepareForFirestore } from '../utils/typeUtils';

// Create mock objects
const testTimestamp: FirebaseTimestamp = {
  toDate: () => new Date(),
  seconds: 1234567890,
  nanoseconds: 123456789
};

// Test User
const testUser: User = {
  uid: 'user123',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: testTimestamp,
  updatedAt: '2023-01-01T00:00:00.000Z'
};

// Test Workout
const testWorkout: Workout = {
  id: 'workout123',
  userId: 'user123',
  name: 'Test Workout',
  date: '2023-01-01',
  exercises: [],
  createdAt: testTimestamp,
  updatedAt: '2023-01-01T00:00:00.000Z'
};

// Test WorkoutPlan
const testPlan: WorkoutPlan = {
  id: 'plan123',
  userId: 'user123',
  name: 'Test Plan',
  exercises: [],
  createdAt: testTimestamp,
  updatedAt: '2023-01-01T00:00:00.000Z'
};

// Test prepareForFirestore
const firestoreUser = prepareForFirestore(testUser);
const firestoreWorkout = prepareForFirestore(testWorkout);
const firestorePlan = prepareForFirestore(testPlan);

// Check that our types are correctly defined
console.log("Type check passed!"); 