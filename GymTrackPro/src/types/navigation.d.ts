/**
 * React Navigation type augmentations
 */

// Correctly augment the React Navigation types
// This allows us to add optional id property to Navigator components
declare module '@react-navigation/core' {
  export interface DefaultRouterOptions {
    id?: string;
  }
}

// Adding an export to make this a module
export {}; 