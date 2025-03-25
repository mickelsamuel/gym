import React, { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { LineChart } from 'react-native-chart-kit'
import DatabaseService from '../services/DatabaseService'
import { ExerciseContext } from '../context/ExerciseContext'
import { AuthContext } from '../context/AuthContext'
import * as ImagePicker from 'expo-image-picker'

export default function ProfileScreen() {
  const { darkMode } = useContext(ExerciseContext)
  const { logout } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [dailyWeight, setDailyWeight] = useState('')
  const [weightLog, setWeightLog] = useState([])
  const [markedDates, setMarkedDates] = useState({})
  const theme = {
    text: darkMode ? '#FFFFFF' : '#333333',
    background: darkMode ? '#1C1C1E' : '#F8F9FA',
    card: darkMode ? '#2C2C2E' : '#FFFFFF',
    border: darkMode ? '#555555' : '#E0E0E0',
    primary: '#007AFF'
  }

  useEffect(() => {
    loadProfile()
    loadWeightLog()
    loadAllHistory()
  }, [])

  async function loadProfile() {
    try {
      const userProfile = await DatabaseService.getProfile()
      if (userProfile) setProfile(userProfile)
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

  async function handleLogWeight() {
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

  const chartLabels = weightLog.map(entry => entry.date.slice(5))
  const chartWeights = weightLog.map(entry => entry.weight)
  const screenWidth = Dimensions.get('window').width - 32

  async function pickProfileImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Grant permission to access photos.')
        return
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7
      })
      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const uri = pickerResult.assets[0].uri
        const updatedProfile = { ...profile, profilePic: uri }
        await DatabaseService.saveProfile(updatedProfile)
        setProfile(updatedProfile)
      }
    } catch {
      Alert.alert('Error', 'Could not pick image.')
    }
  }

  function dismissKeyboard() {
    Keyboard.dismiss()
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          </View>

          <TouchableOpacity style={styles.profilePicContainer} onPress={pickProfileImage}>
            {profile?.profilePic ? (
              <Image source={{ uri: profile.profilePic }} style={styles.profilePic} />
            ) : (
              <View style={[styles.noPic, { backgroundColor: theme.card }]}>
                <Text style={{ color: theme.text }}>No Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Weight Logging</Text>
            <View style={styles.fieldRow}>
              <TextInput
                style={[
                  styles.fieldInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }
                ]}
                keyboardType="decimal-pad"
                value={dailyWeight}
                onChangeText={setDailyWeight}
                placeholder="Enter weight"
                placeholderTextColor={darkMode ? '#888888' : '#999999'}
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
                  decimalPlaces: 1
                }}
                bezier
                style={styles.chart}
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

          <TouchableOpacity style={styles.logoutButtonContainer} onPress={logout}>
            <Text style={[styles.logoutButtonText, { color: theme.primary }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 80 },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600'
  },
  profilePicContainer: {
    alignSelf: 'center',
    marginBottom: 24
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  noPic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  fieldInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10
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
  chart: {
    marginTop: 12,
    borderRadius: 16
  },
  calendar: {
    borderRadius: 8
  },
  logoutButtonContainer: {
    alignSelf: 'center',
    marginTop: 40
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600'
  }
})