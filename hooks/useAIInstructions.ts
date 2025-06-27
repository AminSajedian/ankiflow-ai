import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

// Prefix for AsyncStorage keys
const STORAGE_PREFIX = 'ai_instruction_';

// Format: ai_instruction_[noteType]_[fieldName]
const getStorageKey = (noteType: string, fieldName: string): string => {
  return `${STORAGE_PREFIX}${noteType}_${fieldName}`;
};

export function useAIInstructions(noteType: string) {
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // --- Debounce refs ---
  // Use type 'any' for cross-platform compatibility (NodeJS.Timeout vs number)
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Load all instructions for this note type
  useEffect(() => {
    const loadInstructions = async () => {
      if (!noteType) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all keys from AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        
        // Filter keys that belong to this note type
        const prefix = `${STORAGE_PREFIX}${noteType}_`;
        const relevantKeys = keys.filter(key => key.startsWith(prefix));
        
        if (relevantKeys.length > 0) {
          // Get all values for these keys
          const values = await AsyncStorage.multiGet(relevantKeys);
          
          // Build instructions object
          const loadedInstructions: Record<string, string> = {};
          values.forEach(([key, value]) => {
            if (value) {
              const fieldName = key.replace(prefix, '');
              loadedInstructions[fieldName] = value;
            }
          });
          
          setInstructions(loadedInstructions);
        }
      } catch (error) {
        console.error('Error loading AI instructions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInstructions();
  }, [noteType]);

  // Get instruction for a specific field
  const getInstruction = useCallback((fieldName: string): string => {
    return instructions[fieldName] || '';
  }, [instructions]);

  // Save instruction for a field (debounced)
  const saveInstruction = useCallback((fieldName: string, instruction: string): void => {
    if (!noteType || !fieldName) return;

    setInstructions(prev => ({
      ...prev,
      [fieldName]: instruction
    }));

    // Clear any existing timer for this field
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
    }

    // Debounce save to AsyncStorage
    debounceTimers.current[fieldName] = setTimeout(async () => {
      try {
        const key = getStorageKey(noteType, fieldName);
        await AsyncStorage.setItem(key, instruction);
      } catch (error) {
        console.error('Error saving AI instruction:', error);
      }
    }, 500); // 500ms debounce
  }, [noteType]);

  // Get all instructions as a simple object
  const getAllInstructions = useCallback((): Record<string, string> => {
    return { ...instructions };
  }, [instructions]);

  return {
    loading,
    getInstruction,
    saveInstruction,
    getAllInstructions
  };
}
