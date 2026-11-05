// providers/AnkiProvider.tsx
import AnkiDroid from "@/modules/ankidroid";
import { logger } from "@/utils/logger";
import { createContext, useContext, useRef } from "react";
import Toast from 'react-native-toast-message';

// Used only where the native AnkiDroid module is unavailable (e.g. web with desktop Anki)
const ANKICONNECT_URL = 'http://127.0.0.1:8765';

interface AnkiNoteField {
  value: string;
  order: number;
  description?: string;
}

interface AnkiNoteInfo {
  noteId: number;
  fields: Record<string, AnkiNoteField>;
  modelName?: string;
  tags?: string[];
  cardIds?: number[];
  mod?: number; // modification time
}

interface FieldWithDescription {
  value: string;
  description: string;
}

interface NoteType {
  id: number;
  name: string;
  fields: string[];
}

interface NoteWithInfo {
  fields: Record<string, FieldWithDescription>;
  created: number;
  noteId: number;
}

interface AnkiContextValue {
  getDecks: () => Promise<string[]>;
  getNotes: (deck: string) => Promise<number[]>;
  updateNote: (noteId: number, fields: Record<string, string>) => Promise<void>;
  getNoteFields: (noteId: number) => Promise<Record<string, FieldWithDescription>>;
  updateNoteFields: (noteId: number, fields: Record<string, FieldWithDescription>) => Promise<boolean>;
  getNoteType: (noteId: number) => Promise<string>;
  getNoteTypeFields: (modelName: string) => Promise<string[]>;
  getAllNoteTypes: () => Promise<NoteType[]>;
  getNotesFieldsBatch: (noteIds: number[]) => Promise<NoteWithInfo[]>;
}

const AnkiContext = createContext<AnkiContextValue>({
  getDecks: async () => [],
  getNotes: async () => [],
  updateNote: async () => {},
  getNoteFields: async () => ({}),
  updateNoteFields: async () => false,
  getNoteType: async () => '',
  getNoteTypeFields: async () => [],
  getAllNoteTypes: async () => [],
  getNotesFieldsBatch: async () => [],
});

export function useAnkiContext() {
  return useContext(AnkiContext);
}

export function AnkiProvider({ children }: { children: React.ReactNode }) {
  const isInitialConnection = useRef(true);
  const hasAnkiDroidPermission = useRef(false);

  async function ensureAnkiDroidPermission() {
    if (hasAnkiDroidPermission.current) return;
    if (!AnkiDroid!.isInstalled()) {
      throw new Error('AnkiDroid is not installed. Install it from Google Play and open it once.');
    }
    let permission = await AnkiDroid!.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) {
      permission = await AnkiDroid!.requestPermissionsAsync();
    }
    if (!permission.granted) {
      throw new Error('Access to AnkiDroid was denied. Allow it in Settings › Apps › AnkiFlow AI › Permissions.');
    }
    hasAnkiDroidPermission.current = true;
  }

  // Maps the AnkiConnect-style actions used below onto AnkiDroid's own API
  async function ankiDroidRequest(action: string, params: any): Promise<any> {
    await ensureAnkiDroidPermission();
    switch (action) {
      case 'deckNames':
        return AnkiDroid!.deckNames();
      case 'findNotes':
        return AnkiDroid!.findNotes(params.query);
      case 'notesInfo':
        return AnkiDroid!.notesInfo(params.notes);
      case 'updateNoteFields':
        return AnkiDroid!.updateNoteFields(params.note.id, params.note.fields);
      case 'modelNamesAndIds':
        return AnkiDroid!.modelNamesAndIds();
      case 'modelFieldNames':
        return AnkiDroid!.modelFieldNames(params.modelName);
      default:
        throw new Error(`Unsupported AnkiDroid action: ${action}`);
    }
  }

  async function ankiRequest<T = any>(action: string, params: any = {}): Promise<T | undefined> {
    if (AnkiDroid) {
      try {
        const result = await ankiDroidRequest(action, params);
        if (isInitialConnection.current) {
          logger.info('Successfully connected to AnkiDroid');
          isInitialConnection.current = false;
        }
        return result;
      } catch (e: any) {
        Toast.show({
          type: 'error',
          text1: 'AnkiDroid Error',
          text2: e.message,
          autoHide: false,
          position: 'bottom',
          onPress: () => Toast.hide(),
        });
        logger.error(`AnkiDroid failed: ${action}`, e.message);
        return undefined;
      }
    }

    try {
      // Remove network check for local AnkiConnect actions

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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

  const getNoteType = async (noteId: number): Promise<string> => {
    const result = await ankiRequest<AnkiNoteInfo[]>("notesInfo", { notes: [noteId] });
    return result?.[0]?.modelName ?? '';
  };
  
  const updateNoteFields = async (noteId: number, fields: Record<string, FieldWithDescription>): Promise<boolean> => {
    try {
      // Implement your logic to update note fields in Anki
      // This is a placeholder - replace with your actual implementation
      console.log(`Updating fields for note ${noteId}`, fields);
      
      // Return true if successful
      return true;
    } catch (error) {
      console.error('Error updating note fields:', error);
      return false;
    }
  };

  const getNoteTypeFields = async (modelName: string): Promise<string[]> => {
    const result = await ankiRequest<string[]>("modelFieldNames", { modelName });
    return result ?? [];
  };

  const getAllNoteTypes = async (): Promise<NoteType[]> => {
    const namesAndIds = await ankiRequest<Record<string, number>>("modelNamesAndIds");
    if (!namesAndIds) return [];

    const noteTypes: NoteType[] = [];
    for (const [name, id] of Object.entries(namesAndIds)) {
      noteTypes.push({ id, name, fields: await getNoteTypeFields(name) });
    }
    return noteTypes;
  };
  
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
    updateNoteFields,
    getNoteType,
    getNoteTypeFields,
    getAllNoteTypes,
    getNotesFieldsBatch: async (noteIds) => {
      if (!noteIds.length) return [];
      const modelResult = await ankiRequest<AnkiNoteInfo[]>("notesInfo", {
        notes: noteIds,
      });
      if (!modelResult) return [];
      
      return modelResult.map(noteInfo => {
        const fieldsArray = Object.entries(noteInfo.fields)
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
        
        // Use note ID to approximate creation time (Anki note IDs are sequential)
        // Convert note ID to approximate timestamp (note IDs start from timestamp in milliseconds)
        const created = Math.floor(noteInfo.noteId / 1000);
        
        return {
          fields,
          created,
          noteId: noteInfo.noteId
        };
      });
    },
  };

  return (
    <AnkiContext.Provider value={value}>{children}</AnkiContext.Provider>
  );
}