import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ProfileStats {
  workouts: number;
  followers: number;
  following: number;
}

interface ProfileHeaderProps {
  name: string;
  username?: string;
  bio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  stats?: ProfileStats;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
  style?: ViewStyle;
  onEditProfile?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onStatsPress?: (statType: 'workouts' | 'followers' | 'following') => void;
}

/**
 * ProfileHeader component - displays user profile information
 */
export default function ProfileHeader({
  name,
  username,
  bio,
  profileImageUrl,
  coverImageUrl,
  stats,
  isCurrentUser = false,
  isFollowing = false,
  style,
  onEditProfile,
  onFollow,
  onMessage,
  onStatsPress,
}: ProfileHeaderProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Default avatar url if none provided
  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random';
  
  // Handler fallbacks
  const handleEditProfile = () => {
    if (onEditProfile) onEditProfile();
  };

  const handleFollow = () => {
    if (onFollow) onFollow();
  };

  const handleMessage = () => {
    if (onMessage) onMessage();
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={styles.coverImage} />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accent1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverGradient}
          />
        )}
        
        {isCurrentUser && (
          <TouchableOpacity 
            style={[
              styles.editCoverButton,
              { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
            ]}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Profile Image */}
      <View style={styles.profileImageWrapper}>
        <Image 
          source={{ uri: profileImageUrl || defaultAvatar }} 
          style={styles.profileImage}
        />
        
        {isCurrentUser && (
          <TouchableOpacity 
            style={[
              styles.editAvatarButton,
              { backgroundColor: colors.primary }
            ]}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Text variant="heading3" style={styles.name}>
          {name}
        </Text>
        
        {username && (
          <Text 
            variant="bodySmall"
            style={{ color: colors.textSecondary, marginTop: 2 } as TextStyle}
          >
            @{username}
          </Text>
        )}
        
        {bio && (
          <Text 
            variant="body"
            style={{ color: colors.text, marginTop: Spacing.sm, textAlign: 'center' } as TextStyle}
          >
            {bio}
          </Text>
        )}
      </View>
      
      {/* Stats Row */}
      {stats && (
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => onStatsPress && onStatsPress('workouts')}
            activeOpacity={0.8}
          >
            <Text 
              variant="subtitle"
              style={{ color: colors.text, fontWeight: '600' } as TextStyle}
            >
              {stats.workouts}
            </Text>
            <Text 
              variant="caption"
              style={{ color: colors.textSecondary, marginTop: 4 } as TextStyle}
            >
              Workouts
            </Text>
          </TouchableOpacity>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => onStatsPress && onStatsPress('followers')}
            activeOpacity={0.8}
          >
            <Text 
              variant="subtitle"
              style={{ color: colors.text, fontWeight: '600' } as TextStyle}
            >
              {stats.followers}
            </Text>
            <Text 
              variant="caption"
              style={{ color: colors.textSecondary, marginTop: 4 } as TextStyle}
            >
              Followers
            </Text>
          </TouchableOpacity>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => onStatsPress && onStatsPress('following')}
            activeOpacity={0.8}
          >
            <Text 
              variant="subtitle"
              style={{ color: colors.text, fontWeight: '600' } as TextStyle}
            >
              {stats.following}
            </Text>
            <Text 
              variant="caption"
              style={{ color: colors.textSecondary, marginTop: 4 } as TextStyle}
            >
              Following
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Action Buttons */}
      {!isCurrentUser ? (
        <View style={styles.actionButtons}>
          <Button
            title={isFollowing ? "Following" : "Follow"}
            onPress={handleFollow}
            type={isFollowing ? "secondary" : "primary"}
            size="medium"
            style={{ flex: 1, marginRight: Spacing.sm }}
          />
          
          <Button
            title="Message"
            onPress={handleMessage}
            type="secondary"
            size="medium"
            icon="chatbubble-outline"
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Button
          title="Edit Profile"
          onPress={handleEditProfile}
          type="secondary"
          size="medium"
          icon="pencil-outline"
          style={styles.editButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  coverContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...createElevation(2, false),
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    width: '100%',
    height: '100%',
  },
  editCoverButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginTop: -50,
    alignSelf: 'center',
    position: 'relative',
    ...createElevation(3, false),
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  name: {
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  editButton: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
}); 