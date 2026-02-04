import React from 'react';
import { View } from '../types';
import { CompassIcon, MessageSquareIcon, MicIcon, MicOffIcon, SpeechToTextIcon } from './icons';

interface NavigationProps {
    currentView: View;
    onNavigate: (view: View) => void;
    isVoiceAgentActive: boolean;
    onStartVoiceAgent: () => void;
    onStopVoiceAgent: () => void;
    t: { [key: string]: string };
}

const NavButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-peach -translate-y-1' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
    >
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : ''}`}>
            {icon}
        </div>
        <span className={`text-[10px] font-bold tracking-wide uppercase ${isActive ? 'text-peach' : 'text-slate-400'}`}>{label}</span>
        {isActive && <div className="w-1 h-1 bg-peach rounded-full mt-0.5"></div>}
    </button>
);

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, isVoiceAgentActive, onStartVoiceAgent, onStopVoiceAgent, t }) => {
    const handleVoiceToggle = () => {
        if (isVoiceAgentActive) {
            onStopVoiceAgent();
        } else {
            onStartVoiceAgent();
        }
    };

    return (
        <footer className="sticky bottom-4 mx-4 md:mx-auto md:max-w-2xl bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-2xl rounded-[2rem] z-50">
            <nav className="px-6 py-3 flex justify-between items-center">
                <NavButton
                    icon={<CompassIcon />}
                    label={t.itinerary}
                    isActive={currentView === View.ITINERARY}
                    onClick={() => onNavigate(View.ITINERARY)}
                />
                <div className="w-px h-8 bg-slate-100"></div>
                <NavButton
                    icon={<MessageSquareIcon />}
                    label={t.chat}
                    isActive={currentView === View.CHAT}
                    onClick={() => onNavigate(View.CHAT)}
                />
                <div className="w-px h-8 bg-slate-100"></div>
                <NavButton
                    icon={<SpeechToTextIcon />}
                    label={t.transcription}
                    isActive={currentView === View.TRANSCRIPTION}
                    onClick={() => onNavigate(View.TRANSCRIPTION)}
                />
                <div className="w-px h-8 bg-slate-100"></div>
                <button
                    onClick={handleVoiceToggle}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 ${isVoiceAgentActive ? 'text-red-500 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                    <div className={`${isVoiceAgentActive ? 'animate-pulse drop-shadow-md' : ''}`}>
                        {isVoiceAgentActive ? <MicOffIcon /> : <MicIcon />}
                    </div>
                    <span className="text-[10px] font-bold tracking-wide uppercase">{t.voiceGuide}</span>
                    {isVoiceAgentActive && <div className="w-1 h-1 bg-red-500 rounded-full mt-0.5 animate-pulse"></div>}
                </button>
            </nav>
        </footer>
    );
};