// ParallaxScrollView.js
import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Animated,
  Dimensions,
  useColorScheme,
} from 'react-native';
import Colors from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 240;

export default function ParallaxScrollView({
  headerComponent,
  children,
  style,
  contentContainerStyle,
  refreshControl,
  scrollEnabled = true,
  ...props
}) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.6, HEADER_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        scrollEnabled={scrollEnabled}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={refreshControl}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerComponent ? HEADER_HEIGHT : 0 },
          contentContainerStyle
        ]}
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </Animated.ScrollView>

      {headerComponent && (
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerTranslateY }],
              opacity: headerOpacity,
            },
          ]}
        >
          {headerComponent}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: HEADER_HEIGHT,
    zIndex: 1,
    overflow: 'hidden',
  }
}); 