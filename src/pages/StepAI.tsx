import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Wand2, Palette, Type, MessageSquare } from 'lucide-react';
import { useSiteSettings } from '../context/SiteContext';
import SEO from '../components/common/SEO';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const StepAI = () => {
    const { getPagePath } = useSiteSettings();
    const { toast } = useToast();
    const [step, setStep] = useState<'input' | 'processing' | 'results'>('input');
    const [formData, setFormData] = useState({
        brandName: '',
        industry: '',
        vibe: ''
    });

    const [result, setResult] = useState<any>(null);

    const industries = [
        "Teknoloji & Yazılım",
        "Moda & Giyim",
        "Yiyecek & İçecek",
        "Sağlık & Güzellik",
        "Eğitim & Danışmanlık",
        "Gayrimenkul",
        "Diğer"
    ];

    const generateBrand = async () => {
        setStep('processing');
        setResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('gemini-generate', {
                body: {
                    brandName: formData.brandName,
                    industry: formData.industry,
                    vibe: formData.vibe
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            setResult(data);
            setStep('results');
        } catch (err: any) {
            console.error('AI Generation Error:', err);
            toast.error(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.", "Hata");
            setStep('input');
        }
    };

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] pt-32 pb-20 px-6 transition-colors duration-300">
            <SEO title="StepAI | Marka Asistanı" description="Yapay zeka setekli marka oluşturma asistanı." />

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-2xl mx-auto relative z-10">

                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-full text-xs font-bold uppercase tracking-widest text-purple-500 mb-6 shadow-sm"
                    >
                        <Sparkles size={14} />
                        <span>StepAI Beta</span>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-[rgb(var(--text-primary))] mb-4"
                    >
                        Markanı <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                            Tanımla
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-[rgb(var(--text-secondary))] text-lg max-w-md mx-auto"
                    >
                        Yapay zeka asistanımız ile saniyeler içinde markanız için renk paleti, slogan ve stil analizi oluşturun.
                    </motion.p>
                </div>

                {/* Main Card */}
                <motion.div
                    layout
                    className="glass-panel w-full bg-[rgb(var(--bg-card))]/50 backdrop-blur-sm border border-[rgb(var(--border-primary))]/40 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
                >
                    <AnimatePresence mode="wait">

                        {/* STEP 1: INPUT */}
                        {step === 'input' && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[rgb(var(--text-secondary))] ml-1">Marka Adı</label>
                                    <input
                                        type="text"
                                        value={formData.brandName}
                                        onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                        placeholder="Örn: VegaSoft"
                                        className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-[rgb(var(--text-primary))]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[rgb(var(--text-secondary))] ml-1">Sektör</label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-[rgb(var(--text-primary))]"
                                    >
                                        <option value="" disabled>Seçiniz...</option>
                                        {industries.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[rgb(var(--text-secondary))] ml-1">Marka Hissi (Vibe)</label>
                                    <input
                                        type="text"
                                        value={formData.vibe}
                                        onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                                        placeholder="Örn: Güvenilir, Minimalist, Lüks, Eğlenceli..."
                                        className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-[rgb(var(--text-primary))]"
                                    />
                                </div>

                                <button
                                    onClick={generateBrand}
                                    disabled={!formData.brandName || !formData.industry}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Wand2 size={20} />
                                    <span>Sihirle Oluştur</span>
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 2: PROCESSING */}
                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <div className="relative w-24 h-24 mb-8">
                                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">StepAI Analiz Ediyor...</h3>
                                <p className="text-[rgb(var(--text-secondary))] text-sm">Renk psikolojisi ve sektör trendleri taranıyor.</p>
                            </motion.div>
                        )}

                        {/* STEP 3: RESULTS */}
                        {step === 'results' && result && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8"
                            >
                                {/* Analysis Text */}
                                <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4">
                                    <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                                        <span className="text-purple-500 font-bold mr-2">Analiz:</span>
                                        {result.analysis}
                                    </p>
                                </div>

                                {/* Colors */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3 text-[rgb(var(--text-primary))] font-bold text-sm">
                                        <Palette size={16} className="text-purple-500" />
                                        <span>Önerilen Renk Paleti</span>
                                    </div>
                                    <div className="flex rounded-2xl overflow-hidden h-16 shadow-lg">
                                        {result.colors.map((c: string, i: number) => (
                                            <div key={i} className="flex-1 flex items-end justify-center pb-2 text-[10px] font-mono font-bold text-white/80 hover:flex-[1.5] transition-all cursor-pointer group" style={{ backgroundColor: c }}>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">{c}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Typography & Slogan */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[rgb(var(--bg-secondary))] p-4 rounded-2xl border border-[rgb(var(--border-primary))]">
                                        <div className="flex items-center gap-2 mb-3 text-[rgb(var(--text-primary))] font-bold text-sm">
                                            <MessageSquare size={16} className="text-pink-500" />
                                            <span>Motto</span>
                                        </div>
                                        <p className="font-serif italic text-lg text-[rgb(var(--text-primary))]">
                                            "{result.slogan}"
                                        </p>
                                    </div>

                                    <div className="bg-[rgb(var(--bg-secondary))] p-4 rounded-2xl border border-[rgb(var(--border-primary))]">
                                        <div className="flex items-center gap-2 mb-3 text-[rgb(var(--text-primary))] font-bold text-sm">
                                            <Type size={16} className="text-blue-500" />
                                            <span>Font Ailesi</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{result.fonts.heading}</p>
                                            <p className="text-sm text-[rgb(var(--text-secondary))]">{result.fonts.body}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setStep('input')}
                                        className="flex-1 py-3 rounded-xl border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] font-bold hover:bg-[rgb(var(--bg-secondary))] transition-colors text-sm"
                                    >
                                        Yeni Analiz
                                    </button>
                                    <button
                                        className="flex-[2] py-3 rounded-xl bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] font-bold hover:opacity-90 transition-opacity text-sm shadow-lg flex items-center justify-center gap-2"
                                    >
                                        Bu Kimliği Uygula
                                        <ArrowRight size={16} />
                                    </button>
                                </div>

                            </motion.div>
                        )}

                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default StepAI;
