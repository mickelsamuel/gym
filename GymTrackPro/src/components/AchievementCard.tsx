import React from 'react';
import { View, StyleSheet, ViewStyle, Image, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Card } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius } from '../constants/Theme';
import { format, formatDistanceToNow } from 'date-fns';

interface AchievementProps {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  icon?: string; // Ionicons name
  type?: 'workout' | 'strength' | 'cardio' | 'consistency' | 'milestone';
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress?: number; // 0-1 if achievement is in progress
  imageUrl?: string;
}

interface AchievementCardProps {
  achievement: AchievementProps;
  style?: ViewStyle;
  onPress?: () => void;
  compact?: boolean;
}

/**
 * AchievementCard component - displays user achievements with colorful styling
 */
export default function AchievementCard({
  achievement,
  style,
  onPress,
  compact = false,
}: AchievementCardProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  if (!achievement) return null;
  
  // Determine gradient colors based on achievement type and level
  const getGradientColors = (): [string, string] => {
    // Level based gradients
    if (achievement.level) {
      switch (achievement.level) {
        case 'bronze':
          return ['#CD7F32', '#A05A27'];
        case 'silver':
          return ['#C0C0C0', '#A8A8A8'];
        case 'gold':
          return ['#FFD700', '#FFA500'];
        case 'platinum':
          return ['#E5E4E2', '#B9B8B6'];
      }
    }
    
    // Type based gradients
    switch (achievement.type) {
      case 'workout':
        return [colors.primary, colors.primaryDark];
      case 'strength':
        return [colors.accent1, '#8A57D4'];
      case 'cardio':
        return [colors.accent2, '#FF8035'];
      case 'consistency':
        return [colors.secondary, '#25B086'];
      case 'milestone':
        return [colors.warning, '#E8B214'];
      default:
        return [colors.primary, colors.primaryDark];
    }
  };
  
  // Determine icon based on achievement type
  const getAchievementIcon = (): string => {
    if (achievement.icon) return achievement.icon;
    
    switch (achievement.type) {
      case 'workout':
        return 'trophy-outline';
      case 'strength':
        return 'barbell-outline';
      case 'cardio':
        return 'heart-outline';
      case 'consistency':
        return 'calendar-outline';
      case 'milestone':
        return 'flag-outline';
      default:
        return 'ribbon-outline';
    }
  };
  
  // Format date for display
  const formatAchievementDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };
  
  const renderCompactVersion = () => {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name={getAchievementIcon() as any}
            size={22}
            color="#FFFFFF"
          />
        </View>
        
        <View style={styles.compactContent}>
          <Text 
            variant="subtitle"
            style={{ color: '#FFFFFF', fontWeight: '600' } as TextStyle}
            numberOfLines={1}
          >
            {achievement.title}
          </Text>
          
          <Text
            variant="caption"
            style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 } as TextStyle}
          >
            {formatAchievementDate(achievement.date)}
          </Text>
        </View>
      </View>
    );
  };
  
  const renderFullVersion = () => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name={getAchievementIcon() as any}
              size={26}
              color="#FFFFFF"
            />
          </View>
          
          <View style={styles.titleContainer}>
            <Text
              variant="subtitle"
              style={{ color: '#FFFFFF', fontWeight: '600' } as TextStyle}
              numberOfLines={1}
            >
              {achievement.title}
            </Text>
            
            <Text
              variant="caption"
              style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 } as TextStyle}
            >
              {formatAchievementDate(achievement.date)}
            </Text>
          </View>
          
          {achievement.level && (
            <View style={styles.levelBadge}>
              <Text 
                variant="tiny" 
                style={{ 
                  color: '#FFFFFF', 
                  fontWeight: '700',
                  textTransform: 'uppercase',
                } as TextStyle}
              >
                {achievement.level}
              </Text>
            </View>
          )}
        </View>
        
        <Text
          variant="bodySmall"
          style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: Spacing.md } as TextStyle}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>
        
        {achievement.imageUrl && (
          <Image
            source={{ uri: achievement.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        {achievement.progress !== undefined && achievement.progress < 1 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${achievement.progress * 100}%` }
                ]} 
              />
            </View>
            <Text
              variant="tiny"
              style={{ color: 'rgba(255, 255, 255, 0.8)' } as TextStyle}
            >
              {Math.round(achievement.progress * 100)}% Complete
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <Card
      style={style}
      onPress={onPress}
      background={getGradientColors()[0]}
      noPadding={compact}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  dateText: {
    marginTop: 2,
  },
  description: {
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    marginTop: Spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.pill,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontWeight: '600',
  },
}); 