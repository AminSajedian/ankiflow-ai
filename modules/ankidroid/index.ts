import { requireOptionalNativeModule } from 'expo-modules-core';

export interface AnkiDroidPermissionResponse {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  canAskAgain: boolean;
}

export interface AnkiDroidNoteInfo {
  noteId: number;
  modelName: string;
  tags: string[];
  mod: number;
  fields: Record<string, { value: string; order: number }>;
}

interface AnkiDroidModule {
  isInstalled(): boolean;
  getPermissionsAsync(): Promise<AnkiDroidPermissionResponse>;
  requestPermissionsAsync(): Promise<AnkiDroidPermissionResponse>;
  deckNames(): Promise<string[]>;
  findNotes(search: string): Promise<number[]>;
  notesInfo(noteIds: number[]): Promise<AnkiDroidNoteInfo[]>;
  updateNoteFields(noteId: number, fields: Record<string, string>): Promise<void>;
  modelNamesAndIds(): Promise<Record<string, number>>;
  modelFieldNames(modelName: string): Promise<string[]>;
}

// null on platforms without the native module (web, iOS)
export default requireOptionalNativeModule<AnkiDroidModule>('AnkiDroid');
