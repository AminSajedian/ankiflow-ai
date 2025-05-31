import { NativeModules, Platform } from 'react-native';
import { logger } from './logger';

const { AnkiDroid } = NativeModules;

interface AnkiDroidNativeInterface {
  isApiAvailable(): Promise<boolean>;
  getDeckNames(): Promise<string[]>;
  getModelNames(): Promise<string[]>;
  getFieldNames(modelName: string): Promise<string[]>;
  addNote(
    modelName: string,
    deckName: string,
    fields: Record<string, string>,
    tags?: string[]
  ): Promise<number>;
  findNotes(query: string): Promise<number[]>;
  loadNote(noteId: number): Promise<Record<string, string>>;
  updateNote(
    noteId: number,
    fields: Record<string, string>,
    tags?: string[]
  ): Promise<boolean>;
  syncCollection(): Promise<boolean>;
  openDeck(deckName: string): Promise<boolean>;
}

// Type guard for native module
function isAnkiDroidAvailable(module: any): module is AnkiDroidNativeInterface {
  return (
    typeof module.isApiAvailable === 'function' &&
    typeof module.getDeckNames === 'function'
  );
}

const AnkiDroidNative: AnkiDroidNativeInterface | null = 
  Platform.OS === 'android' && isAnkiDroidAvailable(AnkiDroid) 
    ? AnkiDroid 
    : null;

/**
 * Check if AnkiDroid API is available
 */
export async function checkConnection(): Promise<boolean> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return false;
  }

  try {
    const isAvailable = await AnkiDroidNative.isApiAvailable();
    logger.info(`AnkiDroid API available: ${isAvailable}`);
    return isAvailable;
  } catch (error) {
    logger.error('Error checking AnkiDroid API availability', error);
    return false;
  }
}

/**
 * Get all deck names
 */
export async function getDecks(): Promise<string[]> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return [];
  }

  try {
    const decks = await AnkiDroidNative.getDeckNames();
    logger.info(`Fetched ${decks.length} decks`);
    return decks;
  } catch (error) {
    logger.error('Error fetching decks', error);
    return [];
  }
}

/**
 * Get all notes in a deck
 */
export async function getDeckNotes(deckName: string): Promise<number[]> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return [];
  }

  try {
    const query = `deck:"${deckName}"`;
    const noteIds = await AnkiDroidNative.findNotes(query);
    logger.info(`Found ${noteIds.length} notes in deck: ${deckName}`);
    return noteIds;
  } catch (error) {
    logger.error(`Error finding notes for deck: ${deckName}`, error);
    return [];
  }
}

/**
 * Get note fields
 */
export async function getNoteFields(noteId: number): Promise<Record<string, string>> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return {};
  }

  try {
    const fields = await AnkiDroidNative.loadNote(noteId);
    logger.info(`Loaded fields for note: ${noteId}`);
    return fields;
  } catch (error) {
    logger.error(`Error loading note fields: ${noteId}`, error);
    return {};
  }
}

/**
 * Add a new note
 */
export async function addNote(
  modelName: string,
  deckName: string,
  fields: Record<string, string>,
  tags: string[] = []
): Promise<number | null> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return null;
  }

  try {
    const noteId = await AnkiDroidNative.addNote(modelName, deckName, fields, tags);
    logger.info(`Added note with ID: ${noteId}`);
    return noteId;
  } catch (error) {
    logger.error('Error adding note', error);
    return null;
  }
}

/**
 * Update existing note
 */
export async function updateNote(
  noteId: number,
  fields: Record<string, string>,
  tags: string[] = []
): Promise<boolean> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return false;
  }

  try {
    const success = await AnkiDroidNative.updateNote(noteId, fields, tags);
    logger.info(`Note ${noteId} update ${success ? 'succeeded' : 'failed'}`);
    return success;
  } catch (error) {
    logger.error(`Error updating note: ${noteId}`, error);
    return false;
  }
}

/**
 * Sync with AnkiWeb
 */
export async function syncWithAnkiWeb(): Promise<boolean> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return false;
  }

  try {
    const success = await AnkiDroidNative.syncCollection();
    logger.info(`Sync ${success ? 'succeeded' : 'failed'}`);
    return success;
  } catch (error) {
    logger.error('Error syncing collection', error);
    return false;
  }
}

/**
 * Open deck in AnkiDroid
 */
export async function openDeck(deckName: string): Promise<boolean> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return false;
  }

  try {
    const success = await AnkiDroidNative.openDeck(deckName);
    logger.info(`Opening deck ${deckName} ${success ? 'succeeded' : 'failed'}`);
    return success;
  } catch (error) {
    logger.error(`Error opening deck: ${deckName}`, error);
    return false;
  }
}

/**
 * Get available note types
 */
export async function getModelNames(): Promise<string[]> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return [];
  }

  try {
    const models = await AnkiDroidNative.getModelNames();
    logger.info(`Fetched ${models.length} model types`);
    return models;
  } catch (error) {
    logger.error('Error fetching model names', error);
    return [];
  }
}

/**
 * Get fields for a note type
 */
export async function getFieldNames(modelName: string): Promise<string[]> {
  if (!AnkiDroidNative) {
    logger.error('AnkiDroid native module not available');
    return [];
  }

  try {
    const fields = await AnkiDroidNative.getFieldNames(modelName);
    logger.info(`Fetched ${fields.length} fields for model: ${modelName}`);
    return fields;
  } catch (error) {
    logger.error(`Error fetching fields for model: ${modelName}`, error);
    return [];
  }
}

export default {
  checkConnection,
  getDecks,
  getDeckNotes,
  getNoteFields,
  addNote,
  updateNote,
  syncWithAnkiWeb,
  openDeck,
  getModelNames,
  getFieldNames,
};