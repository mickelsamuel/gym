import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  Image,
  Text
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';
import DatabaseService from '../services/DatabaseService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Import our custom UI components
import { Title, Heading, Subheading, Body, Caption } from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Container from '../../components/ui/Container';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

const WorkoutScreen = () => {
  const navigation = useNavigation();
  const {
    userGoal,
    getExerciseById,
    favorites,
    darkMode,
    loading: globalLoading,
    getSuggestedWeight,
    getSuggestedReps
  } = useContext(ExerciseContext);
  
  const [workoutLists, setWorkoutLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [showFavorites, setShowFavorites] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const favoritesHeight = useRef(new Animated.Value(0)).current;
  
  // Initialize a default colors object in case the import fails
  const defaultColors = {
    light: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#F8F9FA',
      backgroundSecondary: '#FFFFFF',
      text: '#333333',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#E0E0E0',
      card: '#FFFFFF',
      warning: '#FF9500',
      success: '#28A745',
      danger: '#FF3B30',
      info: '#5AC8FA',
      shadow: 'rgba(0,0,0,0.1)',
    },
    dark: {
      primary: '#0A84FF',
      secondary: '#5E5CE6',
      background: '#1C1C1E',
      backgroundSecondary: '#2C2C2E',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
      textTertiary: '#888888',
      border: '#555555',
      card: '#2C2C2E',
      warning: '#FF9F0A',
      success: '#33CF4D',
      danger: '#FF453A',
      info: '#64D2FF',
      shadow: 'rgba(0,0,0,0.3)',
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = darkMode ? colorScheme.dark : colorScheme.light;

  // Load all workout lists on initial render
  useEffect(() => {
    loadAllWorkouts();
    
    // Animate elements when component mounts
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
      })
    ]).start();
    
    // Load recent workout history
    loadRecentWorkouts();
  }, []);

  // Toggle animation for favorites section
  useEffect(() => {
    toggleFavoritesAnimation();
  }, [showFavorites]);

  // Refresh workout lists when screen regains focus
  useFocusEffect(
    useCallback(() => {
      loadAllWorkouts();
      loadRecentWorkouts();
    }, [])
  );
  
  // Animate showing/hiding favorites section
  const toggleFavoritesAnimation = () => {
    if (showFavorites) {
      favoritesHeight.setValue(0);
      Animated.timing(favoritesHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      }).start();
    } else {
      Animated.timing(favoritesHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
  };
  
  // Load all custom workout plans
  const loadAllWorkouts = async () => {
    setLoading(true);
    try {
      const lists = await DatabaseService.getAllWorkoutLists();
      setWorkoutLists(lists);
    } catch (error) {
      console.error("Error loading workout lists:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load user's recent workout history
  const loadRecentWorkouts = async () => {
    try {
      const history = await DatabaseService.getRecentWorkouts();
      setRecentWorkouts(history?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error loading recent workouts:", error);
    }
  };
  
  // Refresh workout data
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadAllWorkouts(),
        loadRecentWorkouts()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Create a new workout list
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Enter a name for your new workout list.');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const newPlan = await DatabaseService.createWorkoutList(newListName.trim());
      setNewListName('');
      await loadAllWorkouts();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Could not create new workout list.');
      console.error("Error creating workout list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to workout detail screen
  const handleOpenList = (list) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CustomWorkoutDetailScreen', { listId: list.id });
  };

  // Get user's favorite exercises
  const favoriteExercises = favorites
    .map((favId) => getExerciseById(favId))
    .filter(Boolean);
    
  // Get suggestions for next workout based on user's goal and history
  const getNextWorkoutSuggestions = (exerciseId) => {
    if (!exerciseId) return null;
    
    const suggestedWeight = getSuggestedWeight(exerciseId);
    const suggestedReps = getSuggestedReps(exerciseId);
    
    if (!suggestedWeight && !suggestedReps) return null;
    
    return {
      weight: suggestedWeight,
      reps: suggestedReps
    };
  };
  
  // Get color by muscle category
  const getCategoryColor = (category) => {
    const categoryColors = {
      "Chest": "#FF9500",
      "Back": "#5856D6",
      "Arms": "#FF2D55",
      "Shoulders": "#5AC8FA",
      "Legs": "#4CD964",
      "Core": "#FFCC00",
      "Cardio": "#FF3B30",
      "Full Body": "#007AFF"
    };
    
    return categoryColors[category] || colors.primary;
  };

  // Render each workout list item
  const renderWorkoutList = ({ item, index }) => {
    // Get initial 3 exercises for preview
    const previewExercises = item.exercises
      .slice(0, 3)
      .map(exerciseId => getExerciseById(exerciseId))
      .filter(Boolean);
      
    const animationDelay = index * 100;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.listCard,
            { backgroundColor: colors.backgroundSecondary }
          ]}
          onPress={() => handleOpenList(item)}
          activeOpacity={0.7}
        >
          <View style={styles.listCardContent}>
            <View style={styles.listCardHeader}>
              <View>
                <Text style={[styles.listCardTitle, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.listCardSubtitle, { color: colors.textSecondary }]}>
                  {item.exercises.length} {item.exercises.length === 1 ? 'exercise' : 'exercises'}
                </Text>
              </View>
              <View style={[styles.workoutListIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="list" size={18} color={colors.primary} />
              </View>
            </View>
            
            {item.exercises.length > 0 && (
              <View style={styles.exercisePreview}>
                {previewExercises.map(exercise => {
                  if (!exercise) return null;
                  const categoryColor = getCategoryColor(exercise.category);
                  
                  return (
                    <View 
                      key={exercise.id} 
                      style={[
                        styles.exerciseChip,
                        { backgroundColor: categoryColor + '20' }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.exerciseChipText, 
                          { color: categoryColor }
                        ]}
                      >
                        {exercise.name}
                      </Text>
                    </View>
                  );
                })}
                
                {item.exercises.length > 3 && (
                  <View style={[styles.moreChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.moreChipText, { color: colors.textSecondary }]}>
                      +{item.exercises.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.listCardFooter}>
              <TouchableOpacity 
                style={[styles.startButton, { backgroundColor: colors.primary }]}
                onPress={() => handleOpenList(item)}
              >
                <Text style={styles.startButtonText}>Start Workout</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Render each favorite exercise item
  const renderFavoriteExercise = ({ item, index }) => {
    const suggestions = getNextWorkoutSuggestions(item.id);
    const categoryColor = getCategoryColor(item.category);
    
    return (
      <TouchableOpacity 
        style={[
          styles.favoriteCard,
          { backgroundColor: colors.backgroundSecondary }
        ]}
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.favoriteCardHeader}>
          <View style={styles.favoriteInfo}>
            <Text 
              style={[styles.favoriteTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.favoriteSubInfo}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '30' }]}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {item.category}
                </Text>
              </View>
              <Ionicons name="star" size={16} color={colors.warning} style={{ marginLeft: 8 }} />
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.quickLogButton, { backgroundColor: colors.success + '20' }]}
            onPress={() => navigation.navigate('ExerciseDetail', { 
              exerciseId: item.id,
              logWorkout: true 
            })}
          >
            <Ionicons name="add-circle" size={18} color={colors.success} />
            <Text style={[styles.quickLogText, { color: colors.success }]}>Log</Text>
          </TouchableOpacity>
        </View>
        
        {suggestions && (
          <View style={styles.suggestionContainer}>
            <Text style={[styles.suggestionTitle, { color: colors.textSecondary }]}>
              Suggested for next workout:
            </Text>
            
            <View style={styles.suggestionDetails}>
              {suggestions.weight && (
                <View style={styles.suggestionItem}>
                  <Ionicons name="barbell-outline" size={14} color={colors.primary} />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
                    {suggestions.weight} kg
                  </Text>
                </View>
              )}
              
              {suggestions.reps && (
                <View style={styles.suggestionItem}>
                  <Ionicons name="repeat-outline" size={14} color={colors.primary} />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
                    {suggestions.reps.min}-{suggestions.reps.max} reps
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  // Render recent workout item
  const renderRecentWorkout = ({ item, index }) => {
    const exercise = getExerciseById(item.exerciseId);
    if (!exercise) return null;
    
    const date = new Date(item.date);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    const categoryColor = getCategoryColor(exercise.category);
    
    return (
      <TouchableOpacity 
        style={[styles.recentWorkoutItem, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.recentWorkoutIcon, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons name="barbell-outline" size={18} color={categoryColor} />
        </View>
        
        <View style={styles.recentWorkoutInfo}>
          <Text style={[styles.recentWorkoutName, { color: colors.text }]} numberOfLines={1}>
            {exercise.name}
          </Text>
          <View style={styles.recentWorkoutDetails}>
            <Text style={[styles.recentWorkoutData, { color: colors.textSecondary }]}>
              {item.sets}×{item.reps} • {item.weight} kg
            </Text>
            <Text style={[styles.recentWorkoutDate, { color: colors.textTertiary }]}>
              {formattedDate}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Container dark={darkMode} style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Animated.View 
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Title style={[styles.screenTitle, { color: colors.text }]}>My Workouts</Title>
            
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => navigation.navigate('Exercises')}
            >
              <Ionicons name="search-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Create new workout list */}
        <Animated.View
          style={[
            styles.createWorkoutCard,
            { 
              backgroundColor: colors.backgroundSecondary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.createWorkoutHeader}>
            <Text style={[styles.createWorkoutTitle, { color: colors.text }]}>
              Create Workout Plan
            </Text>
            <Ionicons name="add-circle" size={22} color={colors.primary} />
          </View>
          
          <Text style={[styles.createWorkoutSubtitle, { color: colors.textSecondary }]}>
            Build a custom workout routine and track your progress
          </Text>
          
          <View style={styles.createRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background + '80',
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder="e.g. Chest and Triceps"
              placeholderTextColor={colors.textTertiary}
              value={newListName}
              onChangeText={setNewListName}
            />
            
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: colors.primary },
                (!newListName.trim() || loading) && { opacity: 0.6 }
              ]}
              onPress={handleCreateList}
              disabled={!newListName.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Recent Workouts Section */}
        {recentWorkouts.length > 0 && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Workouts
              </Text>
              <TouchableOpacity>
                <Text style={[styles.sectionAction, { color: colors.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentWorkoutsContainer}
            >
              {recentWorkouts.map((workout, index) => (
                <View key={index} style={{ marginRight: 12 }}>
                  {renderRecentWorkout({ item: workout, index })}
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
        
        {/* Workout Lists Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Workout Plans
          </Text>
          {workoutLists.length > 0 && (
            <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
              {workoutLists.length} {workoutLists.length === 1 ? 'plan' : 'plans'}
            </Text>
          )}
        </View>
        
        {loading || globalLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : workoutLists.length > 0 ? (
          <View style={styles.workoutListsGrid}>
            {workoutLists.map((item, index) => (
              <View key={item.id} style={styles.workoutListItem}>
                {renderWorkoutList({ item, index })}
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyStateCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons 
              name="list-outline" 
              size={48} 
              color={colors.textTertiary} 
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No workout plans yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Create your first workout plan above
            </Text>
          </View>
        )}
        
        {/* Favorites Section */}
        <TouchableOpacity
          style={[
            styles.toggleBar, 
            { backgroundColor: colors.backgroundSecondary }
          ]}
          onPress={() => {
            setShowFavorites(!showFavorites);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.toggleBarContent}>
            <View style={[styles.toggleBarIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="star" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.toggleBarText, { color: colors.text }]}>
              Favorite Exercises {favoriteExercises.length > 0 && `(${favoriteExercises.length})`}
            </Text>
          </View>
          
          <Ionicons
            name={showFavorites ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
        
        <Animated.View
          style={{
            maxHeight: favoritesHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000]
            }),
            overflow: 'hidden',
            opacity: favoritesHeight
          }}
        >
          {loading || globalLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : favoriteExercises.length > 0 ? (
            <View style={styles.favoritesContainer}>
              {favoriteExercises.map((item, index) => (
                <View key={item.id} style={{ marginBottom: 12 }}>
                  {renderFavoriteExercise({ item, index })}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyStateCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons 
                name="star-outline" 
                size={48} 
                color={colors.textTertiary} 
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No favorite exercises yet
              </Text>
              
              <TouchableOpacity
                style={[styles.emptyActionButton, { backgroundColor: colors.primary + '20' }]}
                onPress={() => navigation.navigate('Exercises')}
              >
                <Text style={[styles.emptyActionText, { color: colors.primary }]}>
                  Explore Exercises
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </Container>
  );
};

export default WorkoutScreen;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center'
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  createWorkoutCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  createWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  createWorkoutTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  createWorkoutSubtitle: {
    fontSize: 14,
    marginBottom: 16
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12
  },
  createButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600'
  },
  sectionCount: {
    fontSize: 14
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '500'
  },
  workoutListsGrid: {
    paddingHorizontal: 16
  },
  workoutListItem: {
    marginBottom: 16
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  listCardContent: {
    padding: 16
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  workoutListIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  listCardSubtitle: {
    fontSize: 14
  },
  exercisePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 16
  },
  exerciseChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8
  },
  exerciseChipText: {
    fontSize: 13,
    fontWeight: '500'
  },
  moreChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1
  },
  moreChipText: {
    fontSize: 13
  },
  listCardFooter: {
    alignItems: 'flex-start'
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  toggleBar: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2
  },
  toggleBarContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  toggleBarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  toggleBarText: {
    fontSize: 16,
    fontWeight: '600'
  },
  favoritesContainer: {
    paddingHorizontal: 16
  },
  favoriteCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2
  },
  favoriteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  favoriteInfo: {
    flex: 1,
    marginRight: 12
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6
  },
  favoriteSubInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500'
  },
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  quickLogText: {
    marginLeft: 4,
    fontWeight: '600'
  },
  suggestionContainer: {
    marginTop: 4
  },
  suggestionTitle: {
    fontSize: 13,
    marginBottom: 8
  },
  suggestionDetails: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  suggestionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500'
  },
  emptyStateCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyIcon: {
    marginBottom: 16
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12
  },
  emptyActionText: {
    fontWeight: '600'
  },
  recentWorkoutsContainer: {
    paddingLeft: 16,
    paddingRight: 4
  },
  recentWorkoutItem: {
    width: 240,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  recentWorkoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  recentWorkoutInfo: {
    flex: 1
  },
  recentWorkoutName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4
  },
  recentWorkoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recentWorkoutData: {
    fontSize: 13
  },
  recentWorkoutDate: {
    fontSize: 12
  },
  loader: {
    marginVertical: 24
  }
});