import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Svg, Path, Text as SvgText, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Theme, Colors, BorderRadius, Spacing, Animation } from '../constants/Theme';
import { Text } from './ui';
import { useExercise } from '../context/ExerciseContext';

// Define muscle group types and colors
export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'glutes'
  | 'forearms'
  | 'traps'
  | 'none';

// Interface for muscle data
interface MuscleData {
  id: MuscleGroup;
  name: string;
  color: string;
  path: string;
  position?: { x: number, y: number }; // For label positioning
}

interface MuscleMapProps {
  selectedMuscles?: MuscleGroup[];
  primaryMuscle?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  onSelectMuscle?: (muscle: MuscleGroup) => void;
  interactive?: boolean;
  darkMode?: boolean;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
  frontView?: boolean; // Toggle between front and back view
}

const MuscleMap: React.FC<MuscleMapProps> = ({
  selectedMuscles = [],
  primaryMuscle,
  secondaryMuscles = [],
  onSelectMuscle,
  interactive = false,
  darkMode: propDarkMode,
  showLabels = true,
  size = 'medium',
  frontView = true,
}) => {
  const { darkMode: contextDarkMode, reducedMotion } = useExercise();
  const isDark = propDarkMode !== undefined ? propDarkMode : contextDarkMode;
  const currentTheme = isDark ? Theme.dark : Theme.light;
  
  // Animation values for muscle highlights
  const [muscleAnimations, setMuscleAnimations] = useState<{[key: string]: Animated.Value}>({});
  const [recentlyPressed, setRecentlyPressed] = useState<MuscleGroup | null>(null);
  
  // Set up animation values for each muscle group
  useEffect(() => {
    const initialAnimations: {[key: string]: Animated.Value} = {};
    muscles.forEach(muscle => {
      initialAnimations[muscle.id] = new Animated.Value(0);
    });
    setMuscleAnimations(initialAnimations);
  }, []);
  
  // Update animations when selected muscles change
  useEffect(() => {
    if (reducedMotion) return; // Skip animations if reduced motion is enabled
    
    muscles.forEach(muscle => {
      const isSelected = 
        primaryMuscle === muscle.id || 
        secondaryMuscles?.includes(muscle.id) || 
        selectedMuscles?.includes(muscle.id);
      
      if (muscleAnimations[muscle.id]) {
        Animated.timing(muscleAnimations[muscle.id], {
          toValue: isSelected ? 1 : 0,
          duration: Animation.medium,
          useNativeDriver: false, // Can't use native driver with SVG
        }).start();
      }
    });
  }, [selectedMuscles, primaryMuscle, secondaryMuscles, muscleAnimations, reducedMotion]);

  // Define muscle data with improved paths
  const frontMuscles: MuscleData[] = [
    {
      id: 'chest',
      name: 'Chest',
      color: Colors.muscleChest,
      path: "M130,100 C140,110 160,110 170,100 C178,115 178,140 150,155 C122,140 122,115 130,100",
      position: { x: 150, y: 125 }
    },
    {
      id: 'abs',
      name: 'Core',
      color: Colors.muscleCore,
      path: "M140,155 C160,155 160,200 160,230 C150,240 140,230 140,200 C140,180 140,160 140,155",
      position: { x: 150, y: 190 }
    },
    {
      id: 'shoulders',
      name: 'Shoulders',
      color: Colors.muscleShoulders,
      path: "M110,90 C100,95 90,105 90,120 C95,115 110,115 110,90 M190,90 C200,95 210,105 210,120 C205,115 190,115 190,90",
      position: { x: 90, y: 100 }
    },
    {
      id: 'biceps',
      name: 'Biceps',
      color: Colors.muscleArms,
      path: "M100,120 C90,140 85,160 90,180 C100,170 110,150 110,130 C110,125 105,120 100,120 M200,120 C210,140 215,160 210,180 C200,170 190,150 190,130 C190,125 195,120 200,120",
      position: { x: 85, y: 150 }
    },
    {
      id: 'triceps',
      name: 'Triceps',
      color: Colors.muscleArms,
      path: "M90,180 C85,200 90,220 100,240 C105,220 110,200 110,180 C105,175 95,175 90,180 M210,180 C215,200 210,220 200,240 C195,220 190,200 190,180 C195,175 205,175 210,180",
      position: { x: 220, y: 200 }
    },
    {
      id: 'quads',
      name: 'Quads',
      color: Colors.muscleLegs,
      path: "M130,240 C120,270 120,300 130,330 C140,330 150,330 150,320 C150,290 140,270 130,240 M170,240 C180,270 180,300 170,330 C160,330 150,330 150,320 C150,290 160,270 170,240",
      position: { x: 150, y: 285 }
    },
    {
      id: 'calves',
      name: 'Calves',
      color: Colors.muscleLegs,
      path: "M130,330 C125,340 125,350 130,360 C135,360 140,350 140,340 C140,335 135,330 130,330 M170,330 C175,340 175,350 170,360 C165,360 160,350 160,340 C160,335 165,330 170,330",
      position: { x: 150, y: 345 }
    },
    {
      id: 'forearms',
      name: 'Forearms',
      color: Colors.muscleArms,
      path: "M85,200 C80,215 85,230 90,240 C95,235 100,220 100,200 C95,195 90,195 85,200 M215,200 C220,215 215,230 210,240 C205,235 200,220 200,200 C205,195 210,195 215,200",
      position: { x: 75, y: 220 }
    }
  ];

  const backMuscles: MuscleData[] = [
    {
      id: 'back',
      name: 'Back',
      color: Colors.muscleBack,
      path: "M120,100 C115,140 115,180 120,200 C130,210 170,210 180,200 C185,180 185,140 180,100 C160,110 140,110 120,100",
      position: { x: 150, y: 150 }
    },
    {
      id: 'traps',
      name: 'Traps',
      color: Colors.muscleBack,
      path: "M130,80 C140,100 160,100 170,80 C170,90 170,100 150,110 C130,100 130,90 130,80",
      position: { x: 150, y: 90 }
    },
    {
      id: 'shoulders',
      name: 'Shoulders',
      color: Colors.muscleShoulders,
      path: "M110,90 C100,95 90,105 90,120 C95,115 110,115 110,90 M190,90 C200,95 210,105 210,120 C205,115 190,115 190,90",
      position: { x: 90, y: 100 }
    },
    {
      id: 'triceps',
      name: 'Triceps',
      color: Colors.muscleArms,
      path: "M90,120 C80,140 75,160 80,180 C90,170 100,150 100,130 C100,125 95,120 90,120 M210,120 C220,140 225,160 220,180 C210,170 200,150 200,130 C200,125 205,120 210,120",
      position: { x: 220, y: 150 }
    },
    {
      id: 'hamstrings',
      name: 'Hamstrings',
      color: Colors.muscleLegs,
      path: "M130,240 C120,260 120,290 130,320 C140,320 145,315 145,300 C145,280 140,260 130,240 M170,240 C180,260 180,290 170,320 C160,320 155,315 155,300 C155,280 160,260 170,240",
      position: { x: 150, y: 280 }
    },
    {
      id: 'glutes',
      name: 'Glutes',
      color: Colors.muscleLegs,
      path: "M130,200 C120,210 120,225 130,240 C140,240 150,240 150,235 C150,225 140,215 130,200 M170,200 C180,210 180,225 170,240 C160,240 150,240 150,235 C150,225 160,215 170,200",
      position: { x: 150, y: 220 }
    },
    {
      id: 'calves',
      name: 'Calves',
      color: Colors.muscleLegs,
      path: "M130,330 C125,340 125,350 130,360 C135,360 140,350 140,340 C140,335 135,330 130,330 M170,330 C175,340 175,350 170,360 C165,360 160,350 160,340 C160,335 165,330 170,330",
      position: { x: 150, y: 345 }
    }
  ];

  // Choose which set of muscles to display based on view
  const muscles = frontView ? frontMuscles : backMuscles;

  // Function to determine muscle color based on selection state
  const getMuscleColor = (muscleId: MuscleGroup) => {
    if (primaryMuscle === muscleId) {
      return currentTheme.primary;
    } else if (secondaryMuscles?.includes(muscleId)) {
      return currentTheme.secondary;
    } else if (selectedMuscles?.includes(muscleId)) {
      return currentTheme.accent1;
    }
    return isDark ? '#444444' : '#dddddd';
  };

  // Function to handle muscle press with haptic feedback
  const handleMusclePress = (muscleId: MuscleGroup) => {
    if (!interactive || !onSelectMuscle) return;
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Highlight the pressed muscle temporarily
    setRecentlyPressed(muscleId);
    setTimeout(() => setRecentlyPressed(null), 300);
    
    // Call the callback
    onSelectMuscle(muscleId);
  };

  // Get SVG height based on size prop
  const getSvgHeight = () => {
    switch (size) {
      case 'small': return 250;
      case 'large': return 450;
      default: return 350; // medium
    }
  };

  // Toggle between front and back view
  const toggleView = () => {
    if (onSelectMuscle) {
      onSelectMuscle('none'); // Reset selection when toggling view
    }
  };

  return (
    <View style={styles.container}>
      {/* View toggle button */}
      {interactive && (
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            { backgroundColor: currentTheme.card }
          ]}
          onPress={toggleView}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${frontView ? 'back' : 'front'} view`}
          accessibilityHint="Changes the muscle map to show different muscle groups"
        >
          <Text style={{ color: currentTheme.primary }}>
            Show {frontView ? 'Back' : 'Front'} View
          </Text>
        </TouchableOpacity>
      )}
      
      <Svg 
        width="100%" 
        height={getSvgHeight()} 
        viewBox="0 0 300 400"
        accessibilityLabel="Interactive muscle map diagram"
        accessibilityHint={interactive ? "Tap on muscle groups to select them" : "Visual representation of muscle groups"}
      >
        {/* Body outline */}
        <Path
          d="M150,30 C180,30 200,50 200,80 C200,100 190,120 180,130 L180,200 C180,240 190,280 190,320 C190,340 180,360 150,360 C120,360 110,340 110,320 C110,280 120,240 120,200 L120,130 C110,120 100,100 100,80 C100,50 120,30 150,30"
          fill="none"
          stroke={isDark ? "#ffffff" : "#000000"}
          strokeWidth="1.5"
        />

        {/* Render all muscle groups */}
        {muscles.map((muscle) => {
          const isHighlighted = 
            primaryMuscle === muscle.id || 
            secondaryMuscles?.includes(muscle.id) || 
            selectedMuscles?.includes(muscle.id);
          
          const isPressed = recentlyPressed === muscle.id;
          
          // Get dynamic fill color using animation values
          const fillColor = muscleAnimations[muscle.id] 
            ? muscleAnimations[muscle.id].interpolate({
                inputRange: [0, 1],
                outputRange: [
                  isDark ? '#444444' : '#dddddd', 
                  getMuscleColor(muscle.id)
                ]
              })
            : getMuscleColor(muscle.id);
            
          // Create an accessible label for screen readers  
          const accessibilityLabel = `${muscle.name} muscle group${isHighlighted ? ', selected' : ''}`;
          const accessibilityHint = interactive ? `Double tap to ${isHighlighted ? 'deselect' : 'select'} ${muscle.name}` : undefined;
            
          return (
            <React.Fragment key={muscle.id}>
              {/* SVG doesn't properly support accessibility on Android, so we use G wrapper */}
              <G>
                <AnimatedPath
                  d={muscle.path}
                  fill={fillColor}
                  stroke={isPressed ? currentTheme.primary : 'none'}
                  strokeWidth={isPressed ? 2 : 0}
                  onPress={() => handleMusclePress(muscle.id)}
                />
              </G>
              
              {/* Muscle labels if enabled */}
              {showLabels && muscle.position && (isHighlighted || size === 'large') && (
                <SvgText
                  x={muscle.position.x}
                  y={muscle.position.y}
                  fontSize={size === 'small' ? 8 : 10}
                  fontWeight="bold"
                  fill={isDark ? "#ffffff" : "#000000"}
                  textAnchor="middle"
                >
                  {muscle.name}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
      
      {/* Legend */}
      {interactive && (
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: currentTheme.primary }]} />
            <Text style={[styles.legendText, { color: currentTheme.text }]}>Primary Muscles</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: currentTheme.secondary }]} />
            <Text style={[styles.legendText, { color: currentTheme.text }]}>Secondary Muscles</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: currentTheme.accent1 }]} />
            <Text style={[styles.legendText, { color: currentTheme.text }]}>Selected Muscles</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Create an animated version of Path
const AnimatedPath = Animated.createAnimatedComponent(Path);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  toggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Spacing.xs,
  },
  legendText: {
    fontSize: 14,
  },
});

export default MuscleMap; 