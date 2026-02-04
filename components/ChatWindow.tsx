import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import { LoadingSpinner, MicIcon, MicOffIcon } from './icons';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob } from '../utils/audioUtils';

interface ChatWindowProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    t: { [key: string]: string };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, t }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const transcriptionSegmentRef = useRef('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput('');
        }
    };

    const stopTranscription = useCallback(() => {
        if (!sessionPromiseRef.current) return;

        sessionPromiseRef.current?.then((session) => {
            session.close();
        });
        sessionPromiseRef.current = null;

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        if (audioContextRef.current?.state !== 'closed') {
            audioContextRef.current?.close().catch(console.error);
        }

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        setIsTranscribing(false);
        inputRef.current?.focus();
    }, []);

    const startTranscription = useCallback(async () => {
        if (isTranscribing) return;

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsTranscribing(true);
            setInput('');
            setTranscriptionError(null);
            transcriptionSegmentRef.current = '';

            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    inputAudioTranscription: {},
                    responseModalities: [Modality.AUDIO] // Required by API, but we'll ignore audio output
                },
                callbacks: {
                    onopen: () => {
                        if (!streamRef.current) return;
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            transcriptionSegmentRef.current += message.serverContent.inputTranscription.text;
                            setInput(transcriptionSegmentRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                            transcriptionSegmentRef.current += ' ';
                            setInput(transcriptionSegmentRef.current);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setTranscriptionError(t.errorVoiceAgent);
                        stopTranscription();
                    },
                    onclose: () => {
                        // Check if we initiated the close, if not, it might be an unexpected close
                        if (isTranscribing) {
                            setIsTranscribing(false);
                        }
                    },
                },
            });

        } catch (err) {
            console.error('Failed to start transcription:', err);
            setTranscriptionError(t.errorMicrophone);
            setIsTranscribing(false);
        }

    }, [isTranscribing, t, stopTranscription]);

    useEffect(() => {
        return () => {
            stopTranscription();
        }
    }, [stopTranscription]);

    const handleMicToggle = () => {
        if (isTranscribing) {
            stopTranscription();
        } else {
            startTranscription();
        }
    };


    return (
        <div className="flex flex-col h-[600px] bg-white border border-slate-200 rounded-[2rem] animate-fade-in shadow-xl max-w-2xl mx-auto overflow-hidden">
            <div className="bg-peach/10 p-4 border-b border-peach/20">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                    {t.chatWithGuide}
                </h3>
            </div>

            <div className="flex-grow p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                                <span className="text-xl">🤖</span>
                            </div>
                        )}
                        <div className={`max-w-[80%] px-6 py-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${msg.role === 'user'
                            ? 'bg-peach text-slate-900 rounded-br-none'
                            : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-end gap-3 justify-start">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                            <span className="text-xl">🤖</span>
                        </div>
                        <div className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 rounded-bl-none">
                            <LoadingSpinner />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                {transcriptionError && <p className="text-red-500 text-sm mb-2 text-center font-medium bg-red-50 py-1 rounded-lg">{transcriptionError}</p>}
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <div className="relative flex-grow">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isTranscribing ? t.listening + '...' : t.chatPlaceholder}
                            className="w-full bg-white border border-slate-200 rounded-full pl-6 pr-12 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-peach focus:border-peach shadow-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all hover:border-peach/50"
                            disabled={isLoading || isTranscribing}
                        />
                        <button
                            type="button"
                            onClick={handleMicToggle}
                            disabled={isLoading}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-200 ${isTranscribing
                                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                                : 'text-slate-400 hover:text-peach hover:bg-peach/10'
                                }`}
                            aria-label={isTranscribing ? 'Stop recording' : 'Start recording'}
                        >
                            {isTranscribing ? <MicOffIcon /> : <MicIcon />}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-slate-900 text-white px-6 py-4 rounded-full font-bold shadow-lg hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    >
                        {t.send}
                    </button>
                </form>
            </div>
        </div>
    );
};