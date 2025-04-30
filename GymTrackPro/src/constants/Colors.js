// Colors.js - Color system for GymTrackPro
const tintColorLight = '#007AFF';  // Primary iOS blue
const tintColorDark = '#0A84FF';   // Darker iOS blue for dark mode

// Gradient colors for visual appeal
const gradientPrimary = ['#4F8EF7', '#3478F6']; 
const gradientSuccess = ['#33CF4D', '#28A745'];
const gradientWarning = ['#FF9500', '#F57C00'];
const gradientDanger = ['#FF3B30', '#E53935'];

export default {
  light: {
    primary: tintColorLight,
    background: '#F8F9FA',
    backgroundSecondary: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E0E0E0',
    card: '#FFFFFF',
    tabIconDefault: '#C4C4C6',
    tabIconSelected: tintColorLight,
    success: '#28A745',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#5AC8FA',
    gradientPrimary,
    gradientSuccess,
    gradientWarning,
    gradientDanger,
    progressBar: '#EDEDED',
    shadow: 'rgba(0,0,0,0.1)',
  },
  dark: {
    primary: tintColorDark,
    background: '#1C1C1E',
    backgroundSecondary: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textTertiary: '#888888',
    border: '#555555',
    card: '#2C2C2E',
    tabIconDefault: '#515154',
    tabIconSelected: tintColorDark,
    success: '#33CF4D',
    warning: '#FF9F0A',
    danger: '#FF453A',
    info: '#64D2FF',
    gradientPrimary,
    gradientSuccess,
    gradientWarning,
    gradientDanger,
    progressBar: '#444444',
    shadow: 'rgba(0,0,0,0.3)',
  },
}; 