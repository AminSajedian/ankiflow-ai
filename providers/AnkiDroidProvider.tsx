import React, { createContext, useContext, useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
// import { getDecks, getDeckNotes, addNote, syncWithAnkiWeb, openDeck } from '@/utils/ankidroid';
import { getDecks, getDeckNotes, addNote, syncWithAnkiWeb, openDeck } from '@/utils/ankidroidNative';
import { logger } from '@/utils/logger';
import { useNetwork } from './NetworkProvider';

interface FieldWithDescription {
  value: string;
  description: string;
}

interface AnkiDroidContextValue {
  getDecks: () => Promise<string[]>;
  getNotes: (deck: string) => Promise<number[]>;
  updateNote: (noteId: number, fields: Record<string, string>) => Promise<void>;
  getNoteFields: (noteId: number) => Promise<Record<string, FieldWithDescription>>;
  addNote: (modelName: string, deckName: string, fields: Record<string, string>, tags?: string[]) => Promise<number | null>;
  syncWithAnkiWeb: () => Promise<boolean>;
  openDeck: (deckName: string) => Promise<boolean>;
  isConnected: boolean;
  checkConnection: () => Promise<boolean>;
}

const AnkiDroidContext = createContext<AnkiDroidContextValue>({
  getDecks: async () => [],
  getNotes: async () => [],
  updateNote: async () => {},
  getNoteFields: async () => ({}),
  addNote: async () => null,
  syncWithAnkiWeb: async () => false,
  openDeck: async () => false,
  isConnected: false,
  checkConnection: async () => false,
});

export function useAnkiDroidContext() {
  return useContext(AnkiDroidContext);
}

export function AnkiDroidProvider({ children }: { children: React.ReactNode }) {
  const { checkConnection } = useNetwork();
  const [isConnected, setIsConnected] = useState(false);

  const checkAnkiDroidConnection = useCallback(async () => {
    try {
      if (!await checkConnection()) {
        Toast.show({
          type: 'error',
          text1: 'Network Unavailable',
          text2: 'Check your internet connection',
          autoHide: false,
          position: 'bottom',
        });
        return false;
      }

      // Test if we can connect to AnkiDroid by trying to get decks
      const decks = await getDecks();
      const connected = Array.isArray(decks);
      setIsConnected(connected);

      if (connected) {
        logger.info('Successfully connected to AnkiDroid');
        Toast.show({
          type: 'success',
          text1: 'AnkiDroid Available',
          text2: 'Successfully connected to AnkiDroid',
          visibilityTime: 2000,
          position: 'bottom',
        });
      } else {
        logger.warn('Failed to connect to AnkiDroid');
        Toast.show({
          type: 'error',
          text1: 'AnkiDroid Connection Failed',
          text2: 'Make sure AnkiDroid is installed and API access is enabled',
          autoHide: false,
          position: 'bottom',
        });
      }

      return connected;
    } catch (error: any) {
      logger.error('Error checking AnkiDroid connection', error);
      setIsConnected(false);
      return false;
    }
  }, [checkConnection]);

  const getDecksWrapper = useCallback(async () => {
    try {
      if (!await checkAnkiDroidConnection()) {
        return [];
      }

      const decks = await getDecks();
      logger.info('Fetched decks from AnkiDroid', { count: decks.length });
      return decks;
    } catch (error: any) {
      logger.error('Error fetching decks from AnkiDroid', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Get Decks',
        text2: error.message || 'Unknown error',
        autoHide: false,
        position: 'bottom',
      });
      return [];
    }
  }, [checkAnkiDroidConnection]);

  const getNotesWrapper = useCallback(async (deckName: string) => {
    try {
      if (!await checkAnkiDroidConnection()) {
        return [];
      }

      const notes = await getDeckNotes(deckName);
      logger.info(`Fetched notes for deck: ${deckName}`, { count: notes.length });
      return notes;
    } catch (error: any) {
      logger.error(`Error fetching notes for deck: ${deckName}`, error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Get Notes',
        text2: error.message || 'Unknown error',
        autoHide: false,
        position: 'bottom',
      });
      return [];
    }
  }, [checkAnkiDroidConnection]);

  // Note: These methods are placeholders since the Android intent API
  // doesn't currently provide direct access to individual note fields or updating notes
  // You would need to implement custom intents or another solution for these functions
  const updateNoteWrapper = useCallback(async (_noteId: number, _fields: Record<string, string>) => {
    // Not implemented yet
    Toast.show({
      type: 'info',
      text1: 'Note Update Not Available',
      text2: 'Direct note updates are not supported via Android Intents',
      position: 'bottom',
    });
  }, []);

  const getNoteFieldsWrapper = useCallback(async (_noteId: number) => {
    // Not implemented yet
    return {};
  }, []);

  const addNoteWrapper = useCallback(async (
    modelName: string,
    deckName: string,
    fields: Record<string, string>,
    tags: string[] = []
  ) => {
    try {
      if (!await checkAnkiDroidConnection()) {
        return null;
      }

      const noteId = await addNote(modelName, deckName, fields, tags);
      if (noteId !== null) {
        logger.info('Added note to AnkiDroid', { noteId, deckName });
        Toast.show({
          type: 'success',
          text1: 'Note Added',
          text2: `Added to deck: ${deckName}`,
          visibilityTime: 2000,
          position: 'bottom',
        });
      }
      return noteId;
    } catch (error: any) {
      logger.error('Error adding note to AnkiDroid', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Add Note',
        text2: error.message || 'Unknown error',
        autoHide: false,
        position: 'bottom',
      });
      return null;
    }
  }, [checkAnkiDroidConnection]);

  const syncWithAnkiWebWrapper = useCallback(async () => {
    try {
      if (!await checkAnkiDroidConnection()) {
        return false;
      }

      const success = await syncWithAnkiWeb();
      if (success) {
        logger.info('Started sync with AnkiWeb');
        Toast.show({
          type: 'success',
          text1: 'Sync Started',
          text2: 'AnkiDroid is syncing with AnkiWeb',
          visibilityTime: 2000,
          position: 'bottom',
        });
      }
      return success;
    } catch (error: any) {
      logger.error('Error syncing with AnkiWeb', error);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: error.message || 'Unknown error',
        autoHide: false,
        position: 'bottom',
      });
      return false;
    }
  }, [checkAnkiDroidConnection]);

  const openDeckWrapper = useCallback(async (deckName: string) => {
    try {
      if (!await checkAnkiDroidConnection()) {
        return false;
      }

      const success = await openDeck(deckName);
      if (success) {
        logger.info(`Opened deck in AnkiDroid: ${deckName}`);
      }
      return success;
    } catch (error: any) {
      logger.error(`Error opening deck in AnkiDroid: ${deckName}`, error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Open Deck',
        text2: error.message || 'Unknown error',
        autoHide: false,
        position: 'bottom',
      });
      return false;
    }
  }, [checkAnkiDroidConnection]);

  const value: AnkiDroidContextValue = {
    getDecks: getDecksWrapper,
    getNotes: getNotesWrapper,
    updateNote: updateNoteWrapper,
    getNoteFields: getNoteFieldsWrapper,
    addNote: addNoteWrapper,
    syncWithAnkiWeb: syncWithAnkiWebWrapper,
    openDeck: openDeckWrapper,
    isConnected,
    checkConnection: checkAnkiDroidConnection,
  };

  return (
    <AnkiDroidContext.Provider value={value}>{children}</AnkiDroidContext.Provider>
  );
}
