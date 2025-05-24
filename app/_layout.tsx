import { Slot } from "expo-router";
import { AnkiProvider } from "../providers/AnkiProvider";

export default function RootLayout() {
  return (
    <AnkiProvider>
      <Slot />
    </AnkiProvider>
  );
}
