import { useAnkiContext } from "../../../../providers/AnkiProvider";
// import { generateFieldContent } from "@/utils/ai";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";


export default function FlashcardEditor() {
  const { noteId } = useLocalSearchParams<{ deck: string; noteId: string }>();
  const { updateNote, getNoteFields } = useAnkiContext();
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (noteId) {
      getNoteFields(noteId).then(setFields);
    }
  }, [noteId, getNoteFields]);

  const handleAI = async (fieldName: string) => {
    // const newContent = await generateFieldContent(
    //   `Generate content for ${fieldName} about ${fields.Front || "this topic"}`
    // );
    // setFields((prev) => ({ ...prev, [fieldName]: newContent ?? "" }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Object.entries(fields).map(([name, value]) => (
        <View key={name} style={styles.fieldContainer}>
          <Text style={styles.label}>{name}</Text>
          <TextInput
            style={styles.input}
            value={typeof value === "string" ? value : ""}
            onChangeText={(t) => setFields((prev) => ({ ...prev, [name]: t ?? "" }))}
          />
          <Button title="AI Enhance" onPress={() => handleAI(name)} />
        </View>
      ))}
      <Button
        title="Save"
        onPress={() => noteId && updateNote(noteId, fields)}
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
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
});
