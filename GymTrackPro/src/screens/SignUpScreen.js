// screens/SignUpScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { register } = useContext(AuthContext);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMetric, setIsMetric] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleUnitToggle = () => {
    setIsMetric(!isMetric);
    setHeightCm('');
    setHeightFeet('');
    setHeightInches('');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSignUp = async () => {
    try {
      if (
        !fullName || 
        !username || 
        !age || 
        !weight || 
        !email || 
        !password ||
        (isMetric && !heightCm) ||
        (!isMetric && (!heightFeet || !heightInches))
      ) {
        Alert.alert('Error', 'All fields are required. Please fill everything.');
        return;
      }

      const numericAge = parseInt(age, 10);
      const numericWeight = parseFloat(weight);
      const numericHeight = isMetric
        ? parseFloat(heightCm)
        : parseInt(heightFeet, 10) * 12 + parseInt(heightInches, 10);

      if (numericAge < 13) {
        Alert.alert('Error', 'You must be at least 13 years old to sign up.');
        return;
      }

      if (isMetric) {
        // height in cm, weight in kg
        if (numericHeight < 50 || numericHeight > 300) {
          Alert.alert('Error', 'Height must be between 50 cm and 300 cm.');
          return;
        }
        if (numericWeight < 30 || numericWeight > 600) {
          Alert.alert('Error', 'Weight must be between 30 and 600 kg.');
          return;
        }
      } else {
        // height in ft/in, weight in lbs
        if (numericHeight < 36 || numericHeight > 96) {
          Alert.alert('Error', 'Height must be between 3 ft and 8 ft.');
          return;
        }
        if (numericWeight < 60 || numericWeight > 1300) {
          Alert.alert('Error', 'Weight must be between 60 and 1300 lbs.');
          return;
        }
      }

      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        Alert.alert(
          'Invalid Username',
          'Username must be 3–20 characters long and contain only letters, numbers, or underscores.'
        );
        return;
      }

      if (password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters long.');
        return;
      }

      await register({
        email,
        password,
        fullName,
        username,
        age: numericAge,
        height: numericHeight,
        weight: numericWeight,
        units: isMetric ? 'metric' : 'imperial',
      });

      Alert.alert('Success', 'Account created!');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Sign Up Error', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>{'<'} Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>GymTrackPro</Text>
          <Text style={styles.title}>Create an Account</Text>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Smith"
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Username (public)</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="johndoe123"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="e.g. 25"
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Height</Text>
          {isMetric ? (
            <TextInput
              style={styles.input}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              placeholder="cm"
              placeholderTextColor="#999"
            />
          ) : (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={heightFeet}
                onChangeText={setHeightFeet}
                keyboardType="numeric"
                placeholder="ft"
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={heightInches}
                onChangeText={setHeightInches}
                keyboardType="numeric"
                placeholder="in"
                placeholderTextColor="#999"
              />
            </View>
          )}

          <Text style={styles.inputLabel}>
            Weight ({isMetric ? 'kg' : 'lbs'})
          </Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder={isMetric ? 'e.g. 70' : 'e.g. 154'}
            placeholderTextColor="#999"
          />

          <TouchableOpacity onPress={handleUnitToggle} style={styles.unitToggle}>
            <Text style={styles.unitToggleText}>
              Switch to {isMetric ? 'Imperial (ft/in, lbs)' : 'Metric (cm, kg)'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showHideButton}>
              <Text style={{ color: '#007AFF', fontWeight: '500' }}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSignUp} style={styles.button}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')} 
            style={{ marginTop: 16 }}
          >
            <Text style={styles.link}>
              Already have an account? <Text style={{ fontWeight: 'bold' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#F4F6FA',
    padding: 16,
    paddingBottom: 40
  },
  backButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 4,
    marginLeft: 4,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfInput: {
    width: '48%',
  },
  unitToggle: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  unitToggleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    marginBottom: 16
  },
  showHideButton: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
});