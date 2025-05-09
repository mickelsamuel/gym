/**
 * GymTrackPro Animation System
 * Centralized animation constants and keyframes for consistent motion design
 */
import { Easing } from 'react-native';
import { Animation } from './Theme';
// Standard timing configs for different speed animations
export const TimingConfigs = {
  // Quick, subtle animations (150ms)
  fast: {
    duration: Animation.fast,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  },
  // Standard interactions (300ms) 
  normal: {
    duration: Animation.normal,
    easing: Easing.inOut(Easing.cubic),
    useNativeDriver: true,
  },
  // Emphasis animations (500ms)
  slow: {
    duration: Animation.slow,
    easing: Easing.inOut(Easing.cubic),
    useNativeDriver: true,
  },
  // Spring-like behavior for natural motion
  springy: {
    duration: Animation.normal,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    useNativeDriver: true,
  },
  // Bounce effect 
  bounce: {
    duration: Animation.normal,
    easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
    useNativeDriver: true,
  },
};
// Animation sequences for common transitions
export const TransitionPresets = {
  // Fade in from 0 to 1 opacity
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: TimingConfigs.normal,
  },
  // Fade out from 1 to 0 opacity
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    config: TimingConfigs.fast,
  },
  // Slide in from bottom
  slideInBottom: {
    from: { opacity: 0, translateY: 50 },
    to: { opacity: 1, translateY: 0 },
    config: TimingConfigs.normal,
  },
  // Slide in from top
  slideInTop: {
    from: { opacity: 0, translateY: -50 },
    to: { opacity: 1, translateY: 0 },
    config: TimingConfigs.normal,
  },
  // Slide in from left
  slideInLeft: {
    from: { opacity: 0, translateX: -50 },
    to: { opacity: 1, translateX: 0 },
    config: TimingConfigs.normal,
  },
  // Slide in from right
  slideInRight: {
    from: { opacity: 0, translateX: 50 },
    to: { opacity: 1, translateX: 0 },
    config: TimingConfigs.normal,
  },
  // Scale up from 0.9 to 1
  scaleUp: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    config: TimingConfigs.springy,
  },
  // Scale down from 1.1 to 1
  scaleDown: {
    from: { opacity: 0, scale: 1.1 },
    to: { opacity: 1, scale: 1 },
    config: TimingConfigs.springy,
  },
  // Bounce in from bottom
  bounceIn: {
    from: { opacity: 0, translateY: 50 },
    to: { opacity: 1, translateY: 0 },
    config: TimingConfigs.bounce,
  },
};
// Standard delays for staggered animations
export const Delays = {
  veryShort: 50,
  short: 100,
  medium: 150,
  long: 250,
};
export default {
  TimingConfigs,
  TransitionPresets,
  Delays,
}; 