import React from 'react';
import { Stack } from 'expo-router';
import { AnkiDroidTest } from '@/components/AnkiDroidTest';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet } from 'react-native';

export default function AnkiDroidTestScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AnkiDroid API Test',
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
        }}
      />
      <AnkiDroidTest />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
