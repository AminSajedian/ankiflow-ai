import { GoogleGenAI } from "@google/genai";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";

// API key storage key
const API_KEY_STORAGE_KEY = 'gemini_api_key';

// Get API key from AsyncStorage only
export const getApiKey = async (): Promise<string> => {
  try {
    // Only check for a stored API key, no environment variable fallback
    const storedKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    return storedKey || "";
  } catch (error) {
    console.error('Error getting API key:', error);
    return "";
  }
};

// Save API key to AsyncStorage
export const saveApiKey = async (apiKey: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
};

// Generate content using Gemini AI
export const generateContent = async (
  instruction: string,
  fieldValue: string
): Promise<string> => {
  try {
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add your API key in settings.');
    }
    
    // Initialize the Gemini AI client
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    
    // Create prompt that includes the field description and instruction
    const prompt = `
      You are an AI assistant helping to create content for Anki flashcards.
      Generate content for the "${fieldValue}" field with the following instruction:
      ${instruction}
    `;
    
    console.log("🚀 ~ generateContent ~ prompt:", prompt);
    
    // Call the Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: prompt,
    });
    
    console.log("🚀 ~ generateContent ~ response.text:", response.text);
    
    if (!response.text) {
      throw new Error("Empty response from Gemini API");
    }
    
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    Toast.show({
      type: "error",
      text1: "Failed to Generate Content",
      text2: errorMessage,
      visibilityTime: 3000,
    });
    
    throw error;
  }
};

// Simple wrapper around generateContent to match the signature in ai.ts
export const generateFieldContent = async (prompt: string): Promise<string | null> => {
  console.log("🚀 ~ generateFieldContent ~ prompt:", prompt);
  try {
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add your API key in settings.');
    }
    
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    
    // Modified prompt to explicitly request English responses
    const enhancedPrompt = `
      IMPORTANT: Please respond in English only.
      ${prompt}
      Your response must be in English.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: enhancedPrompt,
    });
    
    console.log("🚀 ~ generateFieldContent ~ response.text:", response.text);
    return response.text || null;
  } catch (error) {
    console.error("Error generating content:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    Toast.show({
      type: "error",
      text1: "Failed to Generate Content by AI",
      text2: errorMessage,
      visibilityTime: 3000,
    });
    
    return null;
  }
};
