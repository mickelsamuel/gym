 
// Test setup file for Jest

// Mock Expo
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
      firebaseApiKey: 'test-api-key',
      firebaseAuthDomain: 'test-auth-domain',
      firebaseProjectId: 'test-project-id',
      firebaseStorageBucket: 'test-storage-bucket',
      firebaseMessagingSenderId: 'test-messaging-sender-id',
      firebaseAppId: 'test-app-id',
      firebaseMeasurementId: 'test-measurement-id'
    }
  }
}));

// Mock Expo Linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  parse: jest.fn(),
  parseInitialURLAsync: jest.fn(),
}));

// Mock React Native completely
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'ios',
      select: jest.fn(obj => obj.ios || obj.default),
      Version: 42
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 }))
    },
    NativeModules: {
      NativeAnimatedModule: {
        startAnimatingNode: jest.fn(),
        stopAnimation: jest.fn(),
        setAnimatedNodeValue: jest.fn(),
      },
      StatusBarManager: {
        HEIGHT: 42,
        setStyle: jest.fn(),
        setHidden: jest.fn(),
      },
      SettingsManager: {
        settings: {},
        getConstants: () => ({}),
      },
      UIManager: {
        measure: jest.fn(),
        measureInWindow: jest.fn(),
      }
    },
    Animated: {
      View: 'Animated.View',
      Text: 'Animated.Text',
      Image: 'Animated.Image',
      createAnimatedComponent: jest.fn(() => 'AnimatedComponent'),
      timing: jest.fn(() => ({ start: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({ interpolate: jest.fn() })),
      })),
    },
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ScrollView: 'ScrollView',
    TouchableOpacity: 'TouchableOpacity',
    StyleSheet: {
      create: jest.fn(styles => styles),
    },
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
    },
    VirtualizedList: 'VirtualizedList',
    FlatList: 'FlatList',
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock EventEmitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  const { EventEmitter } = require('events');
  return jest.fn(() => new EventEmitter());
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  FirebaseApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
    signOut: jest.fn(() => Promise.resolve()),
    sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
    updatePassword: jest.fn(() => Promise.resolve()),
    updateEmail: jest.fn(() => Promise.resolve()),
    sendEmailVerification: jest.fn(() => Promise.resolve()),
  })),
  initializeAuth: jest.fn(() => ({
    currentUser: null,
  })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  updatePassword: jest.fn(() => Promise.resolve()),
  updateEmail: jest.fn(() => Promise.resolve()),
  EmailAuthProvider: {
    credential: jest.fn(() => ({})),
  },
  reauthenticateWithCredential: jest.fn(() => Promise.resolve()),
  sendEmailVerification: jest.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  Auth: jest.fn(),
  User: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  connectFirestoreEmulator: jest.fn(),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
  serverTimestamp: jest.fn(() => ({})),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(() => ({})),
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
    delete: jest.fn(() => ({})),
  },
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  isSupported: jest.fn(() => Promise.resolve(true)),
  Analytics: jest.fn(),
}));

// Mock react-native's useColorScheme function
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  // ... existing code ...
})); 