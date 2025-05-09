/**
 * Global type declarations for the GymTrackPro application
 */

import '@react-navigation/native';

// Add declaration for __DEV__ global variable
declare const __DEV__: boolean;

declare global {
  // Add global declaration for performance memory
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  // Add other global interfaces as needed
}

// Make this file a module by adding an export
export {};

// Add other global type declarations as needed

// Patch the @react-navigation/core types to make id optional on Navigator components
declare module '@react-navigation/core' {
  interface DefaultRouterOptions {
    id?: string;
  }
} 