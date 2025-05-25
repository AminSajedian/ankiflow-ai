// providers/AnkiProvider.tsx
import axios from "axios";
import { createContext, useContext } from "react";
import { Platform } from "react-native";

const isAndroid = Platform.OS === "android";
const ANKICONNECT_URL = "http://localhost:8765"; // or use your device's IP if needed

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

const warnNotAvailable = (fn: string) => {
  if (!isAndroid) {
    console.warn(
      `AnkiConnect integration only works on Android. '${fn}' will return fallback value.`
    );
    return;
  }
  console.warn(
    `AnkiConnect API not available or not running. '${fn}' will return fallback value.`
  );
};

async function ankiRequest<T = any>(action: string, params: any = {}): Promise<T | undefined> {
  try {
    const res = await axios.post(ANKICONNECT_URL, {
      action,
      version: 6,
      params,
    });
    if (res.data.error) {
      console.warn(`AnkiConnect error: ${res.data.error}`);
      return undefined;
    }
    return res.data.result;
  } catch (e: any) {
    console.warn("AnkiConnect HTTP error:", e && typeof e === "object" && "message" in e ? (e as any).message : e);
    return undefined;
  }
}

export function AnkiProvider({ children }: { children: React.ReactNode }) {
  const value: AnkiContextValue = {
    getDecks: async () => {
      if (!isAndroid) {
        warnNotAvailable("getDecks");
        return [];
      }
      const result = await ankiRequest<string[]>("deckNames");
      return result || [];
    },
    getNotes: async (deck) => {
      if (!isAndroid) {
        warnNotAvailable("getNotes");
        return [];
      }
      // Find notes in the deck using a search query
      const result = await ankiRequest<number[]>("findNotes", {
        query: `deck:"${deck}"`,
      });
      return result || [];
    },
    updateNote: async (noteId, fields) => {
      if (!isAndroid) {
        warnNotAvailable("updateNote");
        return;
      }
      await ankiRequest("updateNoteFields", {
        note: {
          id: noteId,
          fields,
        },
      });
    },
    getNoteFields: async (noteId) => {
      if (!isAndroid) {
        warnNotAvailable("getNoteFields");
        return {};
      }
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
