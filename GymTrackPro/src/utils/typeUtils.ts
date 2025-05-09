/**
 * Type Utility Functions
 * This file contains utility functions for type handling and conversion
 */
import { FirebaseTimestamp } from '../types/mergedTypes';
import { serverTimestamp, FieldValue } from 'firebase/firestore';
/**
 * Prepares an object for Firestore by handling timestamp fields
 * @param obj The object to prepare for Firestore
 * @returns A copy of the object that's safe for Firestore
 */
export function prepareForFirestore<T extends object>(obj: T): any {
  // Create a new object so we don't modify the original
  const result: any = { ...obj };
  // Remove id field for Firestore
  if ('id' in result) {
    delete result.id;
  }
  // Return the prepared object
  return result;
}
/**
 * Creates a Firebase server timestamp that can be used in place of FirebaseTimestamp
 * @returns A server timestamp FieldValue
 */
export function createServerTimestamp(): FieldValue {
  return serverTimestamp();
}
/**
 * Converts a timestamp string or Firebase timestamp to a Date object
 * @param timestamp The timestamp to convert
 * @returns Date object or null if invalid
 */
export function timestampToDate(timestamp: string | FirebaseTimestamp | undefined): Date | null {
  if (!timestamp) return null;
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return null;
} 