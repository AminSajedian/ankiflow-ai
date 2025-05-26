// providers/AnkiProvider.tsx
import { logger } from "@/utils/logger";
import axios from "axios";
import { createContext, useContext } from "react";

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

async function ankiRequest<T = any>(action: string, params: any = {}): Promise<T | undefined> {
  try {
    logger.debug(`AnkiConnect request: ${action}`, params);
    const res = await axios.post(ANKICONNECT_URL, {
      action,
      version: 6,
      params,
    });
    
    if (res.data.error) {
      logger.error(`AnkiConnect error: ${action}`, res.data.error);
      return undefined;
    }
    logger.debug(`AnkiConnect response: ${action}`, res.data.result);
    return res.data.result;
  } catch (e: any) {
    logger.error(`AnkiConnect failed: ${action}`, e.message);
    return undefined;
  }
}

export function AnkiProvider({ children }: { children: React.ReactNode }) {
  const value: AnkiContextValue = {
    getDecks: async () => {
      const result = await ankiRequest<string[]>("deckNames");
      return result || [];
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
