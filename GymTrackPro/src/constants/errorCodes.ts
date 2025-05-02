/**
 * Firebase and application error codes
 */

// Firebase Auth Error Codes
export const AUTH_ERROR_CODES = {
  INVALID_EMAIL: 'auth/invalid-email',
  USER_DISABLED: 'auth/user-disabled',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  WEAK_PASSWORD: 'auth/weak-password',
  REQUIRES_RECENT_LOGIN: 'auth/requires-recent-login',
  INVALID_CREDENTIAL: 'auth/invalid-credential',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  CREDENTIAL_ALREADY_IN_USE: 'auth/credential-already-in-use',
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  EXPIRED_ACTION_CODE: 'auth/expired-action-code',
  INVALID_ACTION_CODE: 'auth/invalid-action-code',
};

// Firebase Firestore Error Codes
export const FIRESTORE_ERROR_CODES = {
  PERMISSION_DENIED: 'permission-denied',
  UNAUTHENTICATED: 'unauthenticated',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  UNAVAILABLE: 'unavailable',
  DEADLINE_EXCEEDED: 'deadline-exceeded',
  CANCELLED: 'cancelled',
  DATA_LOSS: 'data-loss',
  UNKNOWN: 'unknown',
  INVALID_ARGUMENT: 'invalid-argument',
  FAILED_PRECONDITION: 'failed-precondition',
  ABORTED: 'aborted',
  OUT_OF_RANGE: 'out-of-range',
  UNIMPLEMENTED: 'unimplemented',
  INTERNAL: 'internal',
};

// App-specific error codes
export const APP_ERROR_CODES = {
  // Network errors
  NETWORK_DISCONNECTED: 'network_disconnected',
  SERVER_UNREACHABLE: 'server_unreachable',
  TIMEOUT: 'request_timeout',
  
  // Validation errors
  INVALID_INPUT: 'invalid_input',
  REQUIRED_FIELD_MISSING: 'required_field_missing',
  INVALID_FORMAT: 'invalid_format',
  
  // Authentication errors
  AUTH_EXPIRED: 'auth_expired',
  NOT_AUTHENTICATED: 'not_authenticated',
  MISSING_PERMISSIONS: 'missing_permissions',
  
  // Data errors
  DATA_NOT_FOUND: 'data_not_found',
  DUPLICATE_ENTRY: 'duplicate_entry',
  STALE_DATA: 'stale_data',
  
  // Application errors
  INITIALIZATION_FAILED: 'initialization_failed',
  UNEXPECTED_ERROR: 'unexpected_error',
  FEATURE_DISABLED: 'feature_disabled',
};

// Combine all error codes for easy import
export const ERROR_CODES = {
  ...AUTH_ERROR_CODES,
  ...FIRESTORE_ERROR_CODES,
  ...APP_ERROR_CODES,
};

/**
 * Map an error code to a user-friendly message
 * @param errorCode The error code
 * @returns A user-friendly error message
 */
export const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    // Auth error messages
    case AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE:
      return 'This email is already in use. Please use a different email or sign in.';
    case AUTH_ERROR_CODES.INVALID_EMAIL:
      return 'Invalid email address. Please check your email format.';
    case AUTH_ERROR_CODES.USER_DISABLED:
      return 'This account has been disabled. Please contact support.';
    case AUTH_ERROR_CODES.USER_NOT_FOUND:
      return 'Account not found. Please check your credentials or sign up.';
    case AUTH_ERROR_CODES.WRONG_PASSWORD:
      return 'Incorrect password. Please try again.';
    case AUTH_ERROR_CODES.WEAK_PASSWORD:
      return 'Password is too weak. Please use a stronger password.';
    case AUTH_ERROR_CODES.REQUIRES_RECENT_LOGIN:
      return 'This action requires recent authentication. Please login again.';
    case AUTH_ERROR_CODES.INVALID_CREDENTIAL:
      return 'Invalid credentials. Please try again.';
    case AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED:
      return 'This operation is not allowed.';
      
    // Firestore error messages
    case FIRESTORE_ERROR_CODES.PERMISSION_DENIED:
      return 'Permission denied. You do not have access to this resource.';
    case FIRESTORE_ERROR_CODES.UNAUTHENTICATED:
      return 'Authentication required. Please sign in.';
    case FIRESTORE_ERROR_CODES.NOT_FOUND:
      return 'The requested resource was not found.';
    case FIRESTORE_ERROR_CODES.RESOURCE_EXHAUSTED:
      return 'Service temporarily unavailable. Please try again later.';
    case FIRESTORE_ERROR_CODES.UNAVAILABLE:
      return 'The service is currently unavailable. Please check your connection.';
    case FIRESTORE_ERROR_CODES.DEADLINE_EXCEEDED:
      return 'The operation timed out. Please try again.';
    case FIRESTORE_ERROR_CODES.INVALID_ARGUMENT:
      return 'Invalid argument provided to the operation.';
    case FIRESTORE_ERROR_CODES.FAILED_PRECONDITION:
      return 'Operation failed due to a failed precondition.';
      
    // App-specific error messages
    case APP_ERROR_CODES.NETWORK_DISCONNECTED:
      return 'You appear to be offline. Please check your internet connection.';
    case APP_ERROR_CODES.SERVER_UNREACHABLE:
      return 'Unable to reach the server. Please try again later.';
    case APP_ERROR_CODES.TIMEOUT:
      return 'The request timed out. Please try again.';
    case APP_ERROR_CODES.INVALID_INPUT:
      return 'Invalid input provided. Please check your entries.';
    case APP_ERROR_CODES.REQUIRED_FIELD_MISSING:
      return 'Required field is missing. Please fill in all required fields.';
    case APP_ERROR_CODES.DATA_NOT_FOUND:
      return 'The requested data could not be found.';
      
    // Default error message
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}; 