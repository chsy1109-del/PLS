
import { GoogleGenAI, Type } from "@google/genai";
import { Place } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateItinerarySuggestions = async (destination: string, day: number): Promise<Place[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest 3-4 must-visit places for Day ${day} of a trip to ${destination}. Provide realistic transport info and estimated costs in local currency or USD.`,
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
    contents: `Extract information about the place mentioned in this text: "${input}". Provide name, category, short description, transport tips, and estimated cost.`,
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
    contents: `What is the current exchange rate from ${from} to ${to}? Use Google Search for real-time data. Return ONLY the number value of the rate.`,
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
    contents: `Give me a one-sentence pro-tip for visiting ${placeName}.`,
  });
  return response.text || "No tips found.";
};

export const translateText = async (text: string, targetLanguage: string = "Korean"): Promise<string> => {
  if (!text.trim()) return "";
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate the following text to ${targetLanguage}. Text: "${text}"`,
  });
  return response.text?.trim() || text;
};
