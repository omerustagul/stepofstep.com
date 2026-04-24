import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { playHoverSound, initAudio } from './SonicManager';
import { useState } from 'react';

const ModernHero = () => {
    const [audioStarted, setAudioStarted] = useState(false);

    const handleStart = () => {
        if (!audioStarted) {
            initAudio();
            setAudioStarted(true);
        }
    };

    return (
        <section
            className="relative w-full min-h-[70vh] md:min-h-[85vh] pt-40 md:pt-16 flex items-center justify-center overflow-hidden bg-[rgb(var(--bg-primary))] transition-colors duration-500 pt-24 md:pt-32"
            onClick={handleStart}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-orange-500/10 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vh] h-[60vh] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]" />
            </div>

            <div className="container max-w-6xl mx-auto px-4 md:px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <div className="text-center md:text-left space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "circOut" }}
                    >
                        <h2 className="text-sm font-bold tracking-[0.2em] text-orange-500 mb-4 uppercase">
                            Digital Evolution
                        </h2>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95] text-[rgb(var(--text-primary))]">
                            STEP OF <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                                STEP
                            </span>
                        </h1>
                        <p className="mt-6 text-lg md:text-xl text-[rgb(var(--text-secondary))] max-w-lg mx-auto md:mx-0 leading-relaxed">
                            Markanızı yerçekimsiz ortamda yeniden tasarlıyoruz.
                            Geleceğin dijital dünyasına adım atın.
                        </p>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start"
                    >
                        <button
                            onClick={() => document.getElementById('appointment-cta')?.scrollIntoView({ behavior: 'smooth' })}
                            onMouseEnter={playHoverSound}
                            className="group relative px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-sm tracking-wide transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-1"
                        >
                            ÖN GÖRÜŞME RANDEVUSU AL
                            <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                        </button>

                        <button
                            onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
                            onMouseEnter={playHoverSound}
                            className="px-8 py-4 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] hover:border-orange-500/50 text-[rgb(var(--text-primary))] rounded-full font-bold text-sm tracking-wide transition-all hover:bg-[rgb(var(--bg-tertiary))]"
                        >
                            PORTFOLYOMUZ
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="mt-6 flex items-center justify-center md:justify-start gap-2"
                    >
                        <Link to="/ai-assistant" className="group flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-primary))] hover:text-purple-500 transition-colors">
                            <Sparkles size={14} className="text-purple-500 animate-pulse" />
                            <span>Yeni: <span className="underline decoration-purple-500/30 group-hover:decoration-purple-500 underline-offset-2">StepAI ile markanı ücretsiz analiz et</span></span>
                        </Link>
                    </motion.div>
                </div>

                {/* Right Side - Abstract Visual (CSS/SVG instead of heavy R3F) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative md:flex w-full h-[50vh] items-center justify-center p-8"
                >
                    {/* Modern Abstract Shape */}
                    <div className="relative w-full h-full max-w-sm max-h-sm flex items-center justify-center">
                        <div className="absolute inset-0 border border-[rgb(var(--border-primary))] rounded-full animate-[spin_60s_linear_infinite]" />
                        <div className="absolute inset-8 border border-dashed border-orange-500/30 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
                        <div className="absolute inset-1/4 bg-gradient-to-tr from-orange-500/20 to-transparent blur-3xl rounded-full animate-pulse" />

                        {/* Floating Motto Terms (Irregular Circle) */}
                        <div className="relative w-64 h-64">
                            {/* Top Left */}
                            <div className="absolute top-0 left-4 w-20 h-20 bg-[rgb(var(--bg-card))] rounded-3xl border border-[rgb(var(--border-primary))] shadow-xl flex items-center justify-center -rotate-12 hover:rotate-0 hover:scale-110 transition-all duration-300 z-10 group cursor-pointer">
                                <span className="text-sm font-bold text-orange-500 group-hover:text-orange-600">Sadakat</span>
                            </div>

                            {/* Top Right */}
                            <div className="absolute top-4 right-0 w-20 h-20 bg-[rgb(var(--bg-card))] rounded-3xl border border-[rgb(var(--border-primary))] shadow-xl flex items-center justify-center rotate-[24deg] hover:rotate-0 hover:scale-110 transition-all duration-300 z-10 group cursor-pointer">
                                <span className="text-sm font-bold text-blue-500 group-hover:text-blue-600">Özveri</span>
                            </div>

                            {/* Bottom Left */}
                            <div className="absolute bottom-4 left-0 w-20 h-20 bg-[rgb(var(--bg-card))] rounded-3xl border border-[rgb(var(--border-primary))] shadow-xl flex items-center justify-center rotate-[8deg] hover:rotate-0 hover:scale-110 transition-all duration-300 z-10 group cursor-pointer">
                                <span className="text-sm font-bold text-green-500 group-hover:text-green-600">İstikrar</span>
                            </div>

                            {/* Bottom Right */}
                            <div className="absolute bottom-0 right-8 w-20 h-20 bg-[rgb(var(--bg-card))] rounded-3xl border border-[rgb(var(--border-primary))] shadow-xl flex items-center justify-center -rotate-[15deg] hover:rotate-0 hover:scale-110 transition-all duration-300 z-10 group cursor-pointer">
                                <span className="text-sm font-bold text-red-500 group-hover:text-red-600">Güven</span>
                            </div>

                            {/* Center Logo/Symbol (Optional - to fill void) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ModernHero;
