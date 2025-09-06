import { useThemeColor } from '@/hooks/useThemeColor';
import { useAnkiDroidContext } from '@/providers/AnkiDroidProvider';
import React, { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export function AnkiDroidTest() {
  const ankiDroid = useAnkiDroidContext();
  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [notes, setNotes] = useState<number[]>([]);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ status: null, message: '' });

  // theme-aware colors
  const bg = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const successBg = useThemeColor({ light: '#1e463a', dark: '#123826' }, 'background');
  const errorBg = useThemeColor({ light: '#4e2428', dark: '#6b2d2d' }, 'background');
  const infoBg = useThemeColor({ light: '#2e3c50', dark: '#213047' }, 'background');
  const itemBg = useThemeColor({ light: '#f7f7f7', dark: '#1a1a1a' }, 'background');
  const selectedBg = useThemeColor({ light: '#dfeef7', dark: '#2a3d55' }, 'background');

  const testConnection = async () => {
    setLoading(true);
    setTestResult({ status: 'info', message: 'Testing connection...' });
    try {
      const isConnected = await ankiDroid.checkConnection();
      setTestResult({
        status: isConnected ? 'success' : 'error',
        message: isConnected
          ? 'Successfully connected to AnkiDroid!'
          : 'Failed to connect to AnkiDroid. Make sure the app is installed and API access is enabled.'
      });
    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: `Error testing connection: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDecks = async () => {
    setLoading(true);
    setTestResult({ status: 'info', message: 'Loading decks...' });
    try {
      const deckList = await ankiDroid.getDecks();
      setDecks(deckList);
      setTestResult({
        status: 'success',
        message: `Found ${deckList.length} decks`
      });
    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: `Error loading decks: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (deckName: string) => {
    setLoading(true);
    setSelectedDeck(deckName);
    setTestResult({ status: 'info', message: `Loading notes for ${deckName}...` });
    try {
      const noteIds = await ankiDroid.getNotes(deckName);
      setNotes(noteIds);
      setTestResult({
        status: 'success',
        message: `Found ${noteIds.length} notes in ${deckName}`
      });
    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: `Error loading notes: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const openSelectedDeck = async () => {
    if (!selectedDeck) return;

    setLoading(true);
    setTestResult({ status: 'info', message: `Opening ${selectedDeck} in AnkiDroid...` });
    try {
      const success = await ankiDroid.openDeck(selectedDeck);
      setTestResult({
        status: success ? 'success' : 'error',
        message: success 
          ? `Opened ${selectedDeck} in AnkiDroid` 
          : `Failed to open ${selectedDeck}`
      });
    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: `Error opening deck: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const syncNow = async () => {
    setLoading(true);
    setTestResult({ status: 'info', message: 'Starting sync with AnkiWeb...' });
    try {
      const success = await ankiDroid.syncWithAnkiWeb();
      setTestResult({
        status: success ? 'success' : 'error',
        message: success 
          ? 'Sync started successfully' 
          : 'Failed to start sync'
      });
    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: `Error syncing: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bg }]}>
      <ThemedText style={styles.title}>AnkiDroid API Test</ThemedText>

      <View style={styles.buttonContainer}>
        <Button title="Test Connection" onPress={testConnection} disabled={loading} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Load Decks" onPress={loadDecks} disabled={loading} />
      </View>

      {selectedDeck && (
        <View style={styles.buttonContainer}>
          <Button title="Open in AnkiDroid" onPress={openSelectedDeck} disabled={loading} />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Sync with AnkiWeb" onPress={syncNow} disabled={loading} />
      </View>

      {loading && (
        <ActivityIndicator size="large" style={styles.loader} />
      )}

      {testResult.status && (
        <ThemedView 
          style={[
            styles.resultContainer, 
            testResult.status === 'success' && { backgroundColor: successBg },
            testResult.status === 'error' && { backgroundColor: errorBg },
            testResult.status === 'info' && { backgroundColor: infoBg },
          ]}
        >
          <ThemedText style={[styles.resultText, { color: textColor }]}>{testResult.message}</ThemedText>
        </ThemedView>
      )}

      <ScrollView style={styles.scrollView}>
        {decks.length > 0 && (
          <>
            <ThemedText style={styles.sectionTitle}>Decks:</ThemedText>
            {decks.map((deck, index) => (
              <ThemedView 
                key={index} 
                style={[styles.itemContainer, { backgroundColor: selectedDeck === deck ? selectedBg : itemBg }]}
              >
                <ThemedText 
                  style={[styles.itemText, { color: textColor }]} 
                  onPress={() => loadNotes(deck)}
                >
                  {deck}
                </ThemedText>
              </ThemedView>
            ))}
          </>
        )}

        {notes.length > 0 && selectedDeck && (
          <>
            <ThemedText style={styles.sectionTitle}>
              Notes in {selectedDeck}:
            </ThemedText>
            {notes.map((noteId, index) => (
              <ThemedView key={index} style={[styles.itemContainer, { backgroundColor: itemBg }]}> 
                <ThemedText style={[styles.itemText, { color: textColor }]}>ID: {noteId}</ThemedText>
              </ThemedView>
            ))}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 8,
  },
  loader: {
    marginVertical: 16,
  },
  resultContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  resultText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  itemContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
  },
  itemText: {
    fontSize: 14,
  },
});
