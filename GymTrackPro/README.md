# GymTrackPro 🏋️‍♂️

A comprehensive fitness tracking application for tracking workouts, monitoring progress, and connecting with friends.

![GymTrackPro Banner](./screenshots/banner.png)

## Features

- **Workout Tracking**: Log and monitor your workouts with detailed exercise, set, and rep tracking
- **Progress Visualization**: Track your weight, exercise performance, and body measurements with intuitive charts 
- **Exercise Library**: Comprehensive database of exercises with proper form instructions and muscle targeting
- **Custom Workout Plans**: Create and follow personalized workout routines
- **Social Features**: Connect with friends, share achievements, and participate in challenges
- **Goal Setting**: Set and track fitness goals with milestone celebrations
- **Dark Mode**: Support for both light and dark themes

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication, Firestore, Storage, Analytics)
- **State Management**: React Context API
- **UI Components**: Custom component library based on design specifications
- **Data Visualization**: React Native Chart Kit
- **Navigation**: React Navigation v7
- **Animations**: React Native Reanimated and Lottie

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/GymTrackPro.git
cd GymTrackPro
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm start
```

4. Run on a specific platform:
```bash
npm run ios     # for iOS
npm run android # for Android
```

## Project Structure

```
GymTrackPro/
├── assets/               # Static assets (images, fonts, etc.)
├── src/
│   ├── app/              # Main app components
│   ├── components/       # Reusable UI components
│   ├── constants/        # App-wide constants and theme
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   ├── services/         # API and backend services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
└── ...                   # Configuration files
```

## Design System

GymTrackPro follows a comprehensive design system with:

- Consistent typography using the Inter font family
- Carefully selected color palette for both light and dark modes
- Standardized spacing and layout principles
- Accessible component design
- Responsive UI for various device sizes
- Optimized animations for smooth user experience

## Firebase Configuration

The app uses Firebase for backend services. To set up your own Firebase project:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, and Storage
3. Update the configuration in `src/services/firebase.ts`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Design inspiration from modern fitness applications
- Icons from [Expo Vector Icons](https://icons.expo.fyi/)
- [Firebase](https://firebase.google.com/) for backend services
- [React Native Community](https://reactnative.dev/community/overview) for the incredible ecosystem

## Code Maintenance and Cleanup

To keep the codebase clean and error-free, we've added several scripts:

1. **Cleanup unused imports**
   ```
   npm run cleanup:imports
   ```
   This will scan all TypeScript files and remove any unused imports.

2. **Analyze hook dependencies**
   ```
   npm run analyze:hooks
   ```
   This will help identify missing dependencies in useEffect and other React hooks.

3. **ESLint Fix**
   ```
   npm run lint:fix
   ```
   This will automatically fix common ESLint issues.

4. **Run all cleanup tasks**
   ```
   npm run cleanup
   ```
   This will run the import cleanup followed by ESLint fix. 