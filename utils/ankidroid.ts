import { Platform } from 'react-native';
// import { sendIntent } from 'react-native-android-intent';
import { logger } from './logger';

// AnkiDroid intent actions
const ACTIONS = {
  ADD_NOTE: 'com.ichi2.anki.ADD_NOTE',
  VIEW_DECK: 'com.ichi2.anki.VIEW_DECK',
  DO_SYNC: 'com.ichi2.anki.DO_SYNC',
  API_GET_DECKS: 'com.ichi2.anki.API_GET_DECKS',
  API_GET_DECK_NOTES: 'com.ichi2.anki.API_GET_DECK_NOTES',
  OPEN_COLLECTION: 'com.ichi2.anki.OPEN_COLLECTION'
};

// Interface for AnkiDroid response
interface AnkiDroidResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Send an intent to AnkiDroid
 * @param action The action to perform
 * @param extras Additional data to send with the intent
 * @returns Promise that resolves with the response from AnkiDroid
 */
export function sendAnkiDroidIntent(
  action: string,
  extras: Record<string, any> = {}
): Promise<AnkiDroidResponse> {
  if (Platform.OS !== 'android') {
    logger.error('AnkiDroid API is only available on Android');
    return Promise.resolve({
      success: false,
      error: 'AnkiDroid API is only available on Android'
    });
  }

  return new Promise((resolve) => {
    try {
      // sendIntent(
      //   action,
      //   extras,
      //   (result) => {
      //     try {
      //       // Parse the result JSON if it exists
      //       const parsedResult = result ? JSON.parse(result) : { success: true };
      //       logger.info(`AnkiDroid intent success: ${action}`, parsedResult);
      //       resolve({
      //         success: true,
      //         data: parsedResult
      //       });
      //     } catch (error) {
      //       // If we can't parse the result, still consider it a success
      //       // but return the raw string
      //       logger.warn(`AnkiDroid intent result parse error: ${action}`, error);
      //       resolve({
      //         success: true,
      //         data: result
      //       });
      //     }
      //   },
      //   (error) => {
      //     logger.error(`AnkiDroid intent error: ${action}`, error);
      //     resolve({
      //       success: false,
      //       error
      //     });
      //   }
      // );
    } catch (error: any) {
      logger.error(`Error sending intent to AnkiDroid: ${action}`, error);
      resolve({
        success: false,
        error: error?.message || 'Unknown error'
      });
    }
  });
}

/**
 * Get all decks from AnkiDroid
 * @returns Promise that resolves with the list of decks
 */
export async function getDecks(): Promise<string[]> {
  const response = await sendAnkiDroidIntent(ACTIONS.API_GET_DECKS);

  if (!response.success || !response.data) {
    logger.error('Failed to get decks from AnkiDroid', response.error);
    return [];
  }

  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get all notes in a deck from AnkiDroid
 * @param deckName The name of the deck
 * @returns Promise that resolves with the list of note IDs
 */
export async function getDeckNotes(deckName: string): Promise<number[]> {
  const response = await sendAnkiDroidIntent(ACTIONS.API_GET_DECK_NOTES, {
    deckName
  });

  if (!response.success || !response.data) {
    logger.error(`Failed to get notes for deck: ${deckName}`, response.error);
    return [];
  }

  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Trigger a sync with AnkiWeb
 */
export async function syncWithAnkiWeb(): Promise<boolean> {
  const response = await sendAnkiDroidIntent(ACTIONS.DO_SYNC);
  return response.success;
}

/**
 * Open a specific deck in AnkiDroid
 * @param deckName The name of the deck to open
 */
export async function openDeck(deckName: string): Promise<boolean> {
  const response = await sendAnkiDroidIntent(ACTIONS.VIEW_DECK, { deckName });
  return response.success;
}

/**
 * Add a note to AnkiDroid
 * @param modelName The name of the note type
 * @param deckName The name of the deck
 * @param fields Key-value pairs of field names and values
 * @param tags Optional tags to add to the note
 */
export async function addNote(
  modelName: string,
  deckName: string,
  fields: Record<string, string>,
  tags: string[] = []
): Promise<number | null> {
  const response = await sendAnkiDroidIntent(ACTIONS.ADD_NOTE, {
    modelName,
    deckName,
    fields,
    tags: tags.join(' ')
  });

  if (!response.success) {
    logger.error('Failed to add note to AnkiDroid', response.error);
    return null;
  }

  // The response should contain the ID of the newly created note
  return typeof response.data === 'number' ? response.data : null;
}
