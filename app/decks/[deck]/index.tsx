import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAnkiContext } from "@/providers/AnkiProvider";
import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

// Simplified note interface without full fields
interface Note {
  id: number;
  preview: string; // Just the preview text we need to display
}

export default function FlashcardList() {
  const { deck } = useLocalSearchParams<{ deck: string }>();
  const { getNotes, getNoteFields } = useAnkiContext(); // Need getNoteFields to get preview text
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  useEffect(() => {
    async function loadNotes() {
      if (!deck) return;
      setLoading(true);
      try {
        // getNotes returns number[] (IDs only)
        const noteIds = await getNotes(deck);
        console.log("🚀 ~ loadNotes ~ noteIds:", noteIds);
        
        // Transform note IDs into Note objects with previews
        const notesWithPreviews = await Promise.all(
          noteIds.map(async (id) => {
            const fields = await getNoteFields(id);
            // Get preview from the first field
            const firstFieldValue = Object.values(fields)[0]?.value || "Empty note";
            const preview = firstFieldValue.substring(0, 100) + 
              (firstFieldValue.length > 100 ? "..." : "");
            
            return {
              id,
              preview
            };
          })
        );
        
        setNotes(notesWithPreviews);
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

  const filterNotes = (notes: Note[], query: string) => {
    if (!query.trim()) return notes;
    const lowercaseQuery = query.toLowerCase();
    return notes.filter(note => 
      note.preview.toLowerCase().includes(lowercaseQuery)
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
                {item.preview}
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
