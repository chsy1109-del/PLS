import { GoogleGenAI, Type } from "@google/genai";
import { Place } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateItinerarySuggestions = async (destination: string, day: number): Promise<Place[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest 3 iconic places to visit for Day ${day} in ${destination}. For each place, provide a short description, transport tip, and estimated cost. If unknown, leave as empty string. Return as a JSON array.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            transport: { type: Type.STRING },
            cost: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["name", "transport", "cost", "description"]
        }
      }
    }
  });

  const suggestions = JSON.parse(response.text || "[]");
  return suggestions.map((s: any, idx: number) => ({
    ...s,
    id: `ai-${Date.now()}-${idx}`,
    day,
    visited: false
  }));
};

export const extractPlaceInfo = async (input: string): Promise<Partial<Place>> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract place info from: "${input}". Provide JSON with name, category, description, transport, and cost. Use empty strings for missing data.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          description: { type: Type.STRING },
          transport: { type: Type.STRING },
          cost: { type: Type.STRING }
        },
        required: ["name", "category", "description", "transport", "cost"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { name: input.split('http')[0].trim() || "New Place" };
  }
};

export const getLiveExchangeRate = async (from: string, to: string): Promise<number> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `What is the exchange rate from ${from} to ${to}? Use Google Search. Return ONLY the number.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "1.0";
  const match = text.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 1.0;
};

export const getQuickTip = async (placeName: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Give me a very short travel tip for ${placeName} in one sentence.`,
  });
  return response.text?.trim() || "No tips found.";
};

export const translateText = async (text: string, targetLanguage: string = "Korean"): Promise<string> => {
  if (!text.trim()) return "";
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate this text to ${targetLanguage}: "${text}". Return only the translated string.`,
  });
  return response.text?.trim() || text;
};