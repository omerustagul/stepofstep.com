
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Download, RefreshCw, ArrowLeft, BrainCircuit } from 'lucide-react';
import DesignInterview from './logo-agent/DesignInterview';
import { generateLogos, type BrandProfile, type LogoResult } from './logo-agent/LogoEngine';
import { useAuth } from '../../context/AuthContext';

// Background Floating Particle Component
const FloatingParticle = ({ delay = 0, size = 20, x = "0%", y = "0%", color = "bg-white/10" }) => (
    <motion.div
        className={`absolute rounded-full ${color} backdrop-blur-sm pointer-events-none`}
        style={{ width: size, height: size, left: x, top: y }}
        animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 45, -45, 0]
        }}
        transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
    />
);

const LogoGen = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'intro' | 'interview' | 'results'>('intro');
    const [generatedLogos, setGeneratedLogos] = useState<LogoResult[]>([]);

    const startInterview = () => setView('interview');

    const handleInterviewComplete = (profile: BrandProfile) => {
        // Generate Logos based on profile
        const results = generateLogos(profile);
        setGeneratedLogos(results);
        setView('results');
    };

    const downloadSvg = (svgContent: string, filename: string) => {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 relative overflow-hidden text-white font-sans selection:bg-white/30">

            {/* Back Button */}
            <a href="/portal/apps" className="absolute top-10 left-6 z-50 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all shadow-lg group">
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </a>

            {/* --- ANIMATED BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden">
                <FloatingParticle size={300} x="10%" y="20%" delay={0} color="bg-white/5" />
                <FloatingParticle size={200} x="80%" y="10%" delay={2} color="bg-amber-300/10" />
                <FloatingParticle size={150} x="50%" y="60%" delay={4} color="bg-orange-300/10" />
                <FloatingParticle size={100} x="20%" y="80%" delay={1} color="bg-white/10" />
                <FloatingParticle size={50} x="90%" y="50%" delay={3} color="bg-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-400/20 rounded-full blur-[100px] pointer-events-none" />
            </div>

            {/* --- CONTENT CONTAINER --- */}
            <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[90vh]">

                {/* APP HEADER */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`text-center mb-8 transition-all ${view === 'interview' ? 'scale-75 mb-4' : ''}`}
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-2xl shadow-black/10 border border-white/20">
                        {view === 'intro' ? <PenTool size={24} /> : <BrainCircuit size={24} className="text-white animate-pulse" />}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 drop-shadow-lg">
                        {view === 'interview' ? 'Tasarımcı Neo' : 'AI Logo Stüdyosu'}
                    </h1>
                    {view === 'intro' && (
                        <p className="text-white/80 text-lg font-medium max-w-lg mx-auto">
                            Profesyonel bir tasarımcı gibi çalışan yapay zeka ajanımız Neo ile tanışın. Sizi dinler, anlar ve tasarlar.
                        </p>
                    )}
                </motion.div>

                <AnimatePresence mode="wait">

                    {/* VIEW: INTRO */}
                    {view === 'intro' && (
                        <motion.button
                            key="intro"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={startInterview}
                            className="group relative px-8 py-4 bg-white text-orange-600 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                        >
                            <span>Tasarımı Başlat</span>
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <ArrowLeft size={16} className="rotate-180" />
                            </div>
                        </motion.button>
                    )}

                    {/* VIEW: INTERVIEW */}
                    {view === 'interview' && (
                        <motion.div
                            key="interview"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            <DesignInterview user={user} onComplete={handleInterviewComplete} />
                        </motion.div>
                    )}

                    {/* VIEW: RESULTS */}
                    {view === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-6xl"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {generatedLogos.map((logo, idx) => (
                                    <motion.div
                                        key={logo.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-6 border-4 border-white/20 hover:-translate-y-2 transition-transform duration-300"
                                    >
                                        <div
                                            className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center p-4 border border-zinc-100 mb-4"
                                            dangerouslySetInnerHTML={{ __html: logo.svg }}
                                        />

                                        <div className="w-full">
                                            <h3 className="text-zinc-900 font-bold text-lg mb-1">{logo.description}</h3>
                                            <p className="text-zinc-500 text-xs mb-4">Vektörel Çizim (.SVG)</p>

                                            <button
                                                onClick={() => downloadSvg(logo.svg, `neo-logo-${logo.id}`)}
                                                className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                                            >
                                                <Download size={16} /> İndir
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex justify-center mt-12">
                                <button
                                    onClick={() => setView('intro')}
                                    className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2 backdrop-blur-md border border-white/10"
                                >
                                    <RefreshCw size={20} /> Yeni Tasarım Başlat
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>

            </div>
        </div>
    );
};

export default LogoGen;
