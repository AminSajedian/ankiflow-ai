// providers/AnkiProvider.tsx
import { createContext, useContext } from "react";
import { Platform } from 'react-native';
import AnkiDroid from 'react-native-ankidroid';

const isAndroid = Platform.OS === 'android';

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
    console.warn(`AnkiDroid integration only works on Android. '${fn}' will return fallback value.`);
    return;
  }
  AnkiDroid.isApiAvailable().then((installed: boolean) => {
    if (!installed) {
      console.warn(`AnkiDroid app is not installed. '${fn}' will return fallback value.`);
    } else {
      console.warn(`AnkiDroid ContentProvider not available or permission not granted. '${fn}' will return fallback value.`);
    }
  });
};

async function ensurePermission(): Promise<boolean> {
  if (!isAndroid) return false;
  try {
    const hasPermission = await AnkiDroid.checkPermission();
    if (hasPermission) return true;
    const [err, result] = await AnkiDroid.requestPermission();
    if (err) {
      console.warn("AnkiDroid: Permission request error", err);
      return false;
    }
    return result === 'granted';
  } catch (e) {
    console.warn("AnkiDroid: Permission check/request failed", e);
    return false;
  }
}

function hasMessage(obj: any): obj is { message: string } {
  return obj && typeof obj === 'object' && typeof obj.message === 'string';
}

export function AnkiProvider({ children }: { children: React.ReactNode }) {
  const value: AnkiContextValue = {
    getDecks: async () => {
      if (!isAndroid) {
        warnNotAvailable('getDecks');
        return [];
      }
      let [error, decks] = await AnkiDroid.getDeckList();
      if (error && error.message === 'PERMISSION_DENIED_BY_USER') {
        const granted = await ensurePermission();
        if (granted) {
          [error, decks] = await AnkiDroid.getDeckList();
        }
      }
      if (error || !decks) {
        console.warn("AnkiDroid: getDeckList error", error);
        return [];
      }
      return decks.map(d => d.name);
    },
    getNotes: async (deck) => {
      if (!isAndroid) {
        warnNotAvailable('getNotes');
        return [];
      }
      if (typeof (AnkiDroid as any).getNotes === 'function') {
        try {
          let notes = await (AnkiDroid as any).getNotes(`deck:"${deck}"`);
          // If permission denied, try to request and retry once
          if (hasMessage(notes) && notes.message === 'PERMISSION_DENIED_BY_USER') {
            const granted = await ensurePermission();
            if (granted) {
              notes = await (AnkiDroid as any).getNotes(`deck:"${deck}"`);
            }
          }
          return notes || [];
        } catch (e) {
          console.error("Failed to get notes:", e);
          return [];
        }
      } else {
        warnNotAvailable('getNotes');
        return [];
      }
    },
    updateNote: async (noteId, fields) => {
      if (!isAndroid) {
        warnNotAvailable('updateNote');
        return;
      }
      if (typeof (AnkiDroid as any).updateNote === 'function') {
        try {
          await (AnkiDroid as any).updateNote(noteId, fields);
        } catch (e) {
          if (hasMessage(e) && e.message === 'PERMISSION_DENIED_BY_USER') {
            const granted = await ensurePermission();
            if (granted) {
              try {
                await (AnkiDroid as any).updateNote(noteId, fields);
              } catch (err) {
                console.error("Failed to update note after permission:", err);
              }
            }
          } else {
            console.error("Failed to update note:", e);
          }
        }
      } else {
        warnNotAvailable('updateNote');
      }
    },
    getNoteFields: async (noteId) => {
      if (!isAndroid) {
        warnNotAvailable('getNoteFields');
        return {};
      }
      if (typeof (AnkiDroid as any).getNoteFields === 'function') {
        try {
          let fields = await (AnkiDroid as any).getNoteFields(noteId);
          if (hasMessage(fields) && fields.message === 'PERMISSION_DENIED_BY_USER') {
            const granted = await ensurePermission();
            if (granted) {
              fields = await (AnkiDroid as any).getNoteFields(noteId);
            }
          }
          return fields || {};
        } catch (e) {
          console.error("Failed to get note fields:", e);
          return {};
        }
      } else {
        warnNotAvailable('getNoteFields');
        return {};
      }
    },
  };

  return <AnkiContext.Provider value={value}>{children}</AnkiContext.Provider>;
}
