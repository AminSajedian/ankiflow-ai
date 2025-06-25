import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAnkiContext } from "@/providers/AnkiProvider";
import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

// Simplified note interface without full fields
interface Note {
  id: number;
  preview: string; // Just the preview text we need to display
}

export default function NoteList() {
  const { deck } = useLocalSearchParams<{ deck: string }>();
  const { getNotes, getNoteFields } = useAnkiContext(); // Need getNoteFields to get preview text
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const textColor = useThemeColor({}, "text");
  // const backgroundColor = useThemeColor({}, "background");

  // For fade-in animation of cards
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function loadNotes() {
      if (!deck) return;
      setLoading(true);
      try {
        // getNotes returns number[] (IDs only)
        const noteIds = await getNotes(deck);
        // console.log("🚀 ~ loadNotes ~ noteIds:", noteIds);
        
        // Transform note IDs into Note objects with previews
        const notesWithPreviews = await Promise.all(
          noteIds.map(async (id) => {
            const fields = await getNoteFields(id);
            console.log("🚀 ~ loadNotes ~ fields:", fields);
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
    
    // Start fade-in animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [deck, getNotes, getNoteFields, fadeAnim]);

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
      {/* Header with deck name and stats */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          {deck} 
          <ThemedText style={styles.notesCountText}> • {notes.length} notes</ThemedText>
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={textColor + "80"} style={styles.searchIcon} />
          <TextInput
            style={[
              styles.searchInput,
              { color: textColor }
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes..."
            placeholderTextColor={textColor + "60"}
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={textColor + "80"} />
            </Pressable>
          )}
        </View>
      </View>

      {filteredNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            {searchQuery ? "No matching notes found" : "No notes in this deck"}
          </ThemedText>
        </View>
      ) : (
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
              <Pressable>
                {({ pressed }) => (
                  <View style={[
                    styles.noteItem,
                    pressed && styles.noteItemPressed
                  ]}>
                    <ThemedText style={styles.notePreview}>
                      {item.preview}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={20} color={textColor + "60"} />
                  </View>
                )}
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    // marginBottom: 4,
  },
  notesCountText: {
    fontSize: 16,
    opacity: 0.7,
  },
  deckInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  deckCount: {
    fontSize: 16,
  },
  separator: {
    width: 8,
    height: 16,
    backgroundColor: '#64dd17', // Green color from screenshot
    marginHorizontal: 8,
  },
  deckName: {
    fontSize: 16,
    opacity: 0.7,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  noteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#111',
    marginBottom: 1,
  },
  noteItemPressed: {
    backgroundColor: '#222',
  },
  notePreview: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});