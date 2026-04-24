import type { Appointment } from '../types/appointment';

export const formatDateForICS = (dateStr: string) => {
    // 2023-10-25T14:30:00.000Z -> 20231025T143000Z
    return dateStr.replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateICS = (appointment: Appointment) => {
    const startTime = formatDateForICS(appointment.start_time);
    const endTime = formatDateForICS(appointment.end_time);

    // Standard ICS format
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Step of Step//Website//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:Step of Step - ${appointment.meeting_type === 'online' ? 'Online Toplantı' : 'Görüşme'}`,
        `DESCRIPTION:Görüşme Detayları:\\nKişi: ${appointment.user_name}\\nTip: ${appointment.meeting_type}\\nNot: ${appointment.notes || ''}`,
        'LOCATION:Online / Google Meet',
        'STATUS:CONFIRMED',
        `UID:${appointment.id}@stepofstep.com`,
        `DTSTAMP:${formatDateForICS(new Date().toISOString())}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\\r\\n');

    return icsContent;
};

export const downloadICS = (appointment: Appointment) => {
    const icsContent = generateICS(appointment);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `randevu-${appointment.user_name.replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const getGoogleCalendarLink = (appointment: Appointment) => {
    const startTime = formatDateForICS(appointment.start_time);
    const endTime = formatDateForICS(appointment.end_time);
    const title = encodeURIComponent(`Step of Step - ${appointment.meeting_type === 'online' ? 'Online Toplantı' : 'Görüşme'}`);
    const details = encodeURIComponent(`Görüşme Detayları:\nKişi: ${appointment.user_name}\nTip: ${appointment.meeting_type}`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=Online`;
};
