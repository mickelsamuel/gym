# GymTrackPro Services

This directory contains all service-related code for interfacing with Firebase and other backend services.

## Directory Structure

- **firebase.ts**: Main Firebase initialization and configuration
- **firebaseSecurityRules.ts**: Firestore security rules and client-side permission validation
- **DatabaseService.ts**: Main database service that exports a convenient API for database operations
- **NetworkState.ts**: Service for monitoring and managing network connectivity
- **MockDataService.js**: Service for providing mock data (for development/testing)

### Database Subdirectory

- **BaseDatabaseService.ts**: Base service with common database functionality
- **UserDatabaseService.ts**: User-specific database operations
- **WorkoutDatabaseService.ts**: Workout-related database operations
- **WeightLogDatabaseService.ts**: Weight logging operations
- **migration.ts**: Service for migrating static data to Firestore

## Backend Architecture

### Firebase Integration

The app uses Firebase as its backend with:
- **Firebase Auth**: For user authentication
- **Firestore**: For data storage
- **Firebase Analytics**: For usage tracking

### Service Layer

Services are organized in a modular fashion:
- Base services provide common functionality
- Specialized services handle domain-specific operations
- Each service focuses on a specific area of functionality

### Data Flow

1. UI components interact with context providers
2. Context providers use services for data operations
3. Services handle the details of Firebase integration
4. Data is validated and sanitized before storage
5. Error handling is implemented at each level

## Improvements Made

### Firebase Configuration
- Path constants to prevent typos
- Proper interfaces for operations
- Comprehensive error handling
- Client-side security validation

### Data Management
- Offline support with local storage
- Data caching to reduce Firestore reads
- Batch operations for efficiency
- Transaction support for data consistency

### Data Migration
- Tools to migrate static data to Firestore
- Batch processing to handle large datasets
- Progress monitoring and error handling

### Error Handling
- Detailed error codes
- User-friendly error messages
- Error logging for troubleshooting

### Security
- Firestore security rules
- Client-side permission validation
- Data sanitization to prevent injection attacks

## Usage Examples

### Basic Usage

```typescript
import DatabaseService from '../services/DatabaseService';

// Get user profile
const { data: profile, error } = await DatabaseService.getProfile(userId, isOnline);

// Save a workout
const { data: savedWorkout, error } = await DatabaseService.saveWorkout(workout, isOnline);
```

### Direct Service Access

```typescript
import { userService, workoutService } from '../services/DatabaseService';

// Use user service directly
const { data: profile } = await userService.getProfile(userId, isOnline);

// Use workout service directly
const { data: workouts } = await workoutService.getRecentWorkouts(userId, isOnline, 5);
```

### Data Migration

```typescript
import { runMigrations } from '../utils/migrations';

// Run all migrations
await runMigrations({
  onProgress: (message) => console.log(message),
  onComplete: (results) => console.log('Migration complete:', results),
  onError: (error) => console.error('Migration failed:', error)
});

// Run specific migrations
await runMigrations({
  migrateExercises: true,
  migrateMuscleGroups: true,
  migrateWorkoutCategories: false,
  migrateGoals: false
});
``` 