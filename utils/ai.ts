// utils/ai.ts
import { GoogleGenAI } from "@google/genai";
import Toast from "react-native-toast-message";

const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
});

export const generateFieldContent = async (prompt: string) => {
  console.log("🚀 ~ generateFieldContent ~ prompt:", prompt);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: prompt,
    });
    console.log("🚀 ~ generateFieldContent ~ response.text:", response.text);
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    Toast.show({
      type: "error",
      text1: "Failed to Generating Content by AI",
      text2: errorMessage,
      visibilityTime: 3000,
    });
    return null;
  }
};
