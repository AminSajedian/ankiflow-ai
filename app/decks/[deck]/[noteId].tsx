import { ThemedText } from "@/components/ThemedText";
import { useAIInstructions } from "@/hooks/useAIInstructions";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAnkiContext } from "@/providers/AnkiProvider";
import { generateContent } from "@/utils/aiService";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
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

  // Animation values
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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

  // Animation when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Show loading if data is being fetched
  if (loading || instructionsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading note...</ThemedText>
      </View>
    );
  }

  const toggleFieldExpansion = (fieldName: string) => {
    setExpandedField(current => current === fieldName ? null : fieldName);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View>
          <ThemedText style={styles.headerTitle}>Edit Note</ThemedText>
          <View style={styles.noteTypeBadge}>
            <ThemedText style={styles.noteTypeText}>{noteType}</ThemedText>
          </View>
        </View>
        
        <Pressable
          style={({ pressed }) => [
            styles.instructionsToggle,
            pressed && styles.buttonPressed
          ]}
          onPress={() => setShowInstructions(!showInstructions)}
        >
          <ThemedText style={styles.instructionsToggleText}>
            {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
          </ThemedText>
          <Ionicons 
            name={showInstructions ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={textColor} 
          />
        </Pressable>
      </Animated.View>
      
      {Object.entries(fieldsData).map(([fieldName, field], index) => (
        <Animated.View 
          key={fieldName}
          style={[
            styles.fieldContainer,
            {
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50 + (index * 20), 0]
                })
              }],
              opacity: fadeAnim
            }
          ]}
        >
          {/* Field header with expand/collapse action */}
          <View style={[
            styles.fieldHeaderContainer,
            { backgroundColor: '#1a1a1a' }
          ]}>
            <View style={styles.fieldTitleRow}>
              <ThemedText style={styles.fieldTitle}>{fieldName}</ThemedText>
              <Pressable
                onPress={() => toggleFieldExpansion(fieldName)}
                style={({ pressed }) => [
                  styles.expandButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Ionicons 
                  name={expandedField === fieldName ? "chevron-up" : "chevron-down"}
                  size={22} 
                  color={textColor}
                />
              </Pressable>
            </View>
            {expandedField === fieldName && (
              <ThemedText style={styles.fieldDescription}>
                {field.description}
              </ThemedText>
            )}
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
              <View style={styles.instructionHeaderRow}>
                <MaterialIcons name="psychology-alt" size={18} color={textColor} />
                <ThemedText style={styles.instructionLabel}>
                  AI Instruction Template
                </ThemedText>
              </View>
              
              <TextInput
                style={[
                  styles.instructionInput,
                  {
                    color: textColor,
                    backgroundColor,
                    borderColor: borderColor,
                  }
                ]}
                multiline
                value={getInstruction(fieldName)}
                onChangeText={(text) => saveInstruction(fieldName, text)}
                placeholder={`Enter instruction for generating ${fieldName.toLowerCase()}...`}
                placeholderTextColor={`${textColor}80`}
              />
              
              <View style={styles.instructionNoteContainer}>
                <Ionicons name="information-circle-outline" size={16} color={textColor + "99"} />
                <ThemedText style={styles.instructionNote}>
                  This instruction template applies to all "{fieldName}" fields in "{noteType}" notes.
                </ThemedText>
              </View>
            </View>
          )}
          
          {/* Generate button */}
          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              isGenerating[fieldName] && styles.generateButtonDisabled,
              pressed && !isGenerating[fieldName] && styles.generateButtonPressed,
            ]}
            onPress={() => generateWithAI(fieldName)}
            disabled={isGenerating[fieldName]}
            android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {isGenerating[fieldName] ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <ThemedText style={styles.generatingText}>
                  Generating...
                </ThemedText>
              </View>
            ) : (
              <View style={styles.generateButtonContent}>
                <Ionicons name="flash" size={18} color="#FFFFFF" />
                <ThemedText style={styles.generateButtonText}>
                  Generate with AI
                </ThemedText>
              </View>
            )}
          </Pressable>
        </Animated.View>
      ))}
      
      {/* Save button */}
      <Pressable 
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.saveButtonPressed
        ]}
        onPress={saveNote}
      >
        <Ionicons name="save-outline" size={20} color="#FFFFFF" />
        <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
      </Pressable>
      
      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteTypeBadge: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  noteTypeText: {
    fontSize: 12,
    opacity: 0.8,
  },
  instructionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  instructionsToggleText: {
    marginRight: 6,
    fontSize: 14,
  },
  fieldContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldHeaderContainer: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  fieldTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fieldDescription: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  expandButton: {
    padding: 4,
  },
  fieldInput: {
    borderWidth: 1,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    borderTopWidth: 0,
  },
  instructionContainer: {
    padding: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
  },
  instructionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  instructionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  instructionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  instructionNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  instructionNote: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.7,
    marginLeft: 6,
    flex: 1,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  },
  generateButtonPressed: {
    backgroundColor: '#0056b3',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    backgroundColor: '#2da44e',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  }
});