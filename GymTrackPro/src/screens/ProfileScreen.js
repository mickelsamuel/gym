// src/screens/ProfileScreen.js
import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  Modal,
  Animated,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { LineChart } from 'react-native-chart-kit';
import DatabaseService from '../services/DatabaseService';
import MockDataService from '../services/MockDataService';
import { ExerciseContext } from '../context/ExerciseContext';
import { AuthContext } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '../constants/Colors';
import Container from '../components/ui/Container';
import { Title, Heading, Subheading, Body, Caption } from '../components/ui/Text';
import { CalendarList } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { getAuth } from 'firebase/auth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { getFirestore, doc, getDoc, updateDoc, collection, query, orderBy, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme] || defaultColors;
  const darkMode = colorScheme === 'dark';
  
  const { user, userProfile, logout, emailVerified, deleteAccount } = useContext(AuthContext);
  const navigation = useNavigation();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(220)).current;
  const profileScale = useRef(new Animated.Value(1)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [allWorkoutHistory, setAllWorkoutHistory] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [weightToLog, setWeightToLog] = useState('');
  const [goalSelectionVisible, setGoalSelectionVisible] = useState(false);
  const [userGoal, setUserGoal] = useState(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  
  // Reference to scroll view for programmatic scrolling
  const scrollViewRef = useRef(null);

  // Configure default colors as fallback
  const defaultColors = {
    text: darkMode ? '#FFFFFF' : '#000000',
    textSecondary: darkMode ? '#AAAAAA' : '#666666',
    background: darkMode ? '#121212' : '#FFFFFF',
    backgroundSecondary: darkMode ? '#1E1E1E' : '#F5F5F5',
    tint: darkMode ? '#2BD9FE' : '#5E17EB',
    tabIconDefault: darkMode ? '#777777' : '#CCCCCC',
    tabIconSelected: darkMode ? '#2BD9FE' : '#5E17EB',
    border: darkMode ? '#333333' : '#DDDDDD',
    notification: '#FF3B30',
    primary: darkMode ? '#2BD9FE' : '#5E17EB',
    secondary: darkMode ? '#5E17EB' : '#2BD9FE',
    card: darkMode ? '#1E1E1E' : '#FFFFFF',
    danger: '#FF3B30',
    success: '#4CD964',
  };

  const { darkMode: exerciseDarkMode, userGoal: exerciseUserGoal, setGoal } = useContext(ExerciseContext);
  const [dailyWeight, setDailyWeight] = useState('');
  const [weightLog, setWeightLog] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]); // For weight chart
  
  // Animation interpolations
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -80],
    extrapolate: 'clamp'
  });
  
  const headerAnimatedOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, darkMode ? 0.7 : 0.95],
    extrapolate: 'clamp'
  });
  
  const profileAnimatedScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp'
  });
  
  const profileAnimatedOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.6],
    extrapolate: 'clamp'
  });
  
  const blurAnimatedOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  // Setup animations
  useEffect(() => {
    // Initialize animation values
    scrollY.setValue(0);
    headerHeight.setValue(220);
    profileScale.setValue(1);
    headerOpacity.setValue(1);
    contentOpacity.setValue(0);
  }, []);

  // Check for email verification and redirect if not verified
  useEffect(() => {
    if (user && !emailVerified) {
      // If user is logged in but email is not verified, redirect to verification screen
      navigation.navigate('EmailVerification');
    }
  }, [user, emailVerified, navigation]);

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
      return () => {};
    }, [])
  );

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        await loadProfile();
      } catch (profileError) {
        console.error("Error loading profile:", profileError);
        // Don't throw here, continue with other data loading
      }
      
      try {
        await loadWeightLog();
      } catch (weightError) {
        console.error("Error loading weight logs:", weightError);
        // Don't throw here, continue with other data loading
      }
      
      try {
        await loadAllHistory();
      } catch (historyError) {
        console.error("Error loading workout history:", historyError);
        // Don't throw here, continue with other data loading
      }
      
      // Animate content in after data loads, even if some data failed to load
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }).start();
    } catch (error) {
      console.error("Error loading profile data:", error);
      
      setError("Failed to load profile data. Please try again.");
      
      // Don't show alert unless user action is required
      if (error.message && error.message.includes("authentication") || 
          error.message && error.message.includes("permission")) {
        Alert.alert(
          "Authentication Issue", 
          "Please sign out and sign back in to refresh your session.",
          [
            { text: "OK" },
            { 
              text: "Sign Out", 
              onPress: () => logout() 
            }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  async function loadProfile() {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const auth = getAuth();
      const firestore = getFirestore();
      
      // Add defensive code to check if auth.currentUser exists
      if (!auth.currentUser) {
        console.warn("No current user found in auth");
        throw new Error("Authentication error - no current user");
      }
      
      try {
        const userDoc = await getDoc(doc(firestore, "users", auth.currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
          setUserGoal(userData.fitnessGoal || null);
          setUsernameInput(userData.username || auth.currentUser.displayName || '');
          
          // Load profile picture if exists
          if (userData.profilePicture) {
            try {
              const storage = getStorage();
              const picRef = storageRef(storage, userData.profilePicture);
              const url = await getDownloadURL(picRef);
              setProfilePicUrl(url);
            } catch (storageError) {
              console.error("Error loading profile picture:", storageError);
              // Don't throw, just continue without profile picture
              setProfilePicUrl(null);
            }
          }
        } else {
          // No user document exists
          console.warn("No user document found");
          // Create a basic profile with default values
          setProfile({
            username: auth.currentUser.displayName || '',
            email: auth.currentUser.email || '',
            createdAt: new Date().toISOString()
          });
        }
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        throw new Error("Error accessing user data: " + firestoreError.message);
      }
    } catch (error) {
      console.error("Load profile error:", error);
      throw error;
    }
  }

  async function loadWeightLog() {
    try {
      if (!user) {
        console.warn("Cannot load weight logs: User not authenticated");
        setWeightLogs([]);
        setChartData(null);
        return;
      }

      const auth = getAuth();
      const firestore = getFirestore();
      
      if (!auth.currentUser) {
        console.warn("No current user found in auth");
        setWeightLogs([]);
        setChartData(null);
        return;
      }
      
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let logs = [];
        
        // Check if userData has the weightLog field and it's an array
        if (userData.firestoreWeightLog && Array.isArray(userData.firestoreWeightLog)) {
          logs = userData.firestoreWeightLog;
          // Sort by date (newest first)
          logs.sort((a, b) => new Date(b.date) - new Date(a.date));
          setWeightLogs(logs);
          
          // Generate chart data if we have enough logs
          if (logs.length > 0) {
            try {
              // Prepare data for the line chart
              // Sort by date (oldest first for chart)
              const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
              
              // Take the last 14 entries or fewer if not enough data
              const recentLogs = sortedLogs.slice(-14);
              
              const labels = recentLogs.map(entry => {
                const date = new Date(entry.date);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              });
              
              const data = recentLogs.map(entry => entry.weight);
              
              setChartData({
                labels,
                datasets: [
                  {
                    data,
                    color: (opacity = 1) => colors.primary,
                    strokeWidth: 2
                  }
                ]
              });
            } catch (chartError) {
              console.error("Error creating chart data:", chartError);
              setChartData(null);
            }
          } else {
            setChartData(null);
          }
        } else {
          console.log("No weight logs found in user data");
          setWeightLogs([]);
          setChartData(null);
        }
      } else {
        console.log("User document does not exist");
        setWeightLogs([]);
        setChartData(null);
      }
    } catch (error) {
      console.error("Error loading weight logs:", error);
      // Set empty arrays in case of error to avoid undefined errors in rendering
      setWeightLogs([]);
      setChartData(null);
      throw error;
    }
  }

  async function loadAllHistory() {
    try {
      if (!user) {
        console.warn("Cannot load workout history: User not authenticated");
        setAllWorkoutHistory({});
        setMarkedDates({});
        return;
      }
      
      const auth = getAuth();
      const firestore = getFirestore();
      
      if (!auth.currentUser) {
        console.warn("No current user found in auth");
        setAllWorkoutHistory({});
        setMarkedDates({});
        return;
      }
      
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if userData has the workout history field and it's an array
        if (userData.firestoreSets && Array.isArray(userData.firestoreSets)) {
          const workouts = userData.firestoreSets;
          setAllWorkoutHistory(workouts);
          
          // Create marked dates for calendar
          const dates = {};
          workouts.forEach(workout => {
            if (workout.date) {
              const dateStr = workout.date.split('T')[0]; // format: YYYY-MM-DD
              dates[dateStr] = { 
                marked: true, 
                dotColor: colors.primary 
              };
            }
          });
          
          setMarkedDates(dates);
        } else {
          console.log("No workout history found in user data");
          setAllWorkoutHistory({});
          setMarkedDates({});
        }
      } else {
        console.log("User document does not exist");
        setAllWorkoutHistory({});
        setMarkedDates({});
      }
    } catch (error) {
      console.error("Error loading workout history:", error);
      // Set empty objects in case of error to avoid undefined errors in rendering
      setAllWorkoutHistory({});
      setMarkedDates({});
      throw error;
    }
  }

  async function handleLogWeight() {
    try {
      if (!user) {
        Alert.alert("Error", "You must be signed in to log weight");
        return;
      }
      
      if (!weightToLog || isNaN(parseFloat(weightToLog))) {
        Alert.alert("Invalid Weight", "Please enter a valid weight value");
        return;
      }
      
      const weight = parseFloat(weightToLog);
      if (weight <= 0 || weight > 700) { // Reasonable validation limits
        Alert.alert("Invalid Weight", "Please enter a realistic weight value");
        return;
      }
      
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
      
      // Use firestore directly instead of the DatabaseService
      const auth = getAuth();
      const firestore = getFirestore();
      
      if (!auth.currentUser) {
        Alert.alert("Error", "Authentication error. Please sign in again.");
        return;
      }
      
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Initialize the weight log array if it doesn't exist
        const weightLog = userData.firestoreWeightLog || [];
        
        // Check if we already have an entry for today
        const existingEntryIndex = weightLog.findIndex(entry => 
          entry.date && entry.date.split('T')[0] === today
        );
        
        if (existingEntryIndex >= 0) {
          // Update existing entry
          weightLog[existingEntryIndex] = {
            ...weightLog[existingEntryIndex],
            weight,
            date: today
          };
        } else {
          // Add new entry
          weightLog.push({
            weight,
            date: today
          });
        }
        
        // Sort logs by date (newest first)
        weightLog.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // If there are too many entries, trim the oldest ones
        const MAX_ENTRIES = 100;
        if (weightLog.length > MAX_ENTRIES) {
          weightLog.splice(MAX_ENTRIES);
        }
        
        // Update in Firestore
        await updateDoc(userRef, {
          firestoreWeightLog: weightLog,
          lastUpdated: Timestamp.now()
        });
        
        // Clear input and reload data
        setWeightToLog('');
        await loadWeightLog();
        
        // Show confirmation
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Weight Logged", `Successfully logged weight: ${weight}`);
      } else {
        Alert.alert("Error", "User profile not found. Please try again.");
      }
    } catch (error) {
      console.error("Error logging weight:", error);
      Alert.alert("Error", "Failed to log weight. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  
  const saveUsername = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "You must be signed in to update your profile");
        setEditingUsername(false);
        return;
      }
      
      if (!usernameInput.trim()) {
        Alert.alert("Invalid Username", "Username cannot be empty");
        return;
      }
      
      setLoading(true);
      
      const auth = getAuth();
      const firestore = getFirestore();
      
      if (!auth.currentUser) {
        Alert.alert("Error", "Authentication error. Please sign in again.");
        setEditingUsername(false);
        return;
      }
      
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      
      // Update username in Firestore
      await updateDoc(userRef, {
        username: usernameInput.trim(),
        lastUpdated: Timestamp.now()
      });
      
      // Refresh profile data
      await loadProfile();
      
      // Exit editing mode
      setEditingUsername(false);
      
      // Show confirmation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error saving username:", error);
      Alert.alert("Error", "Failed to update username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Goal options
  const goalOptions = [
    {
      id: 'strength',
      name: 'Strength',
      description: 'Build raw power and strength',
      icon: 'barbell-outline',
      color: '#FF5757'
    },
    {
      id: 'hypertrophy',
      name: 'Hypertrophy',
      description: 'Focus on muscle growth and size',
      icon: 'fitness-outline',
      color: '#5E17EB'
    },
    {
      id: 'endurance',
      name: 'Endurance',
      description: 'Improve stamina and workout capacity',
      icon: 'stopwatch-outline',
      color: '#2BD9FE'
    },
    {
      id: 'tone',
      name: 'Toning',
      description: 'Define muscles and improve body composition',
      icon: 'body-outline',
      color: '#FFB156'
    },
    {
      id: 'weight_loss',
      name: 'Weight Loss',
      description: 'Focus on burning calories and fat loss',
      icon: 'trending-down-outline',
      color: '#4CD964'
    }
  ];

  const handleSelectGoal = (goalId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const auth = getAuth();
      const firestore = getFirestore();
      
      updateDoc(doc(firestore, "users", auth.currentUser.uid), {
        fitnessGoal: goalId
      });
      
      setUserGoal(goalId);
      setGoalSelectionVisible(false);
      
      // Provide success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error setting fitness goal:", error);
      Alert.alert("Error", "Failed to set fitness goal. Please try again.");
    }
  };
  
  const currentGoal = goalOptions.find(g => g.id === userGoal);
  const chartLabels = weightLog.map(entry => {
    const date = new Date(entry.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }).slice(-7); // Last 7 entries
  
  const chartWeights = weightLog.map(entry => entry.weight).slice(-7); // Last 7 entries
  const screenWidth = Dimensions.get('window').width - 48;
  
  const formatRelativeTime = (dateString) => {
    try {
      const date = typeof dateString === 'string' 
        ? parseISO(dateString) 
        : dateString;
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  const renderWeightLogItem = ({ item, index }) => {
    // Calculate weight change if not the first entry
    const prevWeight = index < weightLogs.length - 1 ? weightLogs[index + 1].weight : null;
    const change = prevWeight ? (item.weight - prevWeight).toFixed(1) : null;
    const isGain = change > 0;
    
    return (
      <Animated.View 
        style={[
          styles.weightLogItem, 
          { 
            backgroundColor: colors.backgroundSecondary,
            opacity: 1, // Replace SlideInUp animation
            transform: [{ translateY: 0 }] // Use simple static value instead of animation
          }
        ]}
      >
        <View style={styles.weightDetails}>
          <Text style={[styles.weightValue, { color: colors.text }]}>
            {item.weight} kg
          </Text>
          <Text style={[styles.weightDate, { color: colors.textSecondary }]}>
            {formatRelativeTime(item.date)}
          </Text>
        </View>
        
        {change !== null && (
          <View style={styles.changeContainer}>
            <Ionicons 
              name={isGain ? "arrow-up" : "arrow-down"} 
              size={16} 
              color={isGain ? colors.danger : colors.success} 
            />
            <Text 
              style={[
                styles.changeText, 
                { color: isGain ? colors.danger : colors.success }
              ]}
            >
              {Math.abs(change)} kg
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // Handle scroll events for animations
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
  };

  // Handle delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Error', 'Please enter your password to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.danger, marginTop: 16 }]}>
          {error}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadProfileData}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Container style={{ backgroundColor: colors.background }}>
      {/* Animated Header with Blur Effect */}
      <Animated.View style={[
        styles.header, 
        { 
          transform: [{ translateY: headerTranslateY }],
          opacity: headerAnimatedOpacity 
        }
      ]}>
        <LinearGradient
          colors={darkMode 
            ? ['rgba(30,30,30,0.9)', 'rgba(18,18,18,1)'] 
            : ['rgba(94,23,235,0.8)', 'rgba(43,217,254,0.4)']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[
          StyleSheet.absoluteFill, 
          { opacity: blurAnimatedOpacity }
        ]}>
          <BlurView 
            intensity={darkMode ? 40 : 20} 
            tint={darkMode ? 'dark' : 'light'} 
            style={StyleSheet.absoluteFill} 
          />
        </Animated.View>
        
        <Animated.View style={[
          styles.headerContent, 
          {
            transform: [{ scale: profileAnimatedScale }],
            opacity: profileAnimatedOpacity
          }
        ]}>
          <TouchableOpacity 
            style={styles.profilePicContainer}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            {profilePicUrl ? (
              <Image 
                source={{ uri: profilePicUrl }} 
                style={styles.profilePic} 
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.noPic, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
            
            <View style={[styles.editProfileBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          {editingUsername ? (
            <Animated.View 
              style={styles.usernameEditContainer}
            >
              <TextInput
                style={[
                  styles.usernameInput, 
                  { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.backgroundSecondary
                  }
                ]}
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="Username"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <View style={styles.usernameEditButtons}>
                <TouchableOpacity 
                  style={[styles.usernameEditButton, { backgroundColor: colors.danger }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditingUsername(false);
                    setUsernameInput(profile?.username || '');
                  }}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.usernameEditButton, { backgroundColor: colors.success }]}
                  onPress={saveUsername}
                >
                  <Ionicons name="checkmark" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <TouchableOpacity 
              style={styles.usernameContainer}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditingUsername(true);
              }}
            >
              <Text style={[styles.username, { fontSize: 18, color: '#fff' }]}>
                {profile?.username || 'Set Username'}
              </Text>
              <Ionicons name="pencil" size={16} color="#fff" style={styles.editIcon} />
            </TouchableOpacity>
          )}
          
          {userGoal && !editingUsername && (
            <View style={styles.currentGoalBadge}>
              <Ionicons 
                name={goalOptions.find(g => g.id === userGoal)?.icon || 'fitness'} 
                size={14} 
                color="#fff" 
                style={styles.goalIcon} 
              />
              <Text style={{ color: '#fff', fontSize: 12 }}>
                {goalOptions.find(g => g.id === userGoal)?.name || 'Set Goal'}
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>

      {/* Main Content */}
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <Animated.View style={[
              { width: '100%', opacity: contentOpacity }
            ]}>
              {/* Weight Logging Card */}
              <Animated.View 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: 1 // Static value instead of FadeIn
                  }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontSize: 18 }]}>
                    Weight Tracking
                  </Text>
                  <Ionicons name="fitness" size={20} color={colors.primary} />
                </View>
                
                <View style={styles.fieldRow}>
                  <TextInput
                    style={[
                      styles.fieldInput, 
                      { 
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.backgroundSecondary
                      }
                    ]}
                    value={weightToLog}
                    onChangeText={setWeightToLog}
                    placeholder="Enter weight (kg)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity 
                    style={[styles.logButton, { backgroundColor: colors.primary }]}
                    onPress={handleLogWeight}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                {/* Weight Chart */}
                {chartData && (
                  <View style={[styles.chart, { backgroundColor: colors.backgroundSecondary }]}>
                    <LineChart
                      data={chartData}
                      width={styles.chart.width || 320}
                      height={180}
                      yAxisLabel=""
                      yAxisSuffix=" kg"
                      chartConfig={{
                        backgroundColor: colors.backgroundSecondary,
                        backgroundGradientFrom: colors.backgroundSecondary,
                        backgroundGradientTo: colors.backgroundSecondary,
                        decimalPlaces: 1,
                        color: (opacity = 1) => colors.primary,
                        labelColor: (opacity = 1) => colors.text,
                        style: {
                          borderRadius: 16
                        },
                        propsForDots: {
                          r: "6",
                          strokeWidth: "2",
                          stroke: colors.primary
                        }
                      }}
                      bezier
                      style={styles.chart}
                    />
                  </View>
                )}
                
                {/* Weight Log History */}
                {weightLogs.length > 0 && (
                  <View style={styles.weightHistoryList}>
                    <Text style={[{ color: colors.textSecondary, marginBottom: 8 }]}>
                      Recent Entries
                    </Text>
                    {weightLogs.slice(0, 3).map((item, index) => renderWeightLogItem({ item, index }))}
                    
                    {weightLogs.length > 3 && (
                      <TouchableOpacity 
                        style={{ marginTop: 8, alignItems: 'center' }}
                        onPress={() => navigation.navigate('WeightLog', { logs: weightLogs })}
                      >
                        <Text style={{ color: colors.primary, fontWeight: '500' }}>
                          View All Entries
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Animated.View>
              
              {/* Fitness Goal Card */}
              <Animated.View 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: 1 // Static value instead of FadeIn
                  }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontSize: 18 }]}>
                    Fitness Goal
                  </Text>
                  <Ionicons name="trophy" size={20} color={colors.primary} />
                </View>
                
                {userGoal ? (
                  <View>
                    <View 
                      style={[
                        styles.currentGoalContainer,
                        { 
                          backgroundColor: goalOptions.find(g => g.id === userGoal)?.color + '15' 
                        }
                      ]}
                    >
                      <View 
                        style={[
                          styles.goalIconContainer,
                          { backgroundColor: goalOptions.find(g => g.id === userGoal)?.color + '20' }
                        ]}
                      >
                        <Ionicons 
                          name={goalOptions.find(g => g.id === userGoal)?.icon || 'fitness'} 
                          size={32} 
                          color={goalOptions.find(g => g.id === userGoal)?.color} 
                        />
                      </View>
                      
                      <View style={styles.goalInfo}>
                        <Text style={[styles.goalName, { color: colors.text }]}>
                          {goalOptions.find(g => g.id === userGoal)?.name}
                        </Text>
                        <Text style={[styles.goalDescription, { color: colors.textSecondary }]}>
                          {goalOptions.find(g => g.id === userGoal)?.description}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noGoalContainer}>
                    <Text style={{ color: colors.textSecondary }}>
                      You haven't set a fitness goal yet
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.changeGoalButton, 
                    { backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setGoalSelectionVisible(true);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '500' }}>
                    {userGoal ? 'Change Goal' : 'Set Goal'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Workout Calendar Card */}
              <Animated.View 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: 1 // Static value instead of FadeIn
                  }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontSize: 18 }]}>
                    Workout History
                  </Text>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                
                <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                  Days with completed workouts are marked
                </Text>
                
                <View style={styles.calendar}>
                  <CalendarList
                    horizontal={true}
                    pagingEnabled={true}
                    pastScrollRange={3}
                    futureScrollRange={1}
                    scrollEnabled={true}
                    showScrollIndicator={false}
                    markedDates={markedDates}
                    onDayPress={(day) => {
                      // Navigate to specific day's workout history
                      if (markedDates[day.dateString]) {
                        navigation.navigate('WorkoutHistoryDetail', { date: day.dateString });
                      }
                    }}
                    theme={{
                      calendarBackground: colors.backgroundSecondary,
                      dayTextColor: colors.text,
                      monthTextColor: colors.text,
                      textSectionTitleColor: colors.textSecondary,
                      textDisabledColor: darkMode ? '#555555' : '#d9e1e8',
                      arrowColor: colors.primary,
                      dotColor: colors.primary,
                      todayTextColor: colors.primary,
                      selectedDayBackgroundColor: colors.primary,
                      selectedDayTextColor: '#ffffff',
                      textDayFontSize: 14,
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 13
                    }}
                  />
                </View>
              </Animated.View>

              {/* Logout Button */}
              <Animated.View style={{ opacity: 1 }}>
                <TouchableOpacity 
                  style={[
                    styles.logoutButton, 
                    { 
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Confirm Logout',
                      'Are you sure you want to log out?',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel'
                        },
                        {
                          text: 'Logout',
                          onPress: () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            logout();
                          },
                          style: 'destructive'
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} style={styles.logoutIcon} />
                  <Text style={{ color: colors.danger, fontWeight: '500' }}>Logout</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Delete Account Button */}
              <Animated.View style={{ opacity: 1 }}>
                <TouchableOpacity 
                  style={[
                    styles.deleteAccountButton, 
                    { 
                      backgroundColor: 'rgba(255, 59, 48, 0.1)',
                      borderColor: 'rgba(255, 59, 48, 0.3)',
                    }
                  ]}
                  onPress={() => setShowDeleteConfirm(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} style={styles.deleteIcon} />
                  <Text style={{ color: colors.danger, fontWeight: '500' }}>Delete Account</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Goal Selection Modal */}
      <Modal
        visible={goalSelectionVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalSelectionVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setGoalSelectionVisible(false)}>
          <BlurView 
            intensity={darkMode ? 40 : 20} 
            tint={darkMode ? 'dark' : 'light'} 
            style={styles.modalOverlay}
          >
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.goalModal, 
                  { 
                    backgroundColor: colors.card,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 5,
                  }
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select Your Fitness Goal</Text>
                  <TouchableOpacity 
                    onPress={() => setGoalSelectionVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                {goalOptions.map((option, index) => (
                  <Animated.View
                    key={option.id}
                    style={{ opacity: 1 }} // Static value instead of FadeIn
                  >
                    <TouchableOpacity
                      style={[
                        styles.goalOption,
                        userGoal === option.id && { backgroundColor: option.color + '15' }
                      ]}
                      onPress={() => handleSelectGoal(option.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.goalIconCircle, { backgroundColor: option.color + '20' }]}>
                        <Ionicons name={option.icon} size={24} color={option.color} />
                      </View>
                      <View style={styles.goalOptionContent}>
                        <Text style={[styles.goalOptionTitle, { color: colors.text }]}>{option.name}</Text>
                        <Text style={[styles.goalOptionDescription, { color: colors.textSecondary }]}>
                          {option.description}
                        </Text>
                      </View>
                      {userGoal === option.id && (
                        <Ionicons name="checkmark-circle" size={24} color={option.color} style={styles.selectedIcon} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDeleteConfirm(false)}>
          <BlurView 
            intensity={darkMode ? 40 : 20} 
            tint={darkMode ? 'dark' : 'light'} 
            style={styles.modalOverlay}
          >
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.deleteModal, 
                  { 
                    backgroundColor: colors.card,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 5,
                  }
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.danger, fontWeight: 'bold' }]}>
                    Delete Account
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setShowDeleteConfirm(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.deleteWarning, { color: colors.text }]}>
                  This action cannot be undone. All your data will be permanently deleted.
                </Text>
                
                <Text style={[styles.deleteInstructions, { color: colors.textSecondary }]}>
                  Please enter your password to confirm:
                </Text>
                
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                />
                
                <View style={styles.deleteButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.confirmDeleteButton, 
                      { backgroundColor: colors.danger },
                      isDeleting && { opacity: 0.7 }
                    ]}
                    onPress={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: '600' }}>Delete Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 24,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 230,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  noPic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  editProfileBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontWeight: '600',
    fontSize: 20,
  },
  editIcon: {
    marginLeft: 8,
  },
  usernameEditContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  usernameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
  usernameEditButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  usernameEditButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  currentGoalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  goalIcon: {
    marginRight: 6,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  fieldInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
  },
  logButton: {
    borderRadius: 12,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recentWeightLog: {
    marginTop: 16,
  },
  chart: {
    marginVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  weightHistoryList: {
    marginTop: 16,
  },
  weightLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 6,
  },
  weightDetails: {
    flex: 1,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  weightDate: {
    fontSize: 13,
    marginTop: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeText: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 13,
  },
  currentGoalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  goalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  noGoalContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  changeGoalButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  calendar: {
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalModal: {
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  goalIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  goalOptionContent: {
    flex: 1,
  },
  goalOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalOptionDescription: {
    fontSize: 14,
  },
  selectedIcon: {
    marginLeft: 8,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteModal: {
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  deleteWarning: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  deleteInstructions: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 14,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  deleteButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  confirmDeleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
});