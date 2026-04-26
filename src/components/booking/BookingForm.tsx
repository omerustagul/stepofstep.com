import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, User, Mail, Phone, Video, CheckCircle, Loader2 } from 'lucide-react';

interface BookingFormProps {
    selectedDate: Date | null;
    onSubmit: (formData: any) => Promise<void>;
    onBack: () => void;
    isSubmitting: boolean;
}

const BookingForm = ({ selectedDate, onSubmit, onBack, isSubmitting }: BookingFormProps) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
        meetingType: 'online' // online, phone
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Name Validation (Letters and spaces only)
        if (!formData.name.trim()) {
            newErrors.name = 'İsim soyisim zorunludur.';
        } else if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(formData.name)) {
            newErrors.name = 'İsim sadece harflerden oluşmalıdır.';
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'E-posta adresi zorunludur.';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
        }

        // Phone Validation (Turkey Format mostly, but generic enough for International)
        // clean spaces and dashes
        const cleanPhone = formData.phone.replace(/[\s-]/g, '');
        if (!formData.phone.trim()) {
            newErrors.phone = 'Telefon numarası zorunludur.';
        } else if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
            newErrors.phone = 'Geçerli bir telefon numarası giriniz (Örn: 0555 555 55 55).';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers, spaces, +, -
        const value = e.target.value;
        if (/^[0-9\s+\-]*$/.test(value)) {
            setFormData({ ...formData, phone: value });
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    if (!selectedDate) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[rgb(var(--bg-primary))] rounded-[2.5rem] shadow-xl p-8 border border-[rgb(var(--border-primary))] max-w-lg mx-auto"
        >
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[rgb(var(--border-primary))]">
                <div className="w-12 h-12 bg-[rgb(var(--bg-secondary))]/50 rounded-xl flex items-center justify-center text-[rgb(var(--accent-primary))]">
                    <Calendar size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-[rgb(var(--text-primary))]">Randevu Detayları</h3>
                    <p className="text-[rgb(var(--text-secondary))] text-sm">
                        {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })} saat {format(selectedDate, 'HH:mm')}
                    </p>
                </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-[rgb(var(--text-primary))] mb-1 block">Görüşme Tipi</span>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, meetingType: formData.meetingType === 'online' ? 'office' : 'online' })}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${formData.meetingType === 'online'
                                    ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-light))] text-[rgb(var(--text-primary))] ring-2 ring-[rgb(var(--accent-primary))]/20'
                                    : 'border-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-light))]'
                                    }`}
                            >
                                <Video size={18} />
                                <span className="font-medium">Video Toplantı</span>
                            </button>
                        </div>
                    </label>

                    <div>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--accent-primary))]" size={18} />
                            <input
                                type="text"
                                className={`w-full pl-10 pr-4 py-3 bg-[rgb(var(--bg-primary))] rounded-xl border focus:ring-4 focus:ring-[rgb(var(--accent-primary))]/10 outline-none transition-all ${errors.name ? 'border-red-500' : 'border-[rgb(var(--border-primary))] focus:border-[rgb(var(--accent-primary))]'
                                    }`}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Adınız Soyadınız"
                            />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
                    </div>

                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--accent-primary))]" size={18} />
                            <input
                                type="email"
                                className={`w-full pl-10 pr-4 py-3 bg-[rgb(var(--bg-primary))] rounded-xl border focus:ring-4 focus:ring-[rgb(var(--accent-primary))]/10 outline-none transition-all ${errors.email ? 'border-red-500' : 'border-[rgb(var(--border-primary))] focus:border-[rgb(var(--accent-primary))]'
                                    }`}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="E-posta Adresiniz"
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                    </div>

                    <div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--accent-primary))]" size={18} />
                            <input
                                type="tel"
                                className={`w-full pl-10 pr-4 py-3 bg-[rgb(var(--bg-primary))] rounded-xl border focus:ring-4 focus:ring-[rgb(var(--accent-primary))]/10 outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-[rgb(var(--border-primary))] focus:border-[rgb(var(--accent-primary))]'
                                    }`}
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                placeholder="530 765 43 21"
                                maxLength={15}
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
                    </div>

                    <textarea
                        placeholder="Notlarınız (Opsiyonel)"
                        className="w-full p-4 bg-[rgb(var(--bg-primary))] rounded-xl border border-[rgb(var(--border-primary))] focus:border-[rgb(var(--accent-primary))] focus:ring-4 focus:ring-[rgb(var(--accent-primary))]/10 outline-none transition-all min-h-[100px] resize-none"
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>


                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-3 rounded-xl font-bold text-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-light))] transition-colors"
                        disabled={isSubmitting}
                    >
                        Geri
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-hover))] text-white py-3 rounded-xl font-bold shadow-lg shadow-[rgb(var(--accent-primary))]/25 hover:shadow-[rgb(var(--accent-primary))]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                İşleniyor...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Onayla
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default BookingForm;
