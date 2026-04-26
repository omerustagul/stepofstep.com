import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarCheck } from 'lucide-react';
import BookingCalendar from './BookingCalendar';
import BookingForm from './BookingForm';
import { supabase } from '../../lib/supabase';
import { emailService } from '../../services/emailService';
import { addMinutes } from 'date-fns';
import { downloadICS, getGoogleCalendarLink } from '../../utils/calendarUtils';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BookingModal = ({ isOpen, onClose }: BookingModalProps) => {
    const [step, setStep] = useState<'calendar' | 'form' | 'success'>('calendar');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [appointmentData, setAppointmentData] = useState<any>(null);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setStep('form');
    };

    const handleFormSubmit = async (formData: any) => {
        if (!selectedDate) return;

        setIsSubmitting(true);
        const startTime = selectedDate.toISOString();
        const endTime = addMinutes(selectedDate, 45).toISOString(); // Default 45 min meeting

        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert({
                    start_time: startTime,
                    end_time: endTime,
                    user_name: formData.name,
                    user_email: formData.email,
                    user_phone: formData.phone,
                    meeting_type: formData.meetingType,
                    notes: formData.notes,
                    status: 'confirmed' // Auto confirm for now
                })
                .select()
                .single();

            if (error) throw error;

            // Send Confirmation Email
            try {
                await emailService.sendEmail({
                    to: formData.email,
                    subject: 'Randevunuz Oluşturuldu - Step of Step',
                    html: `
                        <h1>Randevunuz Onaylandı</h1>
                        <p>Sayın ${formData.name},</p>
                        <p><strong>${selectedDate.toLocaleDateString('tr-TR')}</strong> tarihinde saat <strong>${selectedDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</strong> için randevunuz başarıyla oluşturuldu.</p>
                        <p>Görüşme Tipi: ${formData.meetingType === 'online' ? 'Online Görüşme (Google Meet)' : 'Ofiste Yüz Yüze'}</p>
                        <hr>
                        <p>Görüşmek üzere,<br>Step of Step Ekibi</p>
                    `
                });
            } catch (emailError) {
                console.error('Email confirmation failed:', emailError);
                // Don't block the UI flow for email error
            }

            setAppointmentData(data); // Save for ICS generation
            setStep('success');
        } catch (err) {
            console.error('Booking error:', err);
            alert('Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Reset state after close animation
        onClose();
        setTimeout(() => {
            setStep('calendar');
            setSelectedDate(null);
            setAppointmentData(null);
        }, 500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="glass-panel fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-4xl bg-[rgb(var(--bg-primary))] backdrop-blur-xl border border-[rgb(var(--border-primary))] shadow-2xl rounded-3xl overflow-hidden"
                        >
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-[rgb(var(--bg-primary))] hover:bg-[rgb(var(--accent-primary))] text-[rgb(var(--accent-primary))] hover:text-[rgb(var(--text-primary))] rounded-full transition-all"
                            >
                                <X size={16} />
                            </button>

                            {step === 'calendar' && (
                                <BookingCalendar onSelectSlot={handleDateSelect} />
                            )}

                            {step === 'form' && (
                                <BookingForm
                                    selectedDate={selectedDate}
                                    onSubmit={handleFormSubmit}
                                    onBack={() => setStep('calendar')}
                                    isSubmitting={isSubmitting}
                                />
                            )}

                            {step === 'success' && appointmentData && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-12 text-center max-w-lg mx-auto"
                                >
                                    <div className="w-24 h-24 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-500/5">
                                        <CalendarCheck size={40} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-3xl font-black text-zinc-900 mb-2 tracking-tight">Randevu Onaylandı!</h2>
                                    <p className="text-zinc-500 mb-8 font-medium">
                                        Görüşme detayları e-posta adresinize gönderildi. Takviminize eklemeyi unutmayın.
                                    </p>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => downloadICS(appointmentData)}
                                            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20 active:scale-[0.98]"
                                        >
                                            Takvime Ekle (.ICS)
                                        </button>
                                        <a
                                            href={getGoogleCalendarLink(appointmentData)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-4 bg-white border border-zinc-200 text-zinc-700 rounded-2xl font-bold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            Google Takvim'e Ekle
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BookingModal;
