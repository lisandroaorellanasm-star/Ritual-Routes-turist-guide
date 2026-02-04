
import React, { useState, useEffect } from 'react';
import { Itinerary, ItineraryDay, ItineraryItem, GroundingChunk } from '../types';
import { PlayIcon, MapPinIcon, SearchIcon, CalendarPlusIcon, TagIcon } from './icons';
import { MapView } from './MapView';

interface ItineraryDisplayProps {
    itinerary: Itinerary;
    groundingChunks: GroundingChunk[];
    onPlayAudio: (text: string) => void;
    onAddToCalendar: (item: ItineraryItem | ItineraryDay) => void;
    t: { [key: string]: string };
}

interface ItineraryCardProps {
    item: ItineraryItem;
    dayNumber: number;
    onPlayAudio: (text: string) => void;
    onAddToCalendar: (item: ItineraryItem) => void;
    onSelectItem: (item: ItineraryItem) => void;
    isSelected: boolean;
    t: { [key: string]: string };
}

const slugify = (text: string) =>
    String(text).toLowerCase().replace(/[\s\W_]+/g, '-');


const ItineraryItemCard: React.FC<ItineraryCardProps> = ({ item, dayNumber, onPlayAudio, onAddToCalendar, onSelectItem, isSelected, t }) => {
    const isMappable = item.latitude != null && item.longitude != null;
    const elementId = `itinerary-item-${dayNumber}-${slugify(item.time)}-${slugify(item.activity)}`;

    const baseClasses = 'flex gap-4 transition-colors relative py-3 px-2';
    const mappableClasses = isMappable ? 'cursor-pointer rounded-2xl hover:bg-slate-50' : '';
    const selectedClasses = isSelected ? 'bg-peach/10 rounded-2xl' : '';

    return (
        <div
            id={elementId}
            className={`${baseClasses} ${selectedClasses || mappableClasses}`}
            onClick={() => isMappable && onSelectItem(item)}
            role={isMappable ? 'button' : undefined}
            tabIndex={isMappable ? 0 : undefined}
            onKeyDown={(e) => {
                if (isMappable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectItem(item);
                }
            }}
        >
            {isSelected && <div className="absolute left-[-22px] top-4 w-3.5 h-3.5 bg-peach border-2 border-white rounded-full animate-pulse shadow-sm"></div>}
            <div className="w-20 text-right text-slate-500 font-mono text-sm shrink-0 pt-0.5">{item.time}</div>
            <div className="relative pl-6 border-l-2 border-slate-200 w-full ml-1">
                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 bg-white border-2 ${isSelected ? 'border-peach' : 'border-slate-300'} rounded-full transition-colors`}></div>
                <h4 className="font-bold text-slate-900 text-lg leading-tight">{item.activity}</h4>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">{item.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPlayAudio(item.details); }}
                        className="text-xs inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-semibold transition-colors z-10 bg-teal-50 px-2 py-1 rounded-lg"
                    >
                        <PlayIcon />
                        {t.narrateStory}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToCalendar(item); }}
                        className="text-xs inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-semibold transition-colors z-10 bg-slate-100 px-2 py-1 rounded-lg"
                    >
                        <CalendarPlusIcon />
                        {t.addToCalendar}
                    </button>
                    {item.estimatedCost && (
                        <div className="text-xs inline-flex items-center gap-1.5 text-slate-500 px-2 py-1">
                            <TagIcon />
                            <span>{t.estimatedCost}: {item.estimatedCost}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ItineraryDayCardProps {
    day: ItineraryDay;
    onPlayAudio: (text: string) => void;
    onAddToCalendar: (item: ItineraryItem | ItineraryDay) => void;
    onSelectItem: (item: ItineraryItem) => void;
    selectedItem: ItineraryItem | null;
    t: { [key: string]: string };
}

const ItineraryDayCard: React.FC<ItineraryDayCardProps> = ({ day, onPlayAudio, onAddToCalendar, onSelectItem, selectedItem, t }) => {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-teal-50 text-teal-600 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-teal-100 tracking-wider shadow-sm">{day.city || 'Destino'}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{`${t.day} ${day.day}: ${day.title}`}</h3>
                    <p className="text-slate-500 mt-2 text-sm italic font-medium">"{day.theme}"</p>
                </div>
                <button
                    onClick={() => onAddToCalendar(day)}
                    className="text-xs inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl transition-colors font-bold border border-slate-200"
                >
                    <CalendarPlusIcon />
                    {t.addDayToCalendar}
                </button>
            </div>
            <div className="space-y-2">
                {day.schedule.length > 0 ? (
                    day.schedule.map((item, index) => {
                        const isSelected = selectedItem?.activity === item.activity && selectedItem?.time === item.time && selectedItem?.description === item.description;
                        return (
                            <ItineraryItemCard
                                key={index}
                                item={item}
                                dayNumber={day.day}
                                onPlayAudio={onPlayAudio}
                                onAddToCalendar={onAddToCalendar}
                                onSelectItem={onSelectItem}
                                isSelected={isSelected}
                                t={t}
                            />
                        )
                    })
                ) : (
                    <p className="text-slate-400 text-center py-4">{t.noActivitiesFilter}</p>
                )}
            </div>
        </div>
    );
};

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, groundingChunks, onPlayAudio, onAddToCalendar, t }) => {
    const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'half' | 'full'>('all');
    const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);

    useEffect(() => {
        if (selectedItem) {
            const dayOfItem = itinerary.days.find(d => d.schedule.includes(selectedItem));
            if (dayOfItem) {
                const elementId = `itinerary-item-${dayOfItem.day}-${slugify(selectedItem.time)}-slugify(selectedItem.activity)}`;
                const element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }
            }
        }
    }, [selectedItem, itinerary.days]);

    const handleMarkerClick = (item: ItineraryItem) => {
        setDurationFilter('all');
        setSelectedItem(item);
    };

    const filteredDays = itinerary.days.map(day => {
        const filteredSchedule = day.schedule.filter(item => {
            if (durationFilter === 'all') return true;
            if (item.durationMinutes === undefined || item.durationMinutes === null) return false;

            switch (durationFilter) {
                case 'short':
                    return item.durationMinutes < 120;
                case 'half':
                    return item.durationMinutes >= 120 && item.durationMinutes <= 240;
                case 'full':
                    return item.durationMinutes > 240;
                default:
                    return true;
            }
        });
        return { ...day, schedule: filteredSchedule };
    });

    const filterOptions = [
        { key: 'all', label: t.allActivities },
        { key: 'short', label: t.shortActivity },
        { key: 'half', label: t.halfDay },
        { key: 'full', label: t.fullDay },
    ];

    return (
        <div className="animate-fade-in space-y-12 pb-12 max-w-5xl mx-auto px-4 md:px-0">
            <div className="text-center pt-8">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">{itinerary.title}</h2>
                <div className="h-1.5 w-24 bg-peach mx-auto my-6 rounded-full"></div>
                <p className="text-slate-600 mt-2 max-w-3xl mx-auto leading-relaxed text-lg">{itinerary.introduction}</p>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center justify-center gap-1 sm:gap-2 flex-wrap shadow-sm max-w-2xl mx-auto">
                <span className="text-xs font-bold text-slate-400 uppercase px-3 tracking-widest">{t.filterByDuration}:</span>
                {filterOptions.map(option => (
                    <button
                        key={option.key}
                        onClick={() => setDurationFilter(option.key as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${durationFilter === option.key
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <MapView days={filteredDays} t={t} selectedItem={selectedItem} onMarkerClick={handleMarkerClick} />

            <div className="space-y-8">
                {filteredDays.map((day) => (
                    <ItineraryDayCard
                        key={day.day}
                        day={day}
                        onPlayAudio={onPlayAudio}
                        onAddToCalendar={onAddToCalendar}
                        onSelectItem={setSelectedItem}
                        selectedItem={selectedItem}
                        t={t}
                    />
                ))}
            </div>

            {groundingChunks.length > 0 && (
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <SearchIcon /> {t.sourcesAndFurtherReading}
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groundingChunks.map((chunk, index) => {
                            if (chunk.web && chunk.web.uri && chunk.web.title) {
                                return (
                                    <li key={index} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all group">
                                        <div className="p-1.5 bg-sky-100 rounded-lg text-sky-500 group-hover:scale-110 transition-transform"><SearchIcon /></div>
                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 font-medium hover:text-sky-600 transition-colors line-clamp-2 mt-0.5">
                                            {chunk.web.title}
                                        </a>
                                    </li>
                                )
                            }
                            if (chunk.maps) {
                                return (
                                    <li key={index} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group">
                                        <div className="p-1.5 bg-teal-100 rounded-lg text-teal-500 group-hover:scale-110 transition-transform"><MapPinIcon /></div>
                                        <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 font-medium hover:text-teal-600 transition-colors line-clamp-2 mt-0.5">
                                            {chunk.maps.title}
                                        </a>
                                    </li>
                                )
                            }
                            return null;
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};
