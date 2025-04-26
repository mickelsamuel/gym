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
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';

const CustomWorkoutDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { listId } = route.params;
  const { getExerciseById, darkMode } = useContext(ExerciseContext);
  
  // State
  const [workoutList, setWorkoutList] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerHeight = useRef(new Animated.Value(200)).current;
  
  // Theme
  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const cardColor = darkMode ? '#2C2C2E' : '#FFF';
  const textColor = darkMode ? '#FFF' : '#333';
  const secondaryTextColor = darkMode ? '#BBBBBB' : '#666';
  const accentColor = '#007AFF';

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
            duration: 400,
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>Loading workout...</Text>
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
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0062CC" />
      
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#0062CC', '#0096FF']}
          style={styles.gradient}
        />
        
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{workoutList?.name || 'Workout'}</Text>
            <Text style={styles.dateText}>Created on {formattedDate}</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{listExercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
        </View>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.contentContainer,
          { 
            backgroundColor,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={[styles.sectionTitle, { color: textColor }]}>Exercises</Text>
        
        {listExercises.length > 0 ? (
          <FlatList
            data={listExercises}
            keyExtractor={item => item.id.toString()}
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
                  style={[styles.listItem, { backgroundColor: cardColor }]}
                  onPress={() => navigateToExercise(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.listItemText, { color: textColor }]}>{item.name}</Text>
                    <Text style={[styles.muscleGroupText, { color: secondaryTextColor }]}>
                      {item.primaryMuscles?.join(', ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
                </TouchableOpacity>
              </Animated.View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color={darkMode ? '#555' : '#DDD'} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              No exercises added yet
            </Text>
            <Text style={[styles.emptySubtext, { color: darkMode ? '#888' : '#BBB' }]}>
              Add exercises to start building your workout
            </Text>
          </View>
        )}
      </Animated.View>
      
      <View style={[styles.addButtonContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddExercise}
        >
          <Ionicons name="add" size={24} color="#FFF" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  titleContainer: {
    marginTop: 12,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold',
    color: '#FFF',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  stat: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  listItem: { 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseInfo: {
    flex: 1,
  },
  listItemText: { 
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  muscleGroupText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButtonContainer: { 
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  addButton: { 
    backgroundColor: '#007AFF', 
    borderRadius: 12,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: { 
    color: '#FFF', 
    fontSize: 17, 
    fontWeight: '600' 
  },
});

export default CustomWorkoutDetailScreen;