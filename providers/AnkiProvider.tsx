// providers/AnkiProvider.tsx
import { logger } from "@/utils/logger";
import { createContext, useContext } from "react";
import Toast from 'react-native-toast-message';
import { useNetwork } from './NetworkProvider';

const ANKICONNECT_URL = "http://127.0.0.1:8765";

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

  async function ankiRequest<T = any>(action: string, params: any = {}): Promise<T | undefined> {
    try {
      const { isOnline, hasAnkiConnect } = await checkConnections();
      if (!isOnline || !hasAnkiConnect) return undefined;

      logger.debug(`AnkiConnect requesting to: ${ANKICONNECT_URL}`);
      const res = await fetch(ANKICONNECT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          version: 6,
          params,
        }),
      });

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
      return data.result;
    } catch (e: any) {
      logger.error(`AnkiConnect failed: ${action}`, e.message);
      return undefined;
    }
  }

  const value: AnkiContextValue = {
    getDecks: async () => {
      try {
        const result = await ankiRequest<string[]>("deckNames");
        logger.debug('Fetched decks:', result);
        return result || [];
      } catch (error) {
        logger.error('Failed to get decks:', error);
        return [];
      }
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
