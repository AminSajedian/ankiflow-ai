// providers/AnkiProvider.tsx
import { logger } from "@/utils/logger";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNetwork } from './NetworkProvider';

const ANKICONNECT_URLS = Platform.OS === 'android' 
  ? [
      'http://127.0.0.1:8765',
      'http://10.0.2.2:8765',  // Android emulator
      'http://localhost:8765'
    ]
  : ['http://127.0.0.1:8765'];

async function findWorkingAnkiConnectUrl(): Promise<string | null> {
  for (const url of ANKICONNECT_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'version',
          version: 6
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data?.result >= 6) {
        return url;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

interface AnkiContextValue {
  getDecks: () => Promise<string[]>;
  getNotes: (deck: string) => Promise<number[]>;
  updateNote: (noteId: number, fields: Record<string, string>) => Promise<void>;
  getNoteFields: (noteId: number) => Promise<Record<string, string>>;
}

const AnkiContext = createContext<AnkiContextValue>({
  getDecks: async () => [],
  getNotes: async () => [],
  updateNote: async () => {},
  getNoteFields: async () => ({}),
});

export function useAnkiContext() {
  return useContext(AnkiContext);
}

export function AnkiProvider({ children }: { children: React.ReactNode }) {
  const { checkConnections } = useNetwork();
  const [ankiConnectUrl, setAnkiConnectUrl] = useState<string | null>(null);

  useEffect(() => {
    findWorkingAnkiConnectUrl().then(setAnkiConnectUrl);
  }, []);

  async function ankiRequest<T = any>(action: string, params: any = {}): Promise<T | undefined> {
    try {
      const { isOnline, hasAnkiConnect } = await checkConnections();
      if (!isOnline || !hasAnkiConnect || !ankiConnectUrl) {
        logger.debug(`AnkiConnect not available - online: ${isOnline}, hasAnkiConnect: ${hasAnkiConnect}, url: ${ankiConnectUrl}`);
        return undefined;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      logger.debug(`AnkiConnect requesting to: ${ankiConnectUrl}`);
      const res = await fetch(ankiConnectUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          action,
          version: 6,
          params,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        logger.error(`HTTP error for ${action}:`, { status: res.status, body: errorText });
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        Toast.show({
          type: 'error',
          text1: 'AnkiConnect Error',
          text2: data.error,
          autoHide: false,
          position: 'bottom',
          onPress: () => Toast.hide(),
        });
        logger.error(`AnkiConnect error: ${action}`, data.error);
        return undefined;
      }
      
      logger.debug(`AnkiConnect ${action} response:`, data.result);
      return data.result;
    } catch (e: any) {
      const message = e.name === 'AbortError' 
        ? 'Request timed out' 
        : e.message;
      
      Toast.show({
        type: 'error',
        text1: 'AnkiConnect Error',
        text2: `Request failed:\n${message}`,
        autoHide: false,
        position: 'bottom',
        onPress: () => Toast.hide(),
      });
      logger.error(`AnkiConnect failed: ${action}`, message);
      return undefined;
    }
  }

  const value: AnkiContextValue = {
    getDecks: async () => {
      const result = await ankiRequest<string[]>("deckNames");
      if (!result) {
        logger.warn('getDecks returned no results');
        return [];
      }
      logger.debug('Fetched decks:', result);
      return result;
    },
    getNotes: async (deck) => {
      // Find notes in the deck using a search query
      const result = await ankiRequest<number[]>("findNotes", {
        query: `deck:"${deck}"`,
      });
      return result || [];
    },
    updateNote: async (noteId, fields) => {
      await ankiRequest("updateNoteFields", {
        note: {
          id: noteId,
          fields,
        },
      });
    },
    getNoteFields: async (noteId) => {
      // Get note info and extract fields
      const result = await ankiRequest<any[]>("notesInfo", {
        notes: [noteId],
      });
      if (result && result.length > 0 && result[0].fields) {
        // result[0].fields is an object: { FieldName: { value: string, order: number }, ... }
        const fields: Record<string, string> = {};
        for (const key in result[0].fields) {
          fields[key] = result[0].fields[key].value;
        }
        return fields;
      }
      return {};
    },
  };

  return (
    <AnkiContext.Provider value={value}>{children}</AnkiContext.Provider>
  );
}
