import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Send, MessageCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isValidName, isValidEmail, isValidPhone } from '../utils/validation';
import { supabase } from '../lib/supabase';
import SEO from '../components/common/SEO';

const Contact = () => {
    const { t } = useTranslation();
    // const { getPagePath } = useSiteSettings();

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
        <div className="min-h-screen max-w-6xl mx-auto pt-32 pb-20 px-6">
            <SEO path="/contact" />
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20 pt-14">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-orange-500 font-bold tracking-wider uppercase mb-4 block"
                    >
                        {t('contact.heading')}
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-bold text-[rgb(var(--text-primary))] mb-6"
                    >
                        {t('contact.heading').replace('extraordinary', '')} <span className="text-orange-500">{t('contact.highlight')}</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto"
                    >
                        {t('contact.description')}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-12"
                    >
                        {/* Info Cards */}
                        <div className="grid gap-6">
                            <a href="mailto:info@stepofstep.com" className="glass-panel p-6 rounded-3xl flex items-center gap-6 group hover:border-orange-500/30 transition-all">
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[rgb(var(--text-primary))] text-lg mb-1">{t('contact.email')}</h3>
                                    <p className="text-[rgb(var(--text-secondary))] group-hover:text-orange-600 transition-colors">info@stepofstep.com</p>
                                </div>
                            </a>

                            <a href="https://wa.me/908503033853" target="_blank" rel="noopener noreferrer" className="glass-panel p-6 rounded-3xl flex items-center gap-6 group hover:border-green-500/30 transition-all">
                                <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[rgb(var(--text-primary))] text-lg mb-1">{t('contact.phone')}</h3>
                                    <p className="text-[rgb(var(--text-secondary))] group-hover:text-green-600 transition-colors">+90 850 303 38 53</p>
                                </div>
                            </a>

                            <div className="glass-panel p-6 rounded-3xl flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[rg   b(var(--text-primary))] text-lg mb-1">Ofisimiz</h3>
                                    <p className="text-[rgb(var(--text-secondary))]">İnönü Mah. 150. Sk. No: 1 44100 Torbalı İzmir, Türkiye</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-panel p-8 md:p-10 rounded-3xl bg-[rgb(var(--bg-secondary))]"
                    >
                        <h2 className="text-2xl font-bold mb-8 text-[rgb(var(--text-primary))]">{t('contact.send_msg')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.name')}</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        type="text"
                                        disabled={isLoading}
                                        className={`w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-primary))] border transition-all focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500/20'}`}
                                        placeholder={t('contact.name')}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.surname')}</label>
                                    <input
                                        name="surname"
                                        value={formData.surname}
                                        onChange={handleChange}
                                        type="text"
                                        disabled={isLoading}
                                        className={`w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-primary))] border transition-all focus:outline-none focus:ring-2 ${errors.surname ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500/20'}`}
                                        placeholder={t('contact.surname')}
                                    />
                                    {errors.surname && <p className="text-red-500 text-xs">{errors.surname}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.email')}</label>
                                    <input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        type="email"
                                        disabled={isLoading}
                                        className={`w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-primary))] border transition-all focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500/20'}`}
                                        placeholder={t('contact.email')}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.phone')}</label>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        type="tel"
                                        disabled={isLoading}
                                        className={`w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-primary))] border transition-all focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500/20'}`}
                                        placeholder={t('contact.phone')}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">{t('contact.message')}</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={4}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                                    placeholder={t('contact.message')}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Gönderiliyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        {t('contact.submit')}
                                    </>
                                )}
                            </button>

                            <div className="text-center mt-3">
                                <Link to="/portal/messages" className="text-[rgb(var(--text-secondary))] text-xs font-bold hover:text-orange-500 transition-colors inline-flex flex-col md:flex-row items-center gap-0.5 md:gap-2 bg-[rgb(var(--bg-primary))] px-6 py-3 md:px-4 md:py-2 rounded-2xl md:rounded-full border border-[rgb(var(--border-primary))]">
                                    <span>Daha önce mesaj gönderdin mi?</span>
                                    <span className="text-orange-600 underline">Mesajını Takip Et</span>
                                </Link>
                            </div>
                        </form>
                    </motion.div>
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
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
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

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">
                                {submitStatus === 'success' ? 'Mesajınız Gönderildi!' : 'Bir Hata Oluştu!'}
                            </h3>

                            <p className="text-zinc-500 mb-6">
                                {submitStatus === 'success'
                                    ? 'Mesajınız bize başarıyla ulaştı. En kısa sürede size geri dönüş yapacağız.'
                                    : 'Mesajınız gönderilirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.'}
                            </p>

                            <button
                                onClick={() => setSubmitStatus('idle')}
                                className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${submitStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                Tamam
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Contact;
