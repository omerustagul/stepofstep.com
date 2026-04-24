import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AppUsage {
    app_id: string;
    app_name: string;
    total_seconds: number;
    last_used: string;
}

interface ActivityItem {
    id?: string;
    app_id: string;
    app_name: string;
    created_at: string;
    action: string;
}

interface ActivityContextType {
    appUsage: Record<string, number>; // appId -> seconds
    recentActivity: ActivityItem[];
    loading: boolean;
    trackVisit: (appId: string, appName: string) => Promise<void>;
    updateTime: (appId: string, appName: string, seconds: number) => Promise<void>;
    formatTime: (seconds: number) => string;
    refreshData: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
    const [appUsage, setAppUsage] = useState<Record<string, number>>({});
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Fetch data from Supabase
    const fetchData = async () => {
        if (!user?.id) {
            // Fallback to localStorage for non-authenticated users
            const storedUsage = localStorage.getItem('step_app_usage');
            const storedActivity = localStorage.getItem('step_recent_activity');
            if (storedUsage) setAppUsage(JSON.parse(storedUsage));
            if (storedActivity) setRecentActivity(JSON.parse(storedActivity));
            setLoading(false);
            return;
        }

        // Delay non-critical fetch to let Auth finish first
        await new Promise(resolve => setTimeout(resolve, 600));

        setLoading(true);
        try {
            // Parallel fetch: App usage and recent activity
            const [usageResult, activityResult] = await Promise.all([
                supabase.from('app_usage').select('*').eq('user_id', user.id),
                supabase.from('activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
            ]);

            if (usageResult.error) throw usageResult.error;
            if (activityResult.error) throw activityResult.error;

            // Convert usage to record format
            const usageRecord: Record<string, number> = {};
            usageResult.data?.forEach((item: AppUsage) => {
                usageRecord[item.app_id] = item.total_seconds;
            });
            setAppUsage(usageRecord);

            // Format activity
            const formattedActivity: ActivityItem[] = activityResult.data?.map((item: any) => ({
                id: item.id,
                app_id: item.app_id,
                app_name: item.app_name,
                created_at: item.created_at,
                action: item.action
            })) || [];
            setRecentActivity(formattedActivity);

        } catch (error) {
            console.error('Activity data fetch error:', JSON.stringify(error, null, 2));
            // Fallback to localStorage
            const storedUsage = localStorage.getItem('step_app_usage');
            const storedActivity = localStorage.getItem('step_recent_activity');
            if (storedUsage) setAppUsage(JSON.parse(storedUsage));
            if (storedActivity) setRecentActivity(JSON.parse(storedActivity));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const refreshData = async () => {
        await fetchData();
    };

    const trackVisit = useCallback(async (appId: string, appName: string) => {
        const newItem: ActivityItem = {
            app_id: appId,
            app_name: appName,
            created_at: new Date().toISOString(),
            action: 'Opened App'
        };

        // Optimistic update
        setRecentActivity(prev => [newItem, ...prev].slice(0, 10));

        if (!user?.id) {
            // Fallback to localStorage
            const stored = localStorage.getItem('step_recent_activity');
            const activities = stored ? JSON.parse(stored) : [];
            localStorage.setItem('step_recent_activity', JSON.stringify([newItem, ...activities].slice(0, 10)));
            return;
        }

        try {
            await supabase
                .from('activity_log')
                .insert({
                    user_id: user.id,
                    app_id: appId,
                    app_name: appName,
                    action: 'Opened App',
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Track visit error:', error);
        }
    }, [user?.id]);

    const updateTime = useCallback(async (appId: string, appName: string, seconds: number) => {
        // Optimistic update
        setAppUsage(prev => ({
            ...prev,
            [appId]: (prev[appId] || 0) + seconds
        }));

        if (!user?.id) {
            // Fallback to localStorage
            const stored = localStorage.getItem('step_app_usage');
            const usage = stored ? JSON.parse(stored) : {};
            usage[appId] = (usage[appId] || 0) + seconds;
            localStorage.setItem('step_app_usage', JSON.stringify(usage));
            return;
        }

        try {
            // Upsert: Update if exists, insert if not
            const { data: existing } = await supabase
                .from('app_usage')
                .select('id, total_seconds')
                .eq('user_id', user.id)
                .eq('app_id', appId)
                .single();

            if (existing) {
                // Update existing record
                await supabase
                    .from('app_usage')
                    .update({
                        total_seconds: existing.total_seconds + seconds,
                        last_used: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
            } else {
                // Insert new record
                await supabase
                    .from('app_usage')
                    .insert({
                        user_id: user.id,
                        app_id: appId,
                        app_name: appName,
                        total_seconds: seconds,
                        last_used: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Update time error:', error);
        }
    }, [user?.id]);

    const formatTime = useCallback((seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return `${hours}h ${remainingMins}m`;
    }, []);

    const value = useMemo(() => ({
        appUsage,
        recentActivity,
        loading,
        trackVisit,
        updateTime,
        formatTime,
        refreshData
    }), [appUsage, recentActivity, loading, trackVisit, updateTime, formatTime]);

    return (
        <ActivityContext.Provider value={value}>
            {children}
        </ActivityContext.Provider>
    );
};

export const useActivity = () => {
    const context = useContext(ActivityContext);
    if (context === undefined) {
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
};
