import { collection, getDocs, query, where, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { BaseDatabaseService } from './BaseDatabaseService';
import { db, FIREBASE_PATHS, firebaseFirestore } from '../firebase';
import { ApiResponse, Friend, FriendRequest } from '../../types/globalTypes';
import { StorageKeys } from '../../constants';
import { validateFriendRequest, validateFriend } from '../../utils/sanitize';
import { logError } from '../../utils/logging';

/**
 * Service for friend-related database operations
 */
export class FriendDatabaseService extends BaseDatabaseService {
  // Cache keys
  private readonly FRIENDS_CACHE_KEY = 'friends';
  private readonly FRIEND_REQUESTS_CACHE_KEY = 'friendRequests';
  
  /**
   * Get friends for a user
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with friends
   */
  async getFriends(userId: string, isOnline: boolean): Promise<ApiResponse<Friend[]>> {
    return this.executeOperation(
      async () => {
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        const cacheKey = `${this.FRIENDS_CACHE_KEY}:${userId}`;
        
        // Try to get from cache first
        const cachedFriends = this.getFromCache<Friend[]>(cacheKey);
        if (cachedFriends) {
          return cachedFriends;
        }
        
        // If online, try to fetch from Firestore
        if (isOnline && this.isFirebaseAvailable) {
          this.checkOnlineStatus(isOnline);
          
          try {
            const friends = await firebaseFirestore.getCollection<Friend>(
              FIREBASE_PATHS.FRIENDS,
              [{ field: 'userId', operator: '==', value: userId }]
            );
            
            // Cache the friends
            this.addToCache(cacheKey, friends);
            
            // Also save locally for offline access
            const storedFriends = await this.getFromStorage<Record<string, Friend[]>>(StorageKeys.FRIEND_LIST) || {};
            storedFriends[userId] = friends;
            await this.saveToStorage(StorageKeys.FRIEND_LIST, storedFriends);
            
            return friends;
          } catch (error) {
            console.warn('Failed to fetch friends from Firestore, falling back to local data:', error);
            logError('fetch_friends_error', { userId, error });
          }
        }
        
        // If offline or Firestore failed, use locally stored data
        try {
          const storedFriends = await this.getFromStorage<Record<string, Friend[]>>(StorageKeys.FRIEND_LIST);
          const userFriends = storedFriends && storedFriends[userId] ? storedFriends[userId] : [];
          
          // Cache the friends
          this.addToCache(cacheKey, userFriends);
          
          return userFriends;
        } catch (error) {
          console.error('Error loading friend data:', error);
          logError('load_friends_error', { userId, error });
          return [];
        }
      },
      'get_friends_error',
      'Failed to retrieve friends'
    );
  }
  
  /**
   * Send friend request
   * @param fromUserId Sender user ID
   * @param toUserId Recipient user ID
   * @param username Sender username
   * @param photoUrl Sender photo URL (optional)
   * @param isOnline Current online status
   * @returns API response with friend request
   */
  async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
    username: string,
    photoUrl: string | undefined,
    isOnline: boolean
  ): Promise<ApiResponse<FriendRequest>> {
    return this.executeOperation(
      async () => {
        if (!fromUserId || !toUserId || !username) {
          throw new Error('Sender ID, recipient ID, and username are required');
        }
        
        // Check if users are already friends
        const friendsResponse = await this.getFriends(fromUserId, isOnline);
        if (friendsResponse.success && friendsResponse.data) {
          const existingFriend = friendsResponse.data.find(f => f.friendId === toUserId);
          if (existingFriend) {
            throw new Error('Users are already friends');
          }
        }
        
        // Check if there's already a pending request
        const requestsResponse = await this.getSentFriendRequests(fromUserId, isOnline);
        if (requestsResponse.success && requestsResponse.data) {
          const existingRequest = requestsResponse.data.find(r => 
            r.toUid === toUserId && r.status === 'pending'
          );
          if (existingRequest) {
            throw new Error('A friend request is already pending');
          }
        }
        
        // Create friend request
        const friendRequest: FriendRequest = {
          fromUid: fromUserId,
          fromUsername: username,
          fromPhotoUrl: photoUrl,
          toUid: toUserId,
          sentAt: serverTimestamp(),
          status: 'pending'
        };
        
        // Validate request
        const validationErrors = validateFriendRequest(friendRequest);
        if (validationErrors.length > 0) {
          throw new Error(`Friend request validation failed: ${validationErrors.join(', ')}`);
        }
        
        // If online, send to Firestore
        if (isOnline && this.isFirebaseAvailable) {
          this.checkOnlineStatus(isOnline);
          
          const requestId = await firebaseFirestore.addDocument(FIREBASE_PATHS.FRIEND_REQUESTS, friendRequest);
          
          // Get the created request with ID
          const createdRequest = {
            ...friendRequest,
            id: requestId
          };
          
          // Update caches and local storage
          this.updateFriendRequestCaches(fromUserId, toUserId, createdRequest);
          
          return createdRequest;
        }
        
        throw new Error('Cannot send friend request while offline');
      },
      'send_friend_request_error',
      'Failed to send friend request'
    );
  }
  
  /**
   * Get received friend requests
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with friend requests
   */
  async getReceivedFriendRequests(userId: string, isOnline: boolean): Promise<ApiResponse<FriendRequest[]>> {
    return this.executeOperation(
      async () => {
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        const cacheKey = `${this.FRIEND_REQUESTS_CACHE_KEY}:received:${userId}`;
        
        // Try to get from cache first
        const cachedRequests = this.getFromCache<FriendRequest[]>(cacheKey);
        if (cachedRequests) {
          return cachedRequests;
        }
        
        // If online, try to fetch from Firestore
        if (isOnline && this.isFirebaseAvailable) {
          this.checkOnlineStatus(isOnline);
          
          try {
            const requests = await firebaseFirestore.getCollection<FriendRequest>(
              FIREBASE_PATHS.FRIEND_REQUESTS,
              [
                { field: 'toUid', operator: '==', value: userId },
                { field: 'status', operator: '==', value: 'pending' }
              ]
            );
            
            // Cache the requests
            this.addToCache(cacheKey, requests);
            
            return requests;
          } catch (error) {
            console.warn('Failed to fetch received friend requests from Firestore:', error);
            logError('fetch_received_requests_error', { userId, error });
          }
        }
        
        // If offline or Firestore failed, just return empty array
        // Friend requests should only be accessible when online
        return [];
      },
      'get_received_requests_error',
      'Failed to retrieve received friend requests'
    );
  }
  
  /**
   * Get sent friend requests
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response with sent friend requests
   */
  async getSentFriendRequests(userId: string, isOnline: boolean): Promise<ApiResponse<FriendRequest[]>> {
    return this.executeOperation(
      async () => {
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        const cacheKey = `${this.FRIEND_REQUESTS_CACHE_KEY}:sent:${userId}`;
        
        // Try to get from cache first
        const cachedRequests = this.getFromCache<FriendRequest[]>(cacheKey);
        if (cachedRequests) {
          return cachedRequests;
        }
        
        // If online, try to fetch from Firestore
        if (isOnline && this.isFirebaseAvailable) {
          this.checkOnlineStatus(isOnline);
          
          try {
            const requests = await firebaseFirestore.getCollection<FriendRequest>(
              FIREBASE_PATHS.FRIEND_REQUESTS,
              [
                { field: 'fromUid', operator: '==', value: userId },
                { field: 'status', operator: '==', value: 'pending' }
              ]
            );
            
            // Cache the requests
            this.addToCache(cacheKey, requests);
            
            return requests;
          } catch (error) {
            console.warn('Failed to fetch sent friend requests from Firestore:', error);
            logError('fetch_sent_requests_error', { userId, error });
          }
        }
        
        // If offline or Firestore failed, just return empty array
        // Friend requests should only be accessible when online
        return [];
      },
      'get_sent_requests_error',
      'Failed to retrieve sent friend requests'
    );
  }
  
  /**
   * Accept friend request
   * @param requestId Request ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async acceptFriendRequest(requestId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.executeOperation(
      async () => {
        if (!requestId || !userId) {
          throw new Error('Request ID and user ID are required');
        }
        
        if (!isOnline || !this.isFirebaseAvailable) {
          throw new Error('Cannot accept friend request while offline');
        }
        
        this.checkOnlineStatus(isOnline);
        
        // Get the request
        const request = await firebaseFirestore.getDocument<FriendRequest>(FIREBASE_PATHS.FRIEND_REQUESTS, requestId);
        
        if (!request) {
          throw new Error('Friend request not found');
        }
        
        // Validate that the request is to this user
        if (request.toUid !== userId) {
          throw new Error('Friend request is not addressed to this user');
        }
        
        // Check if the request is pending
        if (request.status !== 'pending') {
          throw new Error('Friend request has already been processed');
        }
        
        // Update the request status to 'accepted'
        await firebaseFirestore.updateDocument(FIREBASE_PATHS.FRIEND_REQUESTS, requestId, {
          status: 'accepted',
          updatedAt: serverTimestamp()
        });
        
        // Create friend records for both users
        const fromUserFriend: Friend = {
          userId: request.fromUid,
          friendId: userId,
          username: request.toUsername || 'Unknown',
          createdAt: serverTimestamp()
        };
        
        const toUserFriend: Friend = {
          userId: userId,
          friendId: request.fromUid,
          username: request.fromUsername,
          profilePic: request.fromPhotoUrl,
          createdAt: serverTimestamp()
        };
        
        // Add both friend records to Firestore
        await firebaseFirestore.addDocument(FIREBASE_PATHS.FRIENDS, fromUserFriend);
        await firebaseFirestore.addDocument(FIREBASE_PATHS.FRIENDS, toUserFriend);
        
        // Invalidate friend caches for both users
        this.invalidateCache(`${this.FRIENDS_CACHE_KEY}:${request.fromUid}`);
        this.invalidateCache(`${this.FRIENDS_CACHE_KEY}:${userId}`);
        
        // Invalidate request caches
        this.invalidateCache(`${this.FRIEND_REQUESTS_CACHE_KEY}:received:${userId}`);
        this.invalidateCache(`${this.FRIEND_REQUESTS_CACHE_KEY}:sent:${request.fromUid}`);
        
        return true;
      },
      'accept_friend_request_error',
      'Failed to accept friend request'
    );
  }
  
  /**
   * Reject friend request
   * @param requestId Request ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async rejectFriendRequest(requestId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.executeOperation(
      async () => {
        if (!requestId || !userId) {
          throw new Error('Request ID and user ID are required');
        }
        
        if (!isOnline || !this.isFirebaseAvailable) {
          throw new Error('Cannot reject friend request while offline');
        }
        
        this.checkOnlineStatus(isOnline);
        
        // Get the request
        const request = await firebaseFirestore.getDocument<FriendRequest>(FIREBASE_PATHS.FRIEND_REQUESTS, requestId);
        
        if (!request) {
          throw new Error('Friend request not found');
        }
        
        // Validate that the request is to this user
        if (request.toUid !== userId) {
          throw new Error('Friend request is not addressed to this user');
        }
        
        // Check if the request is pending
        if (request.status !== 'pending') {
          throw new Error('Friend request has already been processed');
        }
        
        // Update the request status to 'rejected'
        await firebaseFirestore.updateDocument(FIREBASE_PATHS.FRIEND_REQUESTS, requestId, {
          status: 'rejected',
          updatedAt: serverTimestamp()
        });
        
        // Invalidate request caches
        this.invalidateCache(`${this.FRIEND_REQUESTS_CACHE_KEY}:received:${userId}`);
        this.invalidateCache(`${this.FRIEND_REQUESTS_CACHE_KEY}:sent:${request.fromUid}`);
        
        return true;
      },
      'reject_friend_request_error',
      'Failed to reject friend request'
    );
  }
  
  /**
   * Remove friend
   * @param friendshipId Friendship ID
   * @param userId User ID
   * @param isOnline Current online status
   * @returns API response indicating success or failure
   */
  async removeFriend(friendshipId: string, userId: string, isOnline: boolean): Promise<ApiResponse<boolean>> {
    return this.executeOperation(
      async () => {
        if (!friendshipId || !userId) {
          throw new Error('Friendship ID and user ID are required');
        }
        
        if (!isOnline || !this.isFirebaseAvailable) {
          throw new Error('Cannot remove friend while offline');
        }
        
        this.checkOnlineStatus(isOnline);
        
        // Get the friendship record
        const friendship = await firebaseFirestore.getDocument<Friend>(FIREBASE_PATHS.FRIENDS, friendshipId);
        
        if (!friendship) {
          throw new Error('Friendship not found');
        }
        
        // Validate that this friendship belongs to the user
        if (friendship.userId !== userId) {
          throw new Error('Friendship does not belong to this user');
        }
        
        // Delete this friendship record
        await firebaseFirestore.deleteDocument(FIREBASE_PATHS.FRIENDS, friendshipId);
        
        // Find and delete the reciprocal friendship record
        const reciprocalFriendships = await firebaseFirestore.getCollection<Friend>(
          FIREBASE_PATHS.FRIENDS,
          [
            { field: 'userId', operator: '==', value: friendship.friendId },
            { field: 'friendId', operator: '==', value: userId }
          ]
        );
        
        if (reciprocalFriendships && reciprocalFriendships.length > 0) {
          for (const reciprocal of reciprocalFriendships) {
            if (reciprocal.id) {
              await firebaseFirestore.deleteDocument(FIREBASE_PATHS.FRIENDS, reciprocal.id);
            }
          }
        }
        
        // Invalidate friend caches for both users
        this.invalidateCache(`${this.FRIENDS_CACHE_KEY}:${userId}`);
        this.invalidateCache(`${this.FRIENDS_CACHE_KEY}:${friendship.friendId}`);
        
        return true;
      },
      'remove_friend_error',
      'Failed to remove friend'
    );
  }
  
  /**
   * Update friend request caches
   * @param fromUserId Sender user ID
   * @param toUserId Recipient user ID
   * @param request Friend request
   */
  private updateFriendRequestCaches(fromUserId: string, toUserId: string, request: FriendRequest): void {
    // Update sent requests cache
    const sentCacheKey = `${this.FRIEND_REQUESTS_CACHE_KEY}:sent:${fromUserId}`;
    const sentRequests = this.getFromCache<FriendRequest[]>(sentCacheKey) || [];
    this.addToCache(sentCacheKey, [...sentRequests, request]);
    
    // Update received requests cache
    const receivedCacheKey = `${this.FRIEND_REQUESTS_CACHE_KEY}:received:${toUserId}`;
    const receivedRequests = this.getFromCache<FriendRequest[]>(receivedCacheKey) || [];
    this.addToCache(receivedCacheKey, [...receivedRequests, request]);
  }
} 