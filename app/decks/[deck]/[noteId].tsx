import { ThemedText } from "@/components/ThemedText";
import { useAIInstructions } from "@/hooks/useAIInstructions";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAnkiContext } from "@/providers/AnkiProvider";
import { generateContent } from "@/utils/aiService";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Toast from 'react-native-toast-message';

// Define interfaces
interface FieldWithDescription {
  value: string;
  description: string;
}

export default function NoteEditor() {
  const { deck, noteId } = useLocalSearchParams<{ deck: string, noteId: string }>();
  const { getNoteFields, updateNote, getNoteType } = useAnkiContext();
  
  const [fieldsData, setFieldsData] = useState<Record<string, FieldWithDescription>>({});
  const [noteType, setNoteType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Theme colors
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = textColor + "40";
  
  // Use AI instructions hook with the note's type
  const {
    loading: instructionsLoading,
    getInstruction,
    saveInstruction
  } = useAIInstructions(noteType);

  // Load note data and note type
  useEffect(() => {
    const loadNote = async () => {
      if (!noteId) return;
      
      try {
        setLoading(true);
        
        // First get the note type
        const type = await getNoteType(Number(noteId));
        // console.log("Note type:", type);
        setNoteType(type);
        
        // Then load note fields
        const fields = await getNoteFields(Number(noteId));
        setFieldsData(fields);
      } catch (error) {
        console.error("Error loading note:", error);
        Toast.show({
          type: 'error',
          text1: 'Failed to load note',
          position: 'bottom'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadNote();
  }, [noteId, getNoteFields, getNoteType]);

  // Handle updating field value - append new content with a separator
  const updateField = (fieldName: string, value: string) => {
    setFieldsData(prev => {
      const currentValue = prev[fieldName]?.value || "";
      // Add the separator (three hyphens) if both current value and new value exist
      const separator = currentValue && value ? "\n\n---\n\n" : "";
      
      return {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value: currentValue + separator + value
        }
      };
    });
  };

  // Generate content with AI
  const generateWithAI = async (targetFieldName: string) => {
    console.log("Generate button clicked for field:", targetFieldName);
    
    // Get the instruction for this field
    const fieldInstruction = getInstruction(targetFieldName);
    
    try {
      // Show loading state
      setIsGenerating(prev => ({ ...prev, [targetFieldName]: true }));
      console.log("Starting generation for field:", targetFieldName);
      
      // Get the field description
      const firstFieldValue = Object.values(fieldsData)[0]?.value;
      console.log("🚀 ~ generateWithAI ~ firstFieldValue:", firstFieldValue);
      
      // Call the AI service
      const content = await generateContent(targetFieldName, firstFieldValue, fieldInstruction);
      console.log("Generation successful, updating field:", targetFieldName);
      
      // Update the field
      updateField(targetFieldName, content);
      
      Toast.show({
        type: 'success',
        text1: 'Content generated',
        position: 'bottom'
      });
    } catch (error) {
      console.error("Error generating content:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to generate content',
        text2: error instanceof Error ? error.message : 'Unknown error',
        position: 'bottom'
      });
    } finally {
      // Reset generating state
      setIsGenerating(prev => ({ ...prev, [targetFieldName]: false }));
    }
  };

  // Save note changes
  const saveNote = async () => {
    if (!noteId) return;
    
    try {
      // Convert fieldsData to the format expected by updateNote
      const fieldsToUpdate: Record<string, string> = {};
      Object.entries(fieldsData).forEach(([fieldName, field]) => {
        fieldsToUpdate[fieldName] = field.value;
      });
      
      await updateNote(Number(noteId), fieldsToUpdate);
      
      Toast.show({
        type: 'success',
        text1: 'Note saved',
        position: 'bottom'
      });
    } catch (error) {
      console.error("Error saving note:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save note',
        position: 'bottom'
      });
    }
  };

  // Show loading if data is being fetched
  if (loading || instructionsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Edit Flashcard</ThemedText>
        <ThemedText style={styles.noteTypeText}>Note type: {noteType}</ThemedText>
        
        <Pressable
          style={styles.instructionsToggle}
          onPress={() => setShowInstructions(!showInstructions)}
        >
          <ThemedText style={styles.instructionsToggleText}>
            {showInstructions ? 'Hide All Field Instructions' : 'Show All Field Instructions'}
          </ThemedText>
          <Ionicons 
            name={showInstructions ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={textColor} 
          />
        </Pressable>
      </View>
      
      {Object.entries(fieldsData).map(([fieldName, field]) => (
        <View key={fieldName} style={styles.fieldContainer}>
          {/* Field title/header */}
          <View style={styles.fieldHeaderContainer}>
            <ThemedText style={styles.fieldTitle}>{fieldName}</ThemedText>
          </View>
          
          {/* Field content input */}
          <TextInput
            style={[
              styles.fieldInput,
              {
                color: textColor,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
              }
            ]}
            multiline
            value={field.value}
            onChangeText={(text) => updateField(fieldName, text)}
            placeholder={`Enter ${field.description.toLowerCase()}...`}
            placeholderTextColor={`${textColor}80`}
          />
          
          {/* AI instruction section (hidden by default) */}
          {showInstructions && (
            <View style={[
              styles.instructionContainer,
              { borderColor: borderColor }
            ]}>
              <ThemedText style={styles.instructionLabel}>
                AI Instruction for all {field.description} fields in {noteType}
              </ThemedText>
              
              <TextInput
                style={[
                  styles.instructionInput,
                  {
                    color: textColor,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                  }
                ]}
                multiline
                value={getInstruction(fieldName)}
                onChangeText={(text) => saveInstruction(fieldName, text)}
                placeholder={`Enter instruction for generating ${field.description.toLowerCase()}...`}
                placeholderTextColor={`${textColor}80`}
              />
              
              <ThemedText style={styles.instructionNote}>
                This instruction applies to "{fieldName}" field of all notes with "{noteType}" type.
              </ThemedText>
            </View>
          )}
          
          {/* Generate button */}
          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              isGenerating[fieldName] && styles.generateButtonDisabled,
              pressed && styles.generateButtonPressed, // Add visual feedback when pressed
            ]}
            onPress={() => {
              console.log("Generate button pressed for field:", fieldName);
              generateWithAI(fieldName);
            }}
            disabled={isGenerating[fieldName]}
            // Add extra properties to ensure it's touchable
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {isGenerating[fieldName] ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
                <ThemedText style={styles.generateButtonText}>
                  Generate with AI
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      ))}
      
      {/* Save button */}
      <Pressable 
        style={styles.saveButton}
        onPress={saveNote}
      >
        <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
      </Pressable>
      
      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noteTypeText: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.7,
  },
  instructionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  instructionsToggleText: {
    marginRight: 6,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldHeaderContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  fieldTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  fieldInput: {
    borderWidth: 1,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 16,
    borderTopWidth: 0,
  },
  instructionContainer: {
    padding: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    backgroundColor: '#1a1a1a30',
  },
  instructionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  instructionInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  instructionNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
    opacity: 0.7,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    // Make sure it's not hidden or has opacity: 0
    opacity: 1,
    zIndex: 1,
  },
  generateButtonDisabled: {
    backgroundColor: '#007AFF80',
  },
  generateButtonPressed: {
    backgroundColor: '#0056b3', // Darker color when pressed
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});