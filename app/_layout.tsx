import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AnkiProvider } from "@/providers/AnkiProvider";
import { NetworkProvider } from '@/providers/NetworkProvider';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import Toast from 'react-native-toast-message';

export default function AnkiLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, "background");
  const headerTintColor = useThemeColor({}, "text");

  return (
    <NetworkProvider>
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
                  // headerRight: () => (
                  //   <ThemedText style={styles.headerRight}>AnkiFlow AI</ThemedText>
                  // ),
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
                  title: "AI Flashcard Editor",
                  // headerRight: () => (
                  //   <ThemedText style={styles.headerRight}>AI Assistant</ThemedText>
                  // ),
                }}
              />
              <Stack.Screen
                name="+not-found"
                options={{
                  title: "Not Found",
                }}
              />
            </Stack>
            <Toast
              position='bottom'
              bottomOffset={20}
              config={{
                success: ({ text1, text2 }) => (
                  <ThemedView style={styles.toast}>
                    <ThemedText style={styles.toastTitle}>{text1}</ThemedText>
                    {text2 && <ThemedText style={styles.toastMessage}>{text2}</ThemedText>}
                  </ThemedView>
                ),
                error: ({ text1, text2 }) => (
                  <ThemedView style={[styles.toast, styles.errorToast]}>
                    <ThemedText style={styles.toastTitle}>{text1}</ThemedText>
                    {text2 && <ThemedText style={styles.toastMessage}>{text2}</ThemedText>}
                  </ThemedView>
                ),
              }}
            />
          </ThemedView>
        </ThemeProvider>
      </AnkiProvider>
    </NetworkProvider>
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
  toast: {
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  toastMessage: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
});
