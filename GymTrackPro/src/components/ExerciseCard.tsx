import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, Image, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Card } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Typography, Spacing, BorderRadius, createElevation, Colors } from '../constants/Theme';

interface ExerciseCardProps {
  exercise: any; // Replace with your exercise type
  onPress?: () => void;
  onFavoritePress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
  showFavorite?: boolean;
  variant?: 'default' | 'selectable' | 'workout';
  isSelected?: boolean;
  rightComponent?: React.ReactNode;
}

/**
 * ExerciseCard component - displays exercise details in a card format
 */
export default function ExerciseCard({
  exercise,
  onPress,
  onFavoritePress,
  style,
  compact = false,
  showFavorite = true,
  variant = 'default',
  isSelected = false,
  rightComponent,
}: ExerciseCardProps) {
  const { darkMode, isFavorite } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  if (!exercise) return null;
  
  // Determine primary muscle color based on category
  const getMuscleColor = (muscle: string) => {
    if (!muscle) return colors.textSecondary;
    
    const muscleKey = muscle.toLowerCase().replace(/\s/g, '');
    
    if (muscleKey.includes('chest')) return Colors.muscleChest;
    if (muscleKey.includes('back') || muscleKey.includes('lats')) return Colors.muscleBack;
    if (muscleKey.includes('shoulder') || muscleKey.includes('delt')) return Colors.muscleShoulders;
    if (muscleKey.includes('bicep') || muscleKey.includes('tricep') || muscleKey.includes('arm')) return Colors.muscleArms;
    if (muscleKey.includes('leg') || muscleKey.includes('quad') || muscleKey.includes('hamstring') || muscleKey.includes('calv')) return Colors.muscleLegs;
    if (muscleKey.includes('abs') || muscleKey.includes('core')) return Colors.muscleCore;
    if (muscleKey.includes('cardio')) return Colors.muscleCardio;
    if (muscleKey.includes('full') || muscleKey.includes('compound')) return Colors.muscleFullBody;
    
    return colors.textSecondary;
  };
  
  // Extract primary muscle for color coding
  const primaryMuscle = exercise.primaryMuscles && exercise.primaryMuscles.length > 0
    ? exercise.primaryMuscles[0]
    : null;
    
  const muscleColor = getMuscleColor(primaryMuscle);
  
  // Format difficulty to capitalize first letter
  const formatDifficulty = (difficulty: string) => {
    if (!difficulty) return '';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };
  
  // Check if exercise is favorited
  const isFavorited = isFavorite && isFavorite(exercise.id);
  
  // Handle favorite press with stop propagation
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (onFavoritePress) {
      onFavoritePress();
    }
  };
  
  // Determine what icon to show for exercise type
  const getExerciseTypeIcon = () => {
    if (!exercise.equipment) return 'body-outline';
    
    const equipment = exercise.equipment.toLowerCase();
    
    if (equipment.includes('barbell')) return 'barbell-outline';
    if (equipment.includes('dumbbell')) return 'fitness-outline';
    if (equipment.includes('machine')) return 'cog-outline';
    if (equipment.includes('cable')) return 'git-network-outline';
    if (equipment.includes('bodyweight')) return 'body-outline';
    if (equipment.includes('cardio')) return 'heart-outline';
    
    return 'barbell-outline';
  };
  
  const renderCompactVersion = () => {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.muscleIndicator, { backgroundColor: muscleColor }]} />
        <View style={styles.compactContent}>
          <Text 
            variant="bodySmall" 
            style={styles.compactTitle}
            numberOfLines={1}
          >
            {exercise.name}
          </Text>
          
          <View style={styles.compactMeta}>
            <Ionicons name={getExerciseTypeIcon()} size={12} color={colors.textTertiary} />
            <Text 
              variant="tiny" 
              style={{ color: colors.textTertiary, marginLeft: 4 } as TextStyle}
              numberOfLines={1}
            >
              {exercise.equipment || 'Bodyweight'} 
              {primaryMuscle && ` • ${primaryMuscle}`}
            </Text>
          </View>
        </View>
        
        {variant === 'selectable' && (
          <View style={[
            styles.selector, 
            isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color={colors.primary} />
            )}
          </View>
        )}
        
        {showFavorite && variant === 'default' && (
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFavorited ? 'heart' : 'heart-outline'} 
              size={18} 
              color={isFavorited ? colors.danger : colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
        
        {rightComponent}
      </View>
    );
  };
  
  const renderFullVersion = () => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: muscleColor + '20' }]}>
              <Ionicons name={getExerciseTypeIcon()} size={20} color={muscleColor} />
            </View>
            <View style={styles.titleContainer}>
              <Text variant="subtitle" style={styles.title} numberOfLines={2}>
                {exercise.name}
              </Text>
              {exercise.equipment && (
                <Text variant="caption" style={{ color: colors.textSecondary } as TextStyle}>
                  {exercise.equipment}
                </Text>
              )}
            </View>
            
            {showFavorite && variant === 'default' && (
              <TouchableOpacity 
                style={styles.favoriteButton} 
                onPress={handleFavoritePress}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isFavorited ? 'heart' : 'heart-outline'} 
                  size={22} 
                  color={isFavorited ? colors.danger : colors.textSecondary} 
                />
              </TouchableOpacity>
            )}
            
            {variant === 'selectable' && (
              <View style={[
                styles.selector, 
                styles.selectorLarge,
                isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </View>
            )}
            
            {rightComponent}
          </View>
        </View>
        
        <View style={styles.body}>
          <View style={styles.muscleContainer}>
            {primaryMuscle && (
              <View style={[styles.musclePill, { backgroundColor: muscleColor + '20' }]}>
                <Text 
                  variant="caption" 
                  style={{ color: muscleColor, fontWeight: '500' } as TextStyle}
                >
                  {primaryMuscle}
                </Text>
              </View>
            )}
            
            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
              exercise.secondaryMuscles.slice(0, 2).map((muscle: string, index: number) => (
                <View 
                  key={index}
                  style={[
                    styles.musclePill,
                    { backgroundColor: colors.textTertiary + '10' }
                  ]}
                >
                  <Text 
                    variant="caption" 
                    style={{ color: colors.textSecondary } as TextStyle}
                  >
                    {muscle}
                  </Text>
                </View>
              ))
            )}
            
            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 2 && (
              <Text 
                variant="caption" 
                style={{ color: colors.textSecondary, marginLeft: Spacing.xs } as TextStyle}
              >
                +{exercise.secondaryMuscles.length - 2} more
              </Text>
            )}
          </View>
          
          {exercise.difficulty && (
            <View style={[
              styles.difficultyPill, 
              { 
                backgroundColor: 
                  exercise.difficulty === 'beginner' ? colors.success + '20' :
                  exercise.difficulty === 'intermediate' ? colors.warning + '20' :
                  colors.danger + '20'
              }
            ]}>
              <Text 
                variant="tiny" 
                style={{ 
                  color: 
                    exercise.difficulty === 'beginner' ? colors.success :
                    exercise.difficulty === 'intermediate' ? colors.warning :
                    colors.danger,
                  fontWeight: '600'
                } as TextStyle}
              >
                {formatDifficulty(exercise.difficulty)}
              </Text>
            </View>
          )}
        </View>
        
        {exercise.description && (
          <Text 
            variant="bodySmall"
            style={{ color: colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.sm } as TextStyle}
            numberOfLines={2}
          >
            {exercise.description}
          </Text>
        )}
        
        {exercise.image && (
          <Image 
            source={{ uri: exercise.image }} 
            style={styles.image} 
            resizeMode="cover"
          />
        )}
      </View>
    );
  };
  
  return (
    <Card
      style={style}
      elevation={1}
      onPress={onPress}
      compact={compact}
    >
      {compact ? renderCompactVersion() : renderFullVersion()}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  muscleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  musclePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  difficultyPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  description: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  favoriteButton: {
    padding: Spacing.xs,
  },
  selector: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.circle,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  selectorLarge: {
    width: 28,
    height: 28,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  compactContent: {
    flex: 1,
  },
  muscleIndicator: {
    width: 3,
    height: 24,
    borderRadius: 1.5,
    marginRight: Spacing.sm,
  },
  compactTitle: {
    fontWeight: '500',
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  compactMetaText: {
    marginLeft: 4,
  },
}); 