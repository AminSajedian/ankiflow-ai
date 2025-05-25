import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { useAnkiContext } from "../../../providers/AnkiProvider";
import { ThemedText } from "@/components/ThemedText";

export default function FlashcardList() {
  const { deck } = useLocalSearchParams<{ deck: string }>();
  const { getNotes } = useAnkiContext();
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    if (deck) {
      getNotes(deck).then(setNotes);
    }
  }, [deck, getNotes]);

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item}
      renderItem={({ item }: { item: string }) => (
        <Link
          href={{
            pathname: "/decks/[deck]/[noteId]",
            params: { deck, noteId: item },
          }}
          asChild
        >
          <Pressable style={styles.noteItem}>
            <ThemedText>Note ID: {item}</ThemedText>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  noteItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
