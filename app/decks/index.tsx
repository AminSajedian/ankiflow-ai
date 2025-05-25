import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { useAnkiContext } from "../../providers/AnkiProvider";
import { ThemedText } from "@/components/ThemedText";
// import { ThemedView } from "@/components/ThemedView";

export default function DeckList() {
  const { getDecks } = useAnkiContext();
  const [decks, setDecks] = useState<string[]>([]);
  // console.log("🚀 ~ DeckList ~ decks:", decks)

  useEffect(() => {
    getDecks().then(setDecks);
  }, [getDecks]);

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
  deckItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
