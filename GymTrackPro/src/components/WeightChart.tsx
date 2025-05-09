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
import { Theme, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';

interface WeightEntry {
  date: string; // ISO format
  weight: number;
  note?: string;
}

interface Annotation {
  date: string; // ISO format
  text: string;
  type: 'goal' | 'milestone' | 'note';
  color?: string;
}

interface WeightChartProps {
  weightEntries: WeightEntry[];
  goalWeight?: number;
  startWeight?: number;
  annotations?: Annotation[];
  style?: ViewStyle;
  onTimeRangeChange?: (range: TimeRange) => void;
  onEntryPress?: (entry: WeightEntry) => void;
  weightUnit?: 'kg' | 'lbs';
}

type TimeRange = 'week' | 'month' | 'year' | 'all';

// Define chart dataset type
interface ChartDataset {
  data: number[];
  color: (opacity?: number) => string;
  strokeWidth: number;
  strokeDasharray?: number[]; // Add this for dashed lines
}

const WeightChart: React.FC<WeightChartProps> = ({
  weightEntries = [],
  goalWeight,
  startWeight,
  annotations = [],
  style,
  onTimeRangeChange,
  onEntryPress,
  weightUnit = 'kg'
}) => {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  const [selectedRange, setSelectedRange] = useState<TimeRange>('month');
  const [filteredData, setFilteredData] = useState<WeightEntry[]>([]);
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: ChartDataset[];
  }>({
    labels: [],
    datasets: [{ data: [], color: () => '', strokeWidth: 2 }]
  });
  const [selectedEntry, setSelectedEntry] = useState<WeightEntry | null>(null);
  const [weightStats, setWeightStats] = useState({
    current: 0,
    start: 0,
    goal: goalWeight || 0,
    change: 0,
    changePercentage: 0
  });
  
  // Calculate window width for responsive chart
  const windowWidth = Dimensions.get('window').width;
  
  // Filter data based on selected time range
  useEffect(() => {
    filterDataByTimeRange();
  }, [selectedRange, weightEntries]);
  
  // Format chart data when filtered data changes
  useEffect(() => {
    formatChartData();
    calculateWeightStats();
  }, [filteredData, goalWeight]);
  
  // Filter data based on time range
  const filterDataByTimeRange = () => {
    if (weightEntries.length === 0) {
      setFilteredData([]);
      return;
    }
    
    // Sort entries by date (oldest first)
    const sortedEntries = [...weightEntries].sort((a, b) => 
      moment(a.date).diff(moment(b.date))
    );
    
    const now = moment();
    let filteredEntries: WeightEntry[] = [];
    
    switch (selectedRange) {
      case 'week':
        filteredEntries = sortedEntries.filter(entry => 
          moment(entry.date).isAfter(moment().subtract(7, 'days'))
        );
        break;
      case 'month':
        filteredEntries = sortedEntries.filter(entry => 
          moment(entry.date).isAfter(moment().subtract(30, 'days'))
        );
        break;
      case 'year':
        filteredEntries = sortedEntries.filter(entry => 
          moment(entry.date).isAfter(moment().subtract(1, 'year'))
        );
        break;
      case 'all':
      default:
        filteredEntries = sortedEntries;
        break;
    }
    
    // If we have no entries in the selected range but have entries overall,
    // include the most recent entry so the chart isn't empty
    if (filteredEntries.length === 0 && sortedEntries.length > 0) {
      filteredEntries = [sortedEntries[sortedEntries.length - 1]];
    }
    
    setFilteredData(filteredEntries);
  };
  
  // Format data for chart
  const formatChartData = () => {
    if (filteredData.length === 0) {
      setChartData({
        labels: [],
        datasets: [{ data: [0], color: () => colors.primary, strokeWidth: 2 }]
      });
      return;
    }
    
    // For dates and values
    let labels: string[] = [];
    let weights: number[] = [];
    
    // Format labels based on time range (to avoid crowding)
    filteredData.forEach(entry => {
      let label = '';
      
      switch (selectedRange) {
        case 'week':
          label = moment(entry.date).format('ddd');
          break;
        case 'month':
          label = moment(entry.date).format('D');
          break;
        case 'year':
          label = moment(entry.date).format('MMM');
          break;
        case 'all':
          label = moment(entry.date).format('MMM YY');
          break;
      }
      
      labels.push(label);
      weights.push(entry.weight);
    });
    
    // If we have a goal weight, add it as a horizontal line
    const datasets: ChartDataset[] = [
      {
        data: weights,
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2
      }
    ];
    
    // Add goal line if available
    if (goalWeight) {
      // Create an array of the same goal weight for the entire chart
      const goalLine = new Array(weights.length).fill(goalWeight);
      
      datasets.push({
        data: goalLine,
        color: (opacity = 1) => `${colors.secondary}`,
        strokeWidth: 2,
        strokeDasharray: [5, 5] // Dashed line
      });
    }
    
    setChartData({
      labels,
      datasets
    });
  };
  
  // Calculate weight statistics
  const calculateWeightStats = () => {
    if (filteredData.length === 0) {
      setWeightStats({
        current: 0,
        start: startWeight || 0,
        goal: goalWeight || 0,
        change: 0,
        changePercentage: 0
      });
      return;
    }
    
    // Use the most recent entry as current weight
    const currentWeight = filteredData[filteredData.length - 1].weight;
    
    // Use earliest entry in filtered data or provided startWeight
    const firstWeight = startWeight || filteredData[0].weight;
    
    // Calculate change
    const weightChange = currentWeight - firstWeight;
    const changePercentage = (weightChange / firstWeight) * 100;
    
    setWeightStats({
      current: currentWeight,
      start: firstWeight,
      goal: goalWeight || 0,
      change: weightChange,
      changePercentage
    });
  };
  
  // Handle range selection
  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };
  
  // Handle entry selection on chart press
  const handleChartPress = (data: any) => {
    const index = data.index;
    if (index !== undefined && filteredData[index]) {
      setSelectedEntry(filteredData[index]);
      if (onEntryPress) {
        onEntryPress(filteredData[index]);
      }
    }
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
  
  // Render weight stats
  const renderWeightStats = () => {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              Current
            </Text>
            <Text variant="subtitle" style={styles.statValue}>
              {weightStats.current.toFixed(1)} {weightUnit}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              Start
            </Text>
            <Text variant="subtitle" style={styles.statValue}>
              {weightStats.start.toFixed(1)} {weightUnit}
            </Text>
          </View>
          
          {goalWeight && (
            <View style={styles.statItem}>
              <Text variant="caption" style={{ color: colors.textSecondary }}>
                Goal
              </Text>
              <Text variant="subtitle" style={styles.statValue}>
                {weightStats.goal.toFixed(1)} {weightUnit}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.changeContainer}>
          <View style={[
            styles.changeIndicator,
            { 
              backgroundColor: weightStats.change < 0 
                ? colors.success + '20' 
                : weightStats.change > 0
                  ? colors.warning + '20'
                  : 'transparent'
            }
          ]}>
            <Ionicons
              name={weightStats.change < 0 ? 'arrow-down' : 'arrow-up'}
              size={16}
              color={weightStats.change < 0 ? colors.success : colors.warning}
              style={{ opacity: weightStats.change === 0 ? 0 : 1 }}
            />
            <Text
              variant="bodySmall"
              style={[
                styles.changeText,
                { 
                  color: weightStats.change < 0 
                    ? colors.success 
                    : weightStats.change > 0
                      ? colors.warning
                      : colors.textSecondary
                }
              ]}
            >
              {Math.abs(weightStats.change).toFixed(1)} {weightUnit} ({Math.abs(weightStats.changePercentage).toFixed(1)}%)
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render selected entry details
  const renderSelectedEntry = () => {
    if (!selectedEntry) return null;
    
    return (
      <View style={[
        styles.selectedEntryContainer,
        { backgroundColor: colors.card + '80' },
        createElevation(1, darkMode)
      ]}>
        <Text variant="bodySmall" style={{ fontWeight: '500' }}>
          {moment(selectedEntry.date).format('MMMM D, YYYY')}
        </Text>
        <Text variant="body" style={styles.selectedWeight}>
          {selectedEntry.weight.toFixed(1)} {weightUnit}
        </Text>
        {selectedEntry.note && (
          <Text variant="caption" style={{ color: colors.textSecondary }}>
            {selectedEntry.note}
          </Text>
        )}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text variant="subtitle">Weight Tracking</Text>
        {renderRangeSelector()}
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderWeightStats()}
        
        <View style={styles.chartContainer}>
          {filteredData.length > 0 ? (
            <LineChart
              data={chartData}
              width={windowWidth - Spacing.xl}
              height={220}
              yAxisSuffix={` ${weightUnit}`}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 1,
                color: (opacity = 1) => colors.primary,
                labelColor: (opacity = 1) => colors.textSecondary,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
                propsForBackgroundLines: {
                  stroke: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              }}
              bezier
              style={styles.chart}
              onDataPointClick={handleChartPress}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="analytics-outline" size={48} color={colors.textTertiary} />
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                No weight data available
              </Text>
            </View>
          )}
          
          {selectedEntry && renderSelectedEntry()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
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
  statsContainer: {
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '600',
    marginTop: 2,
  },
  changeContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  changeText: {
    marginLeft: Spacing.xs / 2,
    fontWeight: '500',
  },
  chartContainer: {
    position: 'relative',
  },
  chart: {
    borderRadius: BorderRadius.lg,
    paddingRight: Spacing.md,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
    borderRadius: BorderRadius.lg,
  },
  selectedEntryContainer: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  selectedWeight: {
    fontWeight: '700',
    marginVertical: 2,
  },
});

export default WeightChart; 