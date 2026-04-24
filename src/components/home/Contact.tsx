import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isValidName, isValidEmail, isValidPhone } from '../../utils/validation';
import { supabase } from '../../lib/supabase';

const Contact = () => {
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        phone: '',
        email: '',
        message: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleValidation = () => {
        const newErrors: { [key: string]: string } = {};

        if (!isValidName(formData.name)) newErrors.name = 'Geçerli bir isim giriniz.';
        if (!isValidName(formData.surname)) newErrors.surname = 'Geçerli bir soyisim giriniz.';
        if (!isValidPhone(formData.phone)) newErrors.phone = 'Geçerli bir telefon numarası giriniz.';
        if (!isValidEmail(formData.email)) newErrors.email = 'Geçerli bir e-posta adresi giriniz.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (handleValidation()) {
            setIsLoading(true);
            setSubmitStatus('idle');

            try {
                // Save to Supabase
                const { error } = await supabase
                    .from('contact_messages')
                    .insert({
                        name: formData.name,
                        surname: formData.surname,
                        email: formData.email,
                        phone: formData.phone,
                        message: formData.message,
                        status: 'new'
                    });

                if (error) throw error;

                // Simulate success delay for nicer UX
                await new Promise(resolve => setTimeout(resolve, 500));

                setSubmitStatus('success');
                setFormData({
                    name: '',
                    surname: '',
                    phone: '',
                    email: '',
                    message: ''
                });
            } catch (error) {
                console.error("Submission error:", error);
                setSubmitStatus('error');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <section id="contact" className="max-w-6xl mx-auto px-6 py-10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] -z-10" />

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

                    <div>
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-6xl font-bold mb-6"
                        >
                            {t('contact.heading')} <span className="text-orange-500">{t('contact.highlight')}</span>
                        </motion.h2>
                        <p className="text-zinc-500 text-lg mb-8">
                            {t('contact.description')}
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-[rgb(var(--text-secondary))]">
                                <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-orange-500 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-sm">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-[rgb(var(--text-tertiary))]">E-Posta ile Bize Ulaşın</p>
                                    <p className="font-semibold text-[rgb(var(--text-primary))]">info@stepofstep.com</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-[rgb(var(--text-secondary))]">
                                <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-orange-500 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-sm">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-[rgb(var(--text-tertiary))]">Bizi Arayın</p>
                                    <p className="font-semibold text-[rgb(var(--text-primary))]">+90 (850) 303 38 53</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-[rgb(var(--text-secondary))]">
                                <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-orange-500 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-sm">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-[rgb(var(--text-tertiary))]">Bizi Ziyaret Edin</p>
                                    <p className="font-semibold text-[rgb(var(--text-primary))]">İzmir, Turkey</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <motion.form
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-8 rounded-3xl space-y-6 bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl border border-[rgb(var(--border-primary))] relative"
                        onSubmit={handleSubmit}
                    >
                        <h3 className="text-2xl font-bold mb-2 text-[rgb(var(--text-primary))]">{t('contact.send_msg')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.name')}</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    type="text"
                                    disabled={isLoading}
                                    className={`w-full bg-[rgb(var(--bg-input))] border rounded-3xl px-4 py-3 focus:outline-none focus:ring-1 transition-all text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500'}`}
                                    placeholder={t('contact.name')}
                                />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.surname')}</label>
                                <input
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleChange}
                                    type="text"
                                    disabled={isLoading}
                                    className={`w-full bg-[rgb(var(--bg-input))] border rounded-3xl px-4 py-3 focus:outline-none focus:ring-1 transition-all text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] ${errors.surname ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500'}`}
                                    placeholder={t('contact.surname')}
                                />
                                {errors.surname && <p className="text-red-500 text-xs">{errors.surname}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.phone')}</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    type="tel"
                                    disabled={isLoading}
                                    className={`w-full bg-[rgb(var(--bg-input))] border rounded-3xl px-4 py-3 focus:outline-none focus:ring-1 transition-all text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500'}`}
                                    placeholder={t('contact.phone')}
                                />
                                {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.email')}</label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    disabled={isLoading}
                                    className={`w-full bg-[rgb(var(--bg-input))] border rounded-3xl px-4 py-3 focus:outline-none focus:ring-1 transition-all text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500'}`}
                                    placeholder={t('contact.email')}
                                />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.message')}</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-3xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] h-22 resize-none"
                                placeholder={t('contact.message')}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-full transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Gönderiliyor...</span>
                                </>
                            ) : (
                                t('contact.submit')
                            )}
                        </button>



                        <div className="w-full min-w-[calc(100%-10rem)] flex items-center justify-center px-0 mt-3">
                            <Link to="/portal/support" className="text-[rgb(var(--text-tertiary))] text-xs font-bold hover:text-orange-500 transition-colors inline-flex flex-col md:flex-row items-center gap-0.5 md:gap-2 bg-[rgb(var(--bg-tertiary))] px-6 py-3 md:px-4 md:py-2 rounded-2xl md:rounded-full border border-[rgb(var(--border-primary))]">
                                <span>Daha önce mesaj gönderdin mi?</span>
                                <span className="text-orange-600 underline">Mesajını Takip Et</span>
                            </Link>
                        </div>
                    </motion.form>



                </div>
            </div>

            {/* Success/Error Modal Overlay */}
            <AnimatePresence>
                {submitStatus !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[rgb(var(--bg-card))] rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-[rgb(var(--border-primary))]"
                        >
                            <div className="flex justify-center mb-4">
                                {submitStatus === 'success' ? (
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                                        <CheckCircle size={32} />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                        <XCircle size={32} />
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">
                                {submitStatus === 'success' ? 'Mesajınız Gönderildi!' : 'Bir Hata Oluştu!'}
                            </h3>

                            <p className="text-[rgb(var(--text-secondary))] mb-6">
                                {submitStatus === 'success'
                                    ? 'Mesajınız bize başarıyla ulaştı. En kısa sürede size geri dönüş yapacağız.'
                                    : 'Mesajınız gönderilirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.'}
                            </p>

                            <button
                                onClick={() => setSubmitStatus('idle')}
                                className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${submitStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                                    }`}
                            >
                                Tamam
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Contact;
