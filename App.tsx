
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Chat, LiveServerMessage, Modality } from '@google/genai';
import { Itinerary, ChatMessage, Geolocation, View, ItineraryItem, GroundingChunk, ItineraryDay, Language, ItineraryRequest, User } from './types';
import { generateItinerary, createChat, sendMessage, generateSpeech } from './services/geminiService';
import { decode, decodeAudioData, encode, createBlob } from './utils/audioUtils';
import { generateIcsContent, downloadIcsFile, parseTime } from './utils/calendarUtils';
import { translations } from './translations';
import { DestinationForm } from './components/DestinationForm';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { ChatWindow } from './components/ChatWindow';
import { VoiceAgent } from './components/VoiceAgent';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DatePickerModal } from './components/DatePickerModal';
import { TranscriptionView } from './components/TranscriptionView';
import { LandingPage } from './components/LandingPage';

const getInitialLanguage = (): Language => {
    const browserLang = navigator.language.split(/[-_]/)[0];
    const supportedLanguages: Language[] = ['en', 'es', 'nl'];
    if (supportedLanguages.includes(browserLang as Language)) {
        return browserLang as Language;
    }
    return 'en';
};

const App: React.FC = () => {
    const [view, setView] = useState<View>(View.LANDING);
    const [destinationDisplay, setDestinationDisplay] = useState<string>('');
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [itineraryRequest, setItineraryRequest] = useState<ItineraryRequest | null>(null);
    const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<Geolocation | null>(null);
    const [isVoiceAgentActive, setIsVoiceAgentActive] = useState<boolean>(false);
    const [transcriptions, setTranscriptions] = useState<{ user: string, model: string, final: boolean }[]>([]);
    const [user, setUser] = useState<User | null>(null);

    const [language, setLanguage] = useState<Language>(getInitialLanguage());
    const t = translations[language];

    const [tripStartDate, setTripStartDate] = useState<Date | null>(null);
    const [isDatePickerVisible, setIsDatePickerVisible] = useState<boolean>(false);
    const [calendarEventData, setCalendarEventData] = useState<ItineraryItem | ItineraryDay | null>(null);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const prevLanguageRef = useRef<Language | undefined>();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (err) => {
                console.warn(`Could not get geolocation: ${err.message}`);
            }
        );
    }, []);

    useEffect(() => {
        const prevLanguage = prevLanguageRef.current;
        if (prevLanguage !== undefined && prevLanguage !== language && itineraryRequest) {
            const regenerateForNewLanguage = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const { itinerary: newItinerary, groundingChunks: newChunks } = await generateItinerary(itineraryRequest, location, language);
                    setItinerary(newItinerary);
                    setGroundingChunks(newChunks);

                    const newChat = createChat(language, itineraryRequest.useProModel);
                    setChat(newChat);
                    const currentTranslations = translations[language];
                    const initialMessage: ChatMessage = { role: 'model', content: currentTranslations.initialChatMessage };
                    setChatHistory([initialMessage]);
                } catch (err) {
                    console.error(err);
                    setError(translations[language].errorGenerateItinerary);
                } finally {
                    setIsLoading(false);
                }
            };
            regenerateForNewLanguage();
        }
        prevLanguageRef.current = language;
    }, [language, itineraryRequest, location]);

    const handleLogin = () => setUser({ name: 'Alex' });
    const handleLogout = () => setUser(null);

    const handleGenerateItinerary = async (request: ItineraryRequest) => {
        setIsLoading(true);
        setError(null);
        setItineraryRequest(request);
        const display = request.stops.map(s => s.municipality).join(' → ');
        setDestinationDisplay(display);

        try {
            const { itinerary: generatedItinerary, groundingChunks: chunks } = await generateItinerary(request, location, language);
            setItinerary(generatedItinerary);
            setGroundingChunks(chunks);
            const newChat = createChat(language, request.useProModel);
            setChat(newChat);
            const initialMessage: ChatMessage = { role: 'model', content: t.initialChatMessage };
            setChatHistory([initialMessage]);
            setView(View.ITINERARY);
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes("API Key")) {
                setError(err.message);
            } else {
                // Show the actual error message for debugging purposes
                setError(`${t.errorGenerateItinerary} (${err.message})`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!chat) return;
        const userMessage: ChatMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, userMessage]);
        setIsLoading(true);
        try {
            const response = await sendMessage(chat, message);
            const modelMessage: ChatMessage = { role: 'model', content: response };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (err) {
            console.error(err);
            setError(t.errorChatResponse);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayAudio = async (text: string) => {
        setIsLoading(true);
        try {
            const audioData = await generateSpeech(text, language);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
        } catch (err) {
            console.error(err);
            setError(t.errorGenerateSpeech);
        } finally {
            setIsLoading(false);
        }
    };

    const startVoiceAgent = useCallback(async () => {
        if (isVoiceAgentActive) return;

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsVoiceAgentActive(true);
            setView(View.VOICE_AGENT);
            setTranscriptions([]);

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
            if (!apiKey) throw new Error("API Key is missing for Voice Agent");
            const ai = new GoogleGenAI({ apiKey });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            let nextStartTime = 0;
            const sources = new Set<AudioBufferSourceNode>();

            const summarizedItinerary = itinerary ? {
                title: itinerary.title,
                days: itinerary.days.map(day => ({
                    day: day.day,
                    city: day.city,
                    title: day.title,
                    schedule: day.schedule.map(item => ({ time: item.time, activity: item.activity }))
                }))
            } : null;

            const systemInstruction = t.voiceSystemInstruction
                .replace('{destination}', destinationDisplay)
                .replace('{itinerary}', JSON.stringify(summarizedItinerary));

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: async () => {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                            setTranscriptions(prev => {
                                const last = prev[prev.length - 1];
                                if (last && !last.final) return [...prev.slice(0, -1), { ...last, user: currentInputTranscriptionRef.current }];
                                return [...prev, { user: currentInputTranscriptionRef.current, model: '', final: false }];
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                            setTranscriptions(prev => {
                                const last = prev[prev.length - 1];
                                if (last && !last.final) return [...prev.slice(0, -1), { ...last, model: currentOutputTranscriptionRef.current }];
                                return prev;
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscriptions(prev => {
                                const last = prev[prev.length - 1];
                                if (last) return [...prev.slice(0, -1), { ...last, final: true }];
                                return prev;
                            });
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.addEventListener('ended', () => sources.delete(source));
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        setError(t.errorVoiceAgent);
                        stopVoiceAgent();
                    },
                    onclose: () => setIsVoiceAgentActive(false),
                },
            });
        } catch (err) {
            setError(t.errorMicrophone);
            setIsVoiceAgentActive(false);
        }
    }, [isVoiceAgentActive, destinationDisplay, itinerary, language, t]);

    const stopVoiceAgent = useCallback(() => {
        sessionPromiseRef.current?.then((session) => session.close());
        sessionPromiseRef.current = null;
        setIsVoiceAgentActive(false);
        setView(View.ITINERARY);
    }, []);

    const processCalendarEvent = (data: ItineraryItem | ItineraryDay, startDate: Date) => {
        const createEvent = (item: ItineraryItem, dayNumber: number) => {
            const eventDate = new Date(startDate);
            eventDate.setDate(startDate.getDate() + dayNumber - 1);
            const { hours, minutes } = parseTime(item.time);
            eventDate.setHours(hours, minutes, 0, 0);
            const endDate = new Date(eventDate);
            endDate.setMinutes(endDate.getMinutes() + (item.durationMinutes || 60));
            const location = (item.latitude && item.longitude) ? `${item.latitude},${item.longitude}` : item.activity;
            return { title: item.activity, description: item.details, location, startTime: eventDate, endTime: endDate };
        };

        if ('schedule' in data) {
            const events = data.schedule.map(item => createEvent(item, data.day));
            const icsContent = generateIcsContent(events, language);
            downloadIcsFile(icsContent, `Day_${data.day}_Route.ics`);
        } else {
            const dayOfItem = itinerary?.days.find(d => d.schedule.includes(data));
            if (dayOfItem) {
                const event = createEvent(data, dayOfItem.day);
                const icsContent = generateIcsContent([event], language);
                downloadIcsFile(icsContent, `${data.activity}.ics`);
            }
        }
    };

    const handleAddToCalendarRequest = (data: ItineraryItem | ItineraryDay) => {
        setCalendarEventData(data);
        if (!tripStartDate) setIsDatePickerVisible(true);
        else processCalendarEvent(data, tripStartDate);
    };

    const handleDateConfirm = (date: Date) => {
        setTripStartDate(date);
        setIsDatePickerVisible(false);
        if (calendarEventData) processCalendarEvent(calendarEventData, date);
        setCalendarEventData(null);
    };

    const renderView = () => {
        switch (view) {
            case View.LANDING:
                return <LandingPage t={t} onStart={() => setView(View.FORM)} />;
            case View.ITINERARY:
                return itinerary && <ItineraryDisplay t={t} itinerary={itinerary} groundingChunks={groundingChunks} onPlayAudio={handlePlayAudio} onAddToCalendar={handleAddToCalendarRequest} />;
            case View.CHAT:
                return <ChatWindow t={t} messages={chatHistory} onSendMessage={handleSendMessage} isLoading={isLoading} />;
            case View.VOICE_AGENT:
                return <VoiceAgent t={t} transcriptions={transcriptions} onStop={stopVoiceAgent} />;
            case View.TRANSCRIPTION:
                return <TranscriptionView t={t} />;
            case View.FORM:
                return <DestinationForm t={t} onGenerate={handleGenerateItinerary} isLoading={isLoading} />;
            default:
                return <LandingPage t={t} onStart={() => setView(View.FORM)} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF8F4] text-slate-900 flex flex-col font-sans transition-colors duration-500">
            <Header
                destination={destinationDisplay}
                t={t}
                language={language}
                setLanguage={setLanguage}
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
            />
            <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
                {error && (
                    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl z-[100] animate-bounce-in">
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-2xl flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-bold">{error}</span>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                {isDatePickerVisible && <DatePickerModal t={t} onConfirm={handleDateConfirm} onCancel={() => setIsDatePickerVisible(false)} />}
                <div className="flex-grow">{renderView()}</div>
            </main>
            {view !== View.FORM && view !== View.LANDING && (
                <Navigation
                    t={t}
                    currentView={view}
                    onNavigate={setView}
                    isVoiceAgentActive={isVoiceAgentActive}
                    onStartVoiceAgent={startVoiceAgent}
                    onStopVoiceAgent={stopVoiceAgent}
                />
            )}
        </div>
    );
};

export default App;
