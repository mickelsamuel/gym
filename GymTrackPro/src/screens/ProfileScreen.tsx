import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView, Image, Platform, Animated, Easing, RefreshControl, Switch} from 'react-native';
import DatabaseService from '../services/DatabaseService';
import MockDataService from '../services/MockDataService';
import { ExerciseContext } from '../context/ExerciseContext';
import { AuthContext } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {Text, Button, Container, Card} from '../components/ui';
import { BlurView } from 'expo-blur';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {ref} from 'firebase/database';
import {getFirestore, doc, getDoc, updateDoc, collection, query, orderBy, getDocs, addDoc} from 'firebase/firestore';
import {ref as storageRef} from 'firebase/storage';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useColorScheme } from 'react-native';
import {Colors, Theme, Typography, Spacing} from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useExercise } from '../context/ExerciseContext';
;
;
;
;
;
;
// Get the screen dimensions
const screenWidth = Dimensions.get('window').width - 40; // 40px padding
// Types and interfaces
interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  profilePic?: string;
  goal?: string;
  fitnessLevel?: string;
  createdAt?: string;
  lastActive?: string;
  friends?: string[];
}
interface WeightLogEntry {
  id?: string;
  date: string;
  weight: number;
  notes?: string;
}
interface WorkoutSet {
  id?: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  notes?: string;
}
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
}
interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    customStyles?: {
      container?: {
        backgroundColor?: string;
      };
      text?: {
        color?: string;
      };
    };
  };
}
const ProfileScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const darkMode = colorScheme === 'dark';
  // Use theme from Theme constants
  const theme = darkMode ? Theme.dark : Theme.light;
  const { user, userProfile, logout, emailVerified, deleteAccount } = useContext(AuthContext);
  const { isOnline } = useAuth();  const navigation = useNavigation();
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(220)).current;
  const profileScale = useRef(new Animated.Value(1)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  // State variables
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>([]);
  const [allWorkoutHistory, setAllWorkoutHistory] = useState<{[date: string]: WorkoutSet[]}>({});
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [weightToLog, setWeightToLog] = useState<string>('');
  const [goalSelectionVisible, setGoalSelectionVisible] = useState<boolean>(false);
  const [userGoal, setUserGoal] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [weightLogModalVisible, setWeightLogModalVisible] = useState<boolean>(false);
  // Reference to scroll view for programmatic scrolling
  const scrollViewRef = useRef<ScrollView>(null);
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
  const { 
    darkMode: exerciseDarkMode, 
    toggleDarkMode,
    reducedMotion, 
    setReducedMotion,
    themeMode,
    setThemeMode,
    userGoal: exerciseUserGoal, 
    setGoal 
  } = useExercise();
  const [dailyWeight, setDailyWeight] = useState<string>('');
  const [weightLog, setWeightLog] = useState<WeightLogEntry[]>([]);
  const [weightHistory, setWeightHistory] = useState<number[]>([]); // For weight chart
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
  const loadProfileData = async (): Promise<void> => {
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
    } catch (error: any) {
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
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };
  async function loadProfile(): Promise<void> {
    if (!user) return;
    try {
      const db = getFirestore();
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setProfile({
          uid: user.uid,
          email: user.email || '',
          username: userData.username || 'User',
          displayName: userData.displayName || '',
          bio: userData.bio || '',
          profilePic: userData.profilePic || null,
          goal: userData.goal || null,
          fitnessLevel: userData.fitnessLevel || 'Beginner',
          createdAt: userData.createdAt || new Date().toISOString(),
          lastActive: userData.lastActive || new Date().toISOString(),
          friends: userData.friends || [],
        });
        // Update profile pic URL
        if (userData.profilePic) {
          setProfilePicUrl(userData.profilePic as string);
        } else {
          setProfilePicUrl(null);
        }
        // Update username
        setUsernameInput(userData.username || '');
        // Update goal
        if (userData.goal) {
          setUserGoal(userData.goal);
          setGoal(userData.goal);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile data. Please try again.");
    }
  }
  async function loadWeightLog(): Promise<void> {
    if (!user) return;
    try {
      const db = getFirestore();
      const weightLogsRef = collection(db, 'users', user.uid, 'weightLog');
      const q = query(weightLogsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const logs: WeightLogEntry[] = [];
      const historyData: number[] = [];
      const labels: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<WeightLogEntry, 'id'>;
        logs.push({
          id: doc.id,
          ...data,
          weight: parseFloat(data.weight.toString()) // Ensure weight is a number
        });
        // Only use the first 10 entries for the chart (most recent)
        if (logs.length <= 10) {
          historyData.unshift(parseFloat(data.weight.toString()));
          labels.unshift(format(parseISO(data.date), 'MM/dd'));
        }
      });
      setWeightLogs(logs);
      // Create chart data if we have enough entries
      if (historyData.length > 1) {
        setChartData({
          labels,
          datasets: [
            {
              data: historyData,
              color: (opacity = 1) => `rgba(10, 108, 255, ${opacity})`,
              strokeWidth: 2
            }
          ],
          legend: ['Weight (kg)']
        });
      }
    } catch (error) {
      console.error("Error loading weight logs:", error);
      throw error;
    }
  }
  async function loadAllHistory(): Promise<void> {
    if (!user) return;
    try {
      const db = getFirestore();
      const workoutsRef = collection(db, 'users', user.uid, 'workoutSessions');
      const q = query(workoutsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const workoutsByDate: { [date: string]: WorkoutSet[] } = {};
      const dates: MarkedDates = {};
      querySnapshot.forEach((doc) => {
        const workoutData = doc.data();
        const workoutDate = workoutData.date.substring(0, 10); // YYYY-MM-DD
        if (!workoutsByDate[workoutDate]) {
          workoutsByDate[workoutDate] = [];
        }
        // Add workout data to the corresponding date
        // Create a proper WorkoutSet object with all required properties
        workoutsByDate[workoutDate].push({
          date: workoutData.date,
          exerciseId: workoutData.exerciseId || '',
          exerciseName: workoutData.exerciseName || 'Exercise',
          weight: workoutData.weight || 0,
          reps: workoutData.reps || 0,
          notes: workoutData.notes,
          id: doc.id
        });
        // Mark date in calendar with custom styles
        dates[workoutDate] = {
          marked: true,
          dotColor: theme.primary,
          customStyles: {
            container: {
              backgroundColor: theme.primary + '20',
            },
            text: {
              color: darkMode ? '#FFFFFF' : '#000000'
            }
          }
        };
      });
      // Set state with workout history and marked dates
      setAllWorkoutHistory(workoutsByDate);
      setMarkedDates(dates);
    } catch (error) {
      console.error("Error loading workout history:", error);
    }
  }
  async function handleLogWeight(): Promise<void> {
    if (!isOnline) {
      Alert.alert('Error', 'You are offline. Cannot log weight.');
      return;
    }
    if (!weightToLog || isNaN(parseFloat(weightToLog))) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const weight = parseFloat(weightToLog);
      const date = new Date().toISOString();
      const db = getFirestore();
      const weightLogRef = collection(db, 'users', user?.uid || '', 'weightLog');
      await addDoc(weightLogRef, {
        weight,
        date,
        notes: ''
      });
      setWeightToLog('');
      setWeightLogModalVisible(false);
      // Refresh the weight log
      await loadWeightLog();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Also update the calendar
      await loadAllHistory();
    } catch (error) {
      console.error("Error logging weight:", error);
      Alert.alert('Error', 'Failed to log weight. Please try again.');
    }
  }
  const saveUsername = async (): Promise<void> => {
    if (!isOnline) {
      Alert.alert('Error', 'You are offline. Cannot save username.');
      return;
    }
    if (!usernameInput.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user?.uid || '');
      await updateDoc(userDocRef, {
        username: usernameInput.trim()
      });
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          username: usernameInput.trim()
        });
      }
      setEditingUsername(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error updating username:", error);
      Alert.alert('Error', 'Failed to update username. Please try again.');
    }
  };
  const handleSelectGoal = (goalId: string): void => {
    if (!isOnline) {
      Alert.alert('Error', 'You are offline. Cannot select goal.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Update the goal both in context and Firestore
    setGoal(goalId);
    setUserGoal(goalId);
    setGoalSelectionVisible(false);
    // Also update the local profile state
    if (profile) {
      setProfile({
        ...profile,
        goal: goalId
      });
    }
    // Update in Firestore
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user?.uid || '');
      updateDoc(userDocRef, {
        goal: goalId
      });
    } catch (error) {
      console.error("Error updating goal:", error);
      // We don't show an alert here as this is a non-critical operation
    }
  };
  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };
  const handleScroll = (event: any): void => {
    const scrollOffset = event.nativeEvent.contentOffset.y;
    scrollY.setValue(scrollOffset);
  };
  // Handle reduced motion toggle
  const handleReducedMotionToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReducedMotion(value);
  };
  // Handle theme mode selection
  const handleThemeModeSelection = () => {
    Alert.alert(
      'Theme Mode',
      'Choose your preferred theme mode',
      [
        {
          text: 'System',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setThemeMode('system');
          }
        },
        {
          text: 'Light',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setThemeMode('light');
          }
        },
        {
          text: 'Dark',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setThemeMode('dark');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };
  // Render settings section
  const renderSettingsSection = () => {
    return (
      <Card style={styles.settingsCard}>
        <Text variant="heading3" style={styles.sectionTitle}>Settings</Text>
        
        {/* Theme Mode Selection */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleThemeModeSelection}
          activeOpacity={0.7}
        >
          <View style={styles.settingLabelContainer}>
            <Ionicons 
              name={exerciseDarkMode ? "moon" : "sunny"} 
              size={24} 
              color={exerciseDarkMode ? Colors.accentPurple : Colors.accentOrange} 
              style={styles.settingIcon} 
            />
            <View>
              <Text variant="body">Theme Mode</Text>
              <Text variant="bodySmall" style={{color: theme.textSecondary}}>
                {themeMode === 'system' ? 'System default' : 
                 themeMode === 'dark' ? 'Dark mode' : 'Light mode'}
              </Text>
            </View>
          </View>
          <View style={styles.settingValueContainer}>
            <Text variant="bodySmall" style={{color: theme.textSecondary}}>
              {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
        
        {/* Reduced Motion Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Ionicons 
              name="accessibility-outline" 
              size={24} 
              color={Colors.secondaryGreen} 
              style={styles.settingIcon} 
            />
            <View>
              <Text variant="body">Reduced Motion</Text>
              <Text variant="bodySmall" style={{color: theme.textSecondary}}>
                Minimize animations for accessibility
              </Text>
            </View>
          </View>
          <Switch
            value={reducedMotion}
            onValueChange={handleReducedMotionToggle}
            trackColor={{ false: '#767577', true: Colors.secondaryGreen + '80' }}
            thumbColor={reducedMotion ? Colors.secondaryGreen : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
        
        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Sign Out',
                  onPress: () => logout(),
                  style: 'destructive',
                },
              ]
            );
          }}
          type="danger"
          icon="log-out-outline"
          style={styles.logoutButton}
        />
        
        {/* Delete Account Button */}
        <Button
          title="Delete Account"
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  onPress: () => deleteAccount(),
                  style: 'destructive',
                },
              ]
            );
          }}
          type="tertiary"
          icon="trash-outline"
          style={styles.deleteAccountButton}
        />
      </Card>
    );
  };
  // A simplified render implementation for now, to be completed later
  return (
    <Container>
      {/* Header Background with Gradient */}
      <Animated.View
        style={[
          styles.headerBackground,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerAnimatedOpacity,
            height: headerHeight
          }
        ]}
      >
        <LinearGradient
          colors={[Colors.primaryBlue, Colors.primaryDarkBlue]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Blur Overlay for Scrolling Effect */}
        {Platform.OS === 'ios' && (
          <Animated.View style={[styles.blurOverlay, { opacity: blurAnimatedOpacity }]}>
            <BlurView 
              intensity={15} 
              tint={darkMode ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill} 
            />
          </Animated.View>
        )}
      </Animated.View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryBlue}
            colors={[Colors.primaryBlue]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="refresh" size={40} color={Colors.primaryBlue} />
            </Animated.View>
            <Text variant="body" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
              Loading profile...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={50} color={Colors.accentDanger} />
            <Text variant="body" style={{ marginTop: Spacing.md, textAlign: 'center', color: theme.textSecondary }}>
              {error}
            </Text>
            <Button
              title="Try Again"
              onPress={loadProfileData}
              type="primary"
              size="medium"
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        ) : (
          <Animated.View style={{ opacity: contentOpacity }}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
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
                  <View style={[styles.profileImage, styles.profilePlaceholder]}>
                    <Text variant="heading2" style={{ color: '#FFFFFF' }}>
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.editImageButton}
                  onPress={() => {
                    // Image picking functionality will go here
                  }}
                >
                  <Ionicons name="camera" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
              <View style={styles.usernameContainer}>
                {editingUsername ? (
                  <View style={styles.usernameEditContainer}>
                    <TextInput
                      style={[
                        styles.usernameInput,
                        { color: '#FFFFFF' }
                      ]}
                      value={usernameInput}
                      onChangeText={setUsernameInput}
                      placeholder="Enter username"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.usernameButtonsContainer}>
                      <TouchableOpacity
                        style={styles.usernameCancelButton}
                        onPress={() => {
                          setEditingUsername(false);
                          setUsernameInput(profile?.username || '');
                        }}
                      >
                        <Ionicons name="close" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.usernameSaveButton}
                        onPress={saveUsername}
                      >
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.usernameTouchable}
                    onPress={() => setEditingUsername(true)}
                  >
                    <Text variant="heading2" style={{ color: '#FFFFFF' }}>
                      {profile?.username || 'Username'}
                    </Text>
                    <Ionicons name="pencil" size={20} color="rgba(255, 255, 255, 0.8)" style={{ marginLeft: 10 }} />
                  </TouchableOpacity>
                )}
                <Text variant="body" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {profile?.email || ''}
                </Text>
              </View>
            </View>
            
            {/* Profile Body Content */}
            <View style={styles.bodyContent}>
              {renderSettingsSection()}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </Container>
  );
};
// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xxl,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    zIndex: -1,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    minHeight: 300,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    minHeight: 300,
  },
  profileHeader: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profilePlaceholder: {
    backgroundColor: Colors.primaryDarkBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  usernameContainer: {
    alignItems: 'center',
  },
  usernameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  usernameEditContainer: {
    width: '100%',
    maxWidth: 280,
  },
  usernameInput: {
    height: 48,
    fontSize: Typography.subtitle.fontSize,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.3)',
  },
  usernameButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  usernameCancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.sm,
  },
  usernameSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentSuccess,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.sm,
  },
  bodyContent: {
    paddingHorizontal: Spacing.lg,
  },
  // New styles for settings
  settingsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  logoutButton: {
    marginTop: Spacing.xl,
  },
  deleteAccountButton: {
    marginTop: Spacing.md,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
export default ProfileScreen; 