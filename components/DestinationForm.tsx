
import React, { useState, useMemo } from 'react';
import { LoadingSpinner, SparklesIcon } from './icons';
import { ItineraryRequest, Budget, Stop } from '../types';
import { LocationInput } from './LocationInput';
import { motion, AnimatePresence } from 'framer-motion';

interface DestinationFormProps {
    onGenerate: (data: ItineraryRequest) => void;
    isLoading: boolean;
    t: { [key: string]: string };
}

const createInitialStop = (): Stop => ({
    id: crypto.randomUUID(),
    municipality: '',
    department: '',
    country: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    arrivalTime: '09:00 AM',
    departureDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    departureTime: '05:00 PM',
});

export const DestinationForm: React.FC<DestinationFormProps> = ({ onGenerate, isLoading, t }) => {
    const [stops, setStops] = useState<Stop[]>([createInitialStop()]);
    const [budget, setBudget] = useState<Budget>('moderate');
    const [useProModel, setUseProModel] = useState<boolean>(false);
    const [showValidationError, setShowValidationError] = useState(false);

    const addStop = () => {
        const lastStop = stops[stops.length - 1];
        const newArrival = lastStop ? lastStop.departureDate : new Date().toISOString().split('T')[0];
        const newDeparture = new Date(new Date(newArrival).getTime() + 86400000 * 2).toISOString().split('T')[0];

        setStops([...stops, {
            ...createInitialStop(),
            arrivalDate: newArrival,
            departureDate: newDeparture
        }]);
    };

    const removeStop = (id: string) => {
        if (stops.length > 1) {
            setStops(stops.filter(s => s.id !== id));
        }
    };

    const updateStop = (id: string, updates: Partial<Stop>) => {
        setStops(stops.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const validation = useMemo(() => {
        const hasCities = stops.every(s => s.municipality.trim() !== '');
        const datesValid = stops.every(s => {
            const arr = new Date(`${s.arrivalDate} ${s.arrivalTime}`);
            const dep = new Date(`${s.departureDate} ${s.departureTime}`);
            return dep > arr;
        });
        return { hasCities, datesValid };
    }, [stops]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowValidationError(true);
        if (validation.hasCities && validation.datesValid && !isLoading) {
            onGenerate({ stops, budget, useProModel });
        }
    };

    return (
        <div className="flex flex-col items-center justify-start h-full p-4 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-peach/20 rounded-2xl flex items-center justify-center mb-4 text-peach">
                        <SparklesIcon />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 text-center tracking-tight">
                        {t.whereDoesYourJourneyBegin}
                    </h2>
                    <p className="text-slate-500 mt-4 text-center max-w-md">
                        {t.destinationFormDescription}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <AnimatePresence>
                            {stops.map((stop, index) => (
                                <motion.div
                                    key={stop.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative transition-all hover:shadow-2xl hover:border-peach/30"
                                >
                                    <div className="flex justify-between items-center mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-peach to-[#e4986e] flex items-center justify-center text-slate-900 font-black text-sm shadow-md">
                                                {index + 1}
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                                                {t.stopNumber}
                                            </h3>
                                        </div>
                                        {stops.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeStop(stop.id)}
                                                className="text-red-500/70 hover:text-red-600 text-xs font-bold px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 transition-all uppercase tracking-widest"
                                            >
                                                {t.removeStop}
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <LocationInput
                                            label={t.country}
                                            value={stop.country}
                                            type="country"
                                            placeholder={t.countryPlaceholder}
                                            onChange={(val) => updateStop(stop.id, { country: val, department: '', municipality: '' })}
                                            disabled={isLoading}
                                            t={t}
                                        />
                                        <LocationInput
                                            label={t.department}
                                            value={stop.department}
                                            type="department"
                                            context={{ country: stop.country }}
                                            placeholder={t.departmentPlaceholder}
                                            onChange={(val) => updateStop(stop.id, { department: val, municipality: '' })}
                                            disabled={isLoading || !stop.country}
                                            t={t}
                                        />
                                        <LocationInput
                                            label={t.municipality}
                                            value={stop.municipality}
                                            type="municipality"
                                            context={{ country: stop.country, department: stop.department }}
                                            placeholder={t.municipalityPlaceholder}
                                            onChange={(val) => updateStop(stop.id, { municipality: val })}
                                            disabled={isLoading || !stop.department}
                                            t={t}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-8 border-t border-slate-100">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{t.arrival}</label>
                                                <input
                                                    type="date"
                                                    value={stop.arrivalDate}
                                                    onChange={e => updateStop(stop.id, { arrivalDate: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-peach/50 focus:border-peach"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{t.time}</label>
                                                <input
                                                    type="text"
                                                    value={stop.arrivalTime}
                                                    onChange={e => updateStop(stop.id, { arrivalTime: e.target.value })}
                                                    placeholder="09:00 AM"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-peach/50 focus:border-peach"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{t.departure}</label>
                                                <input
                                                    type="date"
                                                    value={stop.departureDate}
                                                    onChange={e => updateStop(stop.id, { departureDate: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-peach/50 focus:border-peach"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{t.time}</label>
                                                <input
                                                    type="text"
                                                    value={stop.departureTime}
                                                    onChange={e => updateStop(stop.id, { departureTime: e.target.value })}
                                                    placeholder="05:00 PM"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-peach/50 focus:border-peach"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={addStop}
                        disabled={isLoading}
                        className="w-full py-6 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-500 font-bold hover:border-peach hover:text-peach hover:bg-peach/5 transition-all flex items-center justify-center gap-3 group"
                    >
                        <div className="group-hover:scale-125 transition-transform duration-300"><SparklesIcon /></div>
                        {t.addStop}
                    </motion.button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                            <label className="block text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">{t.budget}</label>
                            <div className="flex gap-2">
                                {(['budget', 'moderate', 'luxury'] as Budget[]).map((b) => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => setBudget(b)}
                                        className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all ${budget === b
                                                ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-white shadow-lg shadow-teal-500/30'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {t[b + 'Friendly'] || b}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-colors hover:border-teal-200">
                            <label htmlFor="thinking-mode" className="flex items-center gap-4 cursor-pointer w-full">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="thinking-mode"
                                        className="sr-only"
                                        checked={useProModel}
                                        onChange={(e) => setUseProModel(e.target.checked)}
                                        disabled={isLoading}
                                    />
                                    <div className={`block w-14 h-8 rounded-full transition-colors ${useProModel ? 'bg-teal-500' : 'bg-slate-200'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-sm transition-transform ${useProModel ? 'translate-x-6' : ''}`}></div>
                                </div>
                                <div className="ml-2">
                                    <span className="font-bold text-slate-900 text-lg tracking-tight block">{t.thinkingMode}</span>
                                    <p className="text-xs text-slate-400 font-medium">{t.thinkingModeDescription}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-8 pb-12">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading || !validation.hasCities || !validation.datesValid}
                            className="w-full flex items-center justify-center gap-3 bg-peach text-slate-900 font-black px-8 py-6 rounded-[2.5rem] shadow-xl hover:bg-peach-hover hover:shadow-2xl hover:shadow-peach/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xl uppercase tracking-tighter"
                        >
                            {isLoading ? <LoadingSpinner /> : t.generateJourney}
                        </motion.button>
                    </div>

                    {showValidationError && !validation.hasCities && <p className="text-red-500 text-sm mt-2 text-center font-bold uppercase tracking-widest">{t.cityRequired}</p>}
                    {showValidationError && validation.hasCities && !validation.datesValid && <p className="text-red-500 text-sm mt-2 text-center font-bold uppercase tracking-widest">{t.departureAfterArrival}</p>}
                </form>
            </motion.div>
        </div>
    );
};
