import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useHaptics } from '../hooks/useHaptics';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    xp_reward: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlocked_at?: string; // If unlocked
}

interface UserProgress {
    xp: number;
    level: number;
    nextLevelXp: number;
    progressPercent: number;
}

interface GamificationContextType {
    achievements: Achievement[];
    userProgress: UserProgress;
    loading: boolean;
    isDailyClaimed: boolean;
    checkAchievement: (id: string) => Promise<void>;
    claimDailyReward: () => Promise<{ success: boolean; streak: number; reward: number }>;
}

const LEVEL_base_XP = 200;

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const { vibrate } = useHaptics();

    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userProgress, setUserProgress] = useState<UserProgress>({
        xp: 0, level: 1, nextLevelXp: LEVEL_base_XP, progressPercent: 0
    });
    const [isDailyClaimed, setIsDailyClaimed] = useState(false);
    const [loading, setLoading] = useState(false);

    // Calculate level metrics
    const calculateProgress = (xp: number, level: number) => {
        const currentLevelBase = (level - 1) * LEVEL_base_XP;
        const nextLevelThreshold = level * LEVEL_base_XP;
        const xpInLevel = xp - currentLevelBase;
        const requiredInLevel = LEVEL_base_XP;
        const percent = Math.min(100, Math.max(0, (xpInLevel / requiredInLevel) * 100));

        return {
            xp,
            level,
            nextLevelXp: nextLevelThreshold,
            progressPercent: percent
        };
    };

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Parallel fetch: Achievements, Unlocks, User Stats, and Daily Streak
            const [achResult, unlockResult, userResult, streakResult] = await Promise.all([
                supabase.from('achievements').select('*'),
                supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id),
                supabase.from('app_users').select('xp, level').eq('id', user.id).maybeSingle(),
                supabase.from('daily_streaks').select('last_claim_date').eq('user_id', user.id).maybeSingle()
            ]);

            if (achResult.error) throw achResult.error;
            
            // Check daily claim
            if (streakResult.data?.last_claim_date === today) {
                setIsDailyClaimed(true);
            } else {
                setIsDailyClaimed(false);
            }

            // Merge Data
            const unlocksMap = new Map(unlockResult.data?.map((u: any) => [u.achievement_id, u.unlocked_at]));

            const merged = (achResult.data || []).map((a: any) => ({
                ...a,
                unlocked_at: unlocksMap.get(a.id)
            }));

            setAchievements(merged);

            if (userResult.data) {
                setUserProgress(calculateProgress(userResult.data.xp || 0, userResult.data.level || 1));
            }

        } catch (error) {
            console.error('Gamification data error:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const checkAchievement = async (achievementId: string) => {
        if (!user) return;

        // Check if already unlocked
        if (achievements.find(a => a.id === achievementId && a.unlocked_at)) return;

        try {
            // Unlock
            const { error } = await supabase
                .from('user_achievements')
                .insert({ user_id: user.id, achievement_id: achievementId });

            if (error) {
                if (error.code === '23505') return;
                throw error;
            }

            // Award XP
            const ach = achievements.find(a => a.id === achievementId);
            const reward = ach?.xp_reward || 0;

            if (reward > 0) {
                const newXp = userProgress.xp + reward;
                const newLevel = Math.floor(newXp / LEVEL_base_XP) + 1;

                await supabase
                    .from('app_users')
                    .update({ xp: newXp, level: newLevel })
                    .eq('id', user.id);

                setUserProgress(calculateProgress(newXp, newLevel));
            }

            // Update Local State
            setAchievements(prev => prev.map(a => a.id === achievementId ? { ...a, unlocked_at: new Date().toISOString() } : a));

            // Notify
            vibrate('success');
            addNotification({
                type: 'achievement',
                title: 'Başarım Kilidi Açıldı! 🏆',
                message: `${ach?.title || 'Yeni Başarım'}: ${ach?.description}`,
                link: '/profile'
            });

        } catch (error) {
            console.error('Unlock error:', error);
        }
    };

    const claimDailyReward = async () => {
        if (!user || isDailyClaimed) return { success: false, streak: 0, reward: 0 };

        try {
            const today = new Date().toISOString().split('T')[0];

            // Get current streak
            let { data: streakData } = await supabase
                .from('daily_streaks')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (streakData && streakData.last_claim_date === today) {
                setIsDailyClaimed(true);
                return { success: false, streak: streakData.current_streak, reward: 0 };
            }

            // Calculate new streak
            let newStreak = 1;
            if (streakData) {
                const lastDate = new Date(streakData.last_claim_date);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
                    newStreak = streakData.current_streak + 1;
                }
            }

            // Reward logic
            const reward = 10 + (Math.min(newStreak, 7) * 5);

            // Upsert Streak
            await supabase
                .from('daily_streaks')
                .upsert({
                    user_id: user.id,
                    current_streak: newStreak,
                    last_claim_date: today,
                    total_claims: (streakData?.total_claims || 0) + 1
                });

            // Add XP
            const newXp = userProgress.xp + reward;
            const newLevel = Math.floor(newXp / LEVEL_base_XP) + 1;

            await supabase
                .from('app_users')
                .update({ xp: newXp, level: newLevel })
                .eq('id', user.id);

            setUserProgress(calculateProgress(newXp, newLevel));
            setIsDailyClaimed(true);

            vibrate('success');
            addNotification({
                type: 'success',
                title: 'Günlük Ödül Toplandı! 🎁',
                message: `${newStreak}. gün serisi! +${reward} XP kazandın.`,
            });

            return { success: true, streak: newStreak, reward };

        } catch (error) {
            console.error('Claim error:', error);
            return { success: false, streak: 0, reward: 0 };
        }
    };

    return (
        <GamificationContext.Provider value={{
            achievements,
            userProgress,
            loading,
            isDailyClaimed,
            checkAchievement,
            claimDailyReward
        }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (!context) throw new Error('useGamification must be used within a GamificationProvider');
    return context;
};
