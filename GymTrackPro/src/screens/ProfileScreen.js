// src/screens/ProfileScreen.js
import React, { useContext, useState, useEffect } from 'react';
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
  Keyboard,
  Modal
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { LineChart } from 'react-native-chart-kit';
import DatabaseService from '../services/DatabaseService';
import { ExerciseContext } from '../context/ExerciseContext';
import { AuthContext } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { darkMode, userGoal, setGoal } = useContext(ExerciseContext);
  const { logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [dailyWeight, setDailyWeight] = useState('');
  const [weightLog, setWeightLog] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [goalSelectionVisible, setGoalSelectionVisible] = useState(false);

  const theme = {
    text: darkMode ? '#FFFFFF' : '#333333',
    background: darkMode ? '#1C1C1E' : '#F8F9FA',
    card: darkMode ? '#2C2C2E' : '#FFFFFF',
    border: darkMode ? '#555555' : '#E0E0E0',
    primary: '#007AFF'
  };

  useEffect(() => {
    loadProfile();
    loadWeightLog();
    loadAllHistory();
  }, []);

  async function loadProfile() {
    try {
      const userProfile = await DatabaseService.getProfile();
      if (userProfile) setProfile(userProfile);
    } catch (error) {
      console.warn(error);
    }
  }

  async function loadWeightLog() {
    try {
      const log = await DatabaseService.getDailyWeightLog();
      setWeightLog(log);
    } catch (error) {
      console.warn(error);
    }
  }

  async function loadAllHistory() {
    try {
      const fullHistory = await DatabaseService.getExerciseHistory();
      const dateMarks = {};
      fullHistory.forEach(entry => {
        if (entry.date) {
          const dayStr = entry.date.split('T')[0];
          dateMarks[dayStr] = { marked: true, dotColor: theme.primary };
        }
      });
      setMarkedDates(dateMarks);
    } catch (error) {
      console.warn(error);
    }
  }

  async function handleLogWeight() {
    if (!dailyWeight) {
      Alert.alert('Error', 'Enter a weight.');
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const updatedLog = await DatabaseService.logDailyWeight({
        date: today,
        weight: parseFloat(dailyWeight)
      });
      setWeightLog(updatedLog);
      setDailyWeight('');
      Alert.alert('Success', `Logged weight for ${today}.`);
    } catch (error) {
      Alert.alert('Error', 'Could not log daily weight.');
    }
  }

  // Goal options – these can also be imported from your goals.js file if you wish
  const goalOptions = [
    { id: 'strength', name: 'Strength', description: 'Focus on lifting heavier weights with lower reps.' },
    { id: 'hypertrophy', name: 'Hypertrophy', description: 'Build muscle size with moderate weights and higher reps.' },
    { id: 'endurance', name: 'Endurance', description: 'Perform higher reps with lighter weights for stamina.' },
    { id: 'tone', name: 'Tone', description: 'Achieve a lean, defined look with moderate resistance training.' }
  ];

  const handleSelectGoal = (goalId) => {
    setGoal(goalId);
    setGoalSelectionVisible(false);
  };

  const chartLabels = weightLog.map(entry => entry.date.slice(5));
  const chartWeights = weightLog.map(entry => entry.weight);
  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          </View>

          <TouchableOpacity
            style={styles.profilePicContainer}
            onPress={async () => {
              try {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permissionResult.granted) {
                  Alert.alert('Permission Required', 'Grant permission to access photos.');
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  quality: 0.7
                });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  const uri = pickerResult.assets[0].uri;
                  const updatedProfile = { ...profile, profilePic: uri };
                  await DatabaseService.saveProfile(updatedProfile);
                  setProfile(updatedProfile);
                }
              } catch (error) {
                Alert.alert('Error', 'Could not pick image.');
              }
            }}
          >
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
            <Text style={[styles.cardTitle, { color: theme.text }]}>Your Goal</Text>
            <View style={styles.goalDisplay}>
              <Text style={[styles.goalText, { color: theme.text }]}>{userGoal ? userGoal.toUpperCase() : 'Not Set'}</Text>
              <TouchableOpacity style={styles.editGoalButton} onPress={() => setGoalSelectionVisible(true)}>
                <Text style={[styles.editGoalText, { color: theme.primary }]}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

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

        <Modal
          visible={goalSelectionVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setGoalSelectionVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.goalModal, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Your Fitness Goal</Text>
              {goalOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.goalOption}
                  onPress={() => handleSelectGoal(option.id)}
                >
                  <Text style={[styles.goalOptionTitle, { color: theme.text }]}>{option.name}</Text>
                  <Text style={[styles.goalOptionDescription, { color: darkMode ? '#aaa' : '#666' }]}>{option.description}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.cancelButton} onPress={() => setGoalSelectionVisible(false)}>
                <Text style={{ color: theme.primary }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, paddingTop: 80 },
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  profilePicContainer: { alignSelf: 'center', marginBottom: 24 },
  profilePic: { width: 120, height: 120, borderRadius: 60 },
  noPic: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginRight: 10 },
  logButton: { backgroundColor: '#28A745', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  logButtonText: { color: '#FFF', fontWeight: '600' },
  chart: { marginTop: 12, borderRadius: 16 },
  calendar: { borderRadius: 8 },
  logoutButtonContainer: { alignSelf: 'center', marginTop: 40 },
  logoutButtonText: { fontSize: 16, fontWeight: '600' },
  goalDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalText: { fontSize: 18, fontWeight: '600' },
  editGoalButton: { padding: 8 },
  editGoalText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  goalModal: { borderRadius: 12, padding: 24, width: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  goalOption: { marginBottom: 16, alignItems: 'center' },
  goalOptionTitle: { fontSize: 18, fontWeight: '600' },
  goalOptionDescription: { fontSize: 14 },
  cancelButton: { alignSelf: 'center', marginTop: 8 }
});