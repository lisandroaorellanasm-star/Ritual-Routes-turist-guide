import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
    currentLanguage: Language;
    onLanguageChange: (language: Language) => void;
}

const languages: { code: Language; label: string; flag: string; name: string }[] = [
    { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
    { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' },
    { code: 'nl', label: 'NL', flag: '🇳🇱', name: 'Nederlands' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedLanguage = languages.find(l => l.code === currentLanguage) || languages[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    const handleSelect = (langCode: Language) => {
        onLanguageChange(langCode);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-md transition-colors"
            >
                <span>{selectedLanguage.flag}</span>
                <span className="font-semibold text-sm">{selectedLanguage.label}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-20">
                    <ul className="py-1">
                        {languages.map(({ code, label, flag, name }) => (
                            <li key={code}>
                                <button
                                    onClick={() => handleSelect(code)}
                                    className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${
                                        currentLanguage === code
                                            ? 'bg-teal-500/20 text-teal-300'
                                            : 'text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    <span>{flag}</span>
                                    <span>{name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};