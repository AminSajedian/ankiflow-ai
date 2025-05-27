import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAnkiContext } from "@/providers/AnkiProvider";
import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

interface FieldWithDescription {
  value: string;
  description: string;
}

interface NoteWithFields {
  id: number;
  fields: Record<string, FieldWithDescription>;
}

export default function FlashcardList() {
  const { deck } = useLocalSearchParams<{ deck: string }>();
  const { getNotes, getNoteFields } = useAnkiContext();
  const [notes, setNotes] = useState<NoteWithFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  useEffect(() => {
    async function loadNotes() {
      if (!deck) return;
      setLoading(true);
      try {
        const noteIds = await getNotes(deck);
        const notesWithFields = await Promise.all(
          noteIds.map(async (id) => ({
            id,
            fields: await getNoteFields(id),
          }))
        );
        setNotes(notesWithFields);
      } finally {
        setLoading(false);
      }
    }
    loadNotes();
  }, [deck, getNotes, getNoteFields]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderNotePreview = (fields: Record<string, FieldWithDescription>) => {
    const firstField = Object.values(fields)[0]?.value || "Empty note";
    return firstField.substring(0, 100) + (firstField.length > 100 ? "..." : "");
  };

  const filterNotes = (notes: NoteWithFields[], query: string) => {
    if (!query.trim()) return notes;
    const lowercaseQuery = query.toLowerCase();
    return notes.filter(note => 
      Object.values(note.fields).some(field => 
        field.value.toLowerCase().includes(lowercaseQuery)
      )
    );
  };

  const filteredNotes = filterNotes(notes, searchQuery);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              color: textColor,
              backgroundColor: backgroundColor,
              borderColor: textColor,
            }
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search flashcards..."
          placeholderTextColor={textColor + "80"}
        />
        {searchQuery.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color={textColor} />
          </Pressable>
        )}
      </View>
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: "/decks/[deck]/[noteId]",
              params: { deck, noteId: item.id.toString() },
            }}
            asChild
          >
            <Pressable style={styles.noteItem}>
              <ThemedText style={styles.notePreview}>
                {renderNotePreview(item.fields)}
              </ThemedText>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    margin: 16,
    position: 'relative',
  },
  searchInput: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    paddingRight: 40, // Make room for the clear button
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  noteItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#333",
    backgroundColor: "#1a1a1a",
  },
  notePreview: {
    fontSize: 16,
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
