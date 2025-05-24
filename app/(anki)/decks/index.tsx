import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useAnkiContext } from "../../../providers/AnkiProvider";

export default function DeckList() {
  const { getDecks } = useAnkiContext();
  const [decks, setDecks] = useState<string[]>([]);
  console.log("🚀 ~ DeckList ~ decks:", decks)

  useEffect(() => {
    getDecks().then(setDecks);
  }, [getDecks]);

  return (
    <FlatList
      data={decks}
      keyExtractor={(item) => item}
      renderItem={({ item }: { item: string }) => (
        <Link
          href={{ pathname: "/(anki)/decks/[deck]", params: { deck: item } }}
          asChild
        >
          <Pressable style={styles.deckItem}>
            <Text>{item}</Text>
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
