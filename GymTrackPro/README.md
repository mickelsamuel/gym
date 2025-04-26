# GymTrackPro

<img src="./assets/images/icon.png" width="100" alt="GymTrackPro Logo">

GymTrackPro is a comprehensive fitness tracking application built with **React Native** and **Expo**, helping users track workouts, monitor progress, and connect with fitness friends.

## Features

- **Workout Tracking**: Log sets, reps, and weights for each exercise
- **Progress Visualization**: View your progress over time with charts
- **Custom Workout Plans**: Create and save personalized workout routines
- **Goal Setting**: Set fitness goals and track your progress
- **Social Features**: Connect with friends, share progress, and motivate each other
- **Dark Mode Support**: Choose between light and dark themes
- **Offline Support**: Full functionality even without an internet connection
- **Cross-Platform**: Works on both iOS and Android

## Screenshots

<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="./screenshots/login.PNG" width="200" alt="Login Screen">
  <img src="./screenshots/hometab.PNG" width="200" alt="Home Tab">
  <img src="./screenshots/exercisestab.PNG" width="200" alt="Exercises Tab">
  <img src="./screenshots/workouttab.PNG" width="200" alt="Workout Tab">
  <img src="./screenshots/profiletab.PNG" width="200" alt="Profile Tab">
  <img src="./screenshots/socialtab.PNG" width="200" alt="Social Tab">
</div>

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Firebase](https://firebase.google.com/) account (for authentication and cloud storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gymtrackpro.git
   cd gymtrackpro
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Set up Authentication with Email/Password
   - Create a Firestore database
   - Update `src/services/firebase.js` with your Firebase configuration

4. Start the Expo development server:
   ```bash
   npm start
   # or
   expo start
   ```

5. Launch the app:
   - Scan the QR code with the Expo Go app on your mobile device
   - Press 'i' to open in iOS simulator (Mac only)
   - Press 'a' to open in Android emulator

### Building for Production

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Build the app:
   ```bash
   # For development testing
   eas build --profile development --platform all

   # For production
   eas build --profile production --platform all
   ```

3. Submit to app stores:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Project Structure

```
GymTrackPro/
├── assets/                # Images, fonts and other static assets
├── components/            # Reusable UI components
│   └── ui/                # Base UI components like Button, Card, etc.
├── constants/             # App constants including Colors
├── hooks/                 # Custom React hooks
├── src/
│   ├── context/           # React Context providers
│   ├── data/              # Static data (exercises, muscle groups)
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   └── services/          # Services (Firebase, DatabaseService)
├── App.js                 # Main app component
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

## Technologies Used

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **Firebase**: Authentication and cloud storage
- **AsyncStorage**: Local data persistence
- **React Navigation**: Navigation between screens
- **React Native Charts**: Data visualization
- **Expo SQLite**: Local database

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - [your.email@example.com](mailto:your.email@example.com)

Project Link: [https://github.com/your-username/gymtrackpro](https://github.com/your-username/gymtrackpro)
