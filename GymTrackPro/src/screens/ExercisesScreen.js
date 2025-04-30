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
import Colors from '../constants/Colors';
import CustomSkeletonLoader, { SkeletonItem } from '../components/CustomSkeletonLoader';
import Container from '../components/ui/Container';
import { Title, Heading, Subheading, Body, Caption } from '../components/ui/Text';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// -----------------------------------------------------------------------------
// Use only the following broader muscle groups
// -----------------------------------------------------------------------------
const muscleGroupOptions = [
  { label: 'All', value: 'all', icon: 'body-outline' },
  { label: 'Chest', value: 'chest', icon: 'fitness-outline' },
  { label: 'Back', value: 'back', icon: 'barbell-outline' },
  { label: 'Arms', value: 'arms', icon: 'hand-right-outline' },
  { label: 'Legs', value: 'legs', icon: 'footsteps-outline' },
  { label: 'Shoulders', value: 'shoulders', icon: 'golf-outline' }
];

// -----------------------------------------------------------------------------
// Mapping individual muscle IDs to one of the above categories.
// Adjust these mappings as needed:
const muscleToCategory = {
  // Chest remains chest
  chest: 'chest',
  // Back includes various back muscles and core-related groups
  back: 'back',
  lats: 'back',
  lowerBack: 'back',
  erectorSpinae: 'back',
  traps: 'back',
  core: 'back',
  obliques: 'back',
  neck: 'back',
  // Arms covers biceps, triceps, and forearms
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  // Shoulders: main delts and rear delts
  shoulders: 'shoulders',
  rearDelts: 'shoulders',
  // Legs includes general legs plus specific groups
  legs: 'legs',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  adductors: 'legs',
  abductors: 'legs',
  hipFlexors: 'legs'
};

const exerciseTypeOptions = [
  { label: 'All', value: '', icon: 'apps-outline' },
  { label: 'Gym', value: 'gym', icon: 'barbell-outline' },
  { label: 'Dumbbell', value: 'dumbbell', icon: 'barbell-outline' },
  { label: 'Bodyweight', value: 'bodyweight', icon: 'body-outline' },
  { label: 'Cardio', value: 'cardio', icon: 'heart-outline' }
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [popularExercises, setPopularExercises] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [filterCount, setFilterCount] = useState(0);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Instead of directly animating height (which is not supported by native driver),
  // use scale and translateY which are supported
  const headerScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.8],
    extrapolate: 'clamp'
  });
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -20],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });
  
  const filterBarTranslate = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -60],
    extrapolate: 'clamp'
  });

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
      success: '#28A745',
      warning: '#FF9500',
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
      success: '#33CF4D',
      warning: '#FF9F0A',
      danger: '#FF453A',
      info: '#64D2FF',
      shadow: 'rgba(0,0,0,0.3)',
    }
  };
  
  // Use the imported Colors if available, otherwise use the default
  const colorScheme = Colors || defaultColors;
  const colors = darkMode ? colorScheme.dark : colorScheme.light;

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

  // Update filter count
  useEffect(() => {
    let count = 0;
    if (selectedMuscle !== 'all') count++;
    if (selectedType !== '') count++;
    if (selectedDifficulty !== '') count++;
    if (searchQuery.trim() !== '') count++;
    setFilterCount(count);
  }, [selectedMuscle, selectedType, selectedDifficulty, searchQuery]);

  const loadExercises = async () => {
    setIsLoading(true);
    
    try {
      // Load popular exercises
      const allExercises = getAllExercises();
      
      // For popular exercises, in a real app this would be based on:
      // 1. Most viewed exercises
      // 2. Highest rated exercises
      // 3. Most favorited exercises
      // For now, we'll just select some random ones
      const randomIndex = Math.floor(Math.random() * (allExercises.length - 10));
      const popular = allExercises.slice(randomIndex, randomIndex + 8);
      setPopularExercises(popular);
      
      // For recent exercises, grab the ones related to the user's goal
      if (userGoal) {
        const goalExercises = getExercisesByGoal(userGoal).slice(0, 5);
        setRecentExercises(goalExercises);
      }
      
      // Simulate network request
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Error loading exercises:", error);
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  };

  const allExercises = getAllExercises();

  // Filter exercises
  const filteredExercises = allExercises.filter((ex) => {
    const matchName = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = selectedType ? ex.type === selectedType : true;
    const matchDifficulty = selectedDifficulty ? ex.difficulty === selectedDifficulty : true;

    let matchMuscle = true;
    if (selectedMuscle !== 'all') {
      const primaryMatch = ex.primaryMuscles.some(
        (muscle) => muscleToCategory[muscle] === selectedMuscle
      );
      const secondaryMatch = ex.secondaryMuscles.some(
        (muscle) => muscleToCategory[muscle] === selectedMuscle
      );
      matchMuscle = primaryMatch || secondaryMatch;
    }
    return matchName && matchType && matchMuscle && matchDifficulty;
  });

  function dismissKeyboard() {
    Keyboard.dismiss();
  }

  function handleFavoriteToggle(exerciseId) {
    toggleFavorite(exerciseId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function renderPopularExerciseItem({ item }) {
    const isFavorited = isFavorite(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.popularExerciseCard, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
      >
        <View style={styles.popularExerciseIconContainer}>
          <Ionicons 
            name={item.type === 'cardio' ? 'pulse' : 'barbell'} 
            size={24} 
            color={colors.primary} 
          />
        </View>
        <Body dark={darkMode} style={styles.exerciseName} numberOfLines={2}>
          {item.name}
        </Body>
        <Caption dark={darkMode} style={styles.exerciseCategory}>
          {item.category}
        </Caption>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => handleFavoriteToggle(item.id)}
        >
          <Ionicons 
            name={isFavorited ? 'heart' : 'heart-outline'} 
            size={20} 
            color={isFavorited ? colors.danger : colors.textSecondary} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  function renderExerciseItem({ item }) {
    const isFavorited = isFavorite(item.id);
    const stats = getExerciseStats(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.exerciseItem, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
      >
        <View style={styles.exerciseItemContent}>
          <View style={[styles.exerciseTypeIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons 
              name={
                item.type === 'cardio' ? 'pulse' : 
                item.type === 'bodyweight' ? 'body-outline' : 
                'barbell-outline'
              } 
              size={22} 
              color={colors.primary} 
            />
          </View>
          <View style={styles.exerciseDetails}>
            <Text style={[styles.exerciseNameText, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.exerciseInfo, { color: colors.textSecondary }]}>
              {item.category} • {item.equipment || 'No equipment'}
            </Text>
            
            {stats && stats.maxWeight > 0 && (
              <View style={styles.statsRow}>
                <Text style={[styles.statText, { color: colors.primary }]}>
                  Last: {stats.maxWeight} lbs × {stats.lastPerformed ? stats.history[0].reps : 0}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.favoriteButtonList}
            onPress={() => handleFavoriteToggle(item.id)}
          >
            <Ionicons 
              name={isFavorited ? 'heart' : 'heart-outline'} 
              size={20} 
              color={isFavorited ? colors.danger : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  function renderFilterBar() {
    return (
      <Animated.View 
        style={[
          styles.filterBar, 
          { 
            transform: [{ translateY: filterBarTranslate }],
            backgroundColor: colors.backgroundSecondary
          }
        ]}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
        >
          {muscleGroupOptions.map((opt) => (
            <TouchableOpacity
              key={`muscle-${opt.value}`}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedMuscle === opt.value ? colors.primary : 'transparent',
                  borderColor: selectedMuscle === opt.value ? colors.primary : colors.border
                }
              ]}
              onPress={() => {
                setSelectedMuscle(opt.value);
                Haptics.selectionAsync();
              }}
            >
              <Ionicons 
                name={opt.icon} 
                size={16} 
                color={selectedMuscle === opt.value ? '#FFF' : colors.text} 
                style={styles.chipIcon}
              />
              <Text style={{ 
                color: selectedMuscle === opt.value ? '#FFF' : colors.text,
                fontWeight: selectedMuscle === opt.value ? '600' : 'normal'
              }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: filterCount > 0 ? colors.primary + '20' : 'transparent',
                borderColor: colors.border
              }
            ]}
            onPress={() => {
              setShowFilterModal(true);
              Haptics.selectionAsync();
            }}
          >
            <Ionicons 
              name="options-outline" 
              size={16} 
              color={colors.primary} 
              style={styles.chipIcon}
            />
            <Text style={{ color: colors.primary }}>
              Filters {filterCount > 0 ? `(${filterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  }

  function renderSkeletonPlaceholder() {
    return (
      <CustomSkeletonLoader>
        <View style={styles.skeletonContainer}>
          <SkeletonItem style={styles.skeletonHeader}>
            <SkeletonItem style={styles.skeletonTitle} />
            <SkeletonItem style={styles.skeletonSearch} />
          </SkeletonItem>
          
          <SkeletonItem style={styles.skeletonFilterBar}>
            <SkeletonItem style={styles.skeletonChip} />
            <SkeletonItem style={styles.skeletonChip} />
            <SkeletonItem style={styles.skeletonChip} />
            <SkeletonItem style={styles.skeletonChip} />
          </SkeletonItem>
          
          <SkeletonItem style={styles.skeletonPopularContainer}>
            <SkeletonItem style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonPopularRow}>
              <SkeletonItem style={styles.skeletonPopularItem} />
              <SkeletonItem style={styles.skeletonPopularItem} />
              <SkeletonItem style={styles.skeletonPopularItem} />
            </View>
          </SkeletonItem>
          
          <SkeletonItem style={styles.skeletonListContainer}>
            <SkeletonItem style={styles.skeletonSectionTitle} />
            <SkeletonItem style={styles.skeletonListItem} />
            <SkeletonItem style={styles.skeletonListItem} />
            <SkeletonItem style={styles.skeletonListItem} />
            <SkeletonItem style={styles.skeletonListItem} />
          </SkeletonItem>
        </View>
      </CustomSkeletonLoader>
    );
  }

  return (
    <Container style={{ backgroundColor: colors.background }}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.background,
            opacity: headerOpacity,
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale }
            ]
          }
        ]}
      >
        <Title style={{ color: colors.text }}>Exercise Library</Title>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={dismissKeyboard}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      {/* Filter Bar */}
      {renderFilterBar()}

      {isLoading ? (
        renderSkeletonPlaceholder()
      ) : (
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Popular Exercises */}
          {popularExercises.length > 0 && searchQuery === '' && selectedMuscle === 'all' && selectedType === '' && selectedDifficulty === '' && (
            <View style={styles.section}>
              <Subheading dark={darkMode} style={styles.sectionTitle}>Popular Exercises</Subheading>
              <FlatList
                data={popularExercises}
                keyExtractor={(item) => `popular-${item.id}`}
                renderItem={renderPopularExerciseItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.popularExercisesContainer}
              />
            </View>
          )}
          
          {/* Goal-based Recommendations */}
          {recentExercises.length > 0 && searchQuery === '' && selectedMuscle === 'all' && selectedType === '' && selectedDifficulty === '' && (
            <View style={styles.section}>
              <Subheading dark={darkMode} style={styles.sectionTitle}>
                Recommended for Your Goal
              </Subheading>
              <FlatList
                data={recentExercises}
                keyExtractor={(item) => `goal-${item.id}`}
                renderItem={renderPopularExerciseItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.popularExercisesContainer}
              />
            </View>
          )}

          {/* All Exercises */}
          <View style={styles.section}>
            <Subheading dark={darkMode} style={styles.sectionTitle}>
              {searchQuery || selectedMuscle !== 'all' || selectedType || selectedDifficulty
                ? `Results (${filteredExercises.length})`
                : 'All Exercises'}
            </Subheading>
            {filteredExercises.length === 0 ? (
              <View style={styles.emptyResultsContainer}>
                <Ionicons name="search-outline" size={60} color={colors.textTertiary} />
                <Text style={[styles.emptyResultsText, { color: colors.textSecondary }]}>
                  No exercises found
                </Text>
                <Caption dark={darkMode} style={styles.emptyResultsSubtext}>
                  Try changing your filters or search term
                </Caption>
                <Button
                  title="Reset Filters"
                  icon="refresh"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedMuscle('all');
                    setSelectedType('');
                    setSelectedDifficulty('');
                  }}
                  style={styles.resetButton}
                  dark={darkMode}
                />
              </View>
            ) : (
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                renderItem={renderExerciseItem}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false} // Disable scrolling as it's inside another ScrollView
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </Animated.ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView
            tint={darkMode ? "dark" : "light"}
            intensity={90}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <Title dark={darkMode}>Filter Exercises</Title>
              <TouchableOpacity 
                style={styles.resetFiltersButton}
                onPress={() => {
                  setSelectedMuscle('all');
                  setSelectedType('');
                  setSelectedDifficulty('');
                }}
              >
                <Text style={{ color: colors.primary }}>Reset</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContent}>
              <Subheading dark={darkMode} style={styles.filterGroupTitle}>Muscle Group</Subheading>
              <View style={styles.filterOptionsGrid}>
                {muscleGroupOptions.map((opt) => (
                  <TouchableOpacity
                    key={`modal-muscle-${opt.value}`}
                    style={[
                      styles.filterOptionItem,
                      {
                        backgroundColor: selectedMuscle === opt.value ? colors.primary : 'transparent',
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => {
                      setSelectedMuscle(opt.value);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Ionicons 
                      name={opt.icon} 
                      size={20} 
                      color={selectedMuscle === opt.value ? '#FFF' : colors.text} 
                      style={styles.filterOptionIcon}
                    />
                    <Text style={{ 
                      color: selectedMuscle === opt.value ? '#FFF' : colors.text 
                    }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Subheading dark={darkMode} style={styles.filterGroupTitle}>Exercise Type</Subheading>
              <View style={styles.filterOptionsGrid}>
                {exerciseTypeOptions.map((opt) => (
                  <TouchableOpacity
                    key={`modal-type-${opt.value}`}
                    style={[
                      styles.filterOptionItem,
                      {
                        backgroundColor: selectedType === opt.value ? colors.primary : 'transparent',
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => {
                      setSelectedType(opt.value);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Ionicons 
                      name={opt.icon} 
                      size={20} 
                      color={selectedType === opt.value ? '#FFF' : colors.text} 
                      style={styles.filterOptionIcon}
                    />
                    <Text style={{ 
                      color: selectedType === opt.value ? '#FFF' : colors.text 
                    }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Subheading dark={darkMode} style={styles.filterGroupTitle}>Difficulty</Subheading>
              <View style={styles.filterOptionsGrid}>
                {difficultyOptions.map((opt) => (
                  <TouchableOpacity
                    key={`modal-difficulty-${opt.value}`}
                    style={[
                      styles.filterOptionItem,
                      {
                        backgroundColor: selectedDifficulty === opt.value ? colors.primary : 'transparent',
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => {
                      setSelectedDifficulty(opt.value);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Ionicons 
                      name={opt.icon} 
                      size={20} 
                      color={selectedDifficulty === opt.value ? '#FFF' : colors.text} 
                      style={styles.filterOptionIcon}
                    />
                    <Text style={{ 
                      color: selectedDifficulty === opt.value ? '#FFF' : colors.text 
                    }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
});