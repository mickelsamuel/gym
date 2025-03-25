// screens/SocialScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export default function SocialScreen() {
  const { user } = useContext(AuthContext);
  const [myProfile, setMyProfile] = useState(null);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMyProfile = async () => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setMyProfile(snap.data());
    }
  };

  useEffect(() => {
    loadMyProfile();
  }, [user]);

  const handleSearch = async () => {
    setLoading(true);
    setSearchResults([]);
    try {
      const ref = collection(db, 'users');
      // search by username
      const q = query(ref, where('username', '==', searchUsername));
      const qsnap = await getDocs(q);
      const results = [];
      qsnap.forEach((docSnap) => {
        // skip yourself
        if (docSnap.id !== user.uid) {
          results.push(docSnap.data());
        }
      });
      setSearchResults(results);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  const handleAddFriend = async (friendUid) => {
    try {
      if (!myProfile) return;
      const myRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendUid);

      // Add each other to friends array, or you can do friend requests etc.
      // We'll do a naive approach (immediate add):
      const myFriends = myProfile.friends || [];
      if (!myFriends.includes(friendUid)) {
        await updateDoc(myRef, {
          friends: [...myFriends, friendUid],
        });
      }
      Alert.alert('Friend added!');
      loadMyProfile();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderFriend = ({ item }) => (
    <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#ccc' }}>
      <Text>{item}</Text>
    </View>
  );

  const renderSearchResult = ({ item }) => (
    <View style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: '#ccc', justifyContent: 'space-between' }}>
      <Text>{item.username}</Text>
      <TouchableOpacity onPress={() => handleAddFriend(item.uid)}>
        <Text style={{ color: 'blue' }}>Add Friend</Text>
      </TouchableOpacity>
    </View>
  );

  if (!myProfile) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>My Friends</Text>
      {myProfile.friends && myProfile.friends.length > 0 ? (
        <FlatList
          data={myProfile.friends}
          keyExtractor={(item) => item}
          renderItem={renderFriend}
        />
      ) : (
        <Text>No friends yet.</Text>
      )}

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Find Users</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
          placeholder="Username"
          value={searchUsername}
          onChangeText={setSearchUsername}
        />
        <TouchableOpacity
          style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' }}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {loading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {searchResults.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.uid}
            renderItem={renderSearchResult}
          />
        </View>
      )}
    </View>
  );
}