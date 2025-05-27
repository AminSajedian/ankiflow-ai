// providers/AnkiProvider.tsx
import { logger } from "@/utils/logger";
import { createContext, useContext, useRef } from "react";
import Toast from 'react-native-toast-message';
import { useNetwork } from './NetworkProvider';

const ANKICONNECT_URL = 'http://127.0.0.1:8765';

interface AnkiNoteField {
  value: string;
  order: number;
  description?: string;
}

interface AnkiNoteInfo {
  noteId: number;
  fields: Record<string, AnkiNoteField>;
}

interface FieldWithDescription {
  value: string;
  description: string;
}

interface AnkiContextValue {
  getDecks: () => Promise<string[]>;
  getNotes: (deck: string) => Promise<number[]>;
  updateNote: (noteId: number, fields: Record<string, string>) => Promise<void>;
  getNoteFields: (noteId: number) => Promise<Record<string, FieldWithDescription>>;
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
  const { checkConnection } = useNetwork();
  const isInitialConnection = useRef(true);

  async function ankiRequest<T = any>(action: string, params: any = {}): Promise<T | undefined> {
    try {
      if (!await checkConnection()) {
        Toast.show({
          type: 'error',
          text1: 'Network Unavailable',
          text2: 'Check your internet connection',
          autoHide: false,
          position: 'bottom',
        });
        return undefined;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(ANKICONNECT_URL, {
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

      // Show success toast on first successful connection
      if (res.ok && isInitialConnection.current) {
        Toast.show({
          type: 'success',
          text1: 'AnkiConnect Available',
          text2: 'Successfully connected to AnkiConnect',
          visibilityTime: 2000,
          position: 'bottom',
        });
        logger.info('Successfully connected to AnkiConnect');
        isInitialConnection.current = false;
      }

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
      
      // logger.debug(`AnkiConnect ${action} response:`, data.result);
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
      // logger.debug('Fetched decks:', result);
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
      const modelResult = await ankiRequest<AnkiNoteInfo[]>("notesInfo", {
        notes: [noteId],
      });

      if (modelResult?.[0]?.fields) {
        const fieldsArray = Object.entries(modelResult[0].fields)
          .map(([key, field]) => ({
            name: key,
            value: field.value,
            order: field.order,
            description: field.description || ''
          }))
          .sort((a, b) => a.order - b.order);

        const fields: Record<string, FieldWithDescription> = {};
        for (const field of fieldsArray) {
          fields[field.name] = {
            value: field.value,
            description: field.description
          };
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
