// utils/ai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY,
  dangerouslyAllowBrowser: true // Required for Expo
});

export const generateFieldContent = async (prompt: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150
  });
  return completion.choices[0].message.content;
};

// Placeholder for AI utility functions
export function dummyAI() {
  // Implement your AI logic here
  return 'AI response';
}