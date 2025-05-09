# GymTrackPro - Fitness Tracking Application

GymTrackPro is a comprehensive fitness tracking application built with React Native and Expo. It allows users to track workouts, monitor progress, connect with friends, and achieve fitness goals.

## Features

- **User Authentication**: Secure login, registration, and email verification
- **Workout Tracking**: Create, log, and track workout sessions
- **Exercise Library**: Comprehensive database of exercises with detailed information
- **Progress Visualization**: Charts and graphs to visualize your fitness journey
- **Social Features**: Connect with friends, share workouts, and build a fitness community
- **Goal Setting**: Set personalized fitness goals and track progress
- **Weight Tracking**: Log weight and track changes over time
- **Customizable Workouts**: Create and save custom workout routines
- **Dark Mode Support**: Toggle between light and dark themes
- **Offline Support**: Full functionality even without an internet connection

## Screenshots

_[Insert screenshots here]_

## Technology Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **State Management**: Context API
- **Styling**: React Native StyleSheet, Expo LinearGradient
- **Navigation**: React Navigation v7
- **Charts**: React Native Chart Kit
- **Animations**: React Native Reanimated, Lottie
- **Testing**: Jest
- **Error Reporting**: Sentry

## Installation

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Expo CLI
- Firebase account

### Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/GymTrackPro.git
cd GymTrackPro
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Firebase Setup**

- Create a Firebase project at https://console.firebase.google.com/
- Enable Authentication (Email/Password)
- Enable Firestore Database
- Create a web app and get your configuration
- Update the Firebase configuration in `src/services/firebase.ts`

4. **Start the development server**

```bash
npx expo start
```

5. **Run on a device or emulator**

- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Scan the QR code with the Expo Go app on your device

## Firebase Security Rules

For production, make sure to deploy the security rules found in `src/services/firebaseSecurityRules.ts` to your Firebase project. This can be done via the Firebase Console or the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Folder Structure

```
GymTrackPro/
├── assets/             # Images, fonts, and other static assets
├── src/
│   ├── app/            # Main App component
│   ├── components/     # Reusable UI components
│   │   └── ui/         # Design system components
│   ├── constants/      # App constants, theme, colors
│   ├── context/        # Context providers for state management
│   ├── data/           # Static data and constants
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Screen components
│   ├── services/       # API and service integrations
│   │   └── database/   # Database service implementations
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── App.js              # Entry point
└── app.json            # Expo configuration
```

## Design System

GymTrackPro follows a comprehensive design system with consistent colors, typography, spacing, and components. The design elements can be found in:

- `src/constants/Theme.ts` - Main theme configuration
- `src/constants/Colors.ts` - Color palette
- `src/components/ui/` - UI component library

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by modern fitness applications
- Exercise data from [exercise database]
- Icons from Ionicons and Expo Vector Icons

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/GymTrackPro](https://github.com/yourusername/GymTrackPro)
