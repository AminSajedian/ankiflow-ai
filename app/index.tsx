import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Pressable } from 'react-native';

export default function HomeLayout() {
  const iconColor = useThemeColor({}, "text");

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Your Decks",
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="settings-outline" size={24} color={iconColor} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
