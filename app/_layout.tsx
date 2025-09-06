import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AnkiProvider } from "@/providers/AnkiProvider";
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

  // changed: explicit toast backgrounds that adapt to light/dark using useThemeColor overrides
  const successBg = useThemeColor({ light: '#4CAF50', dark: '#2e7d32' }, 'background');
  const errorBg = useThemeColor({ light: '#F44336', dark: '#b71c1c' }, 'background');
  const infoBg = useThemeColor({ light: '#2196F3', dark: '#1565c0' }, 'background');

  // use a theme-aware text color for toasts (keeps white on colored toasts but uses the hook)
  const toastTextColor = useThemeColor({ light: '#fff', dark: '#fff' }, 'text');

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
                }}
              />
              <Stack.Screen
                name="decks/[deck]/index"
                options={{
                  title: "Notes",
                }}
              />
              <Stack.Screen
                name="decks/[deck]/[noteId]"
                options={{
                  title: "AI Note Editor",
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
                // changed: use the dynamic bg colors above and force white text on colored toasts
                success: ({ text1, text2 }) => (
                  <ThemedView style={[styles.toast, { backgroundColor: successBg }]}>
                    <ThemedText style={[styles.toastTitle, { color: toastTextColor }]}>{text1}</ThemedText>
                    {text2 && <ThemedText style={[styles.toastMessage, { color: toastTextColor }]}>{text2}</ThemedText>}
                  </ThemedView>
                ),
                error: ({ text1, text2 }) => (
                  <ThemedView style={[styles.toast, { backgroundColor: errorBg }]}>
                    <ThemedText style={[styles.toastTitle, { color: toastTextColor }]}>{text1}</ThemedText>
                    {text2 && <ThemedText style={[styles.toastMessage, { color: toastTextColor }]}>{text2}</ThemedText>}
                  </ThemedView>
                ),
                info: ({ text1, text2 }) => (
                  <ThemedView style={[styles.toast, { backgroundColor: infoBg }]}>
                    <ThemedText style={[styles.toastTitle, { color: toastTextColor }]}>{text1}</ThemedText>
                    {text2 && <ThemedText style={[styles.toastMessage, { color: toastTextColor }]}>{text2}</ThemedText>}
                  </ThemedView>
                ),
              }}
            />
          </ThemedView>
        </ThemeProvider>
      </AnkiProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toast: {
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    // backgroundColor removed; toast bg provided inline per type using theme-aware colors
  },
  errorToast: {
    // removed fixed background
  },
  infoToast: {
    // removed fixed background
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color removed here; set inline so it can be forced to white on colored backgrounds
  },
  toastMessage: {
    fontSize: 14,
    marginTop: 4,
  },
});