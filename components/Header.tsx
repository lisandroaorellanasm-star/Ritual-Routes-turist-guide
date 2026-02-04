import React, { useState, useEffect, useRef } from 'react';
import { CompassIcon, GoogleIcon, UserIcon, LogOutIcon } from './icons';
import { Language, User } from '../types';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
    destination: string | null;
    t: { [key: string]: string };
    language: Language;
    setLanguage: (language: Language) => void;
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
}

const UserProfile: React.FC<{ user: User; onLogout: () => void; t: { [key: string]: string } }> = ({ user, onLogout, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center">
                    <UserIcon />
                </div>
                <span className="font-semibold text-sm hidden sm:block">{user.name}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-slate-700">
                        <p className="text-sm text-slate-300">{t.signedInAs}</p>
                        <p className="font-semibold truncate">{user.name}</p>
                    </div>
                    <ul className="py-1">
                        <li>
                            <button
                                onClick={onLogout}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                            >
                                <LogOutIcon />
                                <span>{t.signOut}</span>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};


export const Header: React.FC<HeaderProps> = ({ destination, t, language, setLanguage, user, onLogin, onLogout }) => {
    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CompassIcon />
                    <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-sky-600">
                        Ritual Routes
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {destination && (
                        <div className="text-sm text-slate-500 hidden md:block">
                            {t.yourJourneyTo} <span className="font-semibold text-teal-600">{destination}</span>
                        </div>
                    )}
                    <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
                    {user ? (
                        <UserProfile user={user} onLogout={onLogout} t={t} />
                    ) : (
                        <button
                            onClick={onLogin}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-full transition-colors text-sm"
                        >
                            <GoogleIcon />
                            {t.signUpWithGoogle}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
