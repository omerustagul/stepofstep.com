import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, Calendar, Briefcase, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        jobs: 0,
        appointments: 0,
        messages: 0,
        members: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsError, setAnalyticsError] = useState<string | null>(null);

    useEffect(() => {
        // Staggered loading: allow Auth and critical providers to finish first
        const timer1 = setTimeout(() => fetchDashboardData(), 1000);
        const timer2 = setTimeout(() => fetchAnalytics(), 2000);
        
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const fetchAnalytics = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('fetch-analytics');
            
            // Handle edge function specific errors
            if (error) {
                // Check if it's a CORS or Network error (common in local dev)
                if (error.message?.includes('Failed to send a request') || error.message?.includes('CORS')) {
                    setAnalyticsError('Analiz servisi yerel ortamda (CORS) engellendi veya henüz kurulmadı.');
                    return;
                }
                throw error;
            }

            if (data?.error) throw new Error(data.error);

            // Parse GA4 Response
            if (data?.rows?.[0]) {
                const values = data.rows[0].metricValues;
                setAnalytics({
                    visitors: values[0].value,
                    sessions: values[1].value,
                    avgDuration: parseFloat(values[2].value),
                    bounceRate: parseFloat(values[3].value),
                    pagePerSession: parseFloat(values[4].value),
                    newUsers: values[5].value
                });
            }
        } catch (err: any) {
            // Silently catch to prevent console pollution
            setAnalyticsError('Analiz verileri şu an yüklenemiyor.');
            console.warn('[Analytics] Veri çekme atlandı veya servis kapalı.');
        }
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Get Counts
            const { count: jobsCount } = await supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('status', 'new');
            const { count: appointmentsCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).neq('status', 'cancelled');
            const { count: messagesCount } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new');
            // Updated directly to 'app_users' as per MemberManager.tsx
            const { count: membersCount } = await supabase.from('app_users').select('*', { count: 'exact', head: true });

            setStats({
                jobs: jobsCount || 0,
                appointments: appointmentsCount || 0,
                messages: messagesCount || 0,
                members: membersCount || 0
            });

            // 2. Get Recent Activity
            const { data: recentJobs } = await supabase
                .from('job_applications')
                .select('id, name, created_at, status')
                .order('created_at', { ascending: false })
                .limit(10); // Fetched more for scrolling

            const { data: recentAppointments } = await supabase
                .from('appointments')
                .select('id, user_name, created_at, status')
                .order('created_at', { ascending: false })
                .limit(10);

            const activities = [
                ...(recentJobs?.map((j: any) => ({ ...j, type: 'job' })) || []),
                ...(recentAppointments?.map((a: any) => ({ ...a, type: 'appointment', name: a.user_name })) || [])
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 15); // Show up to 15 items in scrollable list

            setRecentActivity(activities);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { title: 'Başvurular', value: stats.jobs, icon: Briefcase, color: 'bg-blue-500', link: '/admin/jobs' },
        { title: 'Aktif Randevular', value: stats.appointments, icon: Calendar, color: 'bg-purple-500', link: '/admin/appointments' },
        { title: 'Mesajlar', value: stats.messages, icon: MessageSquare, color: 'bg-orange-500', link: '/admin/messages' },
        { title: 'Toplam Üye', value: stats.members, icon: Users, color: 'bg-emerald-500', link: '/admin/members' },
    ];

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-zinc-200 rounded-lg"></div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-zinc-200 rounded-2xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-80 bg-zinc-200 rounded-3xl"></div>
                    <div className="h-80 bg-zinc-200 rounded-3xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Genel Bakış</h1>
                <p className="text-zinc-500">İşletmenizin anlık durumu ve istatistikleri.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <Link to={stat.link} key={index} className="block group">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 text-${stat.color.split('-')[1]}-600`}>
                                    <stat.icon size={24} className={stat.color.replace('bg-', 'text-')} />
                                </div>
                                <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <TrendingUp size={12} className="mr-1" /> +12%
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-zinc-900">{stat.value}</h3>
                            <p className="text-sm text-zinc-500 font-medium mt-1">{stat.title}</p>
                        </motion.div>
                    </Link>
                ))}
            </div>

            {/* Layout Container: Equal Height Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[450px]">
                {/* Left Column: Analytics */}
                <div className="lg:col-span-2 h-full flex flex-col">
                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm flex-1 flex flex-col p-6 overflow-hidden relative">
                        {/* Google Brand Header */}
                        <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">G</div>
                            <span className="font-bold text-zinc-700 text-sm">Google Analytics 4</span>
                            <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">● Son 28 Gün</span>
                        </div>

                        {!analytics && !analyticsError ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                            </div>
                        ) : analyticsError ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <p className="text-red-500 font-bold mb-2">Veri Alınamadı</p>
                                <p className="text-xs text-zinc-500 mb-4">{analyticsError}</p>
                                <div className="text-xs bg-zinc-50 p-3 rounded text-zinc-600">
                                    Supabase Edge Function ve Google Service Account kurulumunun yapıldığından emin olun.
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Charts Grid */}
                                <div className="grid grid-cols-2 gap-6 flex-1">
                                    {/* Chart 1: Visitors */}
                                    <div className="space-y-2">
                                        <p className="text-sm text-zinc-500 font-medium">Toplam Ziyaretçi</p>
                                        <h4 className="text-2xl font-bold text-zinc-900">{parseInt(analytics?.visitors || '0').toLocaleString('tr-TR')}</h4>
                                        <div className="h-40 bg-gradient-to-t from-blue-50 to-transparent rounded-xl border-b-2 border-blue-500 relative overflow-hidden group">
                                            <div className="absolute inset-0 flex items-end justify-between px-2 pb-0 opactiy-50">
                                                {/* Fake bars for visual implementation since we don't have time series yet in API call */}
                                                {[...Array(10)].map((_, i) => (
                                                    <div key={i} className="w-[8%] bg-blue-200 rounded-t-sm" style={{ height: `${20 + Math.random() * 60}%` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chart 2: Sessions */}
                                    <div className="space-y-2">
                                        <p className="text-sm text-zinc-500 font-medium">Ortalama Süre</p>
                                        <h4 className="text-2xl font-bold text-zinc-900">
                                            {analytics ? `${Math.floor(analytics.avgDuration / 60)}dk ${Math.floor(analytics.avgDuration % 60)}sn` : '-'}
                                        </h4>
                                        <div className="h-40 bg-gradient-to-t from-orange-50 to-transparent rounded-xl border-b-2 border-orange-500 relative overflow-hidden">
                                            <div className="absolute inset-0 flex items-end justify-between px-2 pb-0 opactiy-50">
                                                {[...Array(10)].map((_, i) => (
                                                    <div key={i} className="w-[8%] bg-orange-200 rounded-t-sm" style={{ height: `${30 + Math.random() * 50}%` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Stats */}
                                <div className="mt-6 pt-6 border-t border-zinc-100 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Hemen Çıkma</p>
                                        <p className="text-lg font-bold text-zinc-800">{(parseFloat(analytics?.bounceRate || '0') * 100).toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Sayfa / Oturum</p>
                                        <p className="text-lg font-bold text-zinc-800">{parseFloat(analytics?.pagePerSession || '0').toFixed(1)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Yeni Kullanıcı</p>
                                        <p className="text-lg font-bold text-zinc-800">{parseInt(analytics?.newUsers || '0').toLocaleString('tr-TR')}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: Recent Activity (Scrollable) */}
                <div className="h-[450px] flex flex-col">
                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-zinc-50 flex items-center justify-between shrink-0 bg-white z-10">
                            <h3 className="font-bold text-lg text-zinc-900">Son Aktiviteler</h3>
                            <Link to="/admin/jobs" className="text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full transition-colors">Tümünü Gör</Link>
                        </div>

                        {/* Scrollable List Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {recentActivity.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                                    <Calendar size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">Henüz aktivite yok.</p>
                                </div>
                            ) : (
                                recentActivity.map((activity, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${activity.type === 'job'
                                            ? 'bg-blue-50 text-blue-500 ring-2 ring-blue-100'
                                            : 'bg-purple-50 text-purple-500 ring-2 ring-purple-100'
                                            } `}>
                                            {activity.type === 'job' ? <Briefcase size={18} /> : <Calendar size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-zinc-900 truncate pr-2">
                                                    {activity.name}
                                                </p>
                                                <span className="text-[10px] text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {new Date(activity.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                                                {activity.type === 'job' ? 'Yeni iş başvurusu alındı.' : 'Yeni randevu oluşturuldu.'}
                                            </p>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${activity.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    activity.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                        'bg-zinc-100 text-zinc-600'
                                                    } `}>
                                                    {activity.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
