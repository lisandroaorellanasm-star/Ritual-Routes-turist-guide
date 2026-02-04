
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from '@google/genai';
import { Geolocation, Itinerary, GroundingChunk, Language, ItineraryRequest, Stop } from '../types';
import { translations } from '../translations';

const getAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Ensure VITE_GEMINI_API_KEY is properly set in Vercel environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

const extractJson = (text: string): string => {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return match[1];
    }
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        return text.substring(startIndex, endIndex + 1);
    }
    return text.trim();
};

const getLanguageName = (lang: Language): string => {
    switch (lang) {
        case 'es': return 'Spanish';
        case 'nl': return 'Dutch';
        case 'en':
        default: return 'English';
    }
}

export const getPlaceSuggestions = async (
    type: 'country' | 'department' | 'municipality',
    query: string,
    context: { country?: string; department?: string } = {}
): Promise<string[]> => {
    const ai = getAI();
    let prompt = "";

    const isQueryEmpty = !query || query.trim().length === 0;

    if (type === 'country') {
        prompt = isQueryEmpty
            ? `List top 10 most popular tourist countries in the world. Return only a JSON array of strings.`
            : `List top 10 countries matching "${query}". Return only a JSON array of strings.`;
    } else if (type === 'department') {
        prompt = isQueryEmpty
            ? `List top 10 major states, provinces, or departments in "${context.country || 'the world'}". Return only a JSON array of strings.`
            : `List top 10 states, provinces, or departments in "${context.country || 'the world'}" matching "${query}". Return only a JSON array of strings.`;
    } else {
        prompt = isQueryEmpty
            ? `List top 10 major cities or municipalities in "${context.department || ''}, ${context.country || ''}". Return only a JSON array of strings.`
            : `List top 10 cities or municipalities in "${context.department || ''}, ${context.country || ''}" matching "${query}". Return only a JSON array of strings.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Error fetching suggestions", e);
        return [];
    }
};

export const generateItinerary = async (request: ItineraryRequest, location: Geolocation | null, language: Language): Promise<{ itinerary: Itinerary, groundingChunks: GroundingChunk[] }> => {
    const ai = getAI();
    const languageName = getLanguageName(language);

    const stopsDescription = request.stops.map((stop, i) =>
        `Stop ${i + 1}: ${stop.municipality}, ${stop.department}, ${stop.country}. Arrival: ${stop.arrivalDate} at ${stop.arrivalTime}. Departure: ${stop.departureDate} at ${stop.departureTime}.`
    ).join('\n');

    const prompt = `Create a detailed, immersive, and multi-city travel itinerary based on the following stops:
${stopsDescription}

The user's budget is "${request.budget}". All recommendations should align with this budget.

Frame the itinerary as a ritual journey of discovery. Provide a sequential schedule day-by-day covering the entire duration of the trip across all cities. 
For each day, provide a theme, a title, the current city, and a schedule with specific times, activities, and rich descriptions.
For each activity, provide:
1. Its specific location with latitude and longitude.
2. An estimated duration in minutes.
3. An estimated cost in the local currency or USD.

The entire response MUST be in ${languageName}.
Your response MUST be a single, valid JSON object following this structure:

{
  "destination": "Combined Destination Description",
  "duration": "Total Trip Duration",
  "title": "Evocative Title for the Journey",
  "introduction": "A short, ceremonial introduction to the journey",
  "days": [
    {
      "day": number,
      "title": "string",
      "theme": "string",
      "city": "Current City",
      "schedule": [
        {
          "time": "string (e.g., '9:00 AM')",
          "activity": "string",
          "description": "string",
          "details": "Extended narrative description",
          "latitude": number | null,
          "longitude": number | null,
          "durationMinutes": number | null,
          "estimatedCost": "string | null"
        }
      ]
    }
  ]
}`;

    const modelName = request.useProModel ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const config: any = {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: location ? {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                },
            },
        } : undefined,
    };

    if (request.useProModel) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: config
    });

    const jsonText = extractJson(response.text);
    const itinerary: Itinerary = JSON.parse(jsonText);
    const groundingChunks: GroundingChunk[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as unknown as GroundingChunk[];

    return { itinerary, groundingChunks };
};

export const createChat = (language: Language, useProModel: boolean): Chat => {
    const ai = getAI();
    const modelName = useProModel ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const config: any = {
        systemInstruction: translations[language].chatSystemInstruction,
    };

    if (useProModel) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    return ai.chats.create({
        model: modelName,
        config: config,
    });
};

export const sendMessage = async (chat: Chat, message: string): Promise<string> => {
    const response = await chat.sendMessage({ message });
    return response.text;
};

export const generateSpeech = async (text: string, language: Language): Promise<string> => {
    const ai = getAI();
    const t = translations[language];
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `${t.sayWithTone} ${text}` }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error('No audio data received from TTS API.');
    }
    return base64Audio;
};
