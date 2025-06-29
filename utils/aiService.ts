import { checkConnection } from "@/utils/networkConnection"; // <-- import the new util
import { GoogleGenAI } from "@google/genai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// AI Api Key Identifier
const AI_API_KEY_IDENTIFIER = "gemini_api_key";

// Get API key from AsyncStorage only
export const getApiKey = async (): Promise<string> => {
  try {
    // Only check for a stored API key, no environment variable fallback
    const storedKey = await AsyncStorage.getItem(AI_API_KEY_IDENTIFIER);
    return storedKey || "";
  } catch (error) {
    console.error("Error getting API key:", error);
    return "";
  }
};

// Save API key to AsyncStorage
export const saveApiKey = async (apiKey: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(AI_API_KEY_IDENTIFIER, apiKey);
  } catch (error) {
    console.error("Error saving API key:", error);
    throw error;
  }
};

// Generate content using Gemini AI
export const generateContent = async (
  targetFieldName: string,
  firstFieldValue: string,
  fieldInstruction: string,
  currentFieldValue: string = "" // Add parameter for current field value
): Promise<string> => {
  try {
    const isOnline = await checkConnection();
    if (!isOnline) {
      Toast.show({
        type: "error",
        text1: "No Internet Connection",
        text2: "AI features require an internet connection.",
        visibilityTime: 3000,
      });
      throw new Error("No internet connection for AI prompt");
    }

    const apiKey = await getApiKey();

    if (!apiKey) {
      throw new Error(
        "Gemini API key not found. Please add your API key in settings."
      );
    }

    // Initialize the Gemini AI client
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Create prompt that includes the field description and instruction
    const prompt = `
      You are an AI assistant helping to create content for Anki flashcard.
      Generate "${targetFieldName}" for "${firstFieldValue}" 
      ${
        fieldInstruction
          ? `with the following instruction: ${fieldInstruction}`
          : ""
      }
    `;

    console.log("🚀 ~ generateContent ~ prompt:", prompt);

    // Call the Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: prompt,
    });

    console.log("🚀 ~ generateContent ~ response:", response.text);

    if (!response.text) {
      throw new Error("Empty response from Gemini API");
    }

    // Add separator if there's existing content
    const generatedContent = response.text;
    if (currentFieldValue && currentFieldValue.trim() !== "") {
      return currentFieldValue + "\n------\n" + generatedContent;
    }

    return generatedContent;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    Toast.show({
      type: "error",
      text1: "Failed to Generate Content",
      text2: errorMessage,
      visibilityTime: 3000,
    });

    // console.error("Error generating content:", error);
    throw error;
  }
};

// Simple wrapper around generateContent to match the signature in ai.ts
export const generateFieldContent = async (
  prompt: string
): Promise<string | null> => {
  console.log("🚀 ~ generateFieldContent ~ prompt:", prompt);
  try {
    const apiKey = await getApiKey();

    if (!apiKey) {
      throw new Error(
        "Gemini API key not found. Please add your API key in settings."
      );
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

    console.log("🚀 ~ generateFieldContent ~ response:", response.text);
    return response.text || null;
  } catch (error) {
    const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";
    
    Toast.show({
      type: "error",
      text1: "Failed to Generate Content by AI",
      text2: errorMessage,
      visibilityTime: 3000,
    });
    
    // console.error("Error generating content:", error);
    return null;
  }
};
