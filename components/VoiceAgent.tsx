import React, { useEffect, useRef } from 'react';
import { MicOffIcon } from './icons';

interface VoiceAgentProps {
    transcriptions: { user: string; model: string; final: boolean }[];
    onStop: () => void;
    t: { [key: string]: string };
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ transcriptions, onStop, t }) => {
    const transcriptionsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptions]);

    return (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 animate-fade-in p-6">
            <div className="w-full max-w-4xl h-full flex flex-col relative">
                <button
                    onClick={onStop}
                    className="absolute top-0 right-0 p-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="text-center pt-12 pb-8">
                    <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-peach to-orange-300 flex items-center justify-center shadow-2xl shadow-peach/40">
                            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-4xl">🎙️</div>
                        </div>
                        <div className="absolute inset-0 animate-ping rounded-full border-2 border-peach opacity-75 duration-1000"></div>
                        <div className="absolute -inset-4 animate-pulse rounded-full border border-peach/30 opacity-50"></div>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{t.listening}</h2>
                    <p className="text-slate-500 mt-3 text-lg font-medium">{t.voiceAgentDescription}</p>
                </div>

                <div className="flex-grow overflow-y-auto space-y-6 p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-inner custom-scrollbar">
                    {transcriptions.map((tItem, i) => (
                        <div key={i} className={`text-lg leading-relaxed space-y-2 ${tItem.final ? 'opacity-100' : 'opacity-60'}`}>
                            {tItem.user && (
                                <p className="text-right">
                                    <span className="inline-block bg-slate-200 text-slate-800 px-6 py-3 rounded-2xl rounded-br-none font-medium shadow-sm">
                                        {tItem.user}
                                    </span>
                                </p>
                            )}
                            {tItem.model && (
                                <p className="text-left">
                                    <span className="inline-block bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl rounded-bl-none font-medium shadow-sm">
                                        {tItem.model}
                                    </span>
                                </p>
                            )}
                        </div>
                    ))}
                    <div ref={transcriptionsEndRef} />
                </div>

                <div className="py-8 text-center">
                    <button
                        onClick={onStop}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-full inline-flex items-center gap-3 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 text-lg"
                    >
                        <MicOffIcon />
                        {t.endSession}
                    </button>
                </div>
            </div>
        </div>
    );
};
