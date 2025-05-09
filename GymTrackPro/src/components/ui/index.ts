/**
 * GymTrackPro UI Components Library
 * Export all components from a single location for easier imports
 */
// UI Components Barrel File
// This file exports all UI components from the design system

// Basic components
export { default as Text } from './Text';
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Container } from './Container';
export { default as Input } from './Input';

// Navigation components
export { TabBar } from './TabBar';
export { default as TabBarBackground } from './TabBarBackground';

// Progress & Animations
export { default as ProgressBar } from './ProgressBar';
export { default as CircleProgress } from './CircleProgress';
export { CircleProgress as Progress, LinearProgress } from './Progress';
export { default as FadeIn } from './FadeIn';
export { default as Animations } from './Animations';

// Special components
export { IconSymbol } from './IconSymbol';
export { default as MuscleGroupBadge } from './MuscleGroupBadge';

// Types
export type { TextProps } from 'react-native';
export type TextVariant = 'body' | 'title' | 'heading' | 'subheading' | 'caption';