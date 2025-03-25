// screens/ProfileScreen.js
import React, { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { LineChart } from 'react-native-chart-kit'
import DatabaseService from '../services/DatabaseService'
import { ExerciseContext } from '../context/ExerciseContext'
import { AuthContext } from '../context/AuthContext'

export default function ProfileScreen() {
  const { darkMode } = useContext(ExerciseContext)
  const { logout } = useContext(AuthContext)

  const [dailyWeight, setDailyWeight] = useState('')
  const [weightLog, setWeightLog] = useState([])
  const [markedDates, setMarkedDates] = useState({})
  
  const theme = {
    text: darkMode ? '#FFFFFF' : '#333333',
    background: darkMode ? '#1C1C1E' : '#F8F9FA',
    card: darkMode ? '#2C2C2E' : '#FFFFFF',
    border: darkMode ? '#555555' : '#E0E0E0',
    primary: '#007AFF',
  }

  useEffect(() => {
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
    loadWeightLog()
    loadAllHistory()
  }, [])

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

  // For chart
  const chartLabels = weightLog.map(entry => entry.date.slice(5))
  const chartWeights = weightLog.map(entry => entry.weight)
  const screenWidth = Dimensions.get('window').width - 32

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerBar}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity onPress={logout} style={styles.headerButton}>
          <Text style={[styles.logoutText, { color: theme.primary }]}>Logout</Text>
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
            placeholder="Enter weight"
            placeholderTextColor={darkMode ? '#888' : '#999'}
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  headerButton: {
    padding: 8
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600'
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
});