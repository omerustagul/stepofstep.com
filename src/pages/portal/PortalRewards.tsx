import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Gift, CheckCircle2, Download, Sparkles, Loader2 } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';
import LevelProgress from '../../components/gamification/LevelProgress';
import DailyReward from '../../components/gamification/DailyReward';
import AchievementCard from '../../components/gamification/AchievementCard';
import UpgradeModal from '../../components/common/UpgradeModal';

const PortalRewards = () => {
    const { user } = useAuth();
    const { achievements, userProgress, loading } = useGamification();
    const { vibrate } = useHaptics();
    const [spinHistory, setSpinHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const fetchSpinHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('wheel_spins')
                .select(`
                    id, spin_date, is_claimed, claimed_at, meta_data,
                    wheel_rewards (label, value, reward_type, reward_value, file_url)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSpinHistory(data || []);
        } catch (err) {
            console.error('Error fetching spin history:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSpinHistory();
    }, [fetchSpinHistory]);

    // Group achievements by rarity or status
    const unlockedAchievements = achievements.filter(a => a.unlocked_at);
    const lockedAchievements = achievements.filter(a => !a.unlocked_at);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">Ödül Merkezi</h1>
                <p className="text-[rgb(var(--text-secondary))]">
                    Başarımların, seviyen ve günlük ödüllerin burada seni bekliyor.
                </p>
            </div>

            {/* Top Grid: Level & Daily Reward */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Level Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onMouseEnter={() => vibrate('light')}
                >
                    <LevelProgress />
                </motion.div>

                {/* Daily Reward */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onMouseEnter={() => vibrate('light')}
                >
                    <DailyReward />
                </motion.div>
            </div>

            {/* Achievements Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
                        <Trophy className="text-yellow-500" />
                        Başarımlar
                    </h2>
                    <div className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                        Toplanan: <span className="text-[rgb(var(--accent-primary))]">{unlockedAchievements.length}</span> / {achievements.length}
                    </div>
                </div>

                {/* Tabs or Filters could go here */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Show unlocked first, then locked */}
                    {unlockedAchievements.map((achievement) => (
                        <div key={achievement.id} onMouseEnter={() => vibrate('light')}>
                            <AchievementCard achievement={achievement} />
                        </div>
                    ))}
                    {lockedAchievements.map((achievement) => (
                        <div key={achievement.id} onMouseEnter={() => vibrate('light')}>
                            <AchievementCard achievement={achievement} />
                        </div>
                    ))}

                    {achievements.length === 0 && !loading && (
                        <div className="col-span-full p-8 text-center bg-[rgb(var(--bg-tertiary))] rounded-2xl border border-[rgb(var(--border-primary))] border-dashed">
                            <p className="text-[rgb(var(--text-secondary))]">Henüz başarım yüklenmedi.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats / Milestones (Optional Future) */}
            <div className="glass-panel p-6 rounded-2xl border border-[rgb(var(--border-primary))]">
                <h3 className="font-bold text-[rgb(var(--text-primary))] mb-4 flex items-center gap-2">
                    <Target className="text-blue-500" />
                    Sonraki Hedefler
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[rgb(var(--bg-secondary))] rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                XP
                            </div>
                            <div>
                                <div className="text-sm font-bold text-[rgb(var(--text-primary))]">Seviye {userProgress.level + 1}</div>
                                <div className="text-xs text-[rgb(var(--text-secondary))]">Sonraki seviyeye ulaş</div>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-[rgb(var(--accent-primary))]">
                            +{Math.max(0, userProgress.nextLevelXp - userProgress.xp)} XP Gerekli
                        </div>
                    </div>
                </div>
            </div>
            {/* Wheel History */}
            <div className="bg-[rgb(var(--bg-card))] rounded-3xl border border-[rgb(var(--border-primary))] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[rgb(var(--border-primary))] flex items-center justify-between">
                    <h2 className="font-black text-lg flex items-center gap-2 text-[rgb(var(--text-primary))]"><Gift className="text-orange-500" size={20} /> Çark Geçmişi</h2>
                    <span className="text-xs font-bold bg-[rgb(var(--bg-tertiary))] px-3 py-1 rounded-full text-[rgb(var(--text-secondary))]">{spinHistory.length} Döndürme</span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {historyLoading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-300" /></div>
                    ) : spinHistory.length === 0 ? (
                        <div className="p-10 text-center text-zinc-400 text-sm">Henüz çevirme geçmişiniz yok.</div>
                    ) : (
                        <div className="divide-y divide-[rgb(var(--border-secondary))]">
                            {spinHistory.map((spin) => {
                                const meta = spin.meta_data || {};
                                const isFile = meta.type === 'file';
                                const isDiscount = meta.type === 'membership_discount';

                                return (
                                    <div key={spin.id} className="p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${spin.is_claimed ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                                                {isFile ? <Download size={20} /> : spin.is_claimed ? <CheckCircle2 size={20} /> : <Gift size={20} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-[rgb(var(--text-primary))] truncate">{spin.wheel_rewards?.label || 'Sürpriz Ödül'}</p>
                                                <p className="text-xs text-[rgb(var(--text-secondary))]">{new Date(spin.spin_date).toLocaleDateString('tr-TR')}</p>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            {spin.wheel_rewards?.file_url ? (
                                                <a
                                                    href={spin.wheel_rewards.file_url}
                                                    target="_blank"
                                                    download
                                                    className="w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1.5 bg-zinc-100 rounded-lg text-zinc-600 hover:bg-orange-500 hover:text-white flex items-center justify-center gap-2 transition-colors"
                                                    title="İndir"
                                                >
                                                    <Download size={16} />
                                                    <span className="hidden md:inline font-bold text-xs">İndir</span>
                                                </a>
                                            ) : isDiscount ? (
                                                <button
                                                    onClick={() => setUpgradeModalOpen(true)}
                                                    className="w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1.5 bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-colors animate-pulse-subtle"
                                                    title="Kullan"
                                                >
                                                    <Sparkles size={16} />
                                                    <span className="hidden md:inline font-bold text-xs">Kullan</span>
                                                </button>
                                            ) : (
                                                <div className="w-8 h-8 flex items-center justify-center text-green-500 bg-green-50 rounded-lg" title="Tanımlandı">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default PortalRewards;
