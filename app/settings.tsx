import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getApiKey, saveApiKey } from '@/utils/aiService';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  // Load API key on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await getApiKey();
        if (key) {
          setApiKey(key);
        }
      } catch (error) {
        console.error('Error loading API key:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApiKey();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Toast.show({
        type: 'error',
        text1: 'API Key Required',
        text2: 'Please enter a valid Gemini API key',
        position: 'bottom',
      });
      return;
    }

    setSaving(true);
    
    try {
      await saveApiKey(apiKey.trim());
      Toast.show({
        type: 'success',
        text1: 'API Key Saved',
        text2: 'Your Gemini API key has been saved',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      Toast.show({
        type: 'error',
        text1: 'Error Saving API Key',
        text2: 'Please try again',
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>AI Settings</ThemedText>
          
          <ThemedText style={styles.label}>Gemini API Key</ThemedText>
          <View style={styles.apiKeyContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: textColor,
                  backgroundColor,
                  borderColor: textColor + '40',
                }
              ]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your Gemini API key"
              placeholderTextColor={textColor + '80'}
              secureTextEntry={!isVisible}
            />
            <Pressable 
              style={styles.visibilityButton}
              onPress={() => setIsVisible(!isVisible)}
            >
              <Ionicons 
                name={isVisible ? 'eye-off' : 'eye'} 
                size={24} 
                color={textColor} 
              />
            </Pressable>
          </View>
          
          <ThemedText style={styles.helperText}>
            You need a Gemini API key to use AI features. Get one at{' '}
            <ThemedText
              style={styles.link}
              onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
            >
              https://aistudio.google.com/app/apikey
            </ThemedText>
          </ThemedText>

          <Pressable
            style={[styles.saveButton, saving && styles.savingButton]}
            onPress={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Save API Key</ThemedText>
            )}
          </Pressable>
        </View>
      </View>
      
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  apiKeyContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    paddingRight: 50,
  },
  visibilityButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  helperText: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
    lineHeight: 20,
  },
  link: {
    color: '#3498db',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
