# GymTrackPro UI Component Library

This directory contains all the reusable UI components for the GymTrackPro application, built according to the design specification.

## Design System Implementation

The components in this library adhere to the GymTrackPro design system, which includes:

- **Color Palette**: Primary, secondary, accent, and functional colors defined in the design spec
- **Typography**: Font sizes, weights, and families (Inter)
- **Spacing**: Consistent spacing scale
- **Elevation**: Shadow styles for different elevations
- **Border Radius**: Standardized border radius values

## Core Components

### Text

A typography component that implements the text styles from the design system.

```tsx
import Text from '../components/ui/Text';

<Text variant="heading1">Welcome to GymTrackPro</Text>
<Text variant="body" color={Colors.textSecondary}>Track your fitness journey</Text>
```

**Props:**
- `variant`: One of 'display', 'title', 'heading1', 'heading2', 'heading3', 'subtitle', 'bodyLarge', 'body', 'bodySmall', 'caption', 'micro', or 'tiny'
- `color`: Optional text color (defaults to theme text color)
- `weight`: Optional font weight ('bold', 'medium', 'regular', 'light')
- `align`: Text alignment ('left', 'center', 'right')

### Button

A versatile button component with support for different styles, sizes, and states.

```tsx
import Button from '../components/ui/Button';

<Button label="Start Workout" onPress={handlePress} />
<Button label="Cancel" variant="outline" onPress={handleCancel} />
<Button icon="add" label="Add Exercise" onPress={handleAdd} />
```

**Props:**
- `variant`: 'primary', 'secondary', 'outline', 'ghost', etc.
- `size`: 'small', 'medium', 'large'
- `label`: Button text
- `icon`: Optional icon name (Ionicons)
- `iconPosition`: 'left' or 'right'
- `loading`: Boolean to show loading state
- `disabled`: Boolean to disable the button

### Card

A surface component that follows the elevation and border radius from the design specification.

```tsx
import Card from '../components/ui/Card';

<Card>
  <Text>Card content goes here</Text>
</Card>

<Card elevation={3} onPress={handlePress}>
  <Text>Pressable card with elevation</Text>
</Card>
```

**Props:**
- `elevation`: 0-5 for different shadow levels
- `borderRadius`: 'none', 'sm', 'md', 'lg', 'xl'
- `onPress`: Optional function to make the card pressable
- `background`: Custom background color

### Input

Text input component following the design specification.

```tsx
import Input from '../components/ui/Input';

<Input 
  label="Email" 
  placeholder="Enter your email"
  leftIcon="mail"
  value={email}
  onChangeText={setEmail}
/>

<Input
  label="Password"
  placeholder="Enter your password"
  secureTextEntry
  rightIcon="eye"
  onRightIconPress={togglePasswordVisibility}
  error={passwordError}
  hint="Password must be at least 8 characters"
/>
```

**Props:**
- `label`: Input label
- `hint`: Helper text
- `error`: Error message
- `leftIcon`/`rightIcon`: Icon names (Ionicons)
- `onRightIconPress`: Function for right icon press
- `valid`: Boolean to show valid state

### TabBar

Custom tab bar component for navigation with a modern, blurred design.

```tsx
// Used in navigation configuration
```

### CircleProgress

Circular progress indicator for workout completion, achievements, etc.

```tsx
import CircleProgress from '../components/ui/CircleProgress';

<CircleProgress progress={0.75} size={100} />
<CircleProgress progress={0.5} showPercentage={true} />
```

**Props:**
- `progress`: Number between 0-1
- `size`: Diameter in pixels
- `thickness`: Line thickness
- `color`: Progress color
- `showPercentage`: Boolean to show percentage inside

### ProgressBar

Linear progress bar component for showing progress towards goals.

```tsx
import ProgressBar from '../components/ui/ProgressBar';

<ProgressBar progress={0.6} label="Weekly Goal" showPercentage={true} />
```

**Props:**
- `progress`: Number between 0-1
- `height`: Bar height
- `label`: Optional text label
- `showPercentage`: Boolean to show percentage
- `animate`: Boolean to enable animation

### MuscleGroupBadge

Badge component specifically designed for muscle groups with the color coding from the design spec.

```tsx
import MuscleGroupBadge from '../components/ui/MuscleGroupBadge';

<MuscleGroupBadge muscleGroup="chest" />
<MuscleGroupBadge muscleGroup="back" label="Back Exercises" count={12} />
```

**Props:**
- `muscleGroup`: Muscle group ID (chest, back, legs, etc.)
- `label`: Optional custom label
- `selected`: Boolean for selected state
- `count`: Optional number to show count

## Usage Guidelines

1. Always use these components instead of native elements when possible
2. Follow the design system for consistent UI
3. Utilize the theme context for dark/light mode support
4. Keep components simple and composable

## Theming

All components automatically adapt to light and dark mode by using the `useExercise` hook which provides the current theme. 