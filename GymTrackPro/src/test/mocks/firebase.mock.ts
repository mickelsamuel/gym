// firebase.mock.ts - Mock implementation of Firebase for testing

const mockUserData: Record<string, any> = {};
const mockFirestoreData: Record<string, Record<string, any>> = {
  users: {},
  workoutHistory: {},
  weightLog: {},
  exercises: {},
  friends: {},
  friendRequests: {}
};

// Add nested collection storage
// Export this to make it accessible in tests
export const mockNestedCollections: Record<string, Record<string, any>> = {};

export class MockFirebase {
  private static errorOperations: {[key: string]: {collection: string, docId: string}[]} = {};
  
  /**
   * Configure the mock to throw an error for a specific operation
   * @param operation The operation name (e.g., 'setDocument', 'getDocument')
   * @param collection The collection path
   * @param docId The document ID
   */
  public static setErrorOnOperation(operation: string, collection: string, docId: string): void {
    if (!this.errorOperations[operation]) {
      this.errorOperations[operation] = [];
    }
    
    // For testing sync errors, make sure we cover multiple operations
    if (operation === 'setDocument' && collection === 'workoutHistory') {
      this.errorOperations['addDocument'] = this.errorOperations['addDocument'] || [];
      this.errorOperations['addDocument'].push({ collection, docId });
      this.errorOperations['updateDocument'] = this.errorOperations['updateDocument'] || [];
      this.errorOperations['updateDocument'].push({ collection, docId });
    }
    
    this.errorOperations[operation].push({ collection, docId });
  }
  
  /**
   * Check if an operation should throw an error
   * @param operation The operation name
   * @param collection The collection path
   * @param docId The document ID
   * @returns True if the operation should throw an error
   */
  public static shouldThrowError(operation: string, collection: string, docId: string): boolean {
    const operations = this.errorOperations[operation];
    if (!operations) return false;
    
    return operations.some(op => op.collection === collection && op.docId === docId);
  }
  
  /**
   * Reset all error operations
   */
  public static resetErrors(): void {
    this.errorOperations = {};
  }
  
  static setup() {
    // Reset mock data
    Object.keys(mockFirestoreData).forEach(collection => {
      mockFirestoreData[collection] = {};
    });
    Object.keys(mockUserData).forEach(key => delete mockUserData[key]);
    mockAuth.currentUser = null;
    mockAuth.sendPasswordResetEmailCalls = [];
    mockAuth.sendEmailVerificationCalls = [];
    
    // Clear all nested collections
    Object.keys(mockNestedCollections).forEach(key => delete mockNestedCollections[key]);
  }

  static mockAuthState(user: any | null): void {
    if (user) {
      mockUserData.currentUser = user;
    } else {
      delete mockUserData.currentUser;
    }
  }

  static addDocument(collection: string, id: string, data: any): void {
    if (this.shouldThrowError('addDocument', collection, id)) {
      throw new Error(`Simulated error for addDocument operation: ${collection}/${id}`);
    }
    
    // Handle nested paths (like users/userId/weightLog)
    if (collection.includes('/')) {
      const pathParts = collection.split('/');
      const mainCollection = pathParts[0];
      const docId = pathParts[1];
      const subCollection = pathParts[2];
      
      // Create nested key
      const nestedKey = `${mainCollection}/${docId}/${subCollection}`;
      if (!mockNestedCollections[nestedKey]) {
        mockNestedCollections[nestedKey] = {};
      }
      
      mockNestedCollections[nestedKey][id] = { ...data, id };
      return;
    }
    
    if (!mockFirestoreData[collection]) {
      mockFirestoreData[collection] = {};
    }
    
    // Special handling for different collections
    if (collection === 'workoutHistory') {
      mockFirestoreData[collection][id] = {
        ...data,
        id: id || data.id
      };
    } else if (collection === 'users') {
      // For users, make sure we preserve the weight property when updating
      const existingData = mockFirestoreData[collection][id] || {};
      mockFirestoreData[collection][id] = { 
        ...existingData,
        ...data,
        // Ensure weight is always preserved from existing data if available
        weight: data.weight !== undefined ? data.weight : existingData.weight,
      };
    } else {
      mockFirestoreData[collection][id] = { ...data };
    }
  }

  static getDocument(collection: string, id: string): any | null {
    if (this.shouldThrowError('getDocument', collection, id)) {
      throw new Error(`Simulated error for getDocument operation: ${collection}/${id}`);
    }
    
    // Handle nested paths (like users/userId/weightLog)
    if (collection.includes('/')) {
      const pathParts = collection.split('/');
      const mainCollection = pathParts[0];
      const docId = pathParts[1];
      const subCollection = pathParts[2];
      
      const nestedKey = `${mainCollection}/${docId}/${subCollection}`;
      if (!mockNestedCollections[nestedKey]) return null;
      
      return mockNestedCollections[nestedKey][id] || null;
    }
    
    if (!mockFirestoreData[collection]) return null;
    return mockFirestoreData[collection][id] || null;
  }

  static getAllDocuments(collection: string): any[] {
    // Handle nested paths (like users/userId/weightLog)
    if (collection.includes('/')) {
      const nestedKey = collection;
      if (mockNestedCollections[nestedKey]) {
        return Object.values(mockNestedCollections[nestedKey]);
      }
      return [];
    }
    
    if (!mockFirestoreData[collection]) return [];
    return Object.values(mockFirestoreData[collection]);
  }

  static setConnectionDelay(delay: number): void {
    mockUserData.connectionDelay = delay;
  }

  static setConnectionState(isConnected: boolean): void {
    mockUserData.isConnected = isConnected;
  }
}

// Define the mockAuth type first
interface MockAuth {
  currentUser: null | { 
    uid: string; 
    email: string | null; 
    emailVerified: boolean;
    getIdTokenResult: () => Promise<any>;
  };
  sendPasswordResetEmailCalls: string[];
  sendEmailVerificationCalls: any[];
  createUserWithEmailAndPassword: jest.Mock<Promise<{ user: any }>, [string, string]>;
  signInWithEmailAndPassword: jest.Mock<Promise<{ user: any }>, [string, string]>;
  signOut: jest.Mock<Promise<void>, []>;
  sendPasswordResetEmail: jest.Mock<Promise<void>, [string]>;
  sendEmailVerification: jest.Mock<Promise<void>, [any]>;
  onAuthStateChanged: jest.Mock<() => void, [any]>;
}

// Extend mock auth to include tracking for reset emails and verification emails
export const mockAuth: MockAuth = {
  currentUser: null,
  
  // Track calls to various methods
  sendPasswordResetEmailCalls: [],
  sendEmailVerificationCalls: [],
  
  createUserWithEmailAndPassword: jest.fn(async (email: string, password: string): Promise<{ user: any }> => {
    // Simple password validation for tests
    if (password.length < 8) {
      const error = new Error('Password must be at least 8 characters long');
      (error as any).code = 'auth/weak-password';
      throw error;
    }
    
    const user = { 
      uid: `user-${Math.random().toString(36).substring(2, 9)}`, 
      email, 
      emailVerified: false,
      getIdTokenResult: async () => ({
        claims: {},
        token: 'valid-token',
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        signInProvider: 'password',
        signInSecondFactor: null
      })
    };
    
    mockAuth.currentUser = user;
    return { user };
  }),
  
  signInWithEmailAndPassword: jest.fn(async (email: string, password: string): Promise<{ user: any }> => {
    // To be configured by tests as needed, we'll make it more robust now
    if (mockAuth.currentUser && mockAuth.currentUser.email === email) {
      return { user: mockAuth.currentUser };
    }
    
    // For testing wrong password scenarios
    if (email === "test2@example.com" && password === "WrongPassword123") {
      const error = new Error('Incorrect password. Please try again.');
      (error as any).code = 'auth/wrong-password';
      throw error;
    }
    
    // For testing non-existent user scenarios
    if (email === "nonexistent@example.com") {
      const error = new Error('Account not found. Please check your credentials or sign up.');
      (error as any).code = 'auth/user-not-found';
      throw error;
    }
    
    // Default login behavior for testing
    const user = { 
      uid: `user-login-${Math.random().toString(36).substring(2, 9)}`, 
      email, 
      emailVerified: false,
      getIdTokenResult: async () => ({
        claims: {},
        token: 'valid-token',
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        signInProvider: 'password',
        signInSecondFactor: null
      })
    };
    
    mockAuth.currentUser = user;
    return { user };
  }),
  
  signOut: jest.fn(async (): Promise<void> => {
    mockAuth.currentUser = null;
  }),
  
  sendPasswordResetEmail: jest.fn(async (email: string): Promise<void> => {
    // Keep track of reset email requests
    mockAuth.sendPasswordResetEmailCalls.push(email);
    
    // Simulate user not found error
    if (email === "nonexistent@example.com") {
      const error = new Error('Account not found. Please check your credentials or sign up.');
      (error as any).code = 'auth/user-not-found';
      throw error;
    }
  }),
  
  sendEmailVerification: jest.fn(async (user: any): Promise<void> => {
    // Keep track of verification email requests
    mockAuth.sendEmailVerificationCalls.push(user);
    return Promise.resolve();
  }),
  
  onAuthStateChanged: jest.fn((callback) => {
    // Immediately call with current user
    callback(mockAuth.currentUser);
    
    // Return unsubscribe function
    return () => {};
  })
};

// Define type for mockFirestore to prevent circular reference
interface MockFirestore {
  collection: jest.Mock<any, [string]>;
}

// Mock Firestore methods
export const mockFirestore: MockFirestore = {
  collection: jest.fn((collectionPath: string) => ({
    doc: jest.fn((docId: string) => ({
      get: jest.fn(async () => {
        const data = MockFirebase.getDocument(collectionPath, docId);
        return {
          exists: !!data,
          data: () => data,
          id: docId
        };
      }),
      
      set: jest.fn(async (data: any) => {
        MockFirebase.addDocument(collectionPath, docId, {
          ...data,
          updatedAt: new Date().toISOString()
        });
        return Promise.resolve();
      }),
      
      update: jest.fn(async (data: any) => {
        const existingData = MockFirebase.getDocument(collectionPath, docId) || {};
        MockFirebase.addDocument(collectionPath, docId, {
          ...existingData,
          ...data,
          updatedAt: new Date().toISOString()
        });
        return Promise.resolve();
      }),
      
      delete: jest.fn(async () => {
        if (mockFirestoreData[collectionPath]) {
          delete mockFirestoreData[collectionPath][docId];
        }
        return Promise.resolve();
      }),
      
      collection: jest.fn((subcollectionPath: string) => 
        mockFirestore.collection(`${collectionPath}/${docId}/${subcollectionPath}`))
    })),
    
    add: jest.fn(async (data: any) => {
      const docId = `doc-${Date.now()}`;
      MockFirebase.addDocument(collectionPath, docId, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docId };
    }),
    
    where: jest.fn(() => ({
      get: jest.fn(async () => {
        const allDocs = MockFirebase.getAllDocuments(collectionPath);
        // This is a simple implementation that doesn't actually filter
        // In a real mock, you would implement the filtering logic
        
        return {
          docs: allDocs.map((doc, index) => ({
            id: doc.id || `mock-doc-${index}`,
            data: () => doc,
            exists: true
          }))
        };
      })
    })),
    
    get: jest.fn(async () => {
      const allDocs = MockFirebase.getAllDocuments(collectionPath);
      return {
        docs: allDocs.map((doc) => ({
          id: doc.id,
          data: () => doc,
          exists: true
        })),
        empty: allDocs.length === 0
      };
    })
  }))
};

// Mock Firebase Firestore interface
export const firebaseFirestore = {
  getDocument: jest.fn(async (collection: string, id: string) => {
    return MockFirebase.getDocument(collection, id);
  }),
  
  setDocument: jest.fn(async (collection: string, id: string, data: any) => {
    MockFirebase.addDocument(collection, id, data);
    return true;
  }),
  
  updateDocument: jest.fn(async (collection: string, id: string, data: any) => {
    const existingData = MockFirebase.getDocument(collection, id) || {};
    MockFirebase.addDocument(collection, id, {
      ...existingData,
      ...data
    });
    return true;
  }),
  
  deleteDocument: jest.fn(async (collection: string, id: string) => {
    if (collection.includes('/')) {
      // For nested collections
      const nestedKey = collection;
      if (mockNestedCollections[nestedKey]) {
        delete mockNestedCollections[nestedKey][id];
      }
    } else if (mockFirestoreData[collection]) {
      delete mockFirestoreData[collection][id];
    }
    return true;
  }),
  
  getCollection: jest.fn(async (collection: string) => {
    return MockFirebase.getAllDocuments(collection);
  })
};

// Overrides for testing
jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(() => mockAuth),
    initializeAuth: jest.fn(() => mockAuth),
    createUserWithEmailAndPassword: jest.fn((auth, email, password) => 
      mockAuth.createUserWithEmailAndPassword(email, password)),
    signInWithEmailAndPassword: jest.fn((auth, email, password) =>
      mockAuth.signInWithEmailAndPassword(email, password)),
    signOut: jest.fn(() => mockAuth.signOut()),
    sendPasswordResetEmail: jest.fn((auth, email) => 
      mockAuth.sendPasswordResetEmail(email)),
    onAuthStateChanged: jest.fn((auth, callback) =>
      mockAuth.onAuthStateChanged(callback)),
    sendEmailVerification: jest.fn((user) => 
      mockAuth.sendEmailVerification(user)),
    updatePassword: jest.fn(() => Promise.resolve()),
    updateEmail: jest.fn(() => Promise.resolve()),
    EmailAuthProvider: {
      credential: jest.fn(() => ({}))
    },
    reauthenticateWithCredential: jest.fn(() => Promise.resolve()),
    Auth: jest.fn(),
    User: jest.fn(),
    browserLocalPersistence: {}
  };
});

jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(() => mockFirestore),
    connectFirestoreEmulator: jest.fn(),
    collection: jest.fn((db, path) => mockFirestore.collection(path)),
    doc: jest.fn((db, path, id) => mockFirestore.collection(path).doc(id)),
    getDoc: jest.fn(async (docRef) => docRef.get()),
    setDoc: jest.fn(async (docRef, data) => docRef.set(data)),
    updateDoc: jest.fn(async (docRef, data) => docRef.update(data)),
    deleteDoc: jest.fn(async (docRef) => docRef.delete()),
    addDoc: jest.fn(async (collectionRef, data) => collectionRef.add(data)),
    serverTimestamp: jest.fn(() => new Date().toISOString()),
    query: jest.fn(() => ({})),
    where: jest.fn(() => ({})),
    getDocs: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date() })),
      fromDate: jest.fn(() => ({}))
    },
    writeBatch: jest.fn(() => ({ 
      set: jest.fn(), 
      update: jest.fn(), 
      delete: jest.fn(), 
      commit: jest.fn(() => Promise.resolve()) 
    })),
    runTransaction: jest.fn(() => Promise.resolve()),
    Firestore: jest.fn(),
    CollectionReference: jest.fn(),
    DocumentReference: jest.fn(),
    WhereFilterOp: jest.fn(),
    DocumentData: jest.fn(),
    QueryDocumentSnapshot: jest.fn(),
    SnapshotOptions: jest.fn(),
    FirestoreDataConverter: jest.fn(),
    FieldValue: {
      serverTimestamp: jest.fn(() => ({})),
      delete: jest.fn(() => ({}))
    }
  };
});

jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(() => ({})),
    FirebaseApp: jest.fn()
  };
}); 