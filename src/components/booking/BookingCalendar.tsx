import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay, addMinutes, addDays, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface BookingCalendarProps {
    onSelectSlot: (date: Date) => void;
}

const BookingCalendar = ({ onSelectSlot }: BookingCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [availability, setAvailability] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAvailability();
    }, [currentDate]);

    const fetchAvailability = async () => {
        setLoading(true);
        // Fetch Weekly Schedule
        const { data: schedule } = await supabase.from('appointment_availability').select('*');
        if (schedule) setAvailability(schedule);

        // Fetch Exceptions and Appointments for Current Month
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        const { data: exceptionData } = await supabase
            .from('appointment_exceptions')
            .select('*')
            .gte('date', start)
            .lte('date', end);

        if (exceptionData) setExceptions(exceptionData);

        const { data: appointmentData } = await supabase
            .from('appointments')
            .select('start_time, end_time')
            .gte('start_time', start)
            .lte('end_time', end)
            .neq('status', 'cancelled'); // Don't block cancelled slots

        if (appointmentData) setAppointments(appointmentData);

        setLoading(false);
    };

    const getSlotsForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = date.getDay(); // 0 = Sunday

        // 1. Check Exceptions First
        const exception = exceptions.find(e => e.date === dateStr);

        let start = '09:00';
        let end = '18:00';

        if (exception) {
            if (!exception.is_available) return []; // Closed
            start = exception.start_time;
            end = exception.end_time;
        } else {
            // 2. Check Weekly Schedule
            const dayRule = availability.find(d => d.day_of_week === dayOfWeek);
            if (dayRule) {
                if (!dayRule.is_working_day) return []; // Closed
                start = dayRule.start_time;
                end = dayRule.end_time;
            } else {
                if (dayOfWeek === 0 || dayOfWeek === 6) return []; // Default weekend closed
            }
        }

        // Generate Time Slots
        const slots: string[] = [];
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        let current = new Date(date);
        current.setHours(startHour, startMin, 0, 0);

        const closeTime = new Date(date);
        closeTime.setHours(endHour, endMin, 0, 0);

        while (current < closeTime) {
            const slotStart = current;
            const slotEnd = addMinutes(current, 60); // 1 hour slots by default

            // Check if this slot overlaps with any existing appointment
            const isOccupied = appointments.some(app => {
                const appStart = new Date(app.start_time);
                const appEnd = new Date(app.end_time);
                return slotStart < appEnd && slotEnd > appStart;
            });

            if (!isOccupied) {
                slots.push(format(current, 'HH:mm'));
            }

            current = addMinutes(current, 60);
        }

        // Filter past times if today
        if (isToday(date)) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();
            return slots.filter(slot => {
                const [h, m] = slot.split(':').map(Number);
                return h > currentHour || (h === currentHour && m > currentMin);
            });
        }

        return slots;
    };

    const isDateDisabled = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = date.getDay();

        // Check if more than 14 days ahead
        const maxDate = addDays(new Date(), 14);
        if (isAfter(date, maxDate)) return true;

        // Exception Check
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) return !exception.is_available;

        // Weekly Check
        const dayRule = availability.find(d => d.day_of_week === dayOfWeek);
        if (dayRule) return !dayRule.is_working_day;

        return dayOfWeek === 0 || dayOfWeek === 6; // Default weekend closed
    };

    const handleDateClick = (day: Date) => {
        if (isBefore(day, startOfDay(new Date()))) return;
        if (loading) return;
        if (isDateDisabled(day)) return;

        setSelectedDate(day);
    };

    const handleTimeSelect = (time: string) => {
        if (!selectedDate) return;
        const [hours, minutes] = time.split(':').map(Number);
        const dateWithTime = new Date(selectedDate);
        dateWithTime.setHours(hours, minutes);
        onSelectSlot(dateWithTime);
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    const availableTimeSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

    return (
        <div className="flex flex-col md:flex-row h-auto max-h-[700px] overflow-hidden">
            {/* Calendar Section */}
            <div className="p-3 md:p-6 flex-1 min-w-[100px] md:min-w-[500px] bg-[rgb(var(--bg-primary))]">
                <div className="flex items-center gap-3 justify-start mb-6">
                    <h3 className="text-xl font-bold text-[rgb(var(--text-secondary))] capitalize tracking-tight">
                        {format(currentDate, 'MMMM yyyy', { locale: tr })}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                            disabled={isSameMonth(currentDate, new Date())}
                            className="w-10 h-10 flex items-center justify-center bg-[rgb(var(--bg-secondary))] rounded-xl hover:bg-[rgb(var(--accent-primary))] disabled:opacity-30 transition-colors text-[rgb(var(--text-primary))]"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                            className="w-10 h-10 flex items-center justify-center bg-[rgb(var(--bg-secondary))] rounded-xl hover:bg-[rgb(var(--accent-primary))] transition-colors text-[rgb(var(--text-primary))]"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-y-4 mb-4 text-center text-xs font-bold text-[rgb(var(--text-secondary))] uppercase tracking-widest">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                        <div key={d}>{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2 md:gap-3">
                    {Array.from({ length: (startOfMonth(currentDate).getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {daysInMonth.map((day) => {
                        const isPastDate = isBefore(day, startOfDay(new Date()));
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isDisabled = isDateDisabled(day);

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => handleDateClick(day)}
                                disabled={isPastDate || (isDisabled && !loading)}
                                className={`
                                relative aspect-square mx-auto flex items-center justify-center rounded-2xl text-sm font-bold transition-all w-full max-w-[48px]
                                ${isSelected
                                        ? 'bg-[rgb(var(--accent-primary))] text-[rgb(var(--bg-card))] shadow-xl shadow-zinc-900/20 scale-105'
                                        : ''
                                    }
                                ${!isSelected && !isPastDate && !isDisabled
                                        ? 'hover:bg-[rgb(var(--accent-primary))] text-[rgb(var(--text-primary))] hover:scale-110'
                                        : ''
                                    }
                                ${isPastDate || (isDisabled && !loading)
                                        ? 'text-[rgb(var(--text-muted))] cursor-not-allowed'
                                        : ''
                                    }
                                ${isToday(day) && !isSelected ? 'ring-2 ring-orange-500/20 text-orange-600 bg-orange-50' : ''}
                            `}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 flex items-center gap-6 text-xs font-medium text-[rgb(var(--text-muted))] justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[rgb(var(--accent-primary))]"></div>
                        <span>Seçili</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-100 ring-2 ring-orange-500/20"></div>
                        <span>Bugün</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[rgb(var(--bg-secondary))]"></div>
                        <span>Dolu</span>
                    </div>
                </div>
            </div>

            {/* Time Slots Section */}
            <div className="w-full md:w-80 bg-[rgb(var(--bg-secondary))] border-t md:border-t-0 md:border-l border-[rgb(var(--border-primary))] flex flex-col h-[300px] md:h-auto">
                <div className="p-3 pt-6 pb-2">
                    <h4 className="text-sm font-bold text-[rgb(var(--text-primary))] uppercase tracking-wide flex items-center gap-2">
                        <Clock size={16} className="text-[rgb(var(--accent-primary))]" />
                        {selectedDate ? format(selectedDate, 'd MMMM', { locale: tr }) : 'Tarih Seçin'}
                    </h4>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pt-6 pb-6 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="animate-spin text-[rgb(var(--accent-primary))]" />
                            </div>
                        ) : selectedDate ? (
                            availableTimeSlots.length > 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    {availableTimeSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => handleTimeSelect(time)}
                                            className="group relative overflow-hidden py-3 px-4 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] rounded-xl text-sm font-bold transition-all hover:border-[rgb(var(--accent-primary))] hover:shadow-lg hover:shadow-[rgb(var(--accent-primary))]/10 active:scale-95"
                                        >
                                            <span className="relative z-10 text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent-primary))] transition-colors">
                                                {time}
                                            </span>
                                            <div className="absolute inset-0 bg-[rgb(var(--accent-light))] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-zinc-400 text-center text-sm p-4 gap-3"
                                >
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                                        <Info size={20} className="opacity-50" />
                                    </div>
                                    <span>Bu tarihte uygun saat bulunmuyor.</span>
                                </motion.div>
                            )
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-[rgb(var(--text-primary))] text-center text-sm p-4 gap-4"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--bg-primary))] flex items-center justify-center rotate-3">
                                    <Clock size={24} className="text-[rgb(var(--text-primary))]" />
                                </div>
                                <p className="max-w-[200px]">
                                    Uygun saatleri görüntülemek için takvimden bir gün seçin.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// Helper component
const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default BookingCalendar;
