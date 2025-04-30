import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Animated,
  Image,
  ActivityIndicator,
  RefreshControl,
  SectionList,
  useWindowDimensions,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { 
  Text, 
  Button, 
  Card, 
  Container, 
  Input,
  FadeIn,
  SlideIn 
} from '../components/ui';
import { Colors, Theme, Typography, Spacing, BorderRadius } from '../constants/Theme';

// Broader muscle groups for filtering
const muscleGroupOptions = [
  { label: 'All', value: 'all', icon: 'body-outline' },
  { label: 'Chest', value: 'chest', icon: 'fitness-outline' },
  { label: 'Back', value: 'back', icon: 'barbell-outline' },
  { label: 'Arms', value: 'arms', icon: 'hand-right-outline' },
  { label: 'Legs', value: 'legs', icon: 'footsteps-outline' },
  { label: 'Shoulders', value: 'shoulders', icon: 'golf-outline' },
  { label: 'Core', value: 'core', icon: 'body-outline' },
  { label: 'Cardio', value: 'cardio', icon: 'heart-outline' }
];

// Mapping individual muscle IDs to one of the above categories.
const muscleToCategory = {
  // Chest remains chest
  chest: 'chest',
  upperChest: 'chest',
  lowerChest: 'chest',
  // Back includes various back muscles
  back: 'back',
  lats: 'back',
  lowerBack: 'back',
  erectorSpinae: 'back',
  traps: 'back',
  rhomboids: 'back',
  // Core-related groups
  core: 'core',
  abs: 'core',
  obliques: 'core',
  // Arms covers biceps, triceps, and forearms
  arms: 'arms',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  // Shoulders: main delts and rear delts
  shoulders: 'shoulders',
  rearDelts: 'shoulders',
  frontDelts: 'shoulders',
  lateralDelts: 'shoulders',
  // Legs includes general legs plus specific groups
  legs: 'legs',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  adductors: 'legs',
  abductors: 'legs',
  hipFlexors: 'legs',
  // Cardio
  cardio: 'cardio'
};

const exerciseTypeOptions = [
  { label: 'All', value: '', icon: 'apps-outline' },
  { label: 'Gym', value: 'gym', icon: 'barbell-outline' },
  { label: 'Dumbbell', value: 'dumbbell', icon: 'barbell-outline' },
  { label: 'Bodyweight', value: 'bodyweight', icon: 'body-outline' },
  { label: 'Cardio', value: 'cardio', icon: 'heart-outline' },
  { label: 'Machine', value: 'machine', icon: 'cog-outline' },
  { label: 'Cable', value: 'cable', icon: 'git-network-outline' }
];

const difficultyOptions = [
  { label: 'All', value: '', icon: 'star-outline' },
  { label: 'Beginner', value: 'beginner', icon: 'star-outline' },
  { label: 'Intermediate', value: 'intermediate', icon: 'star-half-outline' },
  { label: 'Advanced', value: 'advanced', icon: 'star' }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ExercisesScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { 
    getAllExercises, 
    darkMode, 
    getExercisesByGoal,
    isFavorite,
    toggleFavorite,
    getExerciseById,
    userGoal,
    getExerciseStats
  } = useContext(ExerciseContext);

  // Theme based on dark mode
  const theme = darkMode ? Theme.dark : Theme.light;

  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exerciseData, setExerciseData] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [popularExercises, setPopularExercises] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const [filterCount, setFilterCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Animation values for scroll effects
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Header animations
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -60],
    extrapolate: 'clamp'
  });
  
  const filterBarTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -40],
    extrapolate: 'clamp'
  });
  
  const searchScaleX = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.92],
    extrapolate: 'clamp'
  });
  
  // Load initial data
  useEffect(() => {
    loadExercises();
  }, []);
  
  // Reload on focus
  useFocusEffect(
    React.useCallback(() => {
      loadExercises();
    }, [])
  );
  
  // Effect to update filter count
  useEffect(() => {
    let count = 0;
    if (selectedMuscle !== 'all') count++;
    if (selectedType !== '') count++;
    if (selectedDifficulty !== '') count++;
    setFilterCount(count);
  }, [selectedMuscle, selectedType, selectedDifficulty]);
  
  // Effect to apply filters
  useEffect(() => {
    if (exerciseData.length > 0) {
      applyFilters();
    }
  }, [searchQuery, selectedMuscle, selectedType, selectedDifficulty, exerciseData]);
  
  // Load exercises from API/database
  const loadExercises = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all exercises
      const allExercises = await getAllExercises();
      
      // Process and categorize exercises
      setExerciseData(allExercises);
      
      // Set popular exercises (in a real app this would come from analytics)
      const popular = allExercises
        .filter(ex => ex.popularity > 0.7)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 8);
      setPopularExercises(popular);
      
      // Set recent exercises (in a real app this would come from user history)
      const recent = allExercises
        .filter(ex => ex.lastUsed)
        .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
        .slice(0, 8);
      setRecentExercises(recent);
      
      // Set favorite exercises
      const favorites = allExercises.filter(ex => isFavorite(ex.id));
      setFavoriteExercises(favorites);
      
      // Apply initial filters
      applyFilters();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setIsLoading(false);
    }
  };
  
  // Apply filters to exercises
  const applyFilters = () => {
    let filtered = [...exerciseData];
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(query) || 
        (ex.description && ex.description.toLowerCase().includes(query)) ||
        (ex.primaryMuscles && ex.primaryMuscles.some(m => m.toLowerCase().includes(query))) ||
        (ex.secondaryMuscles && ex.secondaryMuscles.some(m => m.toLowerCase().includes(query)))
      );
    }
    
    // Apply muscle filter
    if (selectedMuscle !== 'all') {
      filtered = filtered.filter(ex => {
        const primaryMatches = ex.primaryMuscles && ex.primaryMuscles.some(m => 
          muscleToCategory[m.toLowerCase()] === selectedMuscle
        );
        
        const secondaryMatches = ex.secondaryMuscles && ex.secondaryMuscles.some(m => 
          muscleToCategory[m.toLowerCase()] === selectedMuscle
        );
        
        return primaryMatches || secondaryMatches;
      });
    }
    
    // Apply type filter
    if (selectedType !== '') {
      filtered = filtered.filter(ex => ex.type && ex.type.toLowerCase() === selectedType.toLowerCase());
    }
    
    // Apply difficulty filter
    if (selectedDifficulty !== '') {
      filtered = filtered.filter(ex => ex.difficulty && ex.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    }
    
    setFilteredExercises(filtered);
  };
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  };
  
  // Dismiss keyboard when touching outside inputs
  function dismissKeyboard() {
    Keyboard.dismiss();
    setSearchFocused(false);
  };
  
  // Toggle favorite status for an exercise
  function handleFavoriteToggle(exerciseId) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(exerciseId);
    
    // Update favorites list
    if (isFavorite(exerciseId)) {
      // Remove from favorites
      setFavoriteExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    } else {
      // Add to favorites
      const exercise = exerciseData.find(ex => ex.id === exerciseId);
      if (exercise) {
        setFavoriteExercises(prev => [...prev, exercise]);
      }
    }
  };
  
  // Navigate to exercise details
  const navigateToExerciseDetail = (exerciseId) => {
    Haptics.selectionAsync();
    navigation.navigate('ExerciseDetail', { exerciseId });
  };
  
  // Clear all filters
  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMuscle('all');
    setSelectedType('');
    setSelectedDifficulty('');
  };
  
  // Clear search query
  const clearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
  };

  // Render the search bar
  const renderSearchBar = () => {
    return (
      <Animated.View
        style={[
          styles.searchBarContainer,
          {
            transform: [
              { translateY: headerTranslateY },
              { scaleX: searchScaleX }
            ]
          }
        ]}
      >
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          rightIcon={searchQuery ? "close-circle" : undefined}
          onRightIconPress={clearSearch}
          onFocus={() => setSearchFocused(true)}
          containerStyle={styles.searchInputContainer}
          style={styles.searchInput}
        />
      </Animated.View>
    );
  };

  // Render filter chips
  const renderFilterChips = () => {
    return (
      <Animated.View
        style={[
          styles.filterChipsContainer,
          {
            transform: [{ translateY: filterBarTranslateY }]
          }
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          {muscleGroupOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                selectedMuscle === option.value && styles.selectedFilterChip
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedMuscle(option.value);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={selectedMuscle === option.value ? Colors.primaryBlue : theme.textSecondary}
                style={styles.chipIcon}
              />
              <Text
                variant="caption"
                style={[
                  styles.chipText,
                  selectedMuscle === option.value && styles.selectedChipText
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.moreFiltersChip,
              (filterCount > 0 || showAdvancedFilters) && styles.activeFiltersChip
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowAdvancedFilters(!showAdvancedFilters);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={filterCount > 0 || showAdvancedFilters ? Colors.primaryBlue : theme.textSecondary}
              style={styles.chipIcon}
            />
            <Text
              variant="caption"
              style={[
                styles.chipText,
                (filterCount > 0 || showAdvancedFilters) && styles.selectedChipText
              ]}
            >
              Filters {filterCount > 0 ? `(${filterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  };
  
  // Render advanced filters section
  const renderAdvancedFilters = () => {
    if (!showAdvancedFilters) return null;
    
    return (
      <Card style={styles.advancedFiltersCard}>
        <View style={styles.filtersSection}>
          <Text variant="cardTitle" style={styles.filterSectionTitle}>Equipment Type</Text>
          <View style={styles.filterOptions}>
            {exerciseTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  selectedType === option.value && styles.selectedFilterOption
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedType(option.value);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selectedType === option.value ? Colors.primaryBlue : theme.textSecondary}
                  style={styles.filterOptionIcon}
                />
                <Text
                  variant="body"
                  style={[
                    styles.filterOptionText,
                    selectedType === option.value && styles.selectedFilterOptionText
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.filtersSection}>
          <Text variant="cardTitle" style={styles.filterSectionTitle}>Difficulty Level</Text>
          <View style={styles.filterOptions}>
            {difficultyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  selectedDifficulty === option.value && styles.selectedFilterOption
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDifficulty(option.value);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selectedDifficulty === option.value ? Colors.primaryBlue : theme.textSecondary}
                  style={styles.filterOptionIcon}
                />
                <Text
                  variant="body"
                  style={[
                    styles.filterOptionText,
                    selectedDifficulty === option.value && styles.selectedFilterOptionText
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.filterActions}>
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={clearFilters}
            activeOpacity={0.7}
          >
            <Text variant="body" style={styles.clearFilterText}>
              Clear Filters
            </Text>
          </TouchableOpacity>
          
          <Button
            title="Apply"
            onPress={() => setShowAdvancedFilters(false)}
            type="primary"
            size="small"
          />
        </View>
      </Card>
    );
  };
  
  // Render a popular exercise card
  const renderPopularExerciseCard = ({ item }) => {
    const isFavorited = isFavorite(item.id);
    
    return (
      <Card
        style={styles.popularExerciseCard}
        onPress={() => navigateToExerciseDetail(item.id)}
      >
        <View style={styles.popularExerciseTypeIcon}>
          <Ionicons
            name={
              item.type === 'cardio' ? 'heart-outline' :
              item.type === 'bodyweight' ? 'body-outline' :
              item.type === 'dumbbell' ? 'barbell-outline' :
              item.type === 'machine' ? 'cog-outline' :
              item.type === 'cable' ? 'git-network-outline' :
              'barbell-outline'
            }
            size={22}
            color={theme.primary}
          />
        </View>
        
        <Text variant="cardTitle" style={styles.popularExerciseName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <Text variant="caption" style={styles.popularExerciseDetails}>
          {item.primaryMuscles?.join(', ')}
        </Text>
        
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleFavoriteToggle(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorited ? Colors.accentDanger : theme.textSecondary}
          />
        </TouchableOpacity>
      </Card>
    );
  };
  
  // Render a standard exercise item for the main list
  const renderExerciseItem = ({ item }) => {
    const isFavorited = isFavorite(item.id);
    
    return (
      <Card
        style={styles.exerciseItem}
        onPress={() => navigateToExerciseDetail(item.id)}
      >
        <View style={styles.exerciseContent}>
          <View style={styles.exerciseIconContainer}>
            <View style={styles.exerciseTypeIcon}>
              <Ionicons
                name={
                  item.type === 'cardio' ? 'heart-outline' :
                  item.type === 'bodyweight' ? 'body-outline' :
                  item.type === 'dumbbell' ? 'barbell-outline' :
                  item.type === 'machine' ? 'cog-outline' :
                  item.type === 'cable' ? 'git-network-outline' :
                  'barbell-outline'
                }
                size={22}
                color={theme.primary}
              />
            </View>
          </View>
          
          <View style={styles.exerciseDetails}>
            <Text variant="cardTitle" style={styles.exerciseName}>
              {item.name}
            </Text>
            
            <View style={styles.muscleTagsContainer}>
              {item.primaryMuscles?.slice(0, 2).map((muscle, index) => (
                <View key={index} style={styles.muscleTag}>
                  <Text variant="caption" style={styles.muscleTagText}>
                    {muscle}
                  </Text>
                </View>
              ))}
              
              {item.primaryMuscles?.length > 2 && (
                <View style={styles.muscleTag}>
                  <Text variant="caption" style={styles.muscleTagText}>
                    +{item.primaryMuscles.length - 2}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.exerciseMetadata}>
              <Text variant="caption" style={styles.exerciseMetadataText}>
                {item.equipment || item.type || 'No equipment'} • {item.difficulty || 'All levels'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleFavoriteToggle(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorited ? Colors.accentDanger : theme.textSecondary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('WorkoutLogModal', { exerciseId: item.id });
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };
  
  // Render the popular exercises section
  const renderPopularExercisesSection = () => {
    if (!popularExercises.length || searchQuery) return null;
    
    return (
      <View style={styles.popularSection}>
        <View style={styles.sectionHeader}>
          <Text variant="sectionHeader">Popular Exercises</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              // Navigate to filtered view with popular exercises
            }}
            activeOpacity={0.7}
          >
            <Text variant="body" style={styles.seeAllButton}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          horizontal
          data={popularExercises}
          renderItem={renderPopularExerciseCard}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularExercisesContainer}
        />
      </View>
    );
  };
  
  // Render favorites section
  const renderFavoritesSection = () => {
    if (!favoriteExercises.length || searchQuery) return null;
    
    return (
      <View style={styles.favoritesSection}>
        <View style={styles.sectionHeader}>
          <Text variant="sectionHeader">Favorites</Text>
        </View>
        
        <FlatList
          horizontal
          data={favoriteExercises}
          renderItem={renderPopularExerciseCard}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularExercisesContainer}
        />
      </View>
    );
  };
  
  // Render all exercises or search results
  const renderAllExercisesSection = () => {
    return (
      <View style={styles.allExercisesSection}>
        <View style={styles.sectionHeader}>
          <Text variant="sectionHeader">
            {searchQuery ? 'Search Results' : 'All Exercises'}
          </Text>
          {filteredExercises.length > 0 && (
            <Text variant="caption" style={styles.resultCount}>
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        
        {filteredExercises.length > 0 ? (
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exerciseListContainer}
          />
        ) : (
          <View style={styles.emptyResults}>
            <Ionicons
              name={searchQuery ? 'search-outline' : 'fitness-outline'}
              size={60}
              color={theme.textSecondary}
            />
            <Text variant="body" style={styles.emptyResultsText}>
              {searchQuery ? 'No exercises found for your search' : 'No exercises match your filters'}
            </Text>
            {(searchQuery || filterCount > 0) && (
              <Button
                title="Clear Filters"
                onPress={() => {
                  clearSearch();
                  clearFilters();
                }}
                type="secondary"
                size="small"
                style={styles.clearFiltersButton}
              />
            )}
          </View>
        )}
      </View>
    );
  };
  
  // Render loading state
  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          {/* Header Placeholder */}
          <View style={[styles.skeletonSection, styles.skeletonHeader]}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSearchBar} />
          </View>
          
          {/* Filter Placeholder */}
          <View style={styles.skeletonFilterContainer}>
            <View style={styles.skeletonFilterChip} />
            <View style={styles.skeletonFilterChip} />
            <View style={styles.skeletonFilterChip} />
            <View style={styles.skeletonFilterChip} />
          </View>
          
          {/* Popular Exercises Placeholder */}
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonSectionHeader} />
            <View style={styles.skeletonPopularContainer}>
              <View style={styles.skeletonPopularCard} />
              <View style={styles.skeletonPopularCard} />
              <View style={styles.skeletonPopularCard} />
            </View>
          </View>
          
          {/* Exercise List Placeholder */}
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonSectionHeader} />
            <View style={styles.skeletonExerciseItem} />
            <View style={styles.skeletonExerciseItem} />
            <View style={styles.skeletonExerciseItem} />
          </View>
        </View>
      </View>
    );
  };
  
  // Main render function
  return (
    <Container>
      {isLoading ? (
        renderLoading()
      ) : (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.container}>
            {/* Screen Header */}
            <View style={styles.screenHeader}>
              <Text variant="pageTitle">Exercise Library</Text>
            </View>
            
            {/* Search Bar */}
            {renderSearchBar()}
            
            {/* Filter Chips */}
            {renderFilterChips()}
            
            {/* Advanced Filters */}
            {renderAdvancedFilters()}
            
            {/* Main Content */}
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            >
              {/* Popular Exercises Section */}
              {renderPopularExercisesSection()}
              
              {/* Favorites Section */}
              {renderFavoritesSection()}
              
              {/* All Exercises Section */}
              {renderAllExercisesSection()}
            </ScrollView>
            
            {/* Floating Action Button */}
            <TouchableOpacity
              style={styles.fab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('AddExercise');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 130, // Header height + search bar
    paddingBottom: 80,
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    height: 44
  },
  searchIcon: { 
    marginRight: 8
  },
  searchInput: { 
    flex: 1,
    height: 40,
    fontSize: 16
  },
  filterBar: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    paddingVertical: 8,
    zIndex: 15,
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIcon: {
    marginRight: 6
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12
  },
  popularExercisesContainer: {
    paddingVertical: 8,
  },
  popularExerciseCard: {
    width: 140,
    height: 160,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative'
  },
  popularExerciseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseItem: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
  },
  exerciseItemContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  exerciseTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseNameText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  favoriteButtonList: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyResultsSubtext: {
    marginBottom: 20,
  },
  resetButton: {
    paddingHorizontal: 24,
  },
  // Skeleton Loader styles
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonHeader: {
    height: 100,
    marginBottom: 16,
    padding: 10,
  },
  skeletonTitle: {
    height: 24,
    width: '60%',
    marginBottom: 10,
  },
  skeletonSearch: {
    height: 40,
    width: '100%',
    marginTop: 8,
  },
  skeletonFilterBar: {
    height: 48,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
  },
  skeletonChip: {
    height: 36,
    width: 80,
    borderRadius: 18,
  },
  skeletonPopularContainer: {
    marginBottom: 20,
    padding: 10,
  },
  skeletonSectionTitle: {
    height: 24,
    width: '40%',
    marginBottom: 12,
  },
  skeletonPopularRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonPopularItem: {
    height: 150,
    width: SCREEN_WIDTH / 3.5,
    borderRadius: 8,
    marginRight: 12,
  },
  skeletonListContainer: {
    marginTop: 20,
    padding: 10,
  },
  skeletonListItem: {
    height: 80,
    marginBottom: 12,
    borderRadius: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resetFiltersButton: {
    padding: 8,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  filterGroupTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginHorizontal: '1%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  filterOptionIcon: {
    marginRight: 8,
  },
  applyButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16
  },
  filterChipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedFilterChip: {
    borderColor: Colors.primaryBlue,
    borderWidth: 2,
  },
  selectedChipText: {
    fontWeight: 'bold',
  },
  chipText: {
    marginLeft: 8,
  },
  advancedFiltersCard: {
    marginBottom: 20,
  },
  filtersSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginHorizontal: '1%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedFilterOption: {
    borderColor: Colors.primaryBlue,
    borderWidth: 2,
  },
  filterOptionText: {
    marginLeft: 8,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearFilterButton: {
    padding: 8,
  },
  clearFilterText: {
    color: theme.textSecondary,
  },
  popularSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  seeAllButton: {
    color: Colors.primaryBlue,
  },
  favoritesSection: {
    marginBottom: 20,
  },
  allExercisesSection: {
    marginBottom: 20,
  },
  resultCount: {
    color: theme.textSecondary,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  exerciseListContainer: {
    paddingBottom: 20,
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonSection: {
    padding: 16,
  },
  skeletonSectionHeader: {
    height: 24,
    marginBottom: 12,
  },
  skeletonSearchBar: {
    height: 40,
    width: '100%',
    marginTop: 8,
  },
  skeletonFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  skeletonFilterChip: {
    height: 36,
    width: '48%',
    borderRadius: 18,
  },
  skeletonPopularCard: {
    height: 150,
    width: SCREEN_WIDTH / 3.5,
    borderRadius: 8,
    marginRight: 12,
  },
  skeletonExerciseItem: {
    height: 80,
    marginBottom: 12,
    borderRadius: 8,
  },
});