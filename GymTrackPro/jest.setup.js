// Mock react-native's useColorScheme function
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([]))
}));

// Define a mock User that can be used in tests
class MockUser {
  constructor(props = {}) {
    Object.assign(this, {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: false,
      isAnonymous: false,
      metadata: { creationTime: Date.now(), lastSignInTime: Date.now() },
      providerData: [],
      refreshToken: 'mock-refresh-token',
      tenantId: null,
      displayName: null,
      photoURL: null,
      phoneNumber: null,
      providerId: 'password',
      ...props
    });
  }

  delete() {
    return Promise.resolve();
  }

  getIdToken() {
    return Promise.resolve('mock-id-token');
  }

  getIdTokenResult() {
    return Promise.resolve({
      claims: {},
      token: 'mock-id-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
      signInProvider: 'password',
      signInSecondFactor: null
    });
  }

  reload() {
    return Promise.resolve();
  }

  toJSON() {
    return { ...this };
  }
}

// Mock firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(() => ({
      onAuthStateChanged: jest.fn((callback) => {
        callback(null);
        return jest.fn();
      }),
      currentUser: null
    })),
    initializeAuth: jest.fn(() => ({})),
    browserLocalPersistence: {},
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    EmailAuthProvider: {
      credential: jest.fn()
    },
    reauthenticateWithCredential: jest.fn(),
    updatePassword: jest.fn(),
    updateEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    onAuthStateChanged: jest.fn(),
    // Export the MockUser for test usage
    User: MockUser
  };
});

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  serverTimestamp: jest.fn(() => ({})),
  Timestamp: { 
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date }))
  },
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve())
  })),
  runTransaction: jest.fn((db, fn) => Promise.resolve(fn({ get: jest.fn(), set: jest.fn(), update: jest.fn(), delete: jest.fn() })))
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  isSupported: jest.fn(() => Promise.resolve(true)),
  logEvent: jest.fn(),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(obj => obj.ios)
}));

// Mock sentry-expo
jest.mock('sentry-expo', () => ({
  init: jest.fn(),
  Native: {
    nativeClientAvailable: false,
    nativeSdkAvailable: false,
  },
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setTag: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn((callback) => callback({ setTag: jest.fn() })),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoVersion: 'XX.X.X',
    manifest: {
      version: '1.0.0',
      extra: {
        sentryDsn: 'https://mock-dsn@sentry.io/123456',
      },
    },
    appOwnership: 'standalone',
    installationId: 'mock-installation-id',
    sessionId: 'mock-session-id',
    statusBarHeight: 20,
    systemVersion: '14.0',
    platform: { ios: {} },
  },
  ExecutionEnvironment: {
    standalone: true,
    storeClient: false,
    debugger: false,
  },
})); 