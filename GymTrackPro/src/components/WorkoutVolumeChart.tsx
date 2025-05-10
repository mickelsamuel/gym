import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ViewStyle
} from 'react-native';
import { Text } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius, Colors, MuscleGroupColors } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import moment from 'moment';

// Interface for muscle group volume data
interface MuscleGroupVolume {
  muscleGroup: keyof typeof MuscleGroupColors;
  volume: number;
  workouts: number;
  exercises: number;
}

interface WorkoutVolumeChartProps {
  volumeData: MuscleGroupVolume[];
  style?: ViewStyle;
  onTimeRangeChange?: (range: TimeRange) => void;
  defaultTimeRange?: TimeRange;
}

type TimeRange = 'week' | 'month' | 'year' | 'all';

const WorkoutVolumeChart: React.FC<WorkoutVolumeChartProps> = ({
  volumeData = [],
  style,
  onTimeRangeChange,
  defaultTimeRange = 'month'
}) => {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  const [selectedRange, setSelectedRange] = useState<TimeRange>(defaultTimeRange);
  const [activeMuscleGroups, setActiveMuscleGroups] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [totalVolume, setTotalVolume] = useState<number>(0);
  
  // Calculate window width for responsive chart
  const windowWidth = Dimensions.get('window').width;
  
  // Initialize active muscle groups
  useEffect(() => {
    if (volumeData.length > 0) {
      const muscleGroups = volumeData.map(item => item.muscleGroup);
      setActiveMuscleGroups(muscleGroups);
    }
  }, [volumeData]);
  
  // Update chart data when active muscle groups change
  useEffect(() => {
    formatChartData();
  }, [activeMuscleGroups, volumeData]);
  
  // Format data for chart
  const formatChartData = () => {
    if (volumeData.length === 0 || activeMuscleGroups.length === 0) {
      setChartData({
        labels: ['No Data'],
        datasets: [{ data: [0] }]
      });
      setTotalVolume(0);
      return;
    }
    
    // Filter data by active muscle groups
    const filteredData = volumeData.filter(item => 
      activeMuscleGroups.includes(item.muscleGroup)
    );
    
    // Sort data by volume (highest first)
    const sortedData = [...filteredData].sort((a, b) => b.volume - a.volume);
    
    // Prepare data for chart
    const labels = sortedData.map(item => {
      // Abbreviate muscle group name if needed
      const name = item.muscleGroup;
      return name.length > 6 ? name.substring(0, 6) + '.' : name;
    });
    
    const data = sortedData.map(item => item.volume);
    
    // Calculate color for each bar
    const barColors = sortedData.map(item => {
      const baseColor = MuscleGroupColors[item.muscleGroup] || colors.primary;
      return baseColor;
    });
    
    // Calculate total volume
    const total = filteredData.reduce((sum, item) => sum + item.volume, 0);
    setTotalVolume(total);
    
    setChartData({
      labels,
      datasets: [
        {
          data,
          colors: barColors,
        }
      ]
    });
  };
  
  // Toggle a muscle group
  const toggleMuscleGroup = (muscleGroup: string) => {
    setActiveMuscleGroups(prev => {
      if (prev.includes(muscleGroup)) {
        // Don't allow deactivating if it's the last active muscle group
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== muscleGroup);
      } else {
        return [...prev, muscleGroup];
      }
    });
  };
  
  // Handle range selection
  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };
  
  // Format volume for display
  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };
  
  // Render time range selector
  const renderRangeSelector = () => {
    const ranges: { label: string; value: TimeRange }[] = [
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' },
      { label: 'Year', value: 'year' },
      { label: 'All', value: 'all' }
    ];
    
    return (
      <View style={styles.rangeSelector}>
        {ranges.map(range => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.rangeButton,
              selectedRange === range.value && {
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary
              }
            ]}
            onPress={() => handleRangeChange(range.value)}
          >
            <Text
              variant="caption"
              style={[
                { color: colors.textSecondary },
                selectedRange === range.value && { color: colors.primary }
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // Render muscle group toggles
  const renderMuscleGroupToggles = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toggleContainer}
      >
        {volumeData.map(item => {
          const isActive = activeMuscleGroups.includes(item.muscleGroup);
          const muscleColor = MuscleGroupColors[item.muscleGroup] || colors.primary;
          
          return (
            <TouchableOpacity
              key={item.muscleGroup}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isActive ? muscleColor + '20' : 'transparent',
                  borderColor: isActive ? muscleColor : colors.border
                }
              ]}
              onPress={() => toggleMuscleGroup(item.muscleGroup)}
            >
              <View style={[styles.colorIndicator, { backgroundColor: muscleColor }]} />
              <Text
                variant="caption"
                style={{
                  color: isActive ? colors.text : colors.textSecondary,
                  fontWeight: isActive ? '500' : 'normal'
                }}
              >
                {item.muscleGroup}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };
  
  // Render volume summary
  const renderVolumeSummary = () => {
    // Calculate workout and exercise counts
    const totalWorkouts = volumeData.reduce((sum, item) => 
      activeMuscleGroups.includes(item.muscleGroup) ? sum + item.workouts : sum, 0);
    
    const totalExercises = volumeData.reduce((sum, item) => 
      activeMuscleGroups.includes(item.muscleGroup) ? sum + item.exercises : sum, 0);
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              Total Volume
            </Text>
            <Text variant="heading3" style={styles.summaryValue}>
              {formatVolume(totalVolume)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              Workouts
            </Text>
            <Text variant="subtitle" style={styles.summaryValue}>
              {totalWorkouts}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              Exercises
            </Text>
            <Text variant="subtitle" style={styles.summaryValue}>
              {totalExercises}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render chart or empty state
  const renderChart = () => {
    if (volumeData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textTertiary} />
          <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
            No volume data available
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.chartWrapper}>
        <BarChart
          data={chartData}
          width={windowWidth - Spacing.md * 2}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: 'transparent',
            backgroundGradientTo: 'transparent',
            decimalPlaces: 0,
            color: (opacity = 1, index) => {
              // Use the colors array if available, otherwise use primary color
              if (chartData.datasets[0].colors && 
                  typeof index === 'number' && 
                  chartData.datasets[0].colors[index]) {
                return chartData.datasets[0].colors[index];
              }
              return colors.primary;
            },
            labelColor: (opacity = 1) => colors.textSecondary,
            style: {
              borderRadius: BorderRadius.lg,
            },
            barPercentage: 0.7,
            propsForBackgroundLines: {
              stroke: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          }}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
          flatColor
        />
      </View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text variant="subtitle">Volume by Muscle Group</Text>
        {renderRangeSelector()}
      </View>
      
      {renderMuscleGroupToggles()}
      
      <View style={styles.chartContainer}>
        {renderChart()}
        {renderVolumeSummary()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rangeSelector: {
    flexDirection: 'row',
  },
  rangeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    marginLeft: Spacing.xs,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  chartContainer: {
    flex: 1,
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  chart: {
    borderRadius: BorderRadius.lg,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.md,
  },
  summaryContainer: {
    marginTop: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  summaryValue: {
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});

export default WorkoutVolumeChart; 