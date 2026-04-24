import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { calculateBrandHealth, getHealthRecommendations } from '../../utils/brandHealth';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';

const BrandHealthWidget = () => {
    const { user } = useAuth();
    const { userProgress } = useGamification();

    // Merge auth user with gamification data for score calc
    const effectiveUser = { ...user, xp: userProgress.xp, level: userProgress.level };
    const score = calculateBrandHealth(effectiveUser);
    const recommendations = getHealthRecommendations(score, effectiveUser);

    const getColor = (s: number) => {
        if (s >= 80) return 'text-green-500';
        if (s >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    const circumference = 2 * Math.PI * 40; // r=40
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-[rgb(var(--bg-card))] p-6 rounded-3xl border border-[rgb(var(--border-primary))] shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
                    <Activity className="text-orange-500" size={20} />
                    Marka Sağlık Skoru
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-[rgb(var(--bg-icon-yellow))] text-[rgb(var(--bg-card))] rounded-lg">BETA</span>
            </div>

            <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        {/* Track */}
                        <circle
                            cx="64"
                            cy="64"
                            r="40"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-zinc-100"
                        />
                        {/* Indicator */}
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="64"
                            cy="64"
                            r="40"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            className={getColor(score)}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-black ${getColor(score)}`}>{score}</span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">PUAN</span>
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                    <div>
                        <p className="text-sm font-medium text-zinc-500 mb-1">Durum Analizi</p>
                        <div className="flex items-center gap-2">
                            {score >= 80 ? <TrendingUp size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-orange-500" />}
                            <span className="font-bold text-zinc-900">
                                {score >= 80 ? 'Mükemmel Seviye' : score >= 50 ? 'Geliştirilebilir' : 'Kritik Seviye'}
                            </span>
                        </div>
                    </div>

                    <div className="p-3 bg-[rgb(var(--bg-primary))] rounded-xl border border-[rgb(var(--border-primary))]">
                        <p className="text-xs font-bold text-zinc-400 mb-2 uppercase">ÖNERİLER</p>
                        <div className="space-y-1">
                            {recommendations.slice(0, 2).map((rec, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                                    <CheckCircle2 size={12} className="mt-0.5 text-orange-500 shrink-0" />
                                    <span>{rec}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandHealthWidget;
