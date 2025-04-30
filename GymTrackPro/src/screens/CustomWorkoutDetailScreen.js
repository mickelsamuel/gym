import React, { useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';
import { Colors as ThemeColors, Typography, Spacing, BorderRadius, createNeumorphism } from '../constants/Theme';
import { BlurView } from 'expo-blur';

const CustomWorkoutDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { listId } = route.params;
  const { getExerciseById, darkMode } = useContext(ExerciseContext);
  
  // State
  const [workoutList, setWorkoutList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerHeight = useRef(new Animated.Value(200)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Theme
  const theme = darkMode ? ThemeColors.dark : ThemeColors.light;
  const neumorphism = createNeumorphism(!darkMode, 4);

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
  const loadWorkout = async () => {
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
  
  const navigateToExercise = (exerciseId) => {
    Haptics.selectionAsync();
    navigation.navigate('ExerciseDetail', { exerciseId });
  };
  
  const handleAddExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddExerciseScreen', { listId });
  };
  
  const handleDeleteExercise = async (exerciseId) => {
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
            setIsSaving(true);
            try {
              await DatabaseService.removeExerciseFromList(listId, exerciseId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadWorkout();
            } catch (error) {
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
  
  const handleStartWorkout = () => {
    if (!workoutList || workoutList.exercises.length === 0) {
      Alert.alert('Empty Workout', 'Add some exercises before starting this workout.');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('WorkoutDetail', { workoutId: listId });
  };
  
  const handleShareWorkout = async () => {
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
          Loading workout...
        </Text>
      </View>
    );
  }

  const listExercises = workoutList ? workoutList.exercises
    .map(id => getExerciseById(id))
    .filter(Boolean) : [];
  
  const formattedDate = workoutList?.createdAt 
    ? new Date(workoutList.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) 
    : 'Unknown date';

  return (
    <View style={[styles.container, { 
      backgroundColor: darkMode ? ThemeColors.darkBackground : ThemeColors.lightBackground,
    }]}>
      <StatusBar barStyle="light-content" backgroundColor={ThemeColors.primaryDarkBlue} />
      
      <Animated.View style={[
        styles.header, 
        {
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
          paddingTop: insets.top
        }
      ]}>
        <LinearGradient
          colors={[ThemeColors.primaryDarkBlue, ThemeColors.primaryBlue]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <Animated.View style={[
            styles.titleContainer, 
            { transform: [{ scale: titleScale }] }
          ]}>
            <Text style={styles.title}>{workoutList?.name || 'Workout'}</Text>
            <Text style={styles.dateText}>Created on {formattedDate}</Text>
          </Animated.View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleShareWorkout}
            >
              <Ionicons name="share-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{listExercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartWorkout}
            disabled={listExercises.length === 0}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
            <Ionicons name="play" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <Animated.FlatList
        style={[styles.exerciseList, { opacity: fadeAnim }]}
        contentContainerStyle={[
          styles.listContent, 
          { paddingTop: 200 + insets.top }
        ]}
        data={listExercises}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            <Text style={[styles.sectionTitle, { 
              color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
            }]}>
              Exercises
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="barbell-outline" 
              size={60} 
              color={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight} 
            />
            <Text style={[styles.emptyText, { 
              color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
            }]}>
              No exercises yet
            </Text>
            <Text style={[styles.emptySubtext, { 
              color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight 
            }]}>
              Add exercises to build your workout
            </Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addButton, neumorphism, { 
                backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground 
              }]}
              onPress={handleAddExercise}
            >
              <Ionicons 
                name="add-circle-outline" 
                size={24} 
                color={ThemeColors.primaryBlue}
                style={styles.addButtonIcon} 
              />
              <Text style={[styles.addButtonText, { color: ThemeColors.primaryBlue }]}>
                Add Exercise
              </Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Animated.View
            style={{ 
              opacity: fadeAnim, 
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }) 
              }],
            }}
          >
            <TouchableOpacity
              style={[styles.exerciseCard, neumorphism, { 
                backgroundColor: darkMode ? ThemeColors.darkCardBackground : ThemeColors.lightCardBackground 
              }]}
              onPress={() => navigateToExercise(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { 
                  color: darkMode ? ThemeColors.primaryTextDark : ThemeColors.primaryTextLight 
                }]}>
                  {item.name}
                </Text>
                <Text style={[styles.muscleGroupText, { 
                  color: darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight 
                }]}>
                  {item.primaryMuscles?.join(', ')}
                </Text>
              </View>
              
              <View style={styles.exerciseActions}>
                <TouchableOpacity
                  style={styles.exerciseActionButton}
                  onPress={() => handleDeleteExercise(item.id)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={ThemeColors.accentDanger} />
                  ) : (
                    <Ionicons 
                      name="trash-outline" 
                      size={20} 
                      color={ThemeColors.accentDanger} 
                    />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.exerciseActionButton}
                  onPress={() => navigateToExercise(item.id)}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={darkMode ? ThemeColors.secondaryTextDark : ThemeColors.secondaryTextLight} 
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </View>
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
    position: 'absolute',
    left: 0,
    right: 0,
    height: 200,
    zIndex: 10,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  dateText: {
    fontSize: Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  statLabel: {
    fontSize: Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    marginRight: Spacing.xs,
  },
  exerciseList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.semibold,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  exerciseName: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    marginBottom: 2,
  },
  muscleGroupText: {
    fontSize: Typography.small,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseActionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: Typography.sectionHeader,
    fontWeight: Typography.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.body,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: Spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  addButtonIcon: {
    marginRight: Spacing.xs,
  },
  addButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
});

export default CustomWorkoutDetailScreen;