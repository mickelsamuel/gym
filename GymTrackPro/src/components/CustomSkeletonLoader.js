import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius } from '../constants/Theme';

const { width } = Dimensions.get('window');
const cardWidth = width - (Spacing.md * 2);

/**
 * CustomSkeletonLoader Component
 * Displays skeleton loading UI for different content types
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Type of skeleton to display (card, exercise, profile, list, etc.)
 * @param {number} props.count - Number of skeleton items to display
 * @param {Object} props.style - Additional styles
 */
const CustomSkeletonLoader = ({ type = 'card', count = 3, style }) => {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  const renderSkeletonContent = () => {
    switch (type) {
      case 'card':
        return Array(count).fill(0).map((_, index) => (
          <View key={`card-skeleton-${index}`} style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle} />
              <View style={styles.cardSubtitle} />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardStat} />
              <View style={styles.cardStat} />
              <View style={styles.cardStat} />
            </View>
          </View>
        ));
      
      case 'exercise':
        return Array(count).fill(0).map((_, index) => (
          <View key={`exercise-skeleton-${index}`} style={styles.exerciseContainer}>
            <View style={styles.exerciseLeft}>
              <View style={styles.exerciseIcon} />
            </View>
            <View style={styles.exerciseMiddle}>
              <View style={styles.exerciseTitle} />
              <View style={styles.exerciseSubtitle} />
            </View>
            <View style={styles.exerciseRight}>
              <View style={styles.exerciseAction} />
            </View>
          </View>
        ));
      
      case 'profile':
        return (
          <View style={styles.profileContainer}>
            <View style={styles.profileAvatar} />
            <View style={styles.profileName} />
            <View style={styles.profileBio} />
            <View style={styles.profileStats}>
              <View style={styles.profileStat} />
              <View style={styles.profileStat} />
              <View style={styles.profileStat} />
            </View>
          </View>
        );
      
      case 'workout':
        return Array(count).fill(0).map((_, index) => (
          <View key={`workout-skeleton-${index}`} style={styles.workoutContainer}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutIcon} />
              <View style={styles.workoutTitle} />
            </View>
            <View style={styles.workoutExercises}>
              <View style={styles.workoutExercise} />
              <View style={styles.workoutExercise} />
              <View style={styles.workoutExercise} />
            </View>
            <View style={styles.workoutFooter}>
              <View style={styles.workoutStat} />
              <View style={styles.workoutStat} />
            </View>
          </View>
        ));
      
      case 'list':
      default:
        return Array(count).fill(0).map((_, index) => (
          <View key={`list-skeleton-${index}`} style={styles.listItem}>
            <View style={styles.listIcon} />
            <View style={styles.listContent}>
              <View style={styles.listTitle} />
              <View style={styles.listSubtitle} />
            </View>
          </View>
        ));
    }
  };
  
  return (
    <SkeletonPlaceholder 
      backgroundColor={darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
      highlightColor={darkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)'}
      speed={1200}
    >
      <View style={[styles.container, style]}>
        {renderSkeletonContent()}
      </View>
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  // Card skeleton
  cardContainer: {
    width: cardWidth,
    height: 180,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  cardHeader: {
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    height: 24,
    width: '60%',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    height: 16,
    width: '40%',
    borderRadius: BorderRadius.sm,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  cardStat: {
    height: 60,
    width: '30%',
    borderRadius: BorderRadius.sm,
  },
  // Exercise skeleton
  exerciseContainer: {
    flexDirection: 'row',
    height: 72,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  exerciseLeft: {
    width: 48,
    marginRight: Spacing.sm,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
  },
  exerciseMiddle: {
    flex: 1,
  },
  exerciseTitle: {
    height: 18,
    width: '70%',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  exerciseSubtitle: {
    height: 14,
    width: '50%',
    borderRadius: BorderRadius.sm,
  },
  exerciseRight: {
    width: 40,
  },
  exerciseAction: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.circle,
  },
  // Profile skeleton
  profileContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  profileName: {
    width: 160,
    height: 24,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  profileBio: {
    width: '80%',
    height: 16,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.md,
  },
  profileStat: {
    width: '28%',
    height: 60,
    borderRadius: BorderRadius.md,
  },
  // Workout skeleton
  workoutContainer: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  workoutIcon: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.circle,
    marginRight: Spacing.sm,
  },
  workoutTitle: {
    width: '60%',
    height: 22,
    borderRadius: BorderRadius.sm,
  },
  workoutExercises: {
    marginVertical: Spacing.sm,
  },
  workoutExercise: {
    height: 16,
    width: '90%',
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  workoutFooter: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  workoutStat: {
    width: '30%',
    height: 16,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  // List skeleton
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginBottom: Spacing.sm,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    marginRight: Spacing.md,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    height: 18,
    width: '60%',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  listSubtitle: {
    height: 14,
    width: '40%',
    borderRadius: BorderRadius.sm,
  },
});

export default CustomSkeletonLoader; 