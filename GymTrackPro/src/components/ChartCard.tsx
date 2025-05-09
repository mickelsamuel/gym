import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ViewStyle, Platform, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Text, Card } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius, Typography } from '../constants/Theme';

const { width } = Dimensions.get('window');
const chartWidth = width - 48; // Full width minus padding

type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
};

type TimeRange = 'week' | 'month' | 'year' | 'all';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartData;
  chartType?: 'line' | 'bar';
  timeRanges?: TimeRange[];
  defaultTimeRange?: TimeRange;
  height?: number;
  yAxisSuffix?: string;
  style?: ViewStyle;
  onTimeRangeChange?: (range: TimeRange) => void;
  loading?: boolean;
}

/**
 * ChartCard component - displays analytics data in a consistent format
 */
export default function ChartCard({
  title,
  subtitle,
  data,
  chartType = 'line',
  timeRanges = ['week', 'month', 'year'],
  defaultTimeRange = 'week',
  height = 220,
  yAxisSuffix = '',
  style,
  onTimeRangeChange,
  loading = false,
}: ChartCardProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(defaultTimeRange);
  
  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };
  
  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForLabels: Typography.caption,
    propsForBackgroundLines: {
      stroke: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      strokeDasharray: '5, 5',
    },
  };
  
  // Time range label formatter
  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case 'week': return 'Week';
      case 'month': return 'Month';
      case 'year': return 'Year';
      case 'all': return 'All';
      default: return 'Week';
    }
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="analytics-outline" size={40} color={colors.textTertiary} />
      <Text
        variant="bodySmall"
        style={{ color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' } as TextStyle}
      >
        No data available for this time period
      </Text>
    </View>
  );
  
  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="hourglass-outline" size={40} color={colors.textTertiary} />
      <Text
        variant="bodySmall"
        style={{ color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' } as TextStyle}
      >
        Loading chart data...
      </Text>
    </View>
  );
  
  // Check if data is empty
  const isDataEmpty = () => {
    if (!data || !data.datasets || data.datasets.length === 0) return true;
    return data.datasets.every(dataset => !dataset.data || dataset.data.every(val => val === 0));
  };
  
  return (
    <Card
      style={style}
    >
      <View style={styles.header}>
        <View>
          <Text variant="subtitle" style={styles.title}>{title}</Text>
          {subtitle && (
            <Text
              variant="caption"
              style={{ color: colors.textSecondary } as TextStyle}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {timeRanges && timeRanges.length > 0 && (
          <View style={styles.timeRangeContainer}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  selectedTimeRange === range && {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
                onPress={() => handleTimeRangeChange(range)}
                activeOpacity={0.7}
              >
                <Text
                  variant="tiny"
                  style={{
                    color: selectedTimeRange === range ? colors.primary : colors.textSecondary,
                    fontWeight: selectedTimeRange === range ? '600' : 'normal',
                  } as TextStyle}
                >
                  {getTimeRangeLabel(range)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.chartContainer}>
        {loading ? (
          renderLoadingState()
        ) : isDataEmpty() ? (
          renderEmptyState()
        ) : (
          chartType === 'line' ? (
            <LineChart
              data={data}
              width={chartWidth}
              height={height}
              yAxisSuffix={yAxisSuffix}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withDots={true}
              withShadow={false}
              fromZero
            />
          ) : (
            <BarChart
              data={data}
              width={chartWidth}
              height={height}
              yAxisSuffix={yAxisSuffix}
              yAxisLabel=""
              chartConfig={chartConfig}
              style={styles.chart}
              withInnerLines={true}
              withHorizontalLabels={true}
              showBarTops={false}
              flatColor={true}
              fromZero
            />
          )
        )}
      </View>
      
      {/* Legend */}
      {data.legend && data.legend.length > 0 && (
        <View style={styles.legendContainer}>
          {data.legend.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { 
                    backgroundColor: data.datasets[index]?.color?.(1) || colors.primary
                  }
                ]}
              />
              <Text
                variant="caption"
                style={{ color: colors.textSecondary } as TextStyle}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: '600',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.pill,
    overflow: 'hidden',
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  emptyContainer: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
}); 