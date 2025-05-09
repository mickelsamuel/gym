import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Svg, Path, G } from 'react-native-svg';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Colors, Spacing, BorderRadius } from '../constants/Theme';

interface MuscleGroupSelectorProps {
  onSelectMuscle: (muscleId: string) => void;
  selectedMuscles: string[];
  showBothViews?: boolean;
}

/**
 * Interactive muscle group selector component
 * Allows users to select muscle groups from an anatomical visualization
 */
const MuscleGroupSelector: React.FC<MuscleGroupSelectorProps> = ({
  onSelectMuscle,
  selectedMuscles = [],
  showBothViews = true,
}) => {
  const { darkMode } = useExercise();
  const theme = darkMode ? Theme.dark : Theme.light;
  const [view, setView] = useState<'front' | 'back'>('front');

  // Define muscle groups with IDs, names, and SVG path coordinates
  const muscleGroups = [
    { id: 'chest', name: 'Chest', color: Colors.muscleChest, view: 'front', 
      path: 'M120,140 C130,130 140,120 150,120 C170,130 180,140 190,150 C200,160 200,170 190,180 C180,190 170,190 160,180 C150,170 140,160 130,150 C120,140 110,130 120,140 Z' },
    { id: 'back', name: 'Back', color: Colors.muscleBack, view: 'back',
      path: 'M120,140 C130,130 140,120 150,120 C170,130 180,140 190,150 C200,160 200,170 190,180 C180,190 170,190 160,180 C150,170 140,160 130,150 C120,140 110,130 120,140 Z' },
    { id: 'shoulders', name: 'Shoulders', color: Colors.muscleShoulders, view: 'front',
      path: 'M100,120 C110,110 120,100 130,100 C140,100 150,110 160,120 C170,130 180,140 170,150 C160,160 150,160 140,150 C130,140 120,130 110,120 C100,110 90,100 100,120 Z' },
    { id: 'legs', name: 'Legs', color: Colors.muscleLegs, view: 'front', 
      path: 'M130,200 C140,190 150,180 160,180 C170,180 180,190 190,200 C200,210 210,220 200,230 C190,240 180,250 170,250 C160,250 150,240 140,230 C130,220 120,210 130,200 Z' },
    { id: 'arms', name: 'Arms', color: Colors.muscleArms, view: 'both', 
      path: 'M80,150 C90,140 100,130 110,130 C120,130 130,140 140,150 C150,160 160,170 150,180 C140,190 130,190 120,180 C110,170 100,160 90,150 C80,140 70,130 80,150 Z' },
    { id: 'core', name: 'Core', color: Colors.muscleCore, view: 'front', 
      path: 'M140,160 C150,150 160,140 170,140 C180,140 190,150 200,160 C210,170 220,180 210,190 C200,200 190,210 180,210 C170,210 160,200 150,190 C140,180 130,170 140,160 Z' },
  ];

  const toggleView = () => {
    setView(view === 'front' ? 'back' : 'front');
  };

  const isMuscleSelected = (muscleId: string) => {
    return selectedMuscles.includes(muscleId);
  };

  const handleMusclePress = (muscleId: string) => {
    onSelectMuscle(muscleId);
  };

  // Filter muscles based on current view
  const getVisibleMuscles = () => {
    return muscleGroups.filter(muscle => 
      muscle.view === view || muscle.view === 'both'
    );
  };

  return (
    <View style={styles.container}>
      {showBothViews && (
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              view === 'front' && { backgroundColor: `${theme.primary}25` }
            ]}
            onPress={() => setView('front')}
          >
            <Text style={[
              styles.viewToggleText,
              view === 'front' && { color: theme.primary }
            ]}>
              Front View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              view === 'back' && { backgroundColor: `${theme.primary}25` }
            ]}
            onPress={() => setView('back')}
          >
            <Text style={[
              styles.viewToggleText,
              view === 'back' && { color: theme.primary }
            ]}>
              Back View
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.bodyContainer}>
        <Svg width="300" height="500" viewBox="0 0 300 500">
          {/* Body Outline */}
          <Path
            d="M150,50 C180,50 200,70 200,100 C200,120 190,130 190,140 C190,150 200,160 200,180 C200,200 180,230 180,260 C180,290 190,320 190,350 C190,380 170,420 150,450 C130,420 110,380 110,350 C110,320 120,290 120,260 C120,230 100,200 100,180 C100,160 110,150 110,140 C110,130 100,120 100,100 C100,70 120,50 150,50 Z"
            fill={darkMode ? "#333" : "#f0f0f0"}
            stroke={darkMode ? "#666" : "#ccc"}
            strokeWidth="2"
          />
          
          {/* Muscle Groups */}
          {getVisibleMuscles().map((muscle) => (
            <Path
              key={muscle.id}
              d={muscle.path}
              fill={isMuscleSelected(muscle.id) ? muscle.color : `${muscle.color}40`}
              stroke={isMuscleSelected(muscle.id) ? muscle.color : `${muscle.color}80`}
              strokeWidth="1"
              onPress={() => handleMusclePress(muscle.id)}
            />
          ))}
        </Svg>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendContainer}>
        {muscleGroups.map((muscle) => (
          <TouchableOpacity
            key={muscle.id}
            style={[
              styles.legendItem,
              isMuscleSelected(muscle.id) && { backgroundColor: `${muscle.color}25` }
            ]}
            onPress={() => handleMusclePress(muscle.id)}
          >
            <View style={[styles.colorIndicator, { backgroundColor: muscle.color }]} />
            <Text style={[
              styles.legendText,
              isMuscleSelected(muscle.id) && { color: theme.primary, fontWeight: '600' }
            ]}>
              {muscle.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.lg,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  viewToggleButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    marginHorizontal: Spacing.xs,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bodyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  legendContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.pill,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
  legendText: {
    fontSize: 14,
  },
});

export default MuscleGroupSelector; 