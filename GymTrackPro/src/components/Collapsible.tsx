import React, { useState, PropsWithChildren } from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
;
export function Collapsible({ children, title }: PropsWithChildren<{ title: string }>) {
  const [collapsed, setCollapsed] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? Colors.dark.text : Colors.light.text;
  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        activeOpacity={0.7}
      >
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={iconColor}
        />
      </TouchableOpacity>
      {!collapsed && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
});
