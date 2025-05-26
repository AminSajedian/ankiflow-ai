import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { DeckNode, flattenDeckTree, organizeDeckTree } from "@/utils/deckOrganizer";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet } from "react-native";
import Toast from 'react-native-toast-message';
import { useAnkiContext } from "../../providers/AnkiProvider";

export default function DeckList() {
  const { getDecks } = useAnkiContext();
  const [allDecks, setAllDecks] = useState<string[]>([]);
  const [deckTree, setDeckTree] = useState<DeckNode | null>(null);
  const [visibleDecks, setVisibleDecks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDecks = useCallback(async (showToast = false) => {
    try {
      setError(null);
      const result = await getDecks();
      setAllDecks(result);
      const tree = organizeDeckTree(result);
      setDeckTree(tree);
      setVisibleDecks(flattenDeckTree(tree));
      if (showToast) {
        Toast.show({
          type: 'success',
          text1: 'Decks Updated',
          text2: `${result.length} decks found`,
          visibilityTime: 2000,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load decks: ${errorMessage}`);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Decks',
        text2: errorMessage,
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDecks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDecks(true);
  }, [loadDecks]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const toggleDeck = useCallback((deckName: string) => {
    if (!deckTree) return;
    
    const parts = deckName.split('::');
    let current = deckTree;
    parts.forEach(part => {
      current = current.children[part];
    });
    current.isExpanded = !current.isExpanded;
    setVisibleDecks(flattenDeckTree(deckTree));
  }, [deckTree]);

  const handleDeckPress = (deckName: string, isParent: boolean) => {
    if (isParent) {
      toggleDeck(deckName);
    } else {
      router.push({ pathname: "/decks/[deck]", params: { deck: deckName } });
    }
  };

  const renderDeckItem = ({ item }: { item: string }) => {
    const level = item.split('::').length - 1;
    const isParent = allDecks.some(deck => 
      deck !== item && deck.startsWith(item + '::')
    );
    const displayName = item.split('::').pop() || item;

    return (
      <Pressable 
        style={({ pressed }) => [
          styles.deckItem,
          { marginLeft: level * 16 },
          pressed && styles.deckItemPressed
        ]}
        onPress={() => handleDeckPress(item, isParent)}
      >
        <ThemedView style={styles.deckItemContent}>
          {isParent && (
            <Ionicons 
              name="chevron-down-outline" 
              size={20} 
              color="#fff" 
              style={styles.chevron} 
            />
          )}
          <ThemedText style={styles.deckTitle} numberOfLines={1}>
            {displayName}
          </ThemedText>
        </ThemedView>
      </Pressable>
    );
  };

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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      data={visibleDecks}
      keyExtractor={(item) => item}
      renderItem={renderDeckItem}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  deckItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  deckItemPressed: {
    backgroundColor: '#2a2a2a',
  },
  deckItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chevron: {
    width: 20,
    opacity: 0.7,
  },
  deckTitle: {
    fontSize: 16,
    flex: 1,
    color: '#fff',
    fontWeight: '500',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    margin: 20,
  },
});
