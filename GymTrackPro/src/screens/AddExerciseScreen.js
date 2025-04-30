import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';
import { Colors as ThemeColors, Typography, Spacing, BorderRadius, createNeumorphism } from '../constants/Theme';
import { BlurView } from 'expo-blur';

const AddExerciseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { listId } = route.params;
  const { getAllExercises, favorites, addFavorite, darkMode } = useContext(ExerciseContext);
  
  // State
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutList, setWorkoutList] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Theme
  const theme = darkMode ? ThemeColors.dark : ThemeColors.light;
  const neumorphism = createNeumorphism(!darkMode, 4);

  useEffect(() => {
    async function loadWorkout() {
      setLoading(true);
      try {
        const allLists = await DatabaseService.getAllWorkoutLists();
        const found = allLists.find(l => l.id === listId);
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
  }, [listId]);

  const allExercises = getAllExercises();
  
  // Define muscle groups for filtering
  const muscleGroups = [
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

  const toggleSelection = (exerciseId) => {
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

  const handleDone = async () => {
    if (selectedExercises.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No Selection', 'Please select at least one exercise.');
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
        await DatabaseService.addExerciseToList(listId, exerciseId);
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

  const renderCategoryPill = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        filterCategory === item.id && styles.categoryPillSelected,
        { backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground }
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        setFilterCategory(item.id);
      }}
    >
      <Text 
        style={[
          styles.categoryPillText,
          filterCategory === item.id && styles.categoryPillTextSelected,
          { color: filterCategory === item.id ? 
            ThemeColors.primaryBlue : 
            (darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight) 
          }
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderExerciseItem = ({ item, index }) => {
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
              backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground,
              borderColor: isSelected ? ThemeColors.primaryBlue : 'transparent',
              borderWidth: isSelected ? 2 : 0,
            }
          ]}
          onPress={() => toggleSelection(item.id)}
          disabled={isAlreadyInWorkout}
          activeOpacity={0.7}
        >
          <View style={styles.exerciseCardContent}>
            <View style={styles.exerciseInfo}>
              <View style={styles.exerciseHeader}>
                <Text 
                  style={[
                    styles.exerciseName, 
                    { color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight }
                  ]}
                >
                  {item.name}
                </Text>
                {isAlreadyInWorkout && (
                  <View style={styles.alreadyAddedBadge}>
                    <Text style={styles.alreadyAddedText}>Added</Text>
                  </View>
                )}
              </View>
              
              <Text 
                style={[
                  styles.muscleGroups, 
                  { color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight }
                ]}
              >
                {item.primaryMuscles?.join(', ')}
              </Text>
            </View>
            
            <View style={[
              styles.selectionCircle, 
              { 
                borderColor: isSelected ? ThemeColors.primaryBlue : 
                  (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
              }
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={ThemeColors.primaryBlue} />
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
        backgroundColor: darkMode ? ThemeColors.darkBackground : ThemeColors.lightBackground,
        paddingTop: insets.top 
      }]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={ThemeColors.primaryBlue} />
        <Text style={[styles.loadingText, { 
          color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
        }]}>
          Loading exercises...
        </Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { 
        backgroundColor: darkMode ? ThemeColors.darkBackground : ThemeColors.lightBackground,
        paddingTop: insets.top 
      }]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        
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
              color={darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight} 
            />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={[styles.screenTitle, { 
              color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
            }]}>
              Add Exercises
            </Text>
            <Text style={[styles.workoutName, { 
              color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight 
            }]}>
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
              <ActivityIndicator size="small" color={ThemeColors.primaryBlue} />
            ) : (
              <Text style={[styles.doneButtonText, { color: ThemeColors.primaryBlue }]}>
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
            backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground 
          }]}>
            <Ionicons 
              name="search" 
              size={20} 
              color={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight} 
              style={styles.searchIcon} 
            />
            <TextInput
              style={[styles.searchInput, { 
                color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
              }]}
              placeholder="Search exercises..."
              placeholderTextColor={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight}
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
            <Text style={[styles.resultsText, { 
              color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight 
            }]}>
              {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'} found
            </Text>
            {selectedExercises.length > 0 && (
              <Text style={[styles.selectedCountText, { color: ThemeColors.primaryBlue }]}>
                {selectedExercises.length} selected
              </Text>
            )}
          </View>
          
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exercisesList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="barbell-outline"
                  size={60}
                  color={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight}
                />
                <Text style={[styles.emptyStateText, { 
                  color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
                }]}>
                  No exercises found
                </Text>
                <Text style={[styles.emptyStateSubtext, { 
                  color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight 
                }]}>
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
                colors={[ThemeColors.primaryBlue, ThemeColors.primaryDarkBlue]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.floatingButtonText}>
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
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.body,
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
  screenTitle: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.bold,
  },
  workoutName: {
    fontSize: Typography.caption,
    marginTop: 2,
  },
  doneButton: {
    padding: Spacing.sm,
  },
  doneButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: Typography.body,
  },
  categoriesContainer: {
    marginBottom: Spacing.md,
  },
  categoriesList: {
    paddingRight: Spacing.md,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryPillSelected: {
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
    borderColor: ThemeColors.primaryBlue,
  },
  categoryPillText: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
  },
  categoryPillTextSelected: {
    fontWeight: Typography.semibold,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  resultsText: {
    fontSize: Typography.small,
  },
  selectedCountText: {
    fontSize: Typography.small,
    fontWeight: Typography.semibold,
  },
  exercisesList: {
    paddingBottom: Spacing.xxl * 2,
  },
  exerciseCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
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
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    marginRight: Spacing.sm,
  },
  alreadyAddedBadge: {
    backgroundColor: 'rgba(46, 203, 112, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  alreadyAddedText: {
    fontSize: Typography.small,
    color: ThemeColors.accentSuccess,
    fontWeight: Typography.medium,
  },
  muscleGroups: {
    fontSize: Typography.small,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Typography.body,
    textAlign: 'center',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  floatingButton: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  floatingButtonText: {
    color: '#FFF',
    fontSize: Typography.button,
    fontWeight: Typography.semibold,
    marginRight: Spacing.sm,
  },
});

export default AddExerciseScreen;