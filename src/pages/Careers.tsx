import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useJobs } from '../context/JobContext';
import { Briefcase, Heart, Globe, ArrowRight, CheckCircle, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import SEO from '../components/common/SEO';
import { useSiteSettings } from '../context/SiteContext';

import { supabase } from '../lib/supabase';

const Careers = () => {
    const { t } = useTranslation();
    const { getPagePath } = useSiteSettings();
    const { addApplication } = useJobs();
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [cvData, setCvData] = useState<{ base64: string; fileName: string } | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-dismiss warning after 5 seconds
    useEffect(() => {
        if (warning) {
            const timer = setTimeout(() => {
                setWarning(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [warning]);

    const benefits = [
        { icon: Heart, title: t('careers.benefits.health'), desc: t('careers.benefits.health_desc') },
        { icon: Globe, title: t('careers.benefits.remote'), desc: t('careers.benefits.remote_desc') },
        { icon: Briefcase, title: t('careers.benefits.growth'), desc: t('careers.benefits.growth_desc') }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Check if CV is uploaded
            if (!cvData) {
                setWarning('Lütfen CV dosyanızı yükleyiniz.');
                setIsLoading(false);
                return;
            }

            // Check for duplicate application
            const { count } = await supabase
                .from('job_applications')
                .select('*', { count: 'exact', head: true })
                .eq('email', form.email);

            if (count && count > 0) {
                setWarning('Bu e-posta adresi ile daha önce bir başvuru yapılmış. İlginiz için teşekkür ederiz!');
                setIsLoading(false);
                return;
            }

            await addApplication({
                name: form.name,
                email: form.email,
                phone: form.phone,
                message: form.message,
                cv_url: cvData?.base64
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Başvuru gönderme hatası:', error);
            setWarning('Bir hata oluştu. Lütfen tekrar deneyiniz.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setWarning('Lütfen sadece PDF dosyası yükleyiniz.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            setWarning('Dosya boyutu 10MB\'dan küçük olmalıdır.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setCvData({ base64, fileName: file.name });
            setWarning(null); // Clear any previous warning
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] transition-colors duration-300">
            <SEO path={getPagePath('Kariyer', '/careers')} />
            {/* Hero Section */}
            <section className="relative h-[80vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-zinc-900 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-50"></div>
                <div className="relative z-10 text-center max-w-4xl pt-24 md:pt-16   py-10 px-6">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-bold tracking-wider uppercase mb-6 border border-orange-500/30"
                    >
                        {t('careers.join_team')}
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black mb-6 leading-tight"
                    >
                        {t('careers.title')}<br />
                        <span className="text-orange-500">{t('careers.title_highlight')}</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-zinc-300 max-w-2xl mx-auto"
                    >
                        {t('careers.description')}
                    </motion.p>
                </div>
            </section>

            {/* Life at Step Section */}
            <section className="py-24 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">{t('careers.life_at_step')}</h2>
                    <p className="text-[rgb(var(--text-secondary))] max-w-2xl mx-auto">{t('careers.life_desc')}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {benefits.map((benefit, idx) => (
                        <div key={idx} className="bg-[rgb(var(--bg-card))] p-8 rounded-3xl shadow-sm border border-[rgb(var(--border-primary))] hover:shadow-lg transition-all text-center group">
                            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <benefit.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-3">{benefit.title}</h3>
                            <p className="text-[rgb(var(--text-secondary))]">{benefit.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Application Form Section */}
            <section className="bg-[rgb(var(--bg-secondary))] relative overflow-hidden transition-colors duration-300 py-10 pb-20" id="apply">
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">{t('careers.apply.title')}</h2>
                        <p className="text-[rgb(var(--text-secondary))]">{t('careers.apply.subtitle')}</p>
                    </div>

                    {!submitted ? (
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            onSubmit={handleSubmit}
                            className="glass-panel bg-[rgb(var(--bg-card))]/50 p-8 md:p-12 rounded-3xl shadow-sm border border-[rgb(var(--border-primary))] backdrop-blur-sm"
                        >
                            <div className="grid md:grid-cols-2 gap-6 mb-6">

                                <div>
                                    <label className="block text-sm font-bold text-[rgb(var(--text-primary))] mb-2">{t('careers.apply.fullname')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-3xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-[rgb(var(--text-primary))]"
                                        placeholder="Ahmet Yılmaz"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[rgb(var(--text-primary))] mb-2">{t('careers.apply.email')}</label>
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-3xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all lowercase text-[rgb(var(--text-primary))]"
                                        placeholder="ahmet@example.com"
                                    />
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-[rgb(var(--text-primary))] mb-2">{t('careers.apply.phone')}</label>
                                <input
                                    type="tel"
                                    required
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-3xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-[rgb(var(--text-primary))]"
                                    placeholder="+90 555 123 4567"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-[rgb(var(--text-primary))] mb-2">{t('careers.apply.why_us')}</label>
                                <textarea
                                    required
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-3xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all h-32 resize-none text-[rgb(var(--text-primary))]"
                                    placeholder={t('careers.apply.why_placeholder')}
                                />
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-bold text-[rgb(var(--text-primary))] mb-2">{t('careers.apply.upload_cv')} <span className="text-red-500">*</span></label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div
                                    onClick={triggerFileInput}
                                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group ${cvData
                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                                        : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-input))] hover:bg-[rgb(var(--bg-card))] hover:border-orange-400'
                                        }`}
                                >
                                    {cvData ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-xl flex items-center justify-center">
                                                <FileText size={24} className="text-green-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-[rgb(var(--text-primary))]">{cvData.fileName}</p>
                                                <p className="text-sm text-green-600">CV yüklendi ✓</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto text-[rgb(var(--text-tertiary))] group-hover:text-orange-500 transition-colors mb-2" size={32} />
                                            <p className="text-[rgb(var(--text-secondary))] text-sm">
                                                {t('careers.apply.drag_drop')} <span className="text-orange-500 font-bold">{t('careers.apply.browse')}</span>
                                            </p>
                                            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">Sadece PDF dosyaları, maksimum 10MB</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-[2.5rem] flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        <span>Gönderiliyor...</span>
                                    </>
                                ) : (
                                    <>
                                        {t('careers.apply.submit')} <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-50 p-12 rounded-[2.5rem] text-center border border-green-100"
                        >
                            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-green-800 mb-2">{t('careers.apply.success_title')}</h3>
                            <p className="text-green-700 max-w-md mx-auto">
                                {t('careers.apply.success_desc')}
                            </p>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Warning Popup */}
            <div className="fixed top-4 right-4 z-[9999] pointer-events-none px-4">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={warning ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    className={`bg-white rounded-2xl shadow-2xl p-4 w-96 pointer-events-auto border-l-4 border-red-500 flex items-start gap-3 ${!warning && 'hidden'}`}
                >
                    <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-zinc-900 mb-0.5 text-sm">Dikkat</h4>
                        <p className="text-xs text-zinc-600 leading-relaxed">{warning}</p>
                    </div>
                    <button onClick={() => setWarning(null)} className="text-zinc-400 hover:text-zinc-900 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default Careers;
