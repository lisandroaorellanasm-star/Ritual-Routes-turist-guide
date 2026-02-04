import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed non-exported member `LiveSession` and added `Modality`.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MicIcon, MicOffIcon } from './icons';
import { createBlob } from '../utils/audioUtils';

interface TranscriptionViewProps {
    t: { [key: string]: string };
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({ t }) => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState<string | null>(null);

    // FIX: `LiveSession` is not an exported type. Using `any` for the promise result.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const transcriptionSegmentRef = useRef('');

    const stopTranscription = useCallback(() => {
        sessionPromiseRef.current?.then((session) => {
            session.close();
        });
        sessionPromiseRef.current = null;

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        if (audioContextRef.current?.state !== 'closed') {
            audioContextRef.current?.close();
        }

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        setIsTranscribing(false);
    }, []);

    const startTranscription = useCallback(async () => {
        if (isTranscribing) return;

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsTranscribing(true);
            setTranscription('');
            setError(null);
            transcriptionSegmentRef.current = '';

            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    inputAudioTranscription: {},
                    // FIX: Used Modality.AUDIO enum instead of string literal 'AUDIO'
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
                            setTranscription(transcriptionSegmentRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                            transcriptionSegmentRef.current += ' ';
                            setTranscription(transcriptionSegmentRef.current);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError(t.errorVoiceAgent);
                        stopTranscription();
                    },
                    onclose: () => {
                        setIsTranscribing(false);
                    },
                },
            });

        } catch (err) {
            console.error('Failed to start transcription:', err);
            setError(t.errorMicrophone);
            setIsTranscribing(false);
        }

    }, [isTranscribing, t, stopTranscription]);

    useEffect(() => {
        return () => {
            stopTranscription();
        }
    }, [stopTranscription]);

    const handleToggle = () => {
        if (isTranscribing) {
            stopTranscription();
        } else {
            startTranscription();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in max-w-4xl mx-auto">
            <div className="w-full">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                    {t.transcription}
                </h2>
                <p className="text-slate-500 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
                    {t.transcriptionDescription}
                </p>

                <div className="space-y-8">
                    <button
                        onClick={handleToggle}
                        className={`group relative inline-flex items-center justify-center gap-3 font-bold px-10 py-5 rounded-full transition-all text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 ${isTranscribing
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-slate-900 hover:bg-slate-800'
                            }`}
                    >
                        <div className={`${isTranscribing ? 'animate-pulse' : ''}`}>
                            {isTranscribing ? <MicOffIcon /> : <MicIcon />}
                        </div>
                        <span className="text-lg">{isTranscribing ? t.stopTranscribing : t.startTranscribing}</span>
                        {isTranscribing && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                            </span>
                        )}
                    </button>

                    {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm text-left font-medium">{error}</div>}

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 min-h-[300px] text-left shadow-sm relative overflow-hidden group hover:border-peach/30 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-peach/50 via-slate-200 to-peach/50 opacity-50"></div>
                        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-peach rounded-full"></span>
                            {t.transcriptionResult}
                        </h3>
                        {transcription ? (
                            <p className="text-slate-800 text-lg leading-loose whitespace-pre-wrap font-medium">{transcription}</p>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300 gap-4">
                                <MicIcon />
                                <p className="italic">Waiting for speech...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
