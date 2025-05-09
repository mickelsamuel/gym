import React, { useState, useContext, useEffect, useRef } from 'react';
import {View, ScrollView, FlatList, TouchableOpacity, StyleSheet, TextInput, Animated, RefreshControl, ActivityIndicator, Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ExerciseContext } from '../context/ExerciseContext';
import { useAuth } from '../hooks/useAuth';
import {Text, Button, Card, Container} from '../components/ui';
import {Theme, Spacing, BorderRadius} from '../constants/Theme';
import { RootStackParamList } from '../navigation/NavigationTypes';
import { Exercise } from '../types/mergedTypes';
// Define navigation prop type
type ExercisesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExercisesScreen'>;
// Define filter options for exercises
type FilterOption = 'all' | 'favorites' | 'recent';
type SortOption = 'name' | 'difficulty' | 'muscle';
// Extended Exercise interface with muscle properties needed for this component
interface ExtendedExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  imageUrl?: string;
}
// Define muscle group item type
interface MuscleGroupItem {
  id: string;
  name: string;
  icon: string;
}
const ExercisesScreen: React.FC = () => {
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const { currentUser } = useAuth();
  const { getAllExercises, favorites, darkMode } = useContext(ExerciseContext);
  // Theme
  const theme = darkMode ? Theme.dark : Theme.light;
  // State
  const [exercises, setExercises] = useState<ExtendedExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExtendedExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('name');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [recentExercises, setRecentExercises] = useState<ExtendedExercise[]>([]);
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });
  const searchBarTranslate = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  // Muscle groups data
  const muscleGroups: MuscleGroupItem[] = [
    { id: 'chest', name: 'Chest', icon: 'body-outline' },
    { id: 'back', name: 'Back', icon: 'body-outline' },
    { id: 'legs', name: 'Legs', icon: 'body-outline' },
    { id: 'shoulders', name: 'Shoulders', icon: 'body-outline' },
    { id: 'arms', name: 'Arms', icon: 'body-outline' },
    { id: 'abs', name: 'Abs', icon: 'body-outline' },
    { id: 'cardio', name: 'Cardio', icon: 'heart-outline' },
  ];
  // Helper function to check if an exercise is in favorites
  const isFavorite = (id: string): boolean => {
    return favorites.includes(id);
  };
  // Load exercises
  useEffect(() => {
    loadExercises();
  }, []);
  // Filter exercises when search or filters change
  useEffect(() => {
    filterExercises();
  }, [searchQuery, activeFilter, activeSort, selectedMuscleGroup, exercises]);
  // Load all exercises
  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const allExercises = getAllExercises();
      // Use a type assertion with unknown as intermediate step
      setExercises(allExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup || ex.primaryMuscleGroup || '',
        equipment: ex.equipment || '',
        difficulty: ex.difficulty || 'beginner',
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        imageUrl: ex.image
      })) as ExtendedExercise[]);
      // Set recent exercises based on most recent 5
      setRecentExercises(allExercises.slice(0, 5).map(ex => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup || ex.primaryMuscleGroup || '',
        equipment: ex.equipment || '',
        difficulty: ex.difficulty || 'beginner',
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        imageUrl: ex.image
      })) as ExtendedExercise[]);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  };
  // Filter exercises based on current filters and search
  const filterExercises = () => {
    let result = [...exercises];
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(exercise => 
        exercise.name.toLowerCase().includes(query) || 
        exercise.muscleGroup.toLowerCase().includes(query) ||
        exercise.equipment.toLowerCase().includes(query)
      );
    }
    // Apply type filter
    if (activeFilter === 'favorites') {
      result = result.filter(exercise => isFavorite(exercise.id));
    } else if (activeFilter === 'recent') {
      const recentIds = recentExercises.map((ex: { id: string }) => ex.id);
      result = result.filter(exercise => recentIds.includes(exercise.id));
    }
    // Apply muscle group filter
    if (selectedMuscleGroup) {
      result = result.filter(exercise => 
        exercise.muscleGroup === selectedMuscleGroup ||
        (exercise.primaryMuscles && exercise.primaryMuscles.includes(selectedMuscleGroup)) ||
        (exercise.secondaryMuscles && exercise.secondaryMuscles.includes(selectedMuscleGroup))
      );
    }
    // Apply sorting
    if (activeSort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activeSort === 'difficulty') {
      const difficultyOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 };
      result.sort((a, b) => {
        return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
               (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
      });
    } else if (activeSort === 'muscle') {
      result.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
    }
    setFilteredExercises(result);
  };
  // Handle filter change
  const handleFilterChange = (filter: FilterOption) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  };
  // Handle sort change
  const handleSortChange = (sort: SortOption) => {
    Haptics.selectionAsync();
    setActiveSort(sort);
  };
  // Handle muscle group selection
  const handleMuscleGroupSelect = (muscleId: string) => {
    Haptics.selectionAsync();
    setSelectedMuscleGroup(prevMuscle => prevMuscle === muscleId ? null : muscleId);
  };
  // Navigate to exercise detail
  const navigateToExerciseDetail = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ExerciseDetail', { exerciseId });
  };
  // Render muscle group item
  const renderMuscleGroupItem = ({ item }: { item: MuscleGroupItem }) => {
    const isSelected = selectedMuscleGroup === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.muscleGroupItem,
          isSelected && { backgroundColor: `${theme.primary}25` }
        ]}
        onPress={() => handleMuscleGroupSelect(item.id)}
      >
        <View
          style={[
            styles.muscleIconContainer,
            {
              backgroundColor: isSelected ? `${theme.primary}25` : `${theme.textSecondary}15`,
            }
          ]}
        >
          <Ionicons 
            name={item.icon as any} 
            size={20} 
            color={isSelected ? theme.primary : theme.textSecondary} 
          />
        </View>
        <Text 
          variant="caption"
          style={{ 
            color: isSelected ? theme.primary : theme.text,
            fontWeight: isSelected ? "600" : "400"
          }}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };
  // Render exercise item
  const renderExerciseItem = ({ item }: { item: ExtendedExercise }) => {
    return (
      <Card
        category="default"
        style={styles.exerciseCard}
        onPress={() => navigateToExerciseDetail(item.id)}
      >
        {/* Exercise Image */}
        <View style={styles.exerciseImageContainer}>
          {item.imageUrl ? (
            <View style={styles.exerciseImage}>
              {/* Image would be loaded here in a real app */}
            </View>
          ) : (
            <View
              style={[
                styles.exerciseImagePlaceholder,
                { backgroundColor: `${theme.textSecondary}15` }
              ]}
            >
              <Ionicons name="barbell-outline" size={30} color={theme.textSecondary} />
            </View>
          )}
          {/* Favorite button */}
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              { backgroundColor: darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }
            ]}
            onPress={(e) => {
              e.stopPropagation();
              // Toggle favorite would go here
            }}
          >
            <Ionicons
              name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite(item.id) ? theme.danger : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {/* Exercise Details */}
        <View style={styles.exerciseInfo}>
          <Text 
            variant="subtitle"
            style={{ 
              color: theme.text,
              marginBottom: 4
            }}
          >
            {item.name}
          </Text>
          <View style={styles.exerciseMeta}>
            <View style={styles.exerciseMetaItem}>
              <Ionicons name="body-outline" size={14} color={theme.textSecondary} />
              <Text 
                variant="caption"
                style={{ color: theme.textSecondary, marginLeft: 4 }}
              >
                {item.muscleGroup}
              </Text>
            </View>
            <View style={styles.exerciseMetaItem}>
              <Ionicons name="barbell-outline" size={14} color={theme.textSecondary} />
              <Text 
                variant="caption"
                style={{ color: theme.textSecondary, marginLeft: 4 }}
              >
                {item.equipment}
              </Text>
            </View>
          </View>
          <View style={[
            styles.difficultyBadge,
            { 
              backgroundColor: 
                item.difficulty === 'beginner' ? `${theme.success}20` :
                item.difficulty === 'intermediate' ? `${theme.warning}20` :
                `${theme.danger}20`
            }
          ]}>
            <Text 
              variant="caption"
              style={{ 
                color: 
                  item.difficulty === 'beginner' ? theme.success :
                  item.difficulty === 'intermediate' ? theme.warning :
                  theme.danger,
                fontWeight: "500"
              }}
            >
              {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };
  return (
    <Container>
      {/* Search Bar - Animated on scroll */}
      <Animated.View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: theme.background,
            opacity: searchBarOpacity,
            transform: [{ translateY: searchBarTranslate }],
          },
        ]}
      >
        <View 
          style={[
            styles.searchBar,
            { backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
        >
          <Ionicons 
            name="search" 
            size={20} 
            color={theme.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Search exercises..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterButtons}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'all' && { backgroundColor: `${theme.primary}20` }
            ]}
            onPress={() => handleFilterChange('all')}
          >
            <Text
              variant="caption"
              style={{ 
                color: activeFilter === 'all' ? theme.primary : theme.textSecondary,
                fontWeight: activeFilter === 'all' ? "600" : "400"
              }}
            >
              All Exercises
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'favorites' && { backgroundColor: `${theme.primary}20` }
            ]}
            onPress={() => handleFilterChange('favorites')}
          >
            <Ionicons
              name="heart"
              size={14}
              color={activeFilter === 'favorites' ? theme.primary : theme.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              variant="caption"
              style={{ 
                color: activeFilter === 'favorites' ? theme.primary : theme.textSecondary,
                fontWeight: activeFilter === 'favorites' ? "600" : "400"
              }}
            >
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'recent' && { backgroundColor: `${theme.primary}20` }
            ]}
            onPress={() => handleFilterChange('recent')}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={activeFilter === 'recent' ? theme.primary : theme.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              variant="caption"
              style={{ 
                color: activeFilter === 'recent' ? theme.primary : theme.textSecondary,
                fontWeight: activeFilter === 'recent' ? "600" : "400"
              }}
            >
              Recent
            </Text>
          </TouchableOpacity>
          <View style={styles.sortContainer}>
            <Text
              variant="caption"
              style={{ 
                color: theme.textSecondary,
                marginRight: 8
              }}
            >
              Sort:
            </Text>
            <TouchableOpacity
              style={[
                styles.sortButton,
                activeSort === 'name' && { backgroundColor: `${theme.secondary}20` }
              ]}
              onPress={() => handleSortChange('name')}
            >
              <Text
                variant="caption"
                style={{ 
                  color: activeSort === 'name' ? theme.secondary : theme.textSecondary,
                  fontWeight: activeSort === 'name' ? "600" : "400"
                }}
              >
                Name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                activeSort === 'difficulty' && { backgroundColor: `${theme.secondary}20` }
              ]}
              onPress={() => handleSortChange('difficulty')}
            >
              <Text
                variant="caption"
                style={{ 
                  color: activeSort === 'difficulty' ? theme.secondary : theme.textSecondary,
                  fontWeight: activeSort === 'difficulty' ? "600" : "400"
                }}
              >
                Difficulty
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                activeSort === 'muscle' && { backgroundColor: `${theme.secondary}20` }
              ]}
              onPress={() => handleSortChange('muscle')}
            >
              <Text
                variant="caption"
                style={{ 
                  color: activeSort === 'muscle' ? theme.secondary : theme.textSecondary,
                  fontWeight: activeSort === 'muscle' ? "600" : "400"
                }}
              >
                Muscle
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      {/* Muscle Groups */}
      <View style={styles.muscleGroupsContainer}>
        <FlatList
          data={muscleGroups}
          renderItem={renderMuscleGroupItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.muscleGroupsList}
        />
      </View>
      {/* Exercise List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text 
            variant="body"
            style={{ color: theme.textSecondary, marginTop: Spacing.md }}
          >
            Loading exercises...
          </Text>
        </View>
      ) : filteredExercises.length > 0 ? (
        <FlatList
          data={filteredExercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.exercisesList}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          numColumns={1}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="barbell-outline" size={60} color={theme.textSecondary} />
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
              textAlign: 'center',
              marginBottom: Spacing.lg
            }}
          >
            {searchQuery || selectedMuscleGroup ? 
              'Try adjusting your search or filters' : 
              'No exercises available right now'}
          </Text>
          <Button 
            title="Reset Filters" 
            type="secondary"
            onPress={() => {
              setSearchQuery('');
              setSelectedMuscleGroup(null);
              setActiveFilter('all');
            }}
          />
        </View>
      )}
      {/* Floating action button */}
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddExerciseScreen', { workoutId: 'custom' })}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </Container>
  );
};
const styles = StyleSheet.create({
  searchBarContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  filtersContainer: {
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterButtons: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    marginRight: Spacing.sm,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    marginRight: 6,
  },
  muscleGroupsContainer: {
    marginTop: Spacing.sm,
  },
  muscleGroupsList: {
    paddingHorizontal: Spacing.md,
  },
  muscleGroupItem: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  muscleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  exercisesList: {
    padding: Spacing.md,
    paddingBottom: 100, // Extra padding for FAB
  },
  exerciseCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  exerciseImageContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  exerciseImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  exerciseMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  exerciseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  difficultyBadge: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  fabButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
export default ExercisesScreen; 