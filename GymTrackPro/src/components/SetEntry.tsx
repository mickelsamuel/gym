import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ViewStyle,
  KeyboardType
} from 'react-native';
import { Text } from './ui';
import { useExercise } from '../context/ExerciseContext';
import { Theme, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';

type SetType = 'normal' | 'warmup' | 'dropset' | 'failure' | 'amrap';

interface SetInputProps {
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardType;
  placeholder?: string;
  width?: number;
  label?: string;
}

interface SetEntryProps {
  setNumber: number;
  weight: string;
  reps: string;
  setType?: SetType;
  isComplete?: boolean;
  onWeightChange: (weight: string) => void;
  onRepsChange: (reps: string) => void;
  onSetTypeChange?: (type: SetType) => void;
  onSetComplete?: (complete: boolean) => void;
  onRemove?: () => void;
  weightUnit?: 'kg' | 'lbs';
  onWeightUnitChange?: (unit: 'kg' | 'lbs') => void;
  isLast?: boolean;
  isFirst?: boolean;
  style?: ViewStyle;
  showSetType?: boolean;
  showRemove?: boolean;
  editable?: boolean;
}

/**
 * SetEntry component
 * A form row for entering exercise set data during a workout
 */
export default function SetEntry({
  setNumber,
  weight,
  reps,
  setType = 'normal',
  isComplete = false,
  onWeightChange,
  onRepsChange,
  onSetTypeChange,
  onSetComplete,
  onRemove,
  weightUnit = 'kg',
  onWeightUnitChange,
  isLast = false,
  isFirst = false,
  style,
  showSetType = true,
  showRemove = true,
  editable = true
}: SetEntryProps) {
  const { darkMode } = useExercise();
  const colors = darkMode ? Theme.dark : Theme.light;
  
  // Toggle completion status
  const toggleComplete = () => {
    if (onSetComplete) {
      onSetComplete(!isComplete);
    }
  };
  
  // Set type label mapping
  const setTypeLabels: Record<SetType, { label: string, color: string }> = {
    normal: { label: 'Normal', color: colors.text },
    warmup: { label: 'Warm up', color: '#FFB74D' },
    dropset: { label: 'Drop set', color: '#7C4DFF' },
    failure: { label: 'To failure', color: '#FF5252' },
    amrap: { label: 'AMRAP', color: '#448AFF' }
  };
  
  // Cycle through set types
  const cycleSetType = () => {
    if (!onSetTypeChange) return;
    
    const types: SetType[] = ['normal', 'warmup', 'dropset', 'failure', 'amrap'];
    const currentIndex = types.indexOf(setType);
    const nextIndex = (currentIndex + 1) % types.length;
    onSetTypeChange(types[nextIndex]);
  };
  
  // Toggle weight unit (kg/lbs)
  const toggleWeightUnit = () => {
    if (onWeightUnitChange) {
      onWeightUnitChange(weightUnit === 'kg' ? 'lbs' : 'kg');
    }
  };
  
  // Custom input component
  const SetInput = ({ 
    value, 
    onChangeText, 
    keyboardType = 'numeric', 
    placeholder = '',
    width = 80,
    label
  }: SetInputProps) => (
    <View style={[styles.inputContainer, { width: width }]}>
      {label && (
        <Text variant="caption" style={{ color: colors.textSecondary, marginBottom: 2 }}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          { 
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderColor: colors.border
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        editable={editable}
      />
    </View>
  );
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.card,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: colors.border,
        borderBottomWidth: isLast ? 1 : 0,
        borderBottomColor: colors.border
      },
      style
    ]}>
      {/* Set number and completion toggle */}
      <TouchableOpacity 
        style={styles.setNumberContainer}
        onPress={toggleComplete}
        disabled={!editable || !onSetComplete}
      >
        <View style={[
          styles.setNumber, 
          isComplete && { backgroundColor: colors.success + '20' }
        ]}>
          <Text 
            variant="bodySmall" 
            style={[
              { fontWeight: '500' },
              isComplete && { color: colors.success }
            ]}
          >
            {setNumber}
          </Text>
          {isComplete && (
            <Ionicons name="checkmark" size={12} color={colors.success} style={styles.checkIcon} />
          )}
        </View>
      </TouchableOpacity>
      
      {/* Weight input with unit selector */}
      <View style={styles.weightContainer}>
        <SetInput
          value={weight}
          onChangeText={onWeightChange}
          width={70}
          label="Weight"
        />
        
        <TouchableOpacity 
          style={[
            styles.unitSelector,
            { backgroundColor: colors.inputBackground }
          ]}
          onPress={toggleWeightUnit}
          disabled={!editable || !onWeightUnitChange}
        >
          <Text variant="caption" style={{ fontWeight: '500' }}>
            {weightUnit}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Reps input */}
      <SetInput
        value={reps}
        onChangeText={onRepsChange}
        width={60}
        label="Reps"
      />
      
      {/* Set type selector */}
      {showSetType && (
        <TouchableOpacity 
          style={[
            styles.setTypeButton,
            { 
              backgroundColor: setTypeLabels[setType].color + '10',
              borderColor: setTypeLabels[setType].color + '40',
            }
          ]}
          onPress={cycleSetType}
          disabled={!editable || !onSetTypeChange}
        >
          <Text 
            variant="caption" 
            style={{ 
              color: setTypeLabels[setType].color,
              fontWeight: '500'
            }}
          >
            {setTypeLabels[setType].label}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Remove button */}
      {showRemove && (
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={onRemove}
          disabled={!editable || !onRemove}
        >
          <Ionicons 
            name="close-circle-outline" 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  setNumberContainer: {
    marginRight: Spacing.sm,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  checkIcon: {
    marginLeft: 2,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  inputContainer: {
    marginRight: Spacing.xs,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 16,
  },
  unitSelector: {
    height: 40,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  setTypeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
  },
  removeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
}); 