import { ThemedText } from "@/components/ThemedText";
import { useAIInstructions } from "@/hooks/useAIInstructions";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAnkiContext } from "@/providers/AnkiProvider";
import { generateContent } from "@/utils/aiService";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from "expo-router";
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
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
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

  const toggleFieldInstruction = (fieldName: string) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Add Stack.Screen with save button in header */}
      <Stack.Screen
        options={{
          title: noteType || "Edit Note",
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerRight: () => (
            <Pressable
              onPress={saveNote}
              style={({ pressed }) => [
                styles.headerSaveButton,
                pressed && { opacity: 0.7 }
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="save-outline" size={24} color="#34C759" />
            </Pressable>
          ),
        }}
      />
      
      {/* Header with note type and instructions toggle */}
      <Animated.View 
        style={[styles.header, { opacity: fadeAnim }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.noteTypeBadge}>
            <ThemedText style={styles.noteTypeText}>{noteType}</ThemedText>
          </View>
          
          <Pressable
            style={({ pressed }) => [
              styles.instructionsToggle,
              pressed && styles.buttonPressed
            ]}
            onPress={() => setShowInstructions(!showInstructions)}
          >
            <ThemedText style={styles.instructionsToggleText}>
              {showInstructions ? 'Hide All Instructions' : 'Show All Instructions'}
            </ThemedText>
            <Ionicons 
              name={showInstructions ? "chevron-up" : "chevron-down"} 
              size={18} 
              color="#64dd17" 
            />
          </Pressable>
        </View>
      </Animated.View>
      
      {/* Fields listing */}
      {Object.entries(fieldsData).map(([fieldName, field], index) => {
        const isExpanded = expandedFields[fieldName] || showInstructions;
        
        return (
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
              isExpanded && styles.fieldHeaderExpanded
            ]}>
              <View style={styles.fieldTitleRow}>
                <View style={styles.fieldTitleWrapper}>
                  <ThemedText style={styles.fieldTitle}>{fieldName}</ThemedText>
                </View>
                <Pressable
                  onPress={() => toggleFieldInstruction(fieldName)}
                  style={({ pressed }) => [
                    styles.expandButton,
                    pressed && styles.buttonPressed
                  ]}
                >
                  <View style={[
                    styles.expandButtonContainer, 
                    isExpanded && styles.expandButtonActive
                  ]}>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20} 
                      color={isExpanded ? "#64dd17" : textColor + "CC"}
                    />
                  </View>
                </Pressable>
              </View>
            </View>
            
            {/* Field content input */}
            <TextInput
              style={[
                styles.fieldInput,
                {
                  color: textColor,
                  backgroundColor: backgroundColor === '#000' ? '#0a0a0a' : backgroundColor,
                  borderColor: borderColor,
                }
              ]}
              multiline
              value={field.value}
              onChangeText={(text) => {
                const fieldValue = fieldsData[fieldName]?.value || '';
                updateField(fieldName, text.substring(fieldValue.length));
              }}
              placeholder={`Enter ${fieldName.toLowerCase()}...`}
              placeholderTextColor={`${textColor}60`}
            />
            
            {/* AI instruction section */}
            {isExpanded && (
              <View style={styles.instructionContainer}>
                <View style={styles.instructionHeaderRow}>
                  <MaterialIcons name="psychology-alt" size={18} color="#64dd17" />
                  <ThemedText style={styles.instructionLabel}>
                    AI Template
                  </ThemedText>
                </View>
                
                <TextInput
                  style={[
                    styles.instructionInput,
                    {
                      color: textColor,
                      backgroundColor: backgroundColor === '#000' ? '#111' : backgroundColor,
                      borderColor: "#64dd17" + "40",
                    }
                  ]}
                  multiline
                  value={getInstruction(fieldName)}
                  onChangeText={(text) => saveInstruction(fieldName, text)}
                  placeholder={`How should AI generate this ${fieldName.toLowerCase()}?`}
                  placeholderTextColor={`${textColor}60`}
                />
                
                <View style={styles.instructionNoteContainer}>
                  <Ionicons name="information-circle-outline" style={styles.instructionNoteIcon} size={16} color="#64dd17" />
                  <ThemedText style={styles.instructionNote}>
                    This template applies to the "{fieldName}" field of "{noteType}" note type.
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
                  <MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.generateButtonText}>
                  Generate with AI
                  </ThemedText>
                </View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
      
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  headerRow: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTypeBadge: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  noteTypeText: {
    fontSize: 14,
    opacity: 0.8,
  },
  instructionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 221, 23, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instructionsToggleText: {
    marginRight: 6,
    fontSize: 14,
    color: '#64dd17',
    fontWeight: '500',
  },
  fieldContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  fieldHeaderContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  fieldHeaderPressable: {
    padding: 16,
  },
  fieldHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 221, 23, 0.3)',
  },
  fieldTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fieldTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expandButtonContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  expandButtonActive: {
    backgroundColor: 'rgba(100, 221, 23, 0.15)',
  },
  expandButton: {
    // padding: 4,
  },
  fieldInput: {
    borderWidth: 1,
    padding: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
  instructionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 221, 23, 0.2)',
    backgroundColor: 'rgba(100, 221, 23, 0.05)',
  },
  instructionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#64dd17',
  },
  instructionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 22,
  },
  instructionNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 0,
    paddingTop: 8,
  },
  instructionNoteIcon: {
    marginTop: 3,
    marginRight: 0,
    opacity: 0.8,
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
  headerSaveButton: {
    padding: 8,
    marginRight: 0,
  },
  buttonPressed: {
    opacity: 0.7,
  }
});