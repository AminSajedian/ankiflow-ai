import { checkConnection } from "@/utils/networkConnection"; // <-- import the new util
import { GoogleGenAI } from "@google/genai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// AI Api Key Identifier
const AI_API_KEY_IDENTIFIER = "gemini_api_key";

// Tried in order: the next model is used when one is retired (HTTP 404, as
// gemini-2.0-flash-001 was in June 2026), overloaded (HTTP 503), rate limited
// (HTTP 429) or doesn't answer within GEMINI_TIMEOUT_MS. The "-latest" aliases
// keep the app working after the pinned model is retired.
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];
const GEMINI_TIMEOUT_MS = 25000;

const isRetryableError = (error: unknown) =>
  error instanceof Error &&
  (error.name === "AbortError" || /\b(404|503|429)\b|NOT_FOUND|UNAVAILABLE|RESOURCE_EXHAUSTED|abort/i.test(error.message));

// Flashcards need short answers fast: no thinking, a hard cap on length, and
// plain text because Anki shows Markdown symbols as-is.
const FLASHCARD_SYSTEM_INSTRUCTION = `You write the content of a single field of an Anki flashcard.
Rules:
- Reply with the field content only: no preamble, no options, no explanations, no follow-up questions.
- Plain text only: no Markdown, no HTML, no headings, no bullet symbols, no surrounding quotes.
- Be as short as possible: one line, ideally under 15 words, unless the field instruction asks for more.
- If a field instruction is given, follow it exactly; it overrides the length rule.`;

const generateWithFallback = async (ai: GoogleGenAI, contents: string) => {
  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config: {
          abortSignal: controller.signal,
          systemInstruction: FLASHCARD_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 300,
        },
      });
    } catch (error) {
      if (!isRetryableError(error)) throw error;
      console.warn(`Gemini model ${model} is unavailable, trying the next one`);
      lastError = controller.signal.aborted
        ? new Error("Gemini is taking too long to respond. Please try again.")
        : error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError;
};

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
    const prompt = [
      `Card: ${firstFieldValue}`,
      `Field to write: ${targetFieldName}`,
      fieldInstruction ? `Field instruction: ${fieldInstruction}` : "",
    ].filter(Boolean).join("\n");

    console.log("🚀 ~ generateContent ~ prompt:", prompt);

    // Call the Gemini API
    const response = await generateWithFallback(ai, prompt);

    console.log("🚀 ~ generateContent ~ response:", response.text);

    if (!response.text) {
      throw new Error("Empty response from Gemini API");
    }

    // Trim whitespace from generated content to avoid extra spaces/newlines
    const generatedContent = response.text.trim();
    
    // Add separator if there's existing content
    if (currentFieldValue && currentFieldValue.trim() !== "") {
      return currentFieldValue.trimEnd() + "\n------\n" + generatedContent;
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

    const response = await generateWithFallback(ai, enhancedPrompt);

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
