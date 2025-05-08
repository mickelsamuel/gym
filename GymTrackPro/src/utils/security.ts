import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from './logging';

// Storage key for encryption key
const ENCRYPTION_KEY_STORAGE = 'encryption_key';

// Generate a random encryption key if one doesn't exist
export const getOrCreateEncryptionKey = async (): Promise<string> => {
  try {
    // Try to get existing key
    let encryptionKey = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE);
    
    if (!encryptionKey) {
      // Generate a new key - 32 random bytes encoded as hex
      const randomArray = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
      encryptionKey = randomArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Store the key
      await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE, encryptionKey);
    }
    
    return encryptionKey;
  } catch (error) {
    console.error('Error getting/creating encryption key:', error);
    logError('encryption_key_error', error);
    // Fallback to a default key - not ideal but better than failing
    return 'GymTrackPro_DefaultEncryptionKey_2023';
  }
};

/**
 * Encrypt sensitive data
 * @param data Data to encrypt
 * @returns Encrypted data string
 */
export const encryptData = async <T>(data: T): Promise<string> => {
  try {
    const encryptionKey = await getOrCreateEncryptionKey();
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, encryptionKey).toString();
  } catch (error) {
    console.error('Error encrypting data:', error);
    logError('encrypt_data_error', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param encryptedData Encrypted data string
 * @returns Decrypted data
 */
export const decryptData = async <T>(encryptedData: string): Promise<T> => {
  try {
    const encryptionKey = await getOrCreateEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const jsonString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error decrypting data:', error);
    logError('decrypt_data_error', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt and store sensitive data in AsyncStorage
 * @param key Storage key
 * @param data Data to store
 */
export const secureStore = async <T>(key: string, data: T): Promise<void> => {
  try {
    const encryptedData = await encryptData(data);
    await AsyncStorage.setItem(key, encryptedData);
  } catch (error) {
    console.error(`Error securely storing data (key: ${key}):`, error);
    logError('secure_store_error', { key, error });
    throw error;
  }
};

/**
 * Retrieve and decrypt sensitive data from AsyncStorage
 * @param key Storage key
 * @returns Decrypted data or null if not found
 */
export const secureRetrieve = async <T>(key: string): Promise<T | null> => {
  try {
    const encryptedData = await AsyncStorage.getItem(key);
    if (!encryptedData) return null;
    
    return await decryptData<T>(encryptedData);
  } catch (error) {
    console.error(`Error securely retrieving data (key: ${key}):`, error);
    logError('secure_retrieve_error', { key, error });
    return null;
  }
};

/**
 * Hash a string (e.g., for password storage)
 * @param input String to hash
 * @returns Hashed string
 */
export const hashString = (input: string): string => {
  return CryptoJS.SHA256(input).toString();
}; 