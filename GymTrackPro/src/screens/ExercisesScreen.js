// ExercisesScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ExerciseContext } from '../context/ExerciseContext';

export default function ExercisesScreen() {
  const navigation = useNavigation();
  const { getAllExercises, darkMode } = useContext(ExerciseContext);
  const [searchQuery, setSearchQuery] = useState('');
  const allExercises = getAllExercises();
  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const backgroundColor = darkMode ? '#1C1C1E' : '#F8F9FA';
  const textColor = darkMode ? '#FFFFFF' : '#333';
  const cardColor = darkMode ? '#2C2C2E' : '#FFF';
  const borderColor = darkMode ? '#555555' : '#E0E0E0';
  const placeholderColor = darkMode ? '#888888' : '#666';

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: cardColor }]}
      onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
    >
      <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={darkMode ? '#ccc' : '#666'}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>All Exercises</Text>
      <View style={[styles.searchContainer, { borderColor, backgroundColor: cardColor }]}>
        <Ionicons
          name="search"
          size={20}
          color={placeholderColor}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search exercises..."
          placeholderTextColor={placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16
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
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1
  },
  listContent: {
    paddingBottom: 20
  },
  itemContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  itemName: {
    fontSize: 16
  }
});