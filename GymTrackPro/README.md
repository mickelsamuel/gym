# GymTrackPro

GymTrackPro is a comprehensive fitness tracking mobile application built with React Native and Expo. It helps users track workouts, monitor progress, connect with friends, and achieve fitness goals.

![GymTrackPro App](./screenshots/app-showcase.png)

## Features

- **Workout Tracking**: Log exercises, sets, reps, and weights for each workout
- **Progress Visualization**: Track progress with charts showing weight, volume, and other metrics
- **Exercise Library**: Extensive database of exercises with instructions and muscle group visualization
- **Custom Workout Plans**: Create and save custom workout routines
- **Social Features**: Connect with friends, share workouts, and view activity feed
- **Weight Tracking**: Monitor weight changes over time with goal setting
- **Calendar Integration**: View workout history in a heatmap calendar
- **Dark & Light Modes**: Support for system appearance settings
- **Offline Support**: Use the app even without internet connection
- **Accessibility**: Designed to work with screen readers and other accessibility features

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/GymTrackPro.git
   cd GymTrackPro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on a device or simulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with the Expo Go app on your device

### Firebase Setup

The app uses Firebase for authentication, database, and analytics. To set up your own Firebase project:

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Set up Firestore Database
4. Update the Firebase configuration in `src/services/firebase.ts`

## Project Structure

```
GymTrackPro/
├── assets/                  # Images, fonts, and animations
├── src/
│   ├── app/                 # Main App component
│   ├── components/          # UI components
│   │   └── ui/              # Design system components
│   ├── constants/           # Theme, colors, and other constants
│   ├── context/             # React Context providers
│   ├── data/                # Static data and mock data
│   ├── hooks/               # Custom React hooks
│   ├── navigation/          # Navigation configuration
│   ├── screens/             # App screens
│   ├── services/            # API and database services
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── app.json                 # Expo configuration
├── babel.config.js          # Babel configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Design System

The app follows a comprehensive design system with consistent components, colors, typography, and spacing. All UI elements are built using the components in the `src/components/ui` directory, ensuring a consistent look and feel throughout the app.

### Key UI Components

- **Button**: Primary, secondary, text, icon, and FAB variants
- **Text**: Typography system with predefined variants
- **Card**: Card components for displaying content
- **Container**: Layout container for screens
- **Input**: Form input components

### Theme Colors

The app uses a defined color palette in both light and dark modes:

- Primary Blue: `#3772FF`
- Secondary Green: `#36B37E`
- Accent Orange: `#FF9F5A`
- Accent Purple: `#A66EFC`

Each muscle group is also color-coded for easy identification.

## Development Workflow

### Code Conventions

- Use TypeScript for all new code
- Follow the existing component structure and naming conventions
- Use the design system components for all UI elements
- Add proper documentation for new components and functions
- Write unit tests for critical functionality

### Commits

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring without changing functionality
test: add or update tests
chore: update build tasks, package manager configs, etc.
```

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for new features
- `feature/feature-name`: New features
- `fix/bug-description`: Bug fixes

## Testing

Run tests with:

```bash
npm test
```

The app includes several types of tests:
- **Unit Tests**: For utility functions and isolated components
- **Component Tests**: For UI components
- **Integration Tests**: For component interactions
- **Network Resilience Tests**: For offline functionality

## Building for Production

### Expo Build

```bash
expo build:android     # For Android
expo build:ios         # For iOS
```

### EAS Build (Recommended)

```bash
eas build --platform ios
eas build --platform android
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit)
- [Inter Font Family](https://rsms.me/inter/) 