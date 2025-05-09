import {ParamListBase} from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Define NavigatorID as a string or undefined
export type NavigatorID = string | undefined;
// Extend the ParamListBase for both navigators
export type MainTabParamList = {
  Home: undefined;
  Exercises: undefined;
  Workout: undefined;
  Social: undefined;
  Profile: undefined;
  [key: string]: undefined | { [key: string]: any } | undefined;
};
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: { email?: string };
  ExerciseDetail: { exerciseId: string };
  WorkoutDetail: { workoutId: string };
  CustomWorkoutDetail: { workoutId: string; isEditing?: boolean };
  AddExercise: { workoutId?: string; returnToWorkout?: boolean };
  FriendRequests: undefined;
  FriendProfile: { userId: string };
  WorkoutLog: { date?: string; workoutId?: string; isStarting?: boolean };
  [key: string]: undefined | { [key: string]: any } | undefined;
};
// Note: We're not declaring a module here to avoid duplicate identifier issues
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
// Navigation props for each screen
export type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;
export type ExercisesScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Exercises'>;
export type WorkoutScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Workout'>;
export type SocialScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Social'>;
export type ProfileScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;
// Route props for each screen that takes parameters
export type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;
export type WorkoutDetailRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;
export type FriendProfileRouteProp = RouteProp<RootStackParamList, 'FriendProfile'>;
export type CustomWorkoutDetailRouteProp = RouteProp<RootStackParamList, 'CustomWorkoutDetail'>;
export type AddExerciseRouteProp = RouteProp<RootStackParamList, 'AddExercise'>;
// Combined navigation and route prop types for screens that need both
export type ExerciseDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
};
export type WorkoutDetailScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'WorkoutDetail'>;
  route: WorkoutDetailRouteProp;
};
export type FriendProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'FriendProfile'>;
  route: FriendProfileRouteProp;
};
export type CustomWorkoutDetailScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'CustomWorkoutDetail'>;
  route: CustomWorkoutDetailRouteProp;
};
export type AddExerciseScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'AddExercise'>;
  route: AddExerciseRouteProp;
}; 