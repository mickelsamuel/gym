import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  StatusBar,
  ListRenderItemInfo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';
import {Theme, Spacing, BorderRadius} from '../constants/Theme';
import { RootStackParamList } from '../navigation/NavigationTypes';
import { Text } from '../components/ui';
import { Exercise } from '../types/data';
// Define types
interface MuscleGroup {
  id: string;
  name: string;
}
interface WorkoutList {
  id: string;
  name: string;
  exercises: string[];
  userId: string;
  createdBy?: string;
  isPublic?: boolean;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}
// Extended Exercise interface with muscle properties
interface ExtendedExercise {
  id: string;
  name: string;
  muscleGroup?: string;
  primaryMuscles?: string[];
}
// Define navigation and route prop types
type AddExerciseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExercise'>;
type AddExerciseScreenRouteProp = RouteProp<RootStackParamList, 'AddExercise'>;
const AddExerciseScreen: React.FC = () => {
  const navigation = useNavigation<AddExerciseScreenNavigationProp>();
  const route = useRoute<AddExerciseScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { workoutId } = route.params;
  const { getAllExercises, favorites, addFavorite, darkMode } = useContext(ExerciseContext);
  // State
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [workoutList, setWorkoutList] = useState<WorkoutList | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  // Theme
  const theme = darkMode ? Theme.dark : Theme.light;
  // Custom neumorphism style for card effects
  const neumorphism = !darkMode ? {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)'
  } : {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)'
  };
  useEffect(() => {
    async function loadWorkout() {
      setLoading(true);
      try {
        const allLists = await DatabaseService.getAllWorkoutLists();
        const found = allLists.find(l => l.id === workoutId);
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
    }
    loadWorkout();
  }, [workoutId, navigation]);
  const allExercises = getAllExercises() as unknown as ExtendedExercise[];
  // Define muscle groups for filtering
  const muscleGroups: MuscleGroup[] = [
    { id: 'all', name: 'All' },
    { id: 'chest', name: 'Chest' },
    { id: 'back', name: 'Back' },
    { id: 'shoulders', name: 'Shoulders' },
    { id: 'arms', name: 'Arms' },
    { id: 'legs', name: 'Legs' },
    { id: 'core', name: 'Core' },
    { id: 'cardio', name: 'Cardio' },
  ];
  // Filter exercises based on search query and category
  const filteredExercises = allExercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.primaryMuscles && ex.primaryMuscles.some(muscle => 
        muscle.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    const matchesCategory = filterCategory === 'all' || 
      (ex.primaryMuscles && ex.primaryMuscles.some(muscle => 
        muscle.toLowerCase().includes(filterCategory.toLowerCase())
      ));
    return matchesSearch && matchesCategory;
  });
  const toggleSelection = (exerciseId: string): void => {
    Haptics.selectionAsync();
    if (selectedExercises.includes(exerciseId)) {
      setSelectedExercises(selectedExercises.filter(id => id !== exerciseId));
    } else {
      if (workoutList && workoutList.exercises.includes(exerciseId)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Already Added', 'This exercise is already in your workout list.');
      } else {
        setSelectedExercises([...selectedExercises, exerciseId]);
      }
    }
  };
  const handleDone = async (): Promise<void> => {
    if (selectedExercises.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No Selection', 'Please select at least one exercise.');
      return;
    }
    
    if (!workoutId) {
      Alert.alert('Error', 'No workout selected');
      return;
    }
    
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Loop through selected exercises and add each one.
      for (const exerciseId of selectedExercises) {
        if (!favorites.includes(exerciseId)) {
          addFavorite(exerciseId);
        }
        await DatabaseService.addExerciseToList(workoutId, exerciseId);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success', 
        `${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''} added to your workout.`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not add selected exercises.');
      setSubmitting(false);
    }
  };
  const renderCategoryPill = ({ item }: ListRenderItemInfo<MuscleGroup>) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        filterCategory === item.id && styles.categoryPillSelected,
        { backgroundColor: darkMode ? theme.card : theme.card }
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        setFilterCategory(item.id);
      }}
    >
      <Text 
        variant="caption"
        style={[
          styles.categoryPillText,
          { 
            color: filterCategory === item.id ? 
              theme.primary : theme.textSecondary,
            fontWeight: filterCategory === item.id ? "600" : "400"
          }
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  const renderExerciseItem = ({ item }: ListRenderItemInfo<ExtendedExercise>) => {
    const isSelected = selectedExercises.includes(item.id);
    const isAlreadyInWorkout = workoutList && workoutList.exercises.includes(item.id);
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ 
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
              extrapolate: 'clamp'
            })
          }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.exerciseCard,
            neumorphism,
            { 
              backgroundColor: theme.card,
              borderColor: isSelected ? theme.primary : 'transparent',
              borderWidth: isSelected ? 2 : 0,
            }
          ]}
          onPress={() => toggleSelection(item.id)}
          disabled={Boolean(isAlreadyInWorkout)}
          activeOpacity={0.7}
        >
          <View style={styles.exerciseCardContent}>
            <View style={styles.exerciseInfo}>
              <View style={styles.exerciseHeader}>
                <Text 
                  variant="body"
                  style={[
                    styles.exerciseName, 
                    { color: theme.text, fontWeight: "600" }
                  ]}
                >
                  {item.name}
                </Text>
                {isAlreadyInWorkout && (
                  <View style={[
                    styles.alreadyAddedBadge,
                    { backgroundColor: `${theme.success}30` }
                  ]}>
                    <Text 
                      variant="caption"
                      style={[
                        styles.alreadyAddedText,
                        { color: theme.success }
                      ]}
                    >
                      Added
                    </Text>
                  </View>
                )}
              </View>
              <Text 
                variant="caption"
                style={[
                  styles.muscleGroups, 
                  { color: theme.textSecondary }
                ]}
              >
                {item.primaryMuscles?.join(', ')}
              </Text>
            </View>
            <View style={[
              styles.selectionCircle, 
              { 
                borderColor: isSelected ? theme.primary : 
                  ((darkMode || false) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
              }
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={theme.primary} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { 
        backgroundColor: theme.background,
        paddingTop: insets.top 
      }]}>
        <StatusBar barStyle={(darkMode || false) ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text 
          variant="body"
          style={{ 
            color: theme.textSecondary,
            marginTop: Spacing.md
          }}
        >
          Loading exercises...
        </Text>
      </View>
    );
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { 
        backgroundColor: theme.background,
        paddingTop: insets.top 
      }]}>
        <StatusBar barStyle={(darkMode || false) ? "light-content" : "dark-content"} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme.text} 
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text 
              variant="title"
              style={{ color: theme.text }}
            >
              Add Exercises
            </Text>
            <Text 
              variant="caption"
              style={{ color: theme.textSecondary }}
            >
              {workoutList?.name || 'Workout'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.doneButton,
              {
                opacity: selectedExercises.length === 0 ? 0.5 : 1
              }
            ]}
            onPress={handleDone}
            disabled={selectedExercises.length === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text 
                variant="body"
                style={{ 
                  color: theme.primary,
                  fontWeight: "600" 
                }}
              >
                Done
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.searchContainer, neumorphism, { 
            backgroundColor: theme.card
          }]}>
            <Ionicons 
              name="search" 
              size={20} 
              color={theme.textSecondary} 
              style={styles.searchIcon} 
            />
            <TextInput
              style={[styles.searchInput, { 
                color: theme.text
              }]}
              placeholder="Search exercises..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              data={muscleGroups}
              renderItem={renderCategoryPill}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>
          <View style={styles.resultsHeader}>
            <Text 
              variant="caption"
              style={{ color: theme.textSecondary }}
            >
              {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'} found
            </Text>
            {selectedExercises.length > 0 && (
              <Text 
                variant="caption"
                style={{ 
                  color: theme.primary,
                  fontWeight: "600" 
                }}
              >
                {selectedExercises.length} selected
              </Text>
            )}
          </View>
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exercisesList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="barbell-outline"
                  size={60}
                  color={theme.textSecondary}
                />
                <Text 
                  variant="title"
                  style={{ 
                    color: theme.text,
                    marginTop: Spacing.md,
                    marginBottom: Spacing.sm 
                  }}
                >
                  No exercises found
                </Text>
                <Text 
                  variant="body"
                  style={{ 
                    color: theme.textSecondary,
                    textAlign: 'center'
                  }}
                >
                  Try a different search term or category
                </Text>
              </View>
            }
          />
        </Animated.View>
        {selectedExercises.length > 0 && (
          <Animated.View 
            style={[
              styles.floatingButtonContainer,
              { opacity: fadeAnim }
            ]}
          >
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleDone}
              disabled={submitting}
            >
              <LinearGradient
                colors={[theme.primary, theme.primary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text 
                      variant="body"
                      style={styles.floatingButtonText}
                    >
                      Add {selectedExercises.length} {selectedExercises.length === 1 ? 'Exercise' : 'Exercises'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    padding: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: Spacing.md,
  },
  categoriesList: {
    paddingVertical: Spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    marginRight: Spacing.sm,
  },
  categoryPillSelected: {
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  resultsText: {
    fontSize: 14,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exercisesList: {
    paddingBottom: 100,
  },
  exerciseCard: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  exerciseCardContent: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  muscleGroups: {
    fontSize: 14,
  },
  alreadyAddedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  alreadyAddedText: {
    fontSize: 12,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  floatingButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
export default AddExerciseScreen; 