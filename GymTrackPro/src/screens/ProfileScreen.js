// src/screens/ProfileScreen.js
import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text as RNText,
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
  Easing,
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
import { Text, Title, Heading, Body, Subheading, Caption } from '../components/ui';
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

// Get the screen dimensions
const screenWidth = Dimensions.get('window').width - 40; // 40px padding

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
  const spinValue = useRef(new Animated.Value(0)).current;
  
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
  const [weightLogModalVisible, setWeightLogModalVisible] = useState(false);
  
  // Reference to scroll view for programmatic scrolling
  const scrollViewRef = useRef(null);

  // Create a spinning animation for the loading indicator
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [loading]);
  
  // Interpolate the spin value to rotate from 0 to 360 degrees
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
    warning: '#FFCC00',
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
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            opacity: headerAnimatedOpacity,
            transform: [{ translateY: headerTranslateY }],
            backgroundColor: colors.primary,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.profileImageContainer,
            {
              transform: [{ scale: profileAnimatedScale }],
              opacity: profileAnimatedOpacity
            }
          ]}
        >
          {profilePicUrl ? (
            <Image
              source={{ uri: profilePicUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: colors.secondary }]}>
              <Text style={styles.profileInitial}>
                {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.userInfo}>
          <TouchableOpacity 
            style={styles.nameContainer}
            onPress={() => {
              if (!editingUsername) {
                setUsernameInput(profile?.username || '');
                setEditingUsername(true);
              }
            }}
          >
            {editingUsername ? (
              <View style={styles.usernameEditContainer}>
                <TextInput
                  style={[styles.usernameInput, { color: colors.text }]}
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  autoFocus
                  onBlur={() => setEditingUsername(false)}
                  onSubmitEditing={saveUsername}
                />
                <TouchableOpacity onPress={saveUsername}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </TouchableOpacity>
              </View>
            ) : (
              <Heading style={{ color: '#FFF' }}>
                {profile?.username || 'Anonymous User'}
                <Ionicons name="pencil-outline" size={16} color="rgba(255,255,255,0.8)" style={{ marginLeft: 8 }} />
              </Heading>
            )}
          </TouchableOpacity>
          <Subheading style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
            {profile?.userGoal ? profile.userGoal.charAt(0).toUpperCase() + profile.userGoal.slice(1) : 'No goal set'}
          </Subheading>
        </View>
      </Animated.View>
      
      <Animated.ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
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
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats Dashboard Section */}
        <View style={[styles.section, { marginTop: 180 }]}>
          <Title style={{ marginBottom: 16, color: colors.text }}>Stats Dashboard</Title>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="barbell-outline" size={24} color={colors.primary} />
              </View>
              <Heading style={{ color: colors.text, fontSize: 24 }}>
                {allWorkoutHistory?.totalWorkouts || 0}
              </Heading>
              <Caption style={{ color: colors.textSecondary }}>
                Total Workouts
              </Caption>
            </Card>
            
            <Card style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="trending-up-outline" size={24} color={colors.secondary} />
              </View>
              <Heading style={{ color: colors.text, fontSize: 24 }}>
                {weightLogs?.length || 0}
              </Heading>
              <Caption style={{ color: colors.textSecondary }}>
                Weight Logs
              </Caption>
            </Card>
            
            <Card style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
              </View>
              <Heading style={{ color: colors.text, fontSize: 24 }}>
                {allWorkoutHistory?.completionRate || 0}%
              </Heading>
              <Caption style={{ color: colors.textSecondary }}>
                Completion Rate
              </Caption>
            </Card>
            
            <Card style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="flame-outline" size={24} color={colors.warning} />
              </View>
              <Heading style={{ color: colors.text, fontSize: 24 }}>
                {allWorkoutHistory?.streak || 0}
              </Heading>
              <Caption style={{ color: colors.textSecondary }}>
                Current Streak
              </Caption>
            </Card>
          </View>
        </View>
        
        {/* Weight Section */}
        <View style={styles.section}>
          <Title style={{ marginBottom: 16, color: colors.text }}>Body Metrics</Title>
          <Card style={styles.weightCard}>
            <View style={styles.weightChartHeader}>
              <Subheading style={{ color: colors.text }}>Weight History</Subheading>
              <TouchableOpacity 
                style={styles.logWeightButton}
                onPress={() => {
                  setWeightToLog('');
                  setWeightLogModalVisible(true);
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Log Weight
                </Text>
              </TouchableOpacity>
            </View>
            
            {weightLogs?.length > 0 ? (
              <View style={styles.weightChartContainer}>
                {chartData && (
                  <LineChart
                    data={chartData}
                    width={screenWidth}
                    height={180}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
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
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                )}
              </View>
            ) : (
              <View style={styles.emptyChartContainer}>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                  No weight data available. Log your weight to see trends.
                </Text>
              </View>
            )}
          </Card>
        </View>
        
        {/* Achievements Section */}
        <View style={styles.section}>
          <Title style={{ marginBottom: 16, color: colors.text }}>Achievements</Title>
          <View style={styles.achievementsGrid}>
            {/* Workout Frequency Achievement */}
            <Card style={[
              styles.achievementCard, 
              { opacity: allWorkoutHistory?.totalWorkouts >= 10 ? 1 : 0.5 }
            ]}>
              <View style={[
                styles.achievementIconCircle, 
                { backgroundColor: colors.primary + '20' }
              ]}>
                <Ionicons 
                  name="trophy-outline" 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              <Subheading style={{ color: colors.text, marginTop: 8 }}>
                Dedicated Athlete
              </Subheading>
              <Caption style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Complete 10 workouts
              </Caption>
              {allWorkoutHistory?.totalWorkouts >= 10 && (
                <View style={styles.achievementCompleted}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
              )}
            </Card>
            
            {/* Weight Logging Achievement */}
            <Card style={[
              styles.achievementCard, 
              { opacity: weightLogs?.length >= 5 ? 1 : 0.5 }
            ]}>
              <View style={[
                styles.achievementIconCircle, 
                { backgroundColor: colors.secondary + '20' }
              ]}>
                <Ionicons 
                  name="trending-up-outline" 
                  size={24} 
                  color={colors.secondary} 
                />
              </View>
              <Subheading style={{ color: colors.text, marginTop: 8 }}>
                Progress Tracker
              </Subheading>
              <Caption style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Log weight 5 times
              </Caption>
              {weightLogs?.length >= 5 && (
                <View style={styles.achievementCompleted}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
              )}
            </Card>
            
            {/* Streak Achievement */}
            <Card style={[
              styles.achievementCard, 
              { opacity: allWorkoutHistory?.streak >= 7 ? 1 : 0.5 }
            ]}>
              <View style={[
                styles.achievementIconCircle, 
                { backgroundColor: colors.warning + '20' }
              ]}>
                <Ionicons 
                  name="flame-outline" 
                  size={24} 
                  color={colors.warning} 
                />
              </View>
              <Subheading style={{ color: colors.text, marginTop: 8 }}>
                On Fire
              </Subheading>
              <Caption style={{ color: colors.textSecondary, textAlign: 'center' }}>
                7-day workout streak
              </Caption>
              {allWorkoutHistory?.streak >= 7 && (
                <View style={styles.achievementCompleted}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
              )}
            </Card>
            
            {/* Heavy Lifter Achievement */}
            <Card style={[
              styles.achievementCard, 
              { opacity: allWorkoutHistory?.maxWeight >= 200 ? 1 : 0.5 }
            ]}>
              <View style={[
                styles.achievementIconCircle, 
                { backgroundColor: colors.success + '20' }
              ]}>
                <Ionicons 
                  name="barbell-outline" 
                  size={24} 
                  color={colors.success} 
                />
              </View>
              <Subheading style={{ color: colors.text, marginTop: 8 }}>
                Heavy Lifter
              </Subheading>
              <Caption style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Lift 200+ lbs
              </Caption>
              {allWorkoutHistory?.maxWeight >= 200 && (
                <View style={styles.achievementCompleted}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
              )}
            </Card>
          </View>
        </View>
        
        {/* Settings Section */}
        <View style={styles.section}>
          <Title style={{ marginBottom: 16, color: colors.text }}>Settings</Title>
          <Card style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="person-outline" size={24} color={colors.primary} />
              <Text style={{ flex: 1, marginLeft: 16, color: colors.text }}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setGoalSelectionVisible(true)}
            >
              <Ionicons name="flag-outline" size={24} color={colors.primary} />
              <Text style={{ flex: 1, marginLeft: 16, color: colors.text }}>Change Goal</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('AppSettings')}
            >
              <Ionicons name="settings-outline" size={24} color={colors.primary} />
              <Text style={{ flex: 1, marginLeft: 16, color: colors.text }}>App Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
              <Text style={{ flex: 1, marginLeft: 16, color: colors.text }}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomWidth: 0 }]}
              onPress={logout}
            >
              <Ionicons name="log-out-outline" size={24} color={colors.danger} />
              <Text style={{ flex: 1, marginLeft: 16, color: colors.danger }}>Sign Out</Text>
            </TouchableOpacity>
          </Card>
          
          <TouchableOpacity 
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Text style={{ color: colors.danger }}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
      
      {/* Weight Log Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={weightLogModalVisible}
        onRequestClose={() => setWeightLogModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setWeightLogModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <View style={styles.modalHeader}>
                  <Heading style={{ color: colors.text }}>Log Weight</Heading>
                  <TouchableOpacity onPress={() => setWeightLogModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.weightInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter weight (kg)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={weightToLog}
                    onChangeText={setWeightToLog}
                  />
                  <TouchableOpacity
                    style={[styles.logButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      handleLogWeight();
                      setWeightLogModalVisible(false);
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0A6CFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  usernameInput: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 100,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightCard: {
    padding: 16,
  },
  weightChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logWeightButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 108, 255, 0.1)',
  },
  weightChartContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 8,
  },
  emptyChartContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  achievementIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementCompleted: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  settingsCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  deleteAccountButton: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  weightInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
  },
  logButton: {
    padding: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  weightLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  weightDetails: {
    flexDirection: 'column',
  },
  weightValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  weightDate: {
    fontSize: 14,
    marginTop: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  }
});