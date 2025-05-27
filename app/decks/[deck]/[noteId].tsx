import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { generateFieldContent } from "@/utils/ai";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useAnkiContext } from "@/providers/AnkiProvider";

export default function FlashcardEditor() {
  const { noteId } = useLocalSearchParams<{ deck: string; noteId: string }>();
  const { updateNote, getNoteFields } = useAnkiContext();
  const [fields, setFields] = useState<Record<string, string>>({});

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  useEffect(() => {
    if (noteId) {
      getNoteFields(parseInt(noteId)).then(setFields);
    }
  }, [noteId, getNoteFields]);

  const handleAI = async (fieldName: string) => {
    const newContent = await generateFieldContent(
      `Generate content for ${fieldName} about ${fields.Front || "this topic"}`
    );
    setFields((prev) => ({ ...prev, [fieldName]: newContent ?? "" }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Object.entries(fields).map(([name, value]) => (
        <ThemedView key={name} style={styles.fieldContainer}>
          <ThemedText style={styles.label}>{name}</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                color: textColor,
                backgroundColor: backgroundColor,
                borderColor: textColor,
              },
            ]}
            value={typeof value === "string" ? value : ""}
            onChangeText={(t) => setFields((prev) => ({ ...prev, [name]: t ?? "" }))}
            placeholderTextColor={textColor + "80"}
            multiline
          />
          <Button title="AI Enhance" onPress={() => handleAI(name)} />
        </ThemedView>
      ))}
      <Button
        title="Save"
        onPress={() => noteId && updateNote(parseInt(noteId), fields)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
});
