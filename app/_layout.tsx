import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AnkiProvider } from "@/providers/AnkiProvider";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
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
          <View style={[styles.container, { backgroundColor }]}>
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
            />
          </View>
        </ThemeProvider>
      </AnkiProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});