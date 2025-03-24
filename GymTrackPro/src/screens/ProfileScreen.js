import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  SafeAreaView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Slider from '@react-native-community/slider'
import { Picker } from '@react-native-picker/picker'
import { Calendar } from 'react-native-calendars'
import { LineChart } from 'react-native-chart-kit'
import DatabaseService from '../services/DatabaseService'
import { ExerciseContext } from '../context/ExerciseContext'

export default function ProfileScreen() {
  const { darkMode, toggleDarkMode } = useContext(ExerciseContext)
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    experience: '1',
    profilePic: null,
    weightUnit: 'lbs',
    heightUnit: 'imperial',
    feet: '5',
    inches: '9',
    cm: '175'
  })
  const [dailyWeight, setDailyWeight] = useState('')
  const [weightLog, setWeightLog] = useState([])
  const [markedDates, setMarkedDates] = useState({})
  const theme = {
    text: darkMode ? '#FFFFFF' : '#333333',
    background: darkMode ? '#1C1C1E' : '#F8F9FA',
    card: darkMode ? '#2C2C2E' : '#FFFFFF',
    border: darkMode ? '#555555' : '#E0E0E0',
    placeholder: darkMode ? '#AAAAAA' : '#999999',
    primary: '#007AFF',
    placeholderBg: darkMode ? '#3A3A3C' : '#ECECEC'
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const stored = await DatabaseService.getProfile()
        if (stored) {
          setProfile({
            name: stored.name || '',
            age: stored.age ? String(stored.age) : '',
            weight: stored.weight ? String(stored.weight) : '',
            height: stored.height ? String(stored.height) : '',
            goal: stored.goal || '',
            experience: stored.experience || '1',
            profilePic: stored.profilePic || null,
            weightUnit: stored.weightUnit || 'lbs',
            heightUnit: stored.heightUnit || 'imperial',
            feet: stored.feet ? String(stored.feet) : '5',
            inches: stored.inches ? String(stored.inches) : '9',
            cm: stored.cm ? String(stored.cm) : '175'
          })
        }
      } catch {}
    }
    async function loadWeightLog() {
      try {
        const log = await DatabaseService.getDailyWeightLog()
        setWeightLog(log)
      } catch {}
    }
    async function loadAllHistory() {
      try {
        const fullHistory = await DatabaseService.getExerciseHistory()
        const dateMarks = {}
        fullHistory.forEach(entry => {
          if (entry.date) {
            const dayStr = entry.date.split('T')[0]
            dateMarks[dayStr] = { marked: true, dotColor: theme.primary }
          }
        })
        setMarkedDates(dateMarks)
      } catch {}
    }
    loadProfile()
    loadWeightLog()
    loadAllHistory()
  }, [theme.primary])

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    })
    if (!result.canceled && result.assets?.length > 0) {
      setProfile({ ...profile, profilePic: result.assets[0].uri })
    }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Logout logic here.')
  }

  const handleSaveProfile = async () => {
    if (!profile.name || !profile.goal) {
      Alert.alert('Incomplete', 'Name and goal are required.')
      return
    }
    const numericAge = parseInt(profile.age) || 0
    let numericWeight = parseFloat(profile.weight) || 0
    let numericHeight = 0
    if (profile.heightUnit === 'imperial') {
      const ft = parseInt(profile.feet) || 0
      const inch = parseInt(profile.inches) || 0
      numericHeight = ft * 12 + inch
    } else {
      numericHeight = parseFloat(profile.cm) || 0
    }
    const updated = {
      ...profile,
      age: numericAge,
      weight: numericWeight,
      height: numericHeight
    }
    try {
      await DatabaseService.saveProfile(updated)
      Alert.alert('Profile Saved', 'Your profile has been updated.')
    } catch {
      Alert.alert('Error', 'Could not save profile.')
    }
  }

  const handleLogWeight = async () => {
    if (!dailyWeight) {
      Alert.alert('Error', 'Enter a weight.')
      return
    }
    try {
      const today = new Date().toISOString().split('T')[0]
      const updatedLog = await DatabaseService.logDailyWeight({
        date: today,
        weight: parseFloat(dailyWeight)
      })
      setWeightLog(updatedLog)
      setDailyWeight('')
      Alert.alert('Success', `Logged weight for ${today}.`)
    } catch {
      Alert.alert('Error', 'Could not log daily weight.')
    }
  }

  const experienceLabel = val => {
    if (val === 1) return 'Beginner'
    if (val === 2) return 'Intermediate'
    if (val === 3) return 'Advanced'
    return 'Beginner'
  }

  const chartLabels = weightLog.map(entry => entry.date.slice(5))
  const chartWeights = weightLog.map(entry => entry.weight)
  const screenWidth = Dimensions.get('window').width - 32

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={toggleDarkMode} style={styles.headerButton}>
          <Ionicons
            name={darkMode ? 'sunny-outline' : 'moon-outline'}
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.picContainer}>
            {profile.profilePic ? (
              <Image source={{ uri: profile.profilePic }} style={styles.profilePic} />
            ) : (
              <View style={[styles.profilePlaceholder, { backgroundColor: theme.placeholderBg }]}>
                <Ionicons name="person-outline" size={40} color={theme.placeholder} />
              </View>
            )}
            <TouchableOpacity style={[styles.changePicButton, { backgroundColor: theme.primary }]} onPress={handlePickImage}>
              <Text style={styles.changePicText}>Change Picture</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Name</Text>
            <TextInput
              style={[
                styles.fieldInput,
                { flex: 1, marginLeft: 10, color: theme.text, borderColor: theme.border, backgroundColor: theme.card }
              ]}
              value={profile.name}
              onChangeText={txt => setProfile({ ...profile, name: txt })}
            />
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Stats & Goals</Text>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Age</Text>
            <TextInput
              style={[
                styles.fieldInput,
                { flex: 1, marginLeft: 10, color: theme.text, borderColor: theme.border, backgroundColor: theme.card }
              ]}
              keyboardType="number-pad"
              value={profile.age}
              onChangeText={val => setProfile({ ...profile, age: val })}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Weight</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <TextInput
                style={[
                  styles.fieldInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }
                ]}
                keyboardType="decimal-pad"
                value={profile.weight}
                onChangeText={val => setProfile({ ...profile, weight: val })}
              />
            </View>
            <View style={[styles.pickerWrapper, { width: 80, marginLeft: 8, backgroundColor: theme.card, borderColor: theme.border }]}>
              <Picker
                style={[styles.pickerStyle, { color: theme.text }]}
                selectedValue={profile.weightUnit}
                onValueChange={val => setProfile({ ...profile, weightUnit: val })}
                mode="dropdown"
                dropdownIconColor={theme.text}
              >
                <Picker.Item label="lbs" value="lbs" />
                <Picker.Item label="kg" value="kg" />
              </Picker>
            </View>
          </View>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Height</Text>
            <View style={[styles.pickerWrapper, { flex: 1, marginLeft: 10, backgroundColor: theme.card, borderColor: theme.border }]}>
              <Picker
                style={[styles.pickerStyle, { color: theme.text }]}
                selectedValue={profile.heightUnit}
                onValueChange={val => setProfile({ ...profile, heightUnit: val })}
                mode="dropdown"
                dropdownIconColor={theme.text}
              >
                <Picker.Item label="Imperial (ft/in)" value="imperial" />
                <Picker.Item label="Metric (cm)" value="metric" />
              </Picker>
            </View>
          </View>
          {profile.heightUnit === 'imperial' ? (
            <View style={styles.fieldRow}>
              <View style={[styles.pickerWrapper, { flex: 1, marginRight: 8, backgroundColor: theme.card, borderColor: theme.border }]}>
                <Picker
                  style={[styles.pickerStyle, { color: theme.text }]}
                  selectedValue={profile.feet}
                  onValueChange={v => setProfile({ ...profile, feet: v })}
                  mode="dropdown"
                  dropdownIconColor={theme.text}
                >
                  <Picker.Item label="5 ft" value="5" />
                  <Picker.Item label="6 ft" value="6" />
                  <Picker.Item label="7 ft" value="7" />
                  <Picker.Item label="8 ft" value="8" />
                </Picker>
              </View>
              <View style={[styles.pickerWrapper, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                <Picker
                  style={[styles.pickerStyle, { color: theme.text }]}
                  selectedValue={profile.inches}
                  onValueChange={v => setProfile({ ...profile, inches: v })}
                  mode="dropdown"
                  dropdownIconColor={theme.text}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Picker.Item key={i} label={`${i} in`} value={`${i}`} />
                  ))}
                </Picker>
              </View>
            </View>
          ) : (
            <View style={styles.fieldRow}>
              <TextInput
                style={[
                  styles.fieldInput,
                  { flex: 1, color: theme.text, borderColor: theme.border, backgroundColor: theme.card }
                ]}
                keyboardType="decimal-pad"
                value={profile.cm}
                onChangeText={val => setProfile({ ...profile, cm: val })}
              />
            </View>
          )}
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Goal</Text>
            <View style={[styles.pickerWrapper, { flex: 1, marginLeft: 10, backgroundColor: theme.card, borderColor: theme.border }]}>
              <Picker
                style={[styles.pickerStyle, { color: theme.text }]}
                selectedValue={profile.goal}
                onValueChange={val => setProfile({ ...profile, goal: val })}
                mode="dropdown"
                dropdownIconColor={theme.text}
              >
                <Picker.Item label="Strength" value="strength" />
                <Picker.Item label="Hypertrophy" value="hypertrophy" />
                <Picker.Item label="Endurance" value="endurance" />
                <Picker.Item label="Tone" value="tone" />
              </Picker>
            </View>
          </View>
          <View style={[styles.fieldRow, { marginTop: 12 }]}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Experience</Text>
            <Text style={[styles.expLabel, { color: theme.text }]}>{experienceLabel(Number(profile.experience))}</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40, marginTop: 4 }}
            minimumValue={1}
            maximumValue={3}
            step={1}
            value={Number(profile.experience)}
            onValueChange={val => setProfile({ ...profile, experience: String(val) })}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={darkMode ? '#444444' : theme.border}
          />
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSaveProfile}>
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Weight Logging</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={[
                styles.fieldInput,
                { flex: 1, marginRight: 10, color: theme.text, borderColor: theme.border, backgroundColor: theme.card }
              ]}
              keyboardType="decimal-pad"
              value={dailyWeight}
              onChangeText={setDailyWeight}
            />
            <TouchableOpacity style={styles.logButton} onPress={handleLogWeight}>
              <Text style={styles.logButtonText}>Log Weight</Text>
            </TouchableOpacity>
          </View>
        </View>
        {weightLog.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Weight Progress</Text>
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [{ data: chartWeights, strokeWidth: 2 }]
              }}
              width={screenWidth}
              height={220}
              chartConfig={{
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                color: opacity => `rgba(0,122,255,${opacity})`,
                strokeWidth: 2,
                decimalPlaces: 1,
              }}
              bezier
              style={{ marginTop: 12, borderRadius: 16 }}
            />
          </View>
        )}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Workout Calendar</Text>
          <Calendar
            style={styles.calendar}
            markedDates={markedDates}
            theme={{
              backgroundColor: theme.card,
              calendarBackground: theme.card,
              dayTextColor: theme.text,
              monthTextColor: theme.text,
              textDisabledColor: darkMode ? '#555555' : '#d9e1e8',
              arrowColor: theme.primary,
              dotColor: theme.primary,
              todayTextColor: theme.primary
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerBar: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  headerButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12
  },
  picContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  changePicButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  changePicText: {
    color: '#FFF',
    fontWeight: '600'
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  fieldLabel: {
    fontSize: 14,
    marginRight: 8
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14
  },
  pickerWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center'
  },
  pickerStyle: {
    height: 40,
    marginLeft: 4
  },
  expLabel: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500'
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14
  },
  logButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  logButtonText: {
    color: '#FFF',
    fontWeight: '600'
  },
  calendar: {
    borderRadius: 8
  }
})