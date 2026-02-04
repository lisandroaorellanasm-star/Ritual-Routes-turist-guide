
interface CalendarEvent {
    title: string;
    description: string;
    location: string;
    startTime: Date;
    endTime: Date;
}

// Formats a date for the iCalendar format (YYYYMMDDTHHMMSSZ)
const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
};

// Generates the content for an .ics file from a list of events
export const generateIcsContent = (events: CalendarEvent[], language: string): string => {
    const icsEvents = events.map(event => {
        return [
            'BEGIN:VEVENT',
            `UID:${Math.random().toString(36).substring(2)}@ritualroutes.app`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(event.startTime)}`,
            `DTEND:${formatDate(event.endTime)}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
            `LOCATION:${event.location}`,
            'END:VEVENT'
        ].join('\r\n');
    }).join('\r\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//RitualRoutes//AI Tourist Guide//${language.toUpperCase()}`,
        icsEvents,
        'END:VCALENDAR'
    ].join('\r\n');
};

// Triggers the download of a file with the given content and filename
export const downloadIcsFile = (content: string, filename: string): void => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Parses a time string like "9:00 AM" or "1:30 PM" into hours and minutes
export const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (hours === 12) {
        hours = modifier.toUpperCase() === 'AM' ? 0 : 12;
    } else if (modifier.toUpperCase() === 'PM') {
        hours += 12;
    }

    return { hours, minutes: minutes || 0 };
};
