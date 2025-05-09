import React, { useState } from 'react';
import {View, StyleSheet, TouchableOpacity, ViewStyle, Dimensions} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useExercise } from '../context/ExerciseContext';
import {Theme, Colors, Spacing, BorderRadius} from '../constants/Theme';
import { Text } from './ui';
import MuscleGroupBadge from './ui/MuscleGroupBadge';
;
// Get device dimensions
const { width } = Dimensions.get('window');
const BODY_WIDTH = Math.min(width - 40, 300);
const BODY_HEIGHT = BODY_WIDTH * 2;
// Define svg paths for each muscle group
const MUSCLE_PATHS = {
  chest: "M120,110 C140,105 160,105 180,110 C190,120 190,140 190,160 C190,170 185,180 180,185 C160,190 140,190 120,185 C115,180 110,170 110,160 C110,140 110,120 120,110 Z",
  back: "M120,180 C140,185 160,185 180,180 C190,170 195,160 195,150 C195,130 195,110 180,90 C160,85 140,85 120,90 C105,110 105,130 105,150 C105,160 110,170 120,180 Z",
  shoulders: "M90,100 C95,90 105,80 115,75 C125,80 130,90 130,100 C130,110 125,120 115,125 C105,120 95,110 90,100 Z M210,100 C205,90 195,80 185,75 C175,80 170,90 170,100 C170,110 175,120 185,125 C195,120 205,110 210,100 Z",
  arms: "M90,140 C80,130 75,120 75,100 C75,90 80,80 90,70 C80,80 70,90 70,100 C70,120 75,130 85,140 C90,145 95,150 90,140 Z M210,140 C220,130 225,120 225,100 C225,90 220,80 210,70 C220,80 230,90 230,100 C230,120 225,130 215,140 C210,145 205,150 210,140 Z",
  legs: "M115,300 C120,280 125,260 125,240 C125,220 120,200 115,180 L120,180 L130,180 L140,180 L150,180 L160,180 L170,180 L175,180 C170,200 165,220 165,240 C165,260 170,280 175,300 L160,300 L150,300 L140,300 L130,300 L115,300 Z",
  core: "M135,180 C145,175 155,175 165,180 C175,190 175,200 175,210 C175,220 170,230 165,235 C155,240 145,240 135,235 C130,230 125,220 125,210 C125,200 125,190 135,180 Z",
  fullBody: "M120,110 C140,105 160,105 180,110 C190,140 190,170 180,185 C160,190 140,190 120,185 C110,170 110,140 120,110 Z M90,140 C80,130 75,120 75,100 C75,90 80,80 90,70 C80,80 70,90 70,100 C70,120 75,130 85,140 C90,145 95,150 90,140 Z M210,140 C220,130 225,120 225,100 C225,90 220,80 210,70 C220,80 230,90 230,100 C230,120 225,130 215,140 C210,145 205,150 210,140 Z M90,100 C95,90 105,80 115,75 C125,80 130,90 130,100 C130,110 125,120 115,125 C105,120 95,110 90,100 Z M210,100 C205,90 195,80 185,75 C175,80 170,90 170,100 C170,110 175,120 185,125 C195,120 205,110 210,100 Z M115,300 C120,280 125,260 125,240 C125,220 120,200 115,180 L175,180 C170,200 165,220 165,240 C165,260 170,280 175,300 L115,300 Z M135,180 C145,175 155,175 165,180 C175,190 175,200 175,210 C175,220 170,230 165,235 C155,240 145,240 135,235 C130,230 125,220 125,210 C125,200 125,190 135,180 Z",
  cardio: "M150,240 C160,230 170,230 180,240 C190,250 190,260 180,270 C170,280 160,280 150,270 C140,260 140,250 150,240 Z"
};
interface MuscleGroupSelectorProps {
  selectedMuscles: string[];
  onSelect: (muscleGroup: string) => void;
  style?: ViewStyle;
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  showLabels?: boolean;
}
/**
 * MuscleGroupSelector component
 * 
 * An interactive body map visualization for selecting muscle groups
 * Allows users to toggle selection of muscle groups with visual feedback
 */
const MuscleGroupSelector: React.FC<MuscleGroupSelectorProps> = ({
  selectedMuscles = [],
  onSelect,
  style,
  primaryMuscle,
  secondaryMuscles = [],
  showLabels = true
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  // Get color for a muscle group
  const getMuscleGroupColor = (muscleGroup: string, isActive: boolean): string => {
    const muscleColors: Record<string, string> = {
      chest: Colors.muscleChest,
      back: Colors.muscleBack,
      legs: Colors.muscleLegs,
      shoulders: Colors.muscleShoulders,
      arms: Colors.muscleArms,
      core: Colors.muscleCore,
      fullBody: Colors.muscleFullBody,
      cardio: Colors.muscleCardio
    };
    const baseColor = muscleColors[muscleGroup] || theme.primary;
    if (isActive) {
      return baseColor;
    }
    // For inactive muscle groups, return a more transparent version
    return darkMode ? `${baseColor}40` : `${baseColor}30`;
  };
  // Get muscle group label for display
  const getMuscleGroupLabel = (muscleGroup: string): string => {
    const labels: Record<string, string> = {
      chest: 'Chest',
      back: 'Back',
      legs: 'Legs',
      shoulders: 'Shoulders',
      arms: 'Arms',
      core: 'Core',
      fullBody: 'Full Body',
      cardio: 'Cardio'
    };
    return labels[muscleGroup] || muscleGroup;
  };
  // Determine if a muscle is primary, secondary or regular selected
  const getMuscleStatus = (muscleGroup: string) => {
    if (primaryMuscle === muscleGroup) {
      return 'primary';
    } else if (secondaryMuscles.includes(muscleGroup)) {
      return 'secondary';
    } else if (selectedMuscles.includes(muscleGroup)) {
      return 'selected';
    }
    return 'inactive';
  };
  // Get the opacity for a muscle path based on its status
  const getMuscleOpacity = (muscleGroup: string): number => {
    const status = getMuscleStatus(muscleGroup);
    switch (status) {
      case 'primary': return 1;
      case 'secondary': return 0.75;
      case 'selected': return 0.85;
      default: return 0.3;
    }
  };
  // Handle muscle group selection
  const handleMuscleSelect = (muscleGroup: string) => {
    onSelect(muscleGroup);
  };
  return (
    <View style={[styles.container, style]}>
      {/* Body visualization */}
      <View style={styles.bodyContainer}>
        <Svg width={BODY_WIDTH} height={BODY_HEIGHT} viewBox="0 0 300 400">
          {/* Outline of the body */}
          <Path 
            d="M150,50 C170,50 190,60 200,80 C210,100 210,120 205,140 C220,150 230,170 230,190 C230,210 220,230 210,245 C200,260 190,270 190,290 C190,310 195,330 200,350 L150,350 L100,350 C105,330 110,310 110,290 C110,270 100,260 90,245 C80,230 70,210 70,190 C70,170 80,150 95,140 C90,120 90,100 100,80 C110,60 130,50 150,50 Z"
            fill="none"
            stroke={darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="1"
          />
          {/* Muscle groups */}
          {Object.entries(MUSCLE_PATHS).map(([muscle, path]) => (
            <TouchableOpacity key={muscle} onPress={() => handleMuscleSelect(muscle)}>
              <Path
                d={path}
                fill={getMuscleGroupColor(muscle, selectedMuscles.includes(muscle))}
                opacity={getMuscleOpacity(muscle)}
                strokeWidth="1"
                stroke={darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
              />
            </TouchableOpacity>
          ))}
        </Svg>
      </View>
      {/* Legend */}
      {showLabels && (
        <View style={styles.legend}>
          <Text variant="bodySmall" style={styles.legendTitle}>Muscle Groups</Text>
          <View style={styles.legendContent}>
            {Object.keys(MUSCLE_PATHS).map((muscle) => (
              <MuscleGroupBadge
                key={muscle}
                muscleGroup={muscle}
                label={getMuscleGroupLabel(muscle)}
                selected={selectedMuscles.includes(muscle)}
                onPress={() => handleMuscleSelect(muscle)}
                style={styles.badge}
                size="small"
              />
            ))}
          </View>
        </View>
      )}
      {/* Status indicators */}
      {(primaryMuscle || secondaryMuscles.length > 0) && (
        <View style={styles.statusLegend}>
          {primaryMuscle && (
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: Colors[`muscle${capitalizeFirstLetter(primaryMuscle)}`] }]} />
              <Text variant="caption">Primary Muscle</Text>
            </View>
          )}
          {secondaryMuscles.length > 0 && (
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: Colors.muscleBack, opacity: 0.75 }]} />
              <Text variant="caption">Secondary Muscles</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (string: string): string => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  bodyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  legend: {
    width: '100%',
    marginTop: Spacing.md,
  },
  legendTitle: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  legendContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    margin: Spacing.xs,
  },
  statusLegend: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
});
export default MuscleGroupSelector; 