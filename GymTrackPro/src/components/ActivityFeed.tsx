import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ViewStyle,
  RefreshControl,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Card } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { formatDistanceToNow } from 'date-fns';

// Types
type ActivityType = 'workout' | 'achievement' | 'milestone' | 'follow' | 'like' | 'comment';

interface User {
  id: string;
  name: string;
  username?: string;
  profileImageUrl?: string;
}

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: User;
  timestamp: string; // ISO date string
  content?: {
    text?: string;
    imageUrl?: string;
    workoutId?: string;
    workoutName?: string;
    achievementId?: string;
    achievementName?: string;
    targetUser?: User;
    stats?: {
      duration?: number;
      calories?: number;
      distance?: number;
      exercises?: number;
      sets?: number;
      reps?: number;
      weight?: number;
    };
  };
  likes: number;
  comments: number;
  liked: boolean;
}

interface ActivityFeedProps {
  data: ActivityItem[];
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onUserPress?: (userId: string) => void;
  onItemPress?: (item: ActivityItem) => void;
  onWorkoutPress?: (workoutId: string) => void;
  style?: ViewStyle;
  emptyMessage?: string;
}

/**
 * ActivityFeed component - displays social activity feed
 */
export default function ActivityFeed({
  data,
  loading = false,
  onRefresh,
  refreshing = false,
  onLike,
  onComment,
  onUserPress,
  onItemPress,
  onWorkoutPress,
  style,
  emptyMessage = 'No activity to show',
}: ActivityFeedProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return timestamp;
    }
  };
  
  // Get icon for activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'workout': return 'barbell-outline';
      case 'achievement': return 'trophy-outline';
      case 'milestone': return 'flag-outline';
      case 'follow': return 'person-add-outline';
      case 'like': return 'heart-outline';
      case 'comment': return 'chatbubble-outline';
      default: return 'barbell-outline';
    }
  };
  
  // Get activity title based on type
  const getActivityTitle = (item: ActivityItem) => {
    switch (item.type) {
      case 'workout':
        return `completed a workout${item.content?.workoutName ? `: ${item.content.workoutName}` : ''}`;
      case 'achievement':
        return `earned an achievement${item.content?.achievementName ? `: ${item.content.achievementName}` : ''}`;
      case 'milestone':
        return 'reached a fitness milestone';
      case 'follow':
        return `started following ${item.content?.targetUser?.name || 'someone'}`;
      case 'like':
        return 'liked a workout';
      case 'comment':
        return 'commented on a workout';
      default:
        return 'posted an update';
    }
  };
  
  // Format workout stats nicely
  const formatWorkoutStat = (key: string, value?: number) => {
    if (value === undefined) return null;
    
    switch (key) {
      case 'duration':
        return value < 60 ? `${value}m` : `${Math.floor(value / 60)}h ${value % 60 > 0 ? `${value % 60}m` : ''}`;
      case 'distance':
        return `${value} km`;
      case 'calories':
        return `${value} cal`;
      default:
        return value.toString();
    }
  };
  
  // Render an empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={50} color={colors.textTertiary} />
      <Text
        variant="body"
        style={{ color: colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' } as TextStyle}
      >
        {emptyMessage}
      </Text>
    </View>
  );
  
  // Render a single activity item
  const renderActivityItem = ({ item }: { item: ActivityItem }) => {
    return (
      <Card 
        category="social" 
        style={styles.activityCard}
        onPress={() => onItemPress && onItemPress(item)}
      >
        <View style={styles.activityHeader}>
          <TouchableOpacity 
            style={styles.userContainer}
            onPress={() => onUserPress && onUserPress(item.user.id)}
            activeOpacity={0.8}
          >
            <Image 
              source={{ 
                uri: item.user.profileImageUrl || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user.name)}&background=random` 
              }} 
              style={styles.userAvatar} 
            />
            <View style={styles.userInfo}>
              <Text variant="subtitle" style={styles.userName}>
                {item.user.name}
              </Text>
              <View style={styles.activityInfo}>
                <Text 
                  variant="caption" 
                  style={{ color: colors.textSecondary } as TextStyle}
                >
                  {getActivityTitle(item)}
                </Text>
                <Text 
                  variant="tiny" 
                  style={{ color: colors.textTertiary, marginLeft: Spacing.xs } as TextStyle}
                >
                  • {formatTimestamp(item.timestamp)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={[
            styles.activityTypeIcon,
            { backgroundColor: colors.primary + '15' }
          ]}>
            <Ionicons 
              name={getActivityIcon(item.type)} 
              size={14} 
              color={colors.primary} 
            />
          </View>
        </View>
        
        {/* Content text */}
        {item.content?.text && (
          <Text 
            variant="body" 
            style={styles.contentText}
          >
            {item.content.text}
          </Text>
        )}
        
        {/* Content image */}
        {item.content?.imageUrl && (
          <Image 
            source={{ uri: item.content.imageUrl }} 
            style={styles.contentImage} 
            resizeMode="cover"
          />
        )}
        
        {/* Workout Stats */}
        {item.type === 'workout' && item.content?.stats && (
          <View style={styles.statsContainer}>
            {Object.entries(item.content.stats).map(([key, value]) => {
              const formattedValue = formatWorkoutStat(key, value);
              if (!formattedValue) return null;
              
              return (
                <View key={key} style={styles.statItem}>
                  <Text 
                    variant="caption" 
                    style={{ color: colors.textSecondary } as TextStyle}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    style={{ fontWeight: '600' } as TextStyle}
                  >
                    {formattedValue}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        
        {/* Workout Link */}
        {item.content?.workoutId && item.type === 'workout' && (
          <TouchableOpacity
            style={[
              styles.workoutLink,
              { backgroundColor: colors.primary + '10' }
            ]}
            onPress={() => onWorkoutPress && onWorkoutPress(item.content?.workoutId || '')}
            activeOpacity={0.7}
          >
            <Ionicons name="barbell-outline" size={16} color={colors.primary} />
            <Text 
              variant="bodySmall" 
              style={{ color: colors.primary, marginLeft: Spacing.xs, fontWeight: '500' } as TextStyle}
            >
              View Workout Details
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onLike && onLike(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={item.liked ? 'heart' : 'heart-outline'} 
              size={22} 
              color={item.liked ? colors.danger : colors.text} 
            />
            <Text 
              variant="caption" 
              style={
                item.liked 
                  ? { color: colors.danger, marginLeft: 4 } as TextStyle
                  : { color: colors.textSecondary, marginLeft: 4 } as TextStyle
              }
            >
              {item.likes}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onComment && onComment(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            <Text 
              variant="caption" 
              style={{ color: colors.textSecondary, marginLeft: 4 } as TextStyle}
            >
              {item.comments}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };
  
  return (
    <FlatList
      data={data}
      renderItem={renderActivityItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  activityCard: {
    marginBottom: Spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  contentText: {
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  statItem: {
    marginRight: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  workoutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
    padding: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
}); 