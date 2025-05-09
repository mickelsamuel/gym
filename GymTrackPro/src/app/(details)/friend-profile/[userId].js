import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import FriendProfileScreen from '../../../screens/FriendProfileScreen';

export default function FriendProfile() {
  const { userId } = useLocalSearchParams();
  
  return <FriendProfileScreen userId={userId} />;
} 