/**
 * Exercise Detail Screen - Shows details for a specific exercise
 */
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Text, Button, Card, Container } from '../components/ui';
import { Colors, Theme, Spacing, BorderRadius } from '../constants/Theme';
import { WorkoutSet } from '../types/mergedTypes';
import MuscleMap, { MuscleGroup } from '../components/MuscleMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ExerciseContext } from '../context/ExerciseContext';

// Types for exercise history and related data
interface ExerciseHistoryEntry {
  id: string;
  date: string;
  sets: WorkoutSet[];
}

// Chart related types
type ChartMetric = 'weight' | 'reps' | 'volume';
type TimeRange = '7' | '30' | '90' | 'all';

// Workout log data
interface WorkoutLogData {
  date: string;
  weight: number;
  reps: number;
  notes: string;
}

// Add the WorkoutLogModal component since it's used in the JSX
interface WorkoutLogModalProps {
  visible: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSave: (logData: WorkoutLogData) => void;
  initialData?: WorkoutLogData;
}
const WorkoutLogModal: React.FC<WorkoutLogModalProps> = ({ 
  visible, 
  onClose, 
  onSave,
  initialData 
}) => {
  const [weight, setWeight] = useState(initialData?.weight.toString() || '0');
  const [reps, setReps] = useState(initialData?.reps.toString() || '0');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const handleSave = () => {
    onSave({
      date: new Date().toISOString(),
      weight: parseFloat(weight),
      reps: parseInt(reps, 10),
      notes
    });
    onClose();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20
        }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Log Exercise</Text>
          <View style={{ marginBottom: 15 }}>
            <Text style={{ marginBottom: 8 }}>Weight</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12
              }}
            />
          </View>
          <View style={{ marginBottom: 15 }}>
            <Text style={{ marginBottom: 8 }}>Reps</Text>
            <TextInput
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12
              }}
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ marginBottom: 8 }}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                height: 100,
                textAlignVertical: 'top'
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              onPress={onClose}
              style={{
                padding: 15,
                borderRadius: 8,
                width: '48%',
                alignItems: 'center',
                backgroundColor: '#f5f5f5'
              }}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave}
              style={{
                padding: 15,
                borderRadius: 8,
                width: '48%',
                alignItems: 'center',
                backgroundColor: Colors.primaryBlue
              }}
            >
              <Text style={{ color: 'white' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Helper functions for metrics
const getMetricLabel = (metric: ChartMetric): string => {
  switch (metric) {
    case 'weight':
      return 'Weight';
    case 'reps':
      return 'Reps';
    case 'volume':
      return 'Volume';
    default:
      return '';
  }
};

// Interface for route params
interface ExerciseDetailRouteParams {
  exerciseId: string;
}

// Main component
const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as ExerciseDetailRouteParams;
  const { exerciseId } = params;
  
  const {
    getExerciseById,
    toggleFavorite,
    isFavorite,
    darkMode,
  } = useContext(ExerciseContext);
  
  const exercise = getExerciseById(exerciseId);
  const insets = useSafeAreaInsets();
  const theme = darkMode ? Theme.dark : Theme.light;
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  // States for logging and history
  const [logModalVisible, setLogModalVisible] = useState<boolean>(false);
  const [exerciseHistory] = useState<ExerciseHistoryEntry[]>([]); // Keep this for reference in the render
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('weight');
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  
  // Function to load exercise data
  const loadExerciseData = useCallback(() => {
    // Mock implementation - would be replaced with actual data loading
    setIsLoadingHistory(false);
  }, []); // Remove unnecessary dependency
  
  // Handle workout logging
  const handleLogWorkout = useCallback(() => {
    setLogModalVisible(true);
  }, []);
  
  // Handle sharing the exercise
  const handleShareExercise = useCallback(async () => {
    if (!exercise) return;
    
    try {
      await Share.share({
        message: `Check out this exercise: ${exercise.name}`,
        title: 'GymTrackPro Exercise'
      });
    } catch (error) {
      console.error('Error sharing exercise:', error);
    }
  }, [exercise]);
  
  // Handle setting workout data
  const setWorkoutSet = useCallback((data: WorkoutLogData) => {
    // This would normally save the workout data
    console.log('Saving workout data:', data);
    // Update UI to reflect new data
    setLogModalVisible(false);
  }, []);
  
  // Generate mock data for demo purposes
  useEffect(() => {
    if (exercise) {
      loadExerciseData();
    }
  }, [exercise, loadExerciseData]);
  
  if (!exercise) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
          Loading exercise details...
        </Text>
      </Container>
    );
  }

  // Function to render the header image section
  const renderHeroSection = () => {
    return (
      <View style={styles.heroContainer}>
        {exercise.imageUrl ? (
          <Image 
            source={{ uri: exercise.imageUrl }} 
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroImagePlaceholder, { backgroundColor: theme.cardElevated }]}>
            <Ionicons name="barbell-outline" size={80} color={theme.textSecondary} />
          </View>
        )}
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.heroGradient}
        />
        
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            
            <View style={styles.exerciseMetaContainer}>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>
                  {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                </Text>
              </View>
              
              <Text style={styles.equipmentText}>
                {Array.isArray(exercise.equipment)
                  ? exercise.equipment[0].charAt(0).toUpperCase() + exercise.equipment[0].slice(1)
                  : exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1)
                }
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(exerciseId)}
          >
            <Ionicons 
              name={isFavorite(exerciseId) ? "heart" : "heart-outline"} 
              size={28} 
              color={isFavorite(exerciseId) ? Colors.accentOrange : "white"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Function to render the muscle group visualization
  const renderMuscleGroups = () => {
    const primaryMuscle = exercise.primaryMuscleGroup || (exercise.primaryMuscles && exercise.primaryMuscles[0]);
    const secondaryMuscles = exercise.secondaryMuscles || [];
    
    // Cast the muscle groups to the proper type
    const primaryMuscleTyped = primaryMuscle as MuscleGroup;
    const secondaryMusclesTyped = (secondaryMuscles as unknown) as MuscleGroup[];
    
    return (
      <Card style={styles.sectionCard}>
        <Text variant="subtitle" style={styles.sectionTitle}>
          Target Muscles
        </Text>
        
        <MuscleMap
          primaryMuscle={primaryMuscleTyped}
          secondaryMuscles={secondaryMusclesTyped}
          onSelectMuscle={() => {}}
        />
        
        <View style={styles.muscleLabels}>
          <View style={styles.muscleLabelItem}>
            <View style={[styles.muscleLabelDot, { backgroundColor: Colors.primaryBlue }]} />
            <Text style={{ color: theme.text }}>Primary muscles</Text>
          </View>
          
          <View style={styles.muscleLabelItem}>
            <View style={[styles.muscleLabelDot, { backgroundColor: Colors.secondaryGreen }]} />
            <Text style={{ color: theme.text }}>Secondary muscles</Text>
          </View>
        </View>
      </Card>
    );
  };
  
  // Function to render instructions
  const renderInstructions = () => {
    return (
      <Card style={styles.sectionCard}>
        <Text variant="subtitle" style={styles.sectionTitle}>
          Instructions
        </Text>
        
        {exercise.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>{index + 1}</Text>
            </View>
            <Text style={[styles.instructionText, { color: theme.text }]}>
              {instruction}
            </Text>
          </View>
        ))}
      </Card>
    );
  };
  
  // Function to render the form tips
  const renderFormTips = () => {
    return (
      <Card style={styles.sectionCard}>
        <Text variant="subtitle" style={styles.sectionTitle}>
          Form Tips
        </Text>
        
        <View style={styles.formTipsContainer}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.formTipText, { color: theme.text }]}>
            Keep your back straight throughout the movement.
          </Text>
        </View>
        
        <View style={styles.formTipsContainer}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.formTipText, { color: theme.text }]}>
            Focus on controlled movement, rather than lifting heavy weights.
          </Text>
        </View>
        
        <View style={styles.formTipsContainer}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.formTipText, { color: theme.text }]}>
            Breathe out during the exertion phase of the exercise.
          </Text>
        </View>
      </Card>
    );
  };
  
  // Function to render history chart
  const renderHistoryChart = () => {
    return (
      <Card style={styles.sectionCard}>
        <Text variant="subtitle" style={styles.sectionTitle}>
          Your Performance
        </Text>
        
        <View style={styles.chartControls}>
          <View style={styles.metricSelector}>
            {['weight', 'reps', 'volume'].map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.metricButton,
                  chartMetric === metric && styles.metricButtonActive,
                  { borderColor: theme.border }
                ]}
                onPress={() => setChartMetric(metric as ChartMetric)}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    chartMetric === metric && styles.metricButtonTextActive,
                    { color: chartMetric === metric ? theme.primary : theme.textSecondary }
                  ]}
                >
                  {getMetricLabel(metric as ChartMetric)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.timeRangeSelector}>
            {['7', '30', '90', 'all'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeButton,
                  timeRange === range && styles.timeButtonActive,
                  { borderColor: theme.border }
                ]}
                onPress={() => setTimeRange(range as TimeRange)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    timeRange === range && styles.timeButtonTextActive,
                    { color: timeRange === range ? theme.primary : theme.textSecondary }
                  ]}
                >
                  {range === 'all' ? 'All' : range + 'd'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {isLoadingHistory ? (
          <View style={styles.chartPlaceholder}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : exerciseHistory.length === 0 ? (
          <View style={styles.chartPlaceholder}>
            <Ionicons name="analytics-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              No history data yet
            </Text>
            <Button 
              title="Log your first set" 
              onPress={handleLogWorkout} 
              type="primary"
              size="small"
              style={styles.logButton}
            />
          </View>
        ) : (
          <View style={styles.chartContainer}>
            {/* Chart component would go here */}
            <View style={styles.chartPlaceholder}>
              <Text style={{ color: theme.textSecondary }}>
                Chart visualization
              </Text>
            </View>
          </View>
        )}
      </Card>
    );
  };
  
  // Function to render similar exercises
  const renderSimilarExercises = () => {
    return (
      <Card style={styles.sectionCard}>
        <Text variant="subtitle" style={styles.sectionTitle}>
          Similar Exercises
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.similarExercisesContainer}
        >
          {[1, 2, 3].map((_, index) => (
            <TouchableOpacity key={index} style={styles.similarExerciseCard}>
              <View style={styles.similarExerciseImageContainer}>
                <View style={[styles.similarExerciseImage, { backgroundColor: theme.cardElevated }]}>
                  <Ionicons name="barbell-outline" size={24} color={theme.textSecondary} />
                </View>
              </View>
              <Text style={[styles.similarExerciseName, { color: theme.text }]}>
                {index === 0 ? 'Dumbbell Press' : index === 1 ? 'Incline Press' : 'Push-ups'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>
    );
  };
  
  // Render action button to add to workout
  const renderActionButton = () => {
    return (
      <View style={[styles.actionButtonContainer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          title="Add to Workout"
          onPress={() => {}}
          type="primary"
          fullWidth
          icon="add-outline"
        />
      </View>
    );
  };
  
  // Main render
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            backgroundColor: theme.background,
            opacity: headerOpacity,
            paddingTop: insets.top,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {exercise.name}
          </Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareExercise}
          >
            <Ionicons name="share-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100, // Extra space for the action button
        }}
      >
        {/* Hero Section with Image */}
        {renderHeroSection()}
        
        {/* Exercise Description */}
        <View style={styles.contentContainer}>
          <Card style={styles.descriptionCard}>
            <Text style={[styles.descriptionText, { color: theme.text }]}>
              {exercise.description}
            </Text>
          </Card>
          
          {/* Muscle Group Visualization */}
          {renderMuscleGroups()}
          
          {/* Instructions */}
          {renderInstructions()}
          
          {/* Form Tips */}
          {renderFormTips()}
          
          {/* History Chart */}
          {renderHistoryChart()}
          
          {/* Similar Exercises */}
          {renderSimilarExercises()}
        </View>
      </Animated.ScrollView>
      
      {/* Back Button (absolute positioned) */}
      <TouchableOpacity
        style={[styles.absoluteBackButton, { top: insets.top + Spacing.sm }]}
        onPress={() => navigation.goBack()}
      >
        <View style={[styles.backButtonCircle, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </View>
      </TouchableOpacity>
      
      {/* Action Button at bottom */}
      {renderActionButton()}
      
      {/* Log Workout Modal */}
      <WorkoutLogModal
        visible={logModalVisible}
        onClose={() => setLogModalVisible(false)}
        onSave={setWorkoutSet}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 100,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 60,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: Spacing.xs,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  exerciseMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    backgroundColor: Colors.accentOrange,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.pill,
    marginRight: Spacing.sm,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  equipmentText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  descriptionCard: {
    marginBottom: Spacing.md,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  muscleLabels: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    justifyContent: 'space-around',
  },
  muscleLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleLabelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  instructionNumberText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  formTipsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  formTipText: {
    marginLeft: Spacing.xs,
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  chartControls: {
    marginBottom: Spacing.md,
  },
  metricSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  metricButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  metricButtonActive: {
    backgroundColor: `${Colors.primaryBlue}15`,
    borderColor: Colors.primaryBlue,
  },
  metricButtonText: {
    fontSize: 14,
  },
  metricButtonTextActive: {
    fontWeight: '600',
  },
  timeRangeSelector: {
    flexDirection: 'row',
  },
  timeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  timeButtonActive: {
    backgroundColor: `${Colors.primaryBlue}15`,
    borderColor: Colors.primaryBlue,
  },
  timeButtonText: {
    fontSize: 14,
  },
  timeButtonTextActive: {
    fontWeight: '600',
  },
  chartContainer: {
    minHeight: 200,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    marginVertical: Spacing.md,
    fontSize: 16,
  },
  logButton: {
    marginTop: Spacing.sm,
  },
  similarExercisesContainer: {
    paddingBottom: Spacing.xs,
  },
  similarExerciseCard: {
    width: 120,
    marginRight: Spacing.md,
  },
  similarExerciseImageContainer: {
    height: 90,
    width: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  similarExerciseImage: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarExerciseName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  absoluteBackButton: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 50,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default ExerciseDetailScreen; 