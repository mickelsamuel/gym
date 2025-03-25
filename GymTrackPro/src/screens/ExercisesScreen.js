import React, { useContext, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { ExerciseContext } from '../context/ExerciseContext'

const muscleGroupOptions = [
  { label: 'All', value: '' },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Legs', value: 'legs' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Arms', value: 'arms' }
]

const exerciseTypeOptions = [
  { label: 'All', value: '' },
  { label: 'Gym', value: 'gym' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Bodyweight', value: 'bodyweight' }
]

export default function ExercisesScreen() {
  const navigation = useNavigation()
  const { getAllExercises, darkMode } = useContext(ExerciseContext)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const allExercises = getAllExercises()

  const filteredExercises = allExercises.filter(ex => {
    const matchName = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = selectedType ? ex.type === selectedType : true
    const matchMuscle = selectedMuscle
      ? ex.primaryMuscles.includes(selectedMuscle) || ex.secondaryMuscles.includes(selectedMuscle)
      : true
    return matchName && matchType && matchMuscle
  })

  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA'
  const textColor = darkMode ? '#FFFFFF' : '#333333'
  const cardColor = darkMode ? '#2C2C2E' : '#FFFFFF'
  const borderColor = darkMode ? '#555555' : '#E0E0E0'
  const placeholderColor = darkMode ? '#888888' : '#666666'

  function dismissKeyboard() {
    Keyboard.dismiss()
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: cardColor }]}
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
      >
        <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color={darkMode ? '#ccc' : '#666'} />
      </TouchableOpacity>
    )
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: textColor }]}>All Exercises</Text>
          <View style={[styles.searchContainer, { borderColor, backgroundColor: cardColor }]}>
            <Ionicons name="search" size={20} color={placeholderColor} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search exercises..."
              placeholderTextColor={placeholderColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Text style={[styles.filterLabel, { color: textColor }]}>Filter by Muscle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {muscleGroupOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedMuscle === opt.value ? '#007AFF' : cardColor,
                    borderColor
                  }
                ]}
                onPress={() => setSelectedMuscle(opt.value)}
              >
                <Text
                  style={{
                    color: selectedMuscle === opt.value ? '#FFF' : textColor
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterLabel, { color: textColor }]}>Filter by Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {exerciseTypeOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedType === opt.value ? '#007AFF' : cardColor,
                    borderColor
                  }
                ]}
                onPress={() => setSelectedType(opt.value)}
              >
                <Text
                  style={{
                    color: selectedType === opt.value ? '#FFF' : textColor
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredExercises}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            style={{ marginTop: 16 }}
            contentContainerStyle={{ paddingBottom: 50 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  searchContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    height: 40
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1 },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 12
  },
  itemContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2
  },
  itemName: {
    fontSize: 16
  }
})