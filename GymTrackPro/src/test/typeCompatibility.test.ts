/**
 * Type Compatibility Test
 * 
 * This test verifies type compatibility between the global.ts and mergedTypes.ts files.
 */

import { 
  User, 
  Workout, 
  WorkoutPlan,
  Exercise,
  FirebaseTimestamp,
  WeightLogEntry,
  FriendRequest
} from '../types/mergedTypes';

import { 
  prepareForFirestore, 
  timestampToDate
} from '../utils/typeUtils';

describe('Type Compatibility Tests', () => {
  // Verify FirebaseTimestamp string compatibility
  it('should support FirebaseTimestamp and string timestamp types', () => {
    const mockTimestamp: FirebaseTimestamp = {
      toDate: () => new Date(),
      seconds: 1234567890,
      nanoseconds: 123456789,
      toMillis: () => 1234567890000,
      isEqual: (other: FirebaseTimestamp) => other.seconds === 1234567890 && other.nanoseconds === 123456789,
      toJSON: () => ({ seconds: 1234567890, nanoseconds: 123456789 })
    };

    // This should work with either a string or a FirebaseTimestamp
    const timestamp1: string | FirebaseTimestamp = mockTimestamp;
    const timestamp2: string | FirebaseTimestamp = "2023-01-01T00:00:00.000Z";

    // Test the timestampToDate utility
    const date1 = timestampToDate(timestamp1);
    const date2 = timestampToDate(timestamp2);

    // Verify function works for both types
    expect(date1).toBeInstanceOf(Date);
    expect(date2).toBeInstanceOf(Date);

    // Test with null/undefined values
    expect(timestampToDate(null as any)).toBeNull();
    expect(timestampToDate(undefined as any)).toBeNull();
  });

  it('should handle date conversion from different timestamp sources', () => {
    const mockTimestamp: FirebaseTimestamp = {
      toDate: () => new Date('2023-01-15T12:30:45.000Z'),
      seconds: 1673789445,
      nanoseconds: 0,
      toMillis: () => 1673789445000,
      isEqual: (other: FirebaseTimestamp) => other.seconds === 1673789445 && other.nanoseconds === 0,
      toJSON: () => ({ seconds: 1673789445, nanoseconds: 0 })
    };
    
    const stringTimestamp = '2023-01-15T12:30:45.000Z';
    
    // Convert FirebaseTimestamp to Date
    const date1 = timestampToDate(mockTimestamp);
    expect(date1?.getFullYear()).toBe(2023);
    expect(date1?.getMonth()).toBe(0); // January is 0
    expect(date1?.getDate()).toBe(15);
    
    // Convert string timestamp to Date
    const date2 = timestampToDate(stringTimestamp);
    expect(date2?.getFullYear()).toBe(2023);
    expect(date2?.getMonth()).toBe(0);
    expect(date2?.getDate()).toBe(15);
  });

  it('should prepare objects correctly for Firestore', () => {
    // Create test objects with timestamp values
    const mockUser: User = {
      uid: "user123",
      email: "user@example.com",
      username: "testuser",
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z"
    };

    const mockWorkout: Workout = {
      id: "workout123",
      userId: "user123",
      name: "Test Workout",
      date: "2023-01-01",
      exercises: [],
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z"
    };

    // Test the prepareForFirestore function
    const preparedUser = prepareForFirestore(mockUser);
    const preparedWorkout = prepareForFirestore(mockWorkout);

    // Verify the result is an object
    expect(typeof preparedUser).toBe('object');
    expect(typeof preparedWorkout).toBe('object');
    
    // The prepared object should have the same keys
    expect(preparedUser).toHaveProperty('uid');
    expect(preparedUser).toHaveProperty('email');
    expect(preparedUser).toHaveProperty('username');
    
    expect(preparedWorkout).toHaveProperty('userId');
    expect(preparedWorkout).toHaveProperty('name');
    
    // Test with nested objects
    const weightLogEntry: WeightLogEntry = {
      id: "log123",
      userId: "user123",
      weight: 75.5,
      date: "2023-01-15",
      notes: "Post workout weigh-in"
    };
    
    const preparedEntry = prepareForFirestore(weightLogEntry);
    expect(preparedEntry).toHaveProperty('userId');
    expect(preparedEntry).toHaveProperty('weight');
    expect(preparedEntry.weight).toBe(75.5);
  });
  
  it('should handle nested objects when preparing for Firestore', () => {
    // Create a workout with nested exercise data
    const mockWorkout: Workout = {
      id: "workout123",
      userId: "user123",
      name: "Full Body Workout",
      date: "2023-01-15",
      exercises: [
        {
          id: "ex1",
          name: "Bench Press",
          sets: [
            { weight: 100, reps: 10 },
            { weight: 110, reps: 8 }
          ]
        },
        {
          id: "ex2",
          name: "Deadlift",
          sets: [
            { weight: 150, reps: 5 }
          ]
        }
      ],
      createdAt: "2023-01-01T00:00:00.000Z"
    };
    
    const prepared = prepareForFirestore(mockWorkout);
    
    // Check that the structure is preserved
    expect(prepared).toHaveProperty('userId');
    expect(prepared).toHaveProperty('exercises');
    expect(Array.isArray(prepared.exercises)).toBe(true);
    expect(prepared.exercises.length).toBe(2);
    expect(prepared.exercises[0]).toHaveProperty('sets');
    expect(prepared.exercises[0].sets[0].weight).toBe(100);
    expect(prepared.exercises[1].name).toBe("Deadlift");
  });
}); 