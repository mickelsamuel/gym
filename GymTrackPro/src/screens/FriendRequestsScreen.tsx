import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  StatusBar,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  ImageStyle
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  collection,
  query,
  limit,
  getDocs
} from 'firebase/firestore';
import { ExerciseContext } from '../context/ExerciseContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Theme, Typography, Spacing, BorderRadius, createElevation } from '../constants/Theme';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/NavigationTypes';
import { format, formatDistance, formatRelative } from 'date-fns';

import { 
  Text, 
  Button, 
  Card, 
  Container,
  FadeIn,
} from '../components/ui';

// Simple SlideIn animation component
const SlideIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
    >
      {children}
    </Animated.View>
  );
};

// Types and interfaces
interface FriendRequest {
  fromUid: string;
  fromName: string;
  fromPhotoUrl: string | null;
  sentAt: string;
}

interface SentRequest {
  toUid: string;
  toName: string;
  toPhotoUrl: string | null;
  sentAt: string;
}

interface FriendSuggestion {
  uid: string;
  username: string;
  profilePic: string | null;
  reason: string;
}

interface UserProfile {
  username?: string;
  profilePic?: string | null;
  friends?: string[];
  friendRequests?: FriendRequest[];
  sentRequests?: SentRequest[];
}

// Add formatRelativeTime function
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  return formatDistance(date, new Date(), { addSuffix: true });
};

const FriendRequestsScreen: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ExerciseContext);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // State
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Theme
  const theme = darkMode ? Theme.dark : Theme.light;
  // Define custom colors not in theme
  const customColors = {
    error: Colors.accentDanger,
    textLight: '#FFFFFF'
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    
    loadRequests();
    loadSuggestions();
  }, []);

  async function loadRequests(): Promise<void> {
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const myRef = doc(db, 'users', user.uid);
      const snap = await getDoc(myRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setMyProfile(data);
        setRequests(data.friendRequests || []);
        setSentRequests(data.sentRequests || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load friend requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSuggestions(): Promise<void> {
    if (!user) return;
    
    try {
      // This would normally be a more sophisticated algorithm based on mutual friends,
      // similar workout preferences, etc. For now, we'll just grab some random users.
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(5));
      const querySnapshot = await getDocs(q);
      
      let suggestionList: FriendSuggestion[] = [];
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        // Don't suggest the current user or people they're already friends with
        if (doc.id !== user.uid && 
            (!myProfile?.friends || !myProfile.friends.includes(doc.id)) &&
            (!sentRequests || !sentRequests.some(req => req.toUid === doc.id))) {
          suggestionList.push({
            uid: doc.id,
            username: userData.username || 'User',
            profilePic: userData.profilePic || null,
            reason: 'Similar workout interests'
          });
        }
      });
      
      setSuggestions(suggestionList);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }

  async function acceptRequest(request: FriendRequest): Promise<void> {
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingIds(prev => [...prev, request.fromUid]);
    
    try {
      const myRef = doc(db, 'users', user.uid);
      const theirRef = doc(db, 'users', request.fromUid);
      
      const [mySnap, theirSnap] = await Promise.all([
        getDoc(myRef),
        getDoc(theirRef)
      ]);
      
      if (!mySnap.exists() || !theirSnap.exists()) {
        Alert.alert('Error', 'User data could not be found.');
        setProcessingIds(prev => prev.filter(id => id !== request.fromUid));
        return;
      }
      
      const myData = mySnap.data() as UserProfile;
      const theirData = theirSnap.data() as UserProfile;
      const myFriends = myData.friends || [];
      const theirFriends = theirData.friends || [];
      
      await updateDoc(myRef, {
        friendRequests: arrayRemove(request),
        friends: myFriends.includes(request.fromUid)
          ? myFriends
          : [...myFriends, request.fromUid]
      });
      
      await updateDoc(theirRef, {
        friends: theirFriends.includes(user.uid)
          ? theirFriends
          : [...theirFriends, user.uid]
      });
      
      loadRequests();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
      setProcessingIds(prev => prev.filter(id => id !== request.fromUid));
    }
  }

  async function rejectRequest(request: FriendRequest): Promise<void> {
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProcessingIds(prev => [...prev, request.fromUid]);
    
    try {
      const myRef = doc(db, 'users', user.uid);
      await updateDoc(myRef, {
        friendRequests: arrayRemove(request)
      });
      
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request. Please try again.');
      setProcessingIds(prev => prev.filter(id => id !== request.fromUid));
    }
  }

  async function cancelSentRequest(request: SentRequest): Promise<void> {
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProcessingIds(prev => [...prev, request.toUid]);
    
    try {
      const myRef = doc(db, 'users', user.uid);
      await updateDoc(myRef, {
        sentRequests: arrayRemove(request)
      });
      
      // Also remove the request from the recipient's friendRequests
      const theirRef = doc(db, 'users', request.toUid);
      const theirSnap = await getDoc(theirRef);
      
      if (theirSnap.exists()) {
        const theirData = theirSnap.data() as UserProfile;
        const theirRequests = theirData.friendRequests || [];
        
        const requestToRemove = theirRequests.find(req => req.fromUid === user.uid);
        if (requestToRemove) {
          await updateDoc(theirRef, {
            friendRequests: arrayRemove(requestToRemove)
          });
        }
      }
      
      loadRequests();
    } catch (error) {
      console.error('Error canceling request:', error);
      Alert.alert('Error', 'Failed to cancel request. Please try again.');
      setProcessingIds(prev => prev.filter(id => id !== request.toUid));
    }
  }

  async function sendRequest(suggestion: FriendSuggestion): Promise<void> {
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingIds(prev => [...prev, suggestion.uid]);
    
    try {
      const myRef = doc(db, 'users', user.uid);
      const mySnap = await getDoc(myRef);
      const myData = mySnap.data() as UserProfile;
      
      const request: FriendRequest = {
        fromUid: user.uid,
        fromName: myData.username || 'User',
        fromPhotoUrl: myData.profilePic || null,
        sentAt: new Date().toISOString()
      };
      
      const sentRequest: SentRequest = {
        toUid: suggestion.uid,
        toName: suggestion.username,
        toPhotoUrl: suggestion.profilePic,
        sentAt: new Date().toISOString()
      };
      
      // Add to recipient's friend requests
      const theirRef = doc(db, 'users', suggestion.uid);
      await updateDoc(theirRef, {
        friendRequests: arrayUnion(request)
      });
      
      // Add to my sent requests
      await updateDoc(myRef, {
        sentRequests: arrayUnion(sentRequest)
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadRequests();
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.uid !== suggestion.uid));
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to send request. Please try again.');
      setProcessingIds(prev => prev.filter(id => id !== suggestion.uid));
    }
  }

  const renderRequest = ({ item, index }: { item: FriendRequest; index: number }) => {
    return (
      <SlideIn delay={index * 100}>
        <Card 
          style={{
            marginBottom: 12,
            backgroundColor: theme.card
          }}
        >
          <View style={styles.requestItem}>
            <TouchableOpacity
              onPress={() => navigation.navigate('FriendProfileScreen', { userId: item.fromUid })}
              style={styles.userInfo}
            >
              <View style={styles.avatarContainer}>
                {item.fromPhotoUrl ? (
                  <Image source={{ uri: item.fromPhotoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}>
                    <Ionicons name="person" size={24} color={theme.textSecondary} />
                  </View>
                )}
              </View>
              <View style={styles.nameContainer}>
                <Text 
                  variant="subtitle" 
                  style={{ 
                    color: theme.text, 
                    marginBottom: 2
                  }}
                >
                  {item.fromName}
                </Text>
                <Text 
                  variant="caption" 
                  style={{ 
                    color: theme.textSecondary 
                  }}
                >
                  Sent request {formatRelativeTime(item.sentAt)}
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => rejectRequest(item)}
                disabled={processingIds.includes(item.fromUid)}
              >
                <Text style={{ color: theme.textSecondary }}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => acceptRequest(item)}
                disabled={processingIds.includes(item.fromUid)}
              >
                <Text style={{ color: theme.primary }}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </SlideIn>
    );
  };

  const renderSentRequest = ({ item, index }: { item: SentRequest; index: number }) => {
    return (
      <SlideIn delay={index * 100}>
        <Card 
          style={{
            marginBottom: 12,
            backgroundColor: theme.card
          }}
        >
          <View style={styles.requestItem}>
            <TouchableOpacity
              onPress={() => navigation.navigate('FriendProfileScreen', { userId: item.toUid })}
              style={styles.userInfo}
            >
              <View style={styles.avatarContainer}>
                {item.toPhotoUrl ? (
                  <Image source={{ uri: item.toPhotoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}>
                    <Ionicons name="person" size={24} color={theme.textSecondary} />
                  </View>
                )}
              </View>
              <View style={styles.nameContainer}>
                <Text 
                  variant="subtitle" 
                  style={{ 
                    color: theme.text, 
                    marginBottom: 2
                  }}
                >
                  {item.toName}
                </Text>
                <Text 
                  variant="caption" 
                  style={{ 
                    color: theme.textSecondary 
                  }}
                >
                  Request sent {formatRelativeTime(item.sentAt)}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => cancelSentRequest(item)}
              disabled={processingIds.includes(item.toUid)}
            >
              <Text style={{ color: customColors.error }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </SlideIn>
    );
  };

  const renderSuggestion = ({ item, index }: { item: FriendSuggestion; index: number }) => {
    return (
      <SlideIn delay={index * 100}>
        <Card 
          style={{
            marginBottom: 12,
            backgroundColor: theme.card
          }}
        >
          <View style={styles.requestItem}>
            <TouchableOpacity
              onPress={() => navigation.navigate('FriendProfileScreen', { userId: item.uid })}
              style={styles.userInfo}
            >
              <View style={styles.avatarContainer}>
                {item.profilePic ? (
                  <Image source={{ uri: item.profilePic }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}>
                    <Ionicons name="person" size={24} color={theme.textSecondary} />
                  </View>
                )}
              </View>
              <View style={styles.nameContainer}>
                <Text 
                  variant="subtitle" 
                  style={{ 
                    color: theme.text, 
                    marginBottom: 2
                  }}
                >
                  {item.username}
                </Text>
                <Text 
                  variant="caption" 
                  style={{ 
                    color: theme.textSecondary 
                  }}
                >
                  {item.reason}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => sendRequest(item)}
              disabled={processingIds.includes(item.uid)}
            >
              <Text style={{ color: theme.primary }}>Connect</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </SlideIn>
    );
  };

  return (
    <Container>
      <StatusBar 
        barStyle={darkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background} 
      />
      
      <View 
        style={[
          styles.header, 
          { 
            backgroundColor: theme.background,
            paddingTop: insets.top + Spacing.md,
            borderBottomColor: theme.border
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text 
          variant="heading3" 
          style={{ 
            color: theme.text,
            flex: 1,
            textAlign: 'center'
          }}
        >
          Friend Requests
        </Text>
        
        <View style={styles.placeholderButton} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : requests.length === 0 && sentRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons 
            name="people" 
            size={80} 
            color={`${theme.textSecondary}50`} 
          />
          <Text 
            variant="body" 
            style={{ 
              color: theme.textSecondary,
              textAlign: 'center',
              marginTop: Spacing.md,
              marginBottom: Spacing.md
            }}
          >
            You don't have any friend requests at the moment.
          </Text>
          <Button
            title="Find Friends"
            type="primary"
            onPress={() => navigation.goBack()}
          />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          ListHeaderComponent={
            <>
              {requests.length > 0 && (
                <View style={styles.section}>
                  <Text 
                    variant="heading3" 
                    style={{
                      ...styles.sectionTitle,
                      color: theme.text
                    }}
                  >
                    Requests
                  </Text>
                  
                  <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.fromUid}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {sentRequests.length > 0 && (
                <View style={styles.section}>
                  <Text 
                    variant="heading3" 
                    style={{
                      ...styles.sectionTitle,
                      color: theme.text
                    }}
                  >
                    Sent Requests
                  </Text>
                  
                  <FlatList
                    data={sentRequests}
                    renderItem={renderSentRequest}
                    keyExtractor={(item) => item.toUid}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {suggestions.length > 0 && (
                <View style={styles.section}>
                  <Text 
                    variant="heading3" 
                    style={{
                      ...styles.sectionTitle,
                      color: theme.text
                    }}
                  >
                    People You May Know
                  </Text>
                  
                  <FlatList
                    data={suggestions}
                    renderItem={renderSuggestion}
                    keyExtractor={(item) => item.uid}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </>
          }
          style={{ flex: 1 }}
          contentContainerStyle={[
            { padding: Spacing.lg },
            insets.bottom > 0 ? { paddingBottom: insets.bottom + Spacing.lg } : {}
          ]}
          keyExtractor={(_, index) => `request-${index}`}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    ...createElevation(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderButton: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  requestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  requestInfo: {
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  acceptButton: {
    marginRight: Spacing.xs,
  },
  rejectButton: {},
  cancelButton: {},
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  nameContainer: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectButton: {
    marginLeft: Spacing.md,
  },
});

export default FriendRequestsScreen; 