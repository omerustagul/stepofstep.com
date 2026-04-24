import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Check } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import confetti from 'canvas-confetti';

const DailyReward = () => {
    const { claimDailyReward } = useGamification();
    const [loading, setLoading] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [rewardInfo, setRewardInfo] = useState<{ streak: number, reward: number } | null>(null);

    const handleClaim = async () => {
        setLoading(true);
        const result = await claimDailyReward();
        setLoading(false);

        if (result.success) {
            setClaimed(true);
            setRewardInfo({ streak: result.streak, reward: result.reward });

            // Celebration
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f97316', '#fb923c', '#fdba74']
            });
        }
    };

    if (claimed && rewardInfo) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center"
            >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                    <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="font-bold text-green-800 text-lg">Ödül Alındı!</h3>
                <p className="text-green-600 font-medium">
                    {rewardInfo.streak} Günlük Seri Devam Ediyor
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-bold">
                    +{rewardInfo.reward} XP
                </div>
            </motion.div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-2xl border border-[rgb(var(--border-primary))] text-center relative overflow-hidden group">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <div className="relative z-10">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-500 group-hover:scale-110 transition-transform duration-300">
                    <Gift size={32} />
                </div>

                <h3 className="font-bold text-[rgb(var(--text-primary))] text-xl mb-2">Günlük Ödül</h3>
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
                    Her gün giriş yap, seriyi bozma ve artan XP ödüllerini topla!
                </p>

                <button
                    onClick={handleClaim}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'İşleniyor...' : 'Ödülü Topla'}
                </button>
            </div>
        </div>
    );
};

export default DailyReward;
