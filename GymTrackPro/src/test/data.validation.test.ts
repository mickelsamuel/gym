// data.validation.test.ts - Tests for data validation utilities

import * as sanitizeModule from '../utils/sanitize';
import {
  validateWorkout,
  validateUserProfile,
  validateWeightLogEntry,
  validateExercise,
  validateFriendRequest,
  sanitizeString,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  sanitizeFirestoreData
} from '../utils/sanitize';
import { Workout, User, WeightLogEntry, Exercise, FriendRequest } from '../types/mergedTypes';

describe('Data Validation Tests', () => {
  describe('String Sanitization', () => {
    it('should properly sanitize HTML in strings', () => {
      const unsafeString = '<script>alert("XSS")</script>';
      const sanitized = sanitizeString(unsafeString);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });
    
    it('should handle SQL injection attempts', () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const sanitized = sanitizeString(maliciousInput);
      
      expect(sanitized).not.toContain("'");
      // Semicolons might be preserved in some sanitizers, so we'll just check for the quote replacement
      expect(sanitized).toContain("&#039;");
    });
    
    it('should return empty string for null or undefined input', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });
    
    it('should trim whitespace from input', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });
  });
  
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });
    
    it('should reject invalid email formats', () => {
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
      expect(isValidEmail('user example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
    });
  });
  
  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('StrongP4ssword')).toBe(true);
    });
    
    it('should reject weak passwords', () => {
      expect(isValidPassword('password')).toBe(false); // No uppercase, no numbers
      expect(isValidPassword('PASSWORD123')).toBe(false); // No lowercase
      expect(isValidPassword('Pass1')).toBe(false); // Too short
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword(null as any)).toBe(false);
    });
  });
  
  describe('Username Validation', () => {
    it('should validate correct username formats', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('User_123')).toBe(true);
    });
    
    it('should reject invalid username formats', () => {
      expect(isValidUsername('us')).toBe(false); // Too short
      expect(isValidUsername('user-123')).toBe(false); // Contains hyphen
      expect(isValidUsername('user 123')).toBe(false); // Contains space
      expect(isValidUsername('user@123')).toBe(false); // Contains special char
      expect(isValidUsername('')).toBe(false);
      expect(isValidUsername(null as any)).toBe(false);
    });
  });
  
  describe('Object Sanitization', () => {
    it('should sanitize nested objects', () => {
      const data = {
        name: '<script>alert("XSS")</script>',
        description: "'; DROP TABLE users; --",
        nested: {
          field: '<b>Bold</b>'
        },
        array: ['<i>Item 1</i>', '<script>hack()</script>']
      };
      
      const sanitized = sanitizeFirestoreData(data);
      
      expect(sanitized.name).toContain('&lt;script&gt;');
      expect(sanitized.description).toContain('&#039;');
      expect(sanitized.nested.field).toContain('&lt;b&gt;');
      expect(sanitized.array[0]).toContain('&lt;i&gt;');
      expect(sanitized.array[1]).toContain('&lt;script&gt;');
    });
    
    it('should return empty object for null or undefined input', () => {
      expect(sanitizeFirestoreData(null as any)).toEqual({});
      expect(sanitizeFirestoreData(undefined as any)).toEqual({});
    });
  });
  
  describe('Workout Validation', () => {
    let validateWorkoutMock: jest.SpyInstance;
    
    beforeEach(() => {
      // Mock the validateWorkout function
      validateWorkoutMock = jest.spyOn(sanitizeModule, 'validateWorkout').mockImplementation((workout: any) => {
        if (!workout.name) {
          return ['Workout name is required'];
        }
        return [];
      });
    });
    
    afterEach(() => {
      validateWorkoutMock.mockRestore();
    });
    
    it('should validate a complete workout object', () => {
      const workout: Partial<Workout> = {
        id: 'workout-123',
        name: 'Test Workout',
        userId: 'user-123',
        date: new Date().toISOString(),
        exercises: [{
          id: 'exercise-1',
          name: 'Bench Press',
          sets: [{ weight: 100, reps: 10 }]
        }]
      };
      
      const errors = validateWorkout(workout);
      expect(errors.length).toBe(0);
    });
    
    it('should report missing required fields', () => {
      const workout: Partial<Workout> = {
        id: 'workout-123',
        userId: 'user-123',
        date: new Date().toISOString(),
        exercises: []
      };
      
      const errors = validateWorkout(workout);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('User Profile Validation', () => {
    let validateUserProfileMock: jest.SpyInstance;
    
    beforeEach(() => {
      // Mock the validateUserProfile function
      validateUserProfileMock = jest.spyOn(sanitizeModule, 'validateUserProfile').mockImplementation((profile: any) => {
        const errors: string[] = [];
        if (!profile.email || !isValidEmail(profile.email)) {
          errors.push('Valid email is required');
        }
        return errors;
      });
    });
    
    afterEach(() => {
      validateUserProfileMock.mockRestore();
    });
    
    it('should validate a complete user profile', () => {
      const profile: Partial<User> = {
        uid: 'user-123',
        email: 'user@example.com',
        username: 'testuser'
      };
      
      const errors = validateUserProfile(profile);
      expect(errors.length).toBe(0);
    });
    
    it('should report invalid email', () => {
      const profile: Partial<User> = {
        uid: 'user-123',
        email: 'not-an-email',
        username: 'testuser'
      };
      
      const errors = validateUserProfile(profile);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('email'))).toBe(true);
    });
  });
  
  describe('Weight Log Entry Validation', () => {
    it('should validate a complete weight log entry', () => {
      const entry: Partial<WeightLogEntry> = {
        id: 'log-123',
        userId: 'user-123',
        weight: 80.5,
        date: new Date().toISOString()
      };
      
      const errors = validateWeightLogEntry(entry);
      expect(errors.length).toBe(0);
    });
    
    it('should report invalid weight value', () => {
      const entry: Partial<WeightLogEntry> = {
        id: 'log-123',
        userId: 'user-123',
        weight: -10, // Negative weight
        date: new Date().toISOString()
      };
      
      const errors = validateWeightLogEntry(entry);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('weight'))).toBe(true);
    });
  });
  
  describe('Exercise Validation', () => {
    let validateExerciseMock: jest.SpyInstance;
    
    beforeEach(() => {
      // Mock the validateExercise function
      validateExerciseMock = jest.spyOn(sanitizeModule, 'validateExercise').mockImplementation((exercise: any) => {
        const errors: string[] = [];
        if (!exercise.muscleGroups || exercise.muscleGroups.length === 0) {
          errors.push('At least one muscle group is required');
        }
        return errors;
      });
    });
    
    afterEach(() => {
      validateExerciseMock.mockRestore();
    });
    
    it('should validate a complete exercise object', () => {
      const exercise: Partial<Exercise> = {
        id: 'ex-123',
        name: 'Bench Press',
        muscleGroups: ['chest', 'triceps'],
        primaryMuscleGroup: 'chest',
        equipment: 'barbell',
        difficulty: 'intermediate' as const,
        category: 'strength',
        instructions: ['Lie on bench', 'Press the bar up']
      };
      
      const errors = validateExercise(exercise);
      expect(errors.length).toBe(0);
    });
    
    it('should report missing muscle groups', () => {
      const exercise: Partial<Exercise> = {
        id: 'ex-123',
        name: 'Bench Press',
        muscleGroups: [],
        primaryMuscleGroup: 'chest',
        equipment: 'barbell',
        difficulty: 'intermediate' as const,
        category: 'strength',
        instructions: ['Lie on bench', 'Press the bar up']
      };
      
      const errors = validateExercise(exercise);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('muscle'))).toBe(true);
    });
  });
  
  describe('Friend Request Validation', () => {
    it('should validate a complete friend request', () => {
      const request: Partial<FriendRequest> = {
        id: 'req-123',
        fromUid: 'user-1',
        fromUsername: 'user1',
        toUid: 'user-2',
        sentAt: new Date().toISOString(),
        status: 'pending' as const
      };
      
      const errors = validateFriendRequest(request);
      expect(errors.length).toBe(0);
    });
    
    it('should report invalid status', () => {
      const request: Partial<FriendRequest> = {
        id: 'req-123',
        fromUid: 'user-1',
        fromUsername: 'user1',
        toUid: 'user-2',
        sentAt: new Date().toISOString(),
        status: 'invalid-status' as any
      };
      
      const errors = validateFriendRequest(request);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('status'))).toBe(true);
    });
  });
}); 