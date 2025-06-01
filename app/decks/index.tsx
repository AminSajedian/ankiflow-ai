import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { DeckNode, flattenDeckTree, organizeDeckTree } from "@/utils/deckOrganizer";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
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

  // Animation value for list items
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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

    // Animate the list items when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [loadDecks, fadeAnim]);

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

  const renderDeckItem = ({ item, index }: { item: string, index: number }) => {
    const level = item.split('::').length - 1;
    const isParent = allDecks.some(deck =>
      deck !== item && deck.startsWith(item + '::')
    );
    const displayName = item.split('::').pop() || item;

    // Calculate staggered animation delay based on index
    const animDelay = index * 50;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          }),
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }}
      >
        <View
          style={[
            styles.deckItemContainer,
            { marginLeft: level * 16 + (level > 0 ? 8 : 0) }
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.deckItem,
              pressed && styles.deckItemPressed
            ]}
            android_ripple={{
              color: 'rgba(255,255,255,0.1)',
              borderless: false,
              foreground: true
            }}
            onPress={() => handleDeckPress(item, isParent)}
          >
            <View style={styles.deckItemContent}>

              <ThemedText style={styles.deckTitle} numberOfLines={1}>
                {displayName}
              </ThemedText>

              {isParent && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#fff"
                  style={styles.chevron}
                />
              )}
            </View>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#64dd17" />
        <ThemedText style={styles.loadingText}>Loading your decks...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ff4444" />
        <ThemedText style={styles.error}>{error}</ThemedText>
        <Pressable style={styles.retryButton} onPress={() => loadDecks()}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Your Decks",
          headerTitleStyle: styles.headerTitle,
          headerStyle: { backgroundColor: '#121212' },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && { opacity: 0.7 }
              ]}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <FlatList
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#64dd17"
            colors={["#64dd17"]}
          />
        }
        data={visibleDecks}
        keyExtractor={(item) => item}
        renderItem={renderDeckItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cards-outline" size={60} color="#333" />
            <ThemedText style={styles.emptyText}>No decks found</ThemedText>
            <ThemedText style={styles.emptySubText}>Pull down to refresh</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerButton: {
    marginRight: -6,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  deckItemContainer: {
    marginVertical: 6,
    marginRight: 0,
    borderRadius: 12,
    overflow: 'hidden', // This ensures the ripple effect stays within borders
  },
  deckItem: {
    backgroundColor: '#1a1a1a',
    width: '100%', // Ensure the pressable takes full width
  },
  deckItemPressed: {
    backgroundColor: '#252525',
  },
  deckItemContent: {
    flexDirection: 'row',
    alignItems: 'center',  // This also adds padding on all sides including right
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 8,  // Reduce right padding
  },
  chevron: {
    // marginLeft: 'auto',
    opacity: 0.6,
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
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    margin: 20,
  },
  retryButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
});
