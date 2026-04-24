import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, FileCode, Figma, Image, CheckCircle2, Clock, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const LiveProjectWidget = () => {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchActivities();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('project_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_activities' }, (payload: any) => {
                const newEvent = payload.new;
                setActivities(prev => [newEvent, ...prev].slice(0, 10));
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('project_activities')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setActivities(data || []);
        } catch (err) {
            console.error('Error fetching project activities:', err);
            // Fallback for demo if table doesn't exist yet, or just empty
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'figma': return <Figma size={16} className="text-purple-500" />;
            case 'code': return <FileCode size={16} className="text-blue-500" />;
            case 'image': return <Image size={16} className="text-orange-500" />;
            case 'check': return <CheckCircle2 size={16} className="text-green-500" />;
            default: return <Activity size={16} className="text-zinc-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Şimdi';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} so önce`;
        return date.toLocaleDateString('tr-TR');
    };

    return (
        <div className="glass-panel p-6 rounded-3xl bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-lg relative overflow-hidden h-full flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h3 className="font-bold text-[rgb(var(--text-primary))] text-lg flex items-center gap-2">
                        <Zap size={20} className="text-orange-500" />
                        Canlı Proje Akışı
                    </h3>
                    <p className="text-[rgb(var(--text-secondary))] text-xs">Ekibimizin şu anki çalışma durumu</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">Çevrimiçi</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2" ref={scrollRef}>
                {loading && activities.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-10 text-[rgb(var(--text-tertiary))] text-sm">
                        <Activity size={24} className="mx-auto mb-2 opacity-50" />
                        <p>Henüz proje aktivitesi yok.</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {activities.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex items-start gap-3 pb-3 border-b border-[rgb(var(--border-primary))] last:border-0 last:pb-0 ${formatTime(item.created_at) === 'Şimdi' ? 'bg-orange-500/5 -mx-2 px-2 py-2 rounded-xl border-none' : ''}`}
                            >
                                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] shrink-0`}>
                                    {getIcon(item.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-[rgb(var(--text-primary))] truncate">
                                            {item.user_name || 'Ekip Üyesi'}
                                        </p>
                                        <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] whitespace-nowrap flex items-center gap-1">
                                            {formatTime(item.created_at) === 'Şimdi' && <Clock size={10} className="animate-pulse text-orange-500" />}
                                            {formatTime(item.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[rgb(var(--text-secondary))] truncate">{item.action}</p>

                                    {item.details && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="px-2 py-1 rounded-md bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] text-[10px] font-mono text-[rgb(var(--text-secondary))] flex items-center gap-1">
                                                {getIcon(item.type)}
                                                {item.details}
                                            </div>
                                            {item.is_active && <span className="text-[10px] text-orange-500 font-bold animate-pulse">Düzenleniyor...</span>}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default LiveProjectWidget;
