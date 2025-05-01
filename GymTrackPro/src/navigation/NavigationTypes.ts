import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Workout: undefined;
  Social: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  EmailVerification: undefined;
  
  // Main app screens
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  
  // Workout related screens
  WorkoutDetail: { workoutId: string };
  WorkoutLog: { workoutId: string; isStarting?: boolean };
  CustomWorkoutDetail: { workoutId: string; isEditing?: boolean };
  CustomWorkoutDetailScreen: { listId: string };
  
  // Exercise related screens
  ExerciseDetail: { exerciseId: string };
  ExercisesScreen: undefined;
  AddExerciseScreen: { listId: string };
  
  // Social screens
  FriendRequestsScreen: undefined;
  FriendProfileScreen: { userId: string };
  
  // Settings and other screens
  Settings: undefined;
  EditProfile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 