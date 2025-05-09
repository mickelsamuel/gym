import type { NavigatorScreenParams, ParamListBase } from '@react-navigation/native';
export type NavigatorID = string | undefined;
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  AddNewWorkout: undefined;
  EditExercise: { exerciseId: string };
  WorkoutDetail: { workoutId: string };
  ExerciseDetail: { exerciseId: string };
  Settings: undefined;
  EditProfile: undefined;
  WorkoutPlanDetail: { planId: string };
  ExerciseHistory: { exerciseId: string };
  AchievementDetail: { achievementId: string };
  FriendProfile: { userId: string };
  Notifications: undefined;
  [key: string]: undefined | { [key: string]: any } | undefined;
};
export type MainTabParamList = {
  Home: undefined;
  Exercises: undefined;
  Workout: undefined;
  Social: undefined;
  Profile: undefined;
  [key: string]: undefined | { [key: string]: any } | undefined;
};
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 