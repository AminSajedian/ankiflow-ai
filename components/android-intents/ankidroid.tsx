import { AnkiDroidTest } from '@/components/AnkiDroidTest';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function AnkiDroidTestScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AnkiDroid API Test',
          headerStyle: {
            backgroundColor: backgroundColor,
          },
          headerTintColor: textColor,
        }}
      />
      <AnkiDroidTest />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
