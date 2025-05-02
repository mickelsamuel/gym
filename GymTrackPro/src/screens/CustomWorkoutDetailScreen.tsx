import React, { useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Share,
  ListRenderItemInfo,
  ViewStyle,
  TextStyle,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/NavigationTypes';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';
import { useAuth } from '../context/AuthContext';
import { Colors, Theme, Typography, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { BlurView } from 'expo-blur';

// Import custom UI components
import { 
  Text, 
  Button, 
  Card, 
  Container 
} from '../components/ui';

// Types
interface WorkoutList {
  id: string;
  name: string;
  exercises: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment?: string;
  description?: string;
  image?: string;
  videoUrl?: string;
}

type CustomWorkoutDetailScreenRouteProp = RouteProp<RootStackParamList, 'CustomWorkoutDetailScreen'>;

const CustomWorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CustomWorkoutDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { listId } = route.params;
  const { getExerciseById, darkMode } = useContext(ExerciseContext);
  const { isOnline } = useAuth();
  
  // State
  const [workoutList, setWorkoutList] = useState<WorkoutList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerHeight = useRef(new Animated.Value(200)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Theme
  const theme = darkMode ? Theme.dark : Theme.light;

  // Header animation interpolations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.6],
    extrapolate: 'clamp'
  });
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp'
  });
  
  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp'
  });

  // Function to load the workout list
  const loadWorkout = async (): Promise<void> => {
    setLoading(true);
    try {
      const allLists = await DatabaseService.getAllWorkoutLists();
      const found = allLists.find((l) => l.id === listId);
      if (found) {
        setWorkoutList(found);
        
        // Run animations after data is loaded
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Alert.alert('Error', 'Workout list not found.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      Alert.alert('Error', 'An error occurred while loading the workout.');
    } finally {
      setLoading(false);
    }
  };

  // Load workout when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadWorkout();
      return () => {
        // Reset animation values when screen loses focus
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
      };
    }, [listId])
  );
  
  const navigateToExercise = (exerciseId: string): void => {
    Haptics.selectionAsync();
    navigation.navigate('ExerciseDetail', { exerciseId });
  };
  
  const handleAddExercise = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddExerciseScreen', { listId });
  };
  
  const handleDeleteExercise = async (exerciseId: string): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise from the workout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!isOnline) {
              Alert.alert('Error', 'You are offline. Cannot remove exercise.');
              return;
            }

            setIsSaving(true);
            try {
              await DatabaseService.removeExerciseFromList(listId, exerciseId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadWorkout();
            } catch (error) {
               if (error instanceof Error) {
                console.error('Error removing exercise:', error.message);
              } else {
                 console.error('Error removing exercise:', error);
              }

              console.error('Error removing exercise:', error);
              Alert.alert('Error', 'Failed to remove exercise. Please try again.');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };
  
  const handleStartWorkout = (): void => {
    if (!isOnline) {
      Alert.alert('Error', 'You are offline. Cannot start workout.');
      return;
    }
    if (!workoutList || !workoutList.exercises || workoutList.exercises.length === 0) {
      Alert.alert('Empty Workout', 'Add some exercises before starting this workout.');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('WorkoutDetail', { workoutId: listId });
  };
  
  const handleShareWorkout = async (): Promise<void> => {
    if (!workoutList) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const exerciseNames = workoutList.exercises
        .map(id => {
          const exercise = getExerciseById(id);
          return exercise ? exercise.name : null;
        })
        .filter(Boolean);
      
      const shareMessage = `Check out my "${workoutList.name}" workout in GymTrackPro:\n\n${exerciseNames.join('\n- ')}`;
      
      const result = await Share.share({
        message: shareMessage,
        title: `GymTrackPro: ${workoutList.name} Workout`
      });
      
      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error sharing workout:', error);
      Alert.alert('Error', 'Failed to share workout. Please try again.');
    }
  };

  const renderExerciseItem = ({ item, index }: { item: string; index: number }): JSX.Element => {
    const exercise = getExerciseById(item);
    if (!exercise) return <View />;
    
    return (
      <Animated.View
        style={[
          styles.exerciseItem,
          { 
            backgroundColor: theme.card,
            transform: [
              { translateY: slideAnim },
              { scale: fadeAnim }
            ],
            opacity: fadeAnim
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.exerciseContent}
          onPress={() => navigateToExercise(exercise.id)}
          activeOpacity={0.7}
        >
          {exercise.image ? (
            <Image 
              source={{ uri: exercise.image }} 
              style={styles.exerciseImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.exerciseImagePlaceholder, { backgroundColor: theme.border }]}>
              <Ionicons name="barbell-outline" size={24} color={theme.textSecondary} />
            </View>
          )}
          
          <View style={styles.exerciseDetails}>
            <Text variant="body" style={{ fontWeight: '600' }}>
              {exercise.name}
            </Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>
              {exercise.muscle}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteExercise(exercise.id)}
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <Container>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
            Loading workout...
          </Text>
        </View>
      </Container>
    );
  }

  // Calculate exercise count safely
  const exerciseCount = workoutList?.exercises?.length || 0;
  const hasExercises = exerciseCount > 0;

  return (
    <Container>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { 
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
          backgroundColor: theme.background,
          paddingTop: insets.top,
          borderBottomColor: theme.border
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Animated.View style={[
          styles.titleContainer,
          { transform: [{ scale: titleScale }] }
        ]}>
          <Text variant="heading2" numberOfLines={1} style={{ maxWidth: '80%' }}>
            {workoutList?.name || 'Workout'}
          </Text>
        </Animated.View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareWorkout}
        >
          <Ionicons name="share-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <Animated.FlatList
        data={workoutList?.exercises || []}
        keyExtractor={(item, index) => `exercise-${item}-${index}`}
        renderItem={renderExerciseItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: 100 + insets.top, paddingBottom: insets.bottom + 100 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View>
            <Text
              variant="body"
              style={{ 
                marginBottom: Spacing.lg,
                color: theme.textSecondary
              }}
            >
              {exerciseCount} Exercises
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons 
              name="barbell-outline" 
              size={64} 
              color={theme.textSecondary + '40'} 
            />
            <Text
              variant="body"
              style={{ 
                marginTop: Spacing.md,
                marginBottom: Spacing.md,
                color: theme.textSecondary,
                textAlign: 'center'
              }}
            >
              No exercises yet. Add some to get started.
            </Text>
            <Button
              title="Add Exercise"
              onPress={handleAddExercise}
              type="primary"
            />
             {!isOnline && <Text style={{ color: theme.danger }}>You are offline. You can not add an exercise.</Text>}
          </View>
        }
        ListFooterComponent={
          hasExercises ? (
            <View style={{ paddingVertical: Spacing.lg }}>
              <Button 
                title="Add More Exercises"
                onPress={handleAddExercise}
                type="secondary"
                fullWidth
                icon="add-circle-outline"
                disabled={!isOnline}
              />
            </View>
          ) : null
        }
      />

      {/* Bottom Action Bar */}
      {hasExercises && (
        <View style={[
          styles.bottomBar,
          { 
            backgroundColor: theme.card,
            paddingBottom: insets.bottom || Spacing.md,
            borderTopColor: theme.border,
            ...createElevation(3)
          }
        ]}>
          <Button
            title="Start Workout"
            onPress={handleStartWorkout}
            type="primary"
            size="large"
            fullWidth
            icon="play"
            loading={isSaving}
            disabled={!isOnline}
          />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  exerciseItem: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...createElevation(2),
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
  },
  exerciseImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
});

export default CustomWorkoutDetailScreen; 