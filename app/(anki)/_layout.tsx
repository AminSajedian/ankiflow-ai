import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

export default function AnkiLayout() {
  const backgroundColor = useThemeColor({}, "background");
  const headerTintColor = useThemeColor({}, "text");

  return (
    <ThemedView style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor,
          },
          headerTintColor,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="decks/index"
          options={{
            title: "Your Decks",
            headerRight: () => (
              <ThemedText style={styles.headerRight}>AnkiFlow AI</ThemedText>
            ),
          }}
        />
        <Stack.Screen
          name="decks/[deck]/index"
          options={{
            title: "Flashcards",
          }}
        />
        <Stack.Screen
          name="decks/[deck]/[noteId]"
          options={{
            title: "Edit Flashcard",
            headerRight: () => (
              <ThemedText style={styles.headerRight}>AI Assistant</ThemedText>
            ),
          }}
        />
      </Stack>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    marginRight: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});
