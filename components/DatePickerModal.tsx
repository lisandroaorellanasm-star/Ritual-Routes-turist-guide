import React, { useState } from 'react';

interface DatePickerModalProps {
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    t: { [key: string]: string };
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({ onConfirm, onCancel, t }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const handleConfirm = () => {
        // The input gives 'YYYY-MM-DD', which new Date() interprets as UTC.
        // To avoid timezone issues, create the date with an explicit time and timezone context.
        const [year, month, day] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        onConfirm(date);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-2xl w-full max-w-sm animate-fade-in relative">
                <h3 className="text-xl font-bold text-slate-900">{t.setTripStartDate}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t.datePickerDescription}</p>
                <div className="mt-6">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-peach focus:border-peach outline-none"
                    />
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-xl"
                    >
                        {t.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
};
