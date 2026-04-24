import { motion } from 'framer-motion';
import { Award, Zap, Rocket, Moon, UserCheck, Share2, Footprints } from 'lucide-react';
import type { Achievement } from '../../context/GamificationContext';

const iconMap: Record<string, any> = {
    Award, Zap, Rocket, Moon, UserCheck, Share2, Footprints
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const Icon = iconMap[achievement.icon_name] || Award;
    const isUnlocked = !!achievement.unlocked_at;

    return (
        <motion.div
            initial={{ opacity: 0.8, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative p-4 rounded-2xl border transition-all ${isUnlocked
                ? `bg-[rgb(var(--bg-card))] border-[rgb(var(--border-secondary))] shadow-sm `
                : 'bg-[rgb(var(--bg-tertiary))] border-[rgb(var(--border-primary))] opacity-60 grayscale'
                }`}
        >
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-[rgb(var(--accent-light))] text-[rgb(var(--accent-primary))]' : 'bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-tertiary))]'
                    }`}>
                    <Icon size={24} />
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-[rgb(var(--text-primary))]">{achievement.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${isUnlocked ? 'bg-green-100 text-green-700 border-green-200' : 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-tertiary))] border-[rgb(var(--border-primary))]'
                            }`}>
                            {isUnlocked ? 'Kilit Açıldı' : 'Kilitli'}
                        </span>
                    </div>

                    <p className="text-sm text-[rgb(var(--text-secondary))] mb-2 line-clamp-2">
                        {achievement.description}
                    </p>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[rgb(var(--accent-primary))] flex items-center gap-1">
                            <Zap size={12} fill="currentColor" /> {achievement.xp_reward} XP
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-primary))] px-1.5 rounded">
                            {achievement.rarity}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AchievementCard;
