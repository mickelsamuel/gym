import React from 'react';
import {View, StyleSheet} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import {Theme} from '../constants/Theme';
import { Text } from './ui';
import { useTheme } from '@react-navigation/native';
interface MuscleMapProps {
  selectedMuscles?: string[];
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  onSelectMuscle?: (muscle: string) => void;
  interactive?: boolean;
  darkMode?: boolean;
}
const MuscleMap: React.FC<MuscleMapProps> = ({
  selectedMuscles = [],
  primaryMuscle,
  secondaryMuscles = [],
  onSelectMuscle,
  interactive = false,
  darkMode,
}) => {
  const theme = useTheme();
  const isDark = darkMode !== undefined ? darkMode : theme.dark;
  const currentTheme = isDark ? Theme.dark : Theme.light;
  // Function to determine muscle color based on selection state
  const getMuscleColor = (muscleId: string) => {
    if (primaryMuscle === muscleId) {
      return currentTheme.primary;
    } else if (secondaryMuscles.includes(muscleId)) {
      return currentTheme.secondary;
    } else if (selectedMuscles.includes(muscleId)) {
      return currentTheme.accent1;
    }
    return isDark ? '#555555' : '#cccccc';
  };
  return (
    <View style={styles.container}>
      <Svg width="100%" height="300" viewBox="0 0 300 400">
        {/* Simplified body outline */}
        <Path
          d="M150,30 C180,30 200,50 200,80 C200,100 190,120 180,130 L180,200 C180,240 190,280 190,320 C190,340 180,360 150,360 C120,360 110,340 110,320 C110,280 120,240 120,200 L120,130 C110,120 100,100 100,80 C100,50 120,30 150,30"
          fill="none"
          stroke={isDark ? "#ffffff" : "#000000"}
          strokeWidth="2"
        />
        {/* Chest muscles */}
        <Path
          d="M130,100 C140,110 160,110 170,100 C175,120 175,140 150,150 C125,140 125,120 130,100"
          fill={getMuscleColor('chest')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('chest')}
        />
        {/* Abs */}
        <Path
          d="M140,150 C160,150 160,200 160,230 C150,240 140,230 140,200 C140,180 140,160 140,150"
          fill={getMuscleColor('abs')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('abs')}
        />
        {/* Arms - biceps */}
        <Path
          d="M100,120 C90,140 85,160 90,180 C100,170 110,150 110,130 C110,125 105,120 100,120"
          fill={getMuscleColor('biceps')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('biceps')}
        />
        <Path
          d="M200,120 C210,140 215,160 210,180 C200,170 190,150 190,130 C190,125 195,120 200,120"
          fill={getMuscleColor('biceps')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('biceps')}
        />
        {/* Arms - triceps */}
        <Path
          d="M90,180 C85,200 90,220 100,240 C105,220 110,200 110,180 C105,175 95,175 90,180"
          fill={getMuscleColor('triceps')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('triceps')}
        />
        <Path
          d="M210,180 C215,200 210,220 200,240 C195,220 190,200 190,180 C195,175 205,175 210,180"
          fill={getMuscleColor('triceps')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('triceps')}
        />
        {/* Shoulders */}
        <Path
          d="M110,90 C100,95 90,105 90,120 C95,115 110,115 110,90"
          fill={getMuscleColor('shoulders')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('shoulders')}
        />
        <Path
          d="M190,90 C200,95 210,105 210,120 C205,115 190,115 190,90"
          fill={getMuscleColor('shoulders')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('shoulders')}
        />
        {/* Back */}
        <Path
          d="M120,100 C115,120 115,140 120,170 C130,180 170,180 180,170 C185,140 185,120 180,100 C160,110 140,110 120,100"
          fill={getMuscleColor('back')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('back')}
        />
        {/* Legs - quads */}
        <Path
          d="M130,240 C120,270 120,300 130,330 C140,330 150,330 150,320 C150,290 140,270 130,240"
          fill={getMuscleColor('quads')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('quads')}
        />
        <Path
          d="M170,240 C180,270 180,300 170,330 C160,330 150,330 150,320 C150,290 160,270 170,240"
          fill={getMuscleColor('quads')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('quads')}
        />
        {/* Legs - calves */}
        <Path
          d="M130,330 C125,340 125,350 130,360 C135,360 140,350 140,340 C140,335 135,330 130,330"
          fill={getMuscleColor('calves')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('calves')}
        />
        <Path
          d="M170,330 C175,340 175,350 170,360 C165,360 160,350 160,340 C160,335 165,330 170,330"
          fill={getMuscleColor('calves')}
          onPress={() => interactive && onSelectMuscle && onSelectMuscle('calves')}
        />
      </Svg>
      {interactive && (
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: currentTheme.primary }]} />
            <Text style={styles.legendText}>Primary Muscles</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: currentTheme.secondary }]} />
            <Text style={styles.legendText}>Secondary Muscles</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: currentTheme.accent1 }]} />
            <Text style={styles.legendText}>Selected Muscles</Text>
          </View>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
});
export default MuscleMap; 