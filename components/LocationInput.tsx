
import React, { useState, useEffect, useRef } from 'react';
import { getPlaceSuggestions } from '../services/geminiService';
import { LoadingSpinner, ChevronDownIcon } from './icons';

interface LocationInputProps {
    label: string;
    value: string;
    placeholder: string;
    type: 'country' | 'department' | 'municipality';
    context?: { country?: string; department?: string };
    onChange: (value: string) => void;
    disabled?: boolean;
    t: { [key: string]: string };
}

export const LocationInput: React.FC<LocationInputProps> = ({
    label, value, placeholder, type, context, onChange, disabled, t
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (query: string) => {
        setIsSearching(true);
        const results = await getPlaceSuggestions(type, query, context);
        setSuggestions(results);
        setIsSearching(false);
        setIsOpen(results.length > 0);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);

        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
            fetchSuggestions(val);
        }, 600);
    };

    const handleToggleDropdown = async () => {
        if (disabled) return;
        if (isOpen) {
            setIsOpen(false);
        } else {
            // If we don't have suggestions yet or the value is empty, fetch them
            if (suggestions.length === 0 || !value) {
                await fetchSuggestions(value);
            }
            setIsOpen(true);
        }
    };

    const selectSuggestion = (suggestion: string) => {
        onChange(suggestion);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{label}</label>
            <div className="relative group">
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (!isOpen && !disabled) handleToggleDropdown();
                    }}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pl-4 pr-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-peach/50 focus:border-peach transition-all cursor-pointer shadow-sm hover:border-slate-300"
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={handleToggleDropdown}
                    disabled={disabled}
                    className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-slate-400 hover:text-peach transition-colors border-l border-slate-200"
                >
                    {isSearching ? (
                        <LoadingSpinner />
                    ) : (
                        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon />
                        </div>
                    )}
                </button>
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-y-auto max-h-60 animate-fade-in ring-1 ring-slate-900/5">
                    <li className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 border-b border-slate-100 sticky top-0">
                        {t.suggested}
                    </li>
                    {suggestions.map((s, i) => (
                        <li key={i}>
                            <button
                                type="button"
                                onClick={() => selectSuggestion(s)}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-peach/10 hover:text-peach-hover transition-all flex items-center gap-3 border-b border-slate-50 last:border-0 font-medium"
                            >
                                <span className={`w-2 h-2 rounded-full transition-colors ${value === s ? 'bg-peach shadow-[0_0_8px_rgba(245,169,127,0.6)]' : 'bg-slate-300'}`}></span>
                                {s}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
