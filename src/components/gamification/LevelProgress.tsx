import { motion } from 'framer-motion';
import { useGamification } from '../../context/GamificationContext';

const LevelProgress = () => {
    const { userProgress } = useGamification();

    return (
        <div className="glass-panel p-4 rounded-2xl border border-[rgb(var(--border-primary))]">
            <div className="flex items-end justify-between mb-2">
                <div>
                    <span className="text-xs text-[rgb(var(--text-secondary))] font-medium uppercase tracking-wider">Mevcut Seviye</span>
                    <div className="text-3xl font-black text-[rgb(var(--accent-primary))] leading-none mt-1">
                        LVL {userProgress.level}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-[rgb(var(--text-tertiary))] font-medium">
                        {Math.floor(userProgress.xp)} / {userProgress.nextLevelXp} XP Base
                        {/* Note: Logic in context subtracts base, so displayed might be total or relative. 
                            If context returns absolute XP, we might need relative for bar. 
                            Let's rely on progressPercent from context. */}
                    </span>
                    <div className="text-sm font-bold text-[rgb(var(--text-primary))]">
                        % {Math.round(userProgress.progressPercent)} Tamamlandı
                    </div>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="h-4 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden relative border border-[rgb(var(--border-primary))]">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.05) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.05) 50%,rgba(0,0,0,.05) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}
                />

                {/* Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 relative"
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
            </div>

            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-3 text-center">
                Bir sonraki seviye için daha fazla proje tamamla ve etkileşimde bulun!
            </p>
        </div>
    );
};

export default LevelProgress;
