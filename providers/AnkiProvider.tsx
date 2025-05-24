// providers/AnkiProvider.tsx
import { createContext, useContext } from "react";
import { Platform } from 'react-native';
import SendIntentAndroid from 'react-native-send-intent';

type AnkiAction =
  | "deckNames"
  | "findNotes"
  | "updateNoteFields"
  | "getNoteFields";

interface AnkiContextValue {
  getDecks: () => Promise<string[]>;
  getNotes: (deck: string) => Promise<string[]>;
  updateNote: (noteId: string, fields: Record<string, string>) => Promise<void>;
  getNoteFields: (noteId: string) => Promise<Record<string, string>>;
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

// Helper to send broadcast and receive result via intent callback
const sendAnkiIntent = async (
  action: AnkiAction,
  extras: Record<string, any> = {}
): Promise<string> => {
  console.log("🚀 ~ sendAnkiIntent ~ action:", action);

  if (Platform.OS !== 'android') {
    console.error('AnkiDroid integration only works on Android');
    return '';
  }

  // react-native-send-intent uses sendBroadcast, not sendBroadcastIntent
  try {
    const extrasObj = {
      api_version: 6,
      ...extras,
      action,
    };

    await SendIntentAndroid.sendBroadcast({
      action: "com.ichi2.anki.action.API",
      extras: extrasObj,
    });

    // No result is returned; AnkiDroid API via intent is fire-and-forget.
    return "";
  } catch (error) {
    console.error("AnkiDroid error:", error);
    return '';
  }
};

export function AnkiProvider({ children }: { children: React.ReactNode }) {
  // No async loading needed for SendIntentAndroid (it's imported at the top)
  // Always available after import

  const value: AnkiContextValue = {
    getDecks: async () => {
      try {
        await sendAnkiIntent("deckNames");
        // No result will be returned; this is a limitation of intent broadcast
        // You may want to use a ContentProvider for real data
        console.warn("AnkiProvider: getDecks cannot receive data via broadcast intent. Returning [].");
        return [];
      } catch (e) {
        console.error("Failed to get decks:", e);
        return [];
      }
    },
    getNotes: async (deck) => {
      try {
        await sendAnkiIntent("findNotes", {
          query: `deck:"${deck}"`,
        });
        // No result will be returned; this is a limitation of intent broadcast
        console.warn("AnkiProvider: getNotes cannot receive data via broadcast intent. Returning [].");
        return [];
      } catch (e) {
        console.error("Failed to get notes:", e);
        return [];
      }
    },
    updateNote: async (noteId, fields) => {
      try {
        await sendAnkiIntent("updateNoteFields", {
          noteId,
          fields: JSON.stringify(fields),
        });
      } catch (e) {
        console.error("Failed to update note:", e);
      }
    },
    getNoteFields: async (noteId) => {
      try {
        await sendAnkiIntent("getNoteFields", { noteId });
        // No result will be returned; this is a limitation of intent broadcast
        console.warn("AnkiProvider: getNoteFields cannot receive data via broadcast intent. Returning {}.");
        return {};
      } catch (e) {
        console.error("Failed to get note fields:", e);
        return {};
      }
    },
  };

  return <AnkiContext.Provider value={value}>{children}</AnkiContext.Provider>;
}
