import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { useAnkiContext } from "../../providers/AnkiProvider";

export default function DeckList() {
  const { getDecks } = useAnkiContext();
  const [decks, setDecks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDecks();
      console.log("Loaded decks:", result);
      setDecks(result);
    } catch (e) {
      console.error("Failed to load decks:", e);
      setError("Failed to load decks. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [getDecks]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={styles.error}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={decks}
      keyExtractor={(item) => item}
      renderItem={({ item }: { item: string }) => (
        <Link
          href={{ pathname: "/decks/[deck]", params: { deck: item } }}
          asChild
        >
          <Pressable style={styles.deckItem}>
            <ThemedText>{item}</ThemedText>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "red",
    textAlign: "center",
    margin: 20,
  },
  deckItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
