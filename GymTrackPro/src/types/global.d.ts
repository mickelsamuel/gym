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

// Note: The previous DefaultRouterOptions declaration was causing TypeScript errors
// If you need to augment React Navigation types, consider creating a separate navigation.d.ts file
// or use module augmentation with a different approach 