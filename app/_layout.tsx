import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AnkiProvider } from "@/providers/AnkiProvider";
import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

export default function AnkiLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, "background");
  const headerTintColor = useThemeColor({}, "text");

  return (
    <AnkiProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
            <Stack.Screen
              name="+not-found"
              options={{
                title: "Not Found",
              }}
            />
          </Stack>
        </ThemedView>
      </ThemeProvider>
    </AnkiProvider>
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
