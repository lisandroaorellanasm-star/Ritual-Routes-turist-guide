
export type Language = 'en' | 'es' | 'nl';
export type Budget = 'budget' | 'moderate' | 'luxury';

export interface Stop {
    id: string;
    municipality: string;
    department: string;
    country: string;
    arrivalDate: string;
    arrivalTime: string;
    departureDate: string;
    departureTime: string;
}

export interface ItineraryRequest {
    stops: Stop[];
    budget: Budget;
    useProModel: boolean;
}

export interface ItineraryItem {
    time: string;
    activity: string;
    description: string;
    details: string;
    latitude?: number;
    longitude?: number;
    durationMinutes?: number;
    estimatedCost?: string;
    city?: string;
}

export interface ItineraryDay {
    day: number;
    title: string;
    theme: string;
    city?: string;
    schedule: ItineraryItem[];
}

export interface Itinerary {
    destination: string;
    duration: string;
    title: string;
    introduction: string;
    days: ItineraryDay[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface Geolocation {
    latitude: number;
    longitude: number;
}

export enum View {
    LANDING = 'LANDING',
    FORM = 'FORM',
    ITINERARY = 'ITINERARY',
    CHAT = 'CHAT',
    VOICE_AGENT = 'VOICE_AGENT',
    TRANSCRIPTION = 'TRANSCRIPTION',
}

export interface GroundingChunk {
    web?: {
        uri?: string;
        title?: string;
    };
    maps?: {
        uri?: string;
        title?: string;
        placeAnswerSources?: {
            reviewSnippets: {
                uri?: string;
                text?: string;
            }[];
        }[]
    };
}

export interface User {
    name: string;
}
