import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAnkiContext } from "@/providers/AnkiProvider";
import { generateFieldContent } from "@/utils/ai";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import Toast from 'react-native-toast-message';

interface FieldData {
  value: string;
  description: string;
}

export default function FlashcardEditor() {
  const { noteId } = useLocalSearchParams<{ deck: string; noteId: string }>();
  const { updateNote, getNoteFields } = useAnkiContext();
  const [fields, setFields] = useState<Record<string, FieldData>>({});

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  useEffect(() => {
    if (noteId) {
      getNoteFields(parseInt(noteId)).then((result) => {
        setFields(result);
      });
    }
  }, [noteId, getNoteFields]);

  const handleAI = async (fieldName: string) => {
    const firstField = Object.values(fields)[0]?.value || "this topic";
    const fieldDescription = fields[fieldName]?.description || fieldName;
    console.log("🚀 ~ handleAI ~ fields:", fields)
    console.log("🚀 ~ handleAI ~ fields[fieldName]:", fields[fieldName])
    console.log("🚀 ~ handleAI ~ fields[fieldName].description:", fields[fieldName].description)
    
    const newContent = await generateFieldContent(
      `Generate ${fieldDescription} for "${firstField}"`
    );
    
    setFields((prev) => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], value: newContent?.trim() ?? "" }
    }));
  };

  const handleSave = async () => {
    if (!noteId) return;
    
    try {
      // Convert fields back to simple value format for saving
      const simpleFields = Object.entries(fields).reduce((acc, [key, field]) => {
        acc[key] = field.value;
        return acc;
      }, {} as Record<string, string>);

      await updateNote(parseInt(noteId), simpleFields);
      Toast.show({
        type: 'success',
        text1: 'Note Updated',
        text2: 'Changes saved successfully',
        visibilityTime: 2000,
        position: 'bottom',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error?.message || 'Failed to update note',
        position: 'bottom',
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {Object.entries(fields).map(([name, field]) => (
          <ThemedView key={name} style={styles.fieldContainer}>
            <ThemedText style={styles.label}>{name}</ThemedText>
            {field.description && (
              <ThemedText style={styles.description}>{field.description}</ThemedText>
            )}
            <TextInput
              style={[styles.input, {
                color: textColor,
                backgroundColor: backgroundColor,
                borderColor: textColor,
              }]}
              value={field.value}
              onChangeText={(t) => setFields(prev => ({
                ...prev,
                [name]: { ...prev[name], value: t }
              }))}
              placeholderTextColor={textColor + "80"}
              multiline
            />
            <Button 
              title="AI Enhance" 
              onPress={() => handleAI(name)} 
            />
          </ThemedView>
        ))}
        <Button title="Save" onPress={handleSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100, // Add extra padding at bottom for keyboard
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
});
