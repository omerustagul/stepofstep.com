import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, Loader2, MessageSquare, Briefcase, CheckCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import BrandHealthWidget from '../../components/dashboard/BrandHealthWidget';
import LiveProjectWidget from '../../components/dashboard/LiveProjectWidget';

const ClientDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<{
        appointments: any[];
        lastMessage: any;
        jobApplication: any;
    }>({
        appointments: [],
        lastMessage: null,
        jobApplication: null
    });

    useEffect(() => {
        if (user?.email) {
            fetchDashboardData();
        }
    }, [user?.email]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Parallel fetching for dashboard overview
            const [appointmentsRes, messagesRes, jobsRes] = await Promise.all([
                // 1. Appointments
                supabase
                    .from('appointments')
                    .select('*')
                    .eq('user_email', user?.email)
                    .neq('status', 'cancelled')
                    .gte('start_time', new Date().toISOString())
                    .order('start_time', { ascending: true })
                    .limit(3),

                // 2. Last Message
                supabase
                    .from('contact_messages')
                    .select('*')
                    .eq('email', user?.email)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single(),

                // 3. Job Application
                supabase
                    .from('job_applications')
                    .select('*')
                    .eq('email', user?.email)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()
            ]);

            setDashboardData({
                appointments: appointmentsRes.data || [],
                lastMessage: messagesRes.data, // might be null if no message
                jobApplication: jobsRes.data // might be null if no job app
            });

        } catch (error) {
            console.error("Dashboard data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    const nextAppointment = dashboardData.appointments[0];

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[rgb(var(--text-primary))]">Hoş Geldin, {user?.name.split(' ')[0]} 👋</h1>
                <p className="text-[rgb(var(--text-secondary))] mt-2 text-sm md:text-base">Hesabınla ilgili güncel özet aşağıdadır.</p>
            </div>

            {/* AI Brand Health Score */}
            <BrandHealthWidget />

            {/* Overview Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* LIVE PROJECT ACTIVITY (Full Width on Mobile, spans 2 cols on tablet if needed, or just insert as first item) */}
                {/* Let's make it span full width or dedicated column. Actually let's put it at the top or side. */}
                {/* Better layout: 2 Columns: Left (2/3) Widgets, Right (1/3) Live Feed */}

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Stats & Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card 1: Next Appointment */}
                        <div className="glass-panel p-6 rounded-3xl bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-sm relative overflow-hidden group hover:border-orange-500/20 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform origin-top-right"></div>
                            <div className="relative">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-4">
                                    <Calendar size={24} />
                                </div>
                                <h3 className="font-bold text-[rgb(var(--text-primary))] text-lg mb-1">Sıradaki Randevu</h3>
                                {nextAppointment ? (
                                    <div className="mt-3">
                                        <p className="text-[rgb(var(--text-primary))] font-bold text-xl">
                                            {format(new Date(nextAppointment.start_time), 'd MMMM', { locale: tr })}
                                        </p>
                                        <p className="text-[rgb(var(--text-secondary))] text-sm flex items-center gap-1 mt-1">
                                            <Clock size={14} />
                                            {format(new Date(nextAppointment.start_time), 'HH:mm')} - {nextAppointment.meeting_type === 'online' ? 'Online' : 'Ofis'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <p className="text-[rgb(var(--text-tertiary))] text-sm">Planlanmış randevun yok.</p>
                                        <Link to="/" className="text-orange-500 text-sm font-bold mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all">
                                            Randevu Al <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 2: Job Application Status */}
                        <div className="glass-panel p-6 rounded-3xl bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-sm relative overflow-hidden group hover:border-blue-500/20 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform origin-top-right"></div>
                            <div className="relative">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                                    <Briefcase size={24} />
                                </div>
                                <h3 className="font-bold text-[rgb(var(--text-primary))] text-lg mb-1">İş Başvurusu</h3>
                                {dashboardData.jobApplication ? (
                                    <div className="mt-3">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2
                                            ${dashboardData.jobApplication.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                                dashboardData.jobApplication.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                                    dashboardData.jobApplication.status === 'interview' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                                                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>
                                            {dashboardData.jobApplication.status === 'new' && 'Değerlendiriliyor'}
                                            {dashboardData.jobApplication.status === 'interview' && 'Mülakat Aşamasında'}
                                            {dashboardData.jobApplication.status === 'approved' && 'Kabul Edildi'}
                                            {dashboardData.jobApplication.status === 'rejected' && 'Olumsuz'}
                                        </span>
                                        <p className="text-[rgb(var(--text-secondary))] text-xs">
                                            Son güncelleme: {format(new Date(dashboardData.jobApplication.updated_at || dashboardData.jobApplication.created_at), 'd MMM yyyy', { locale: tr })}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <p className="text-[rgb(var(--text-tertiary))] text-sm">Aktif başvurun yok.</p>
                                        <Link to="/careers" className="text-blue-500 text-sm font-bold mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all">
                                            Pozisyonları İncele <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 3: Last Message Status */}
                        <div className="glass-panel p-6 rounded-3xl bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-sm relative overflow-hidden group hover:border-green-500/20 transition-all md:col-span-2 lg:col-span-2">
                            {/* Make this wide since we have space now */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform origin-top-right"></div>
                            <div className="relative flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shrink-0">
                                    <MessageSquare size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[rgb(var(--text-primary))] text-lg mb-1">Son Mesaj Durumu</h3>
                                    {dashboardData.lastMessage ? (
                                        <div className="">
                                            <div className="flex items-center gap-2 mb-1">
                                                {dashboardData.lastMessage.status === 'new' ? (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-500/20 dark:text-yellow-400 px-2 py-1 rounded-lg">
                                                        <Clock size={12} /> İletildi
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/20 dark:text-green-400 px-2 py-1 rounded-lg">
                                                        <CheckCircle size={12} /> Yanıtlandı
                                                    </span>
                                                )}
                                                <span className="text-xs text-[rgb(var(--text-tertiary))]">• {format(new Date(dashboardData.lastMessage.created_at), 'd MMM HH:mm')}</span>
                                            </div>
                                            <p className="text-[rgb(var(--text-secondary))] text-sm line-clamp-1 italic">"{dashboardData.lastMessage.message}"</p>
                                        </div>
                                    ) : (
                                        <p className="text-[rgb(var(--text-tertiary))] text-sm">Henüz mesajın yok.</p>
                                    )}
                                </div>
                                <div>
                                    {dashboardData.lastMessage ? (
                                        <Link to="/portal/messages" className="text-green-600 text-sm font-bold inline-flex items-center gap-1 hover:underline">
                                            Detaylar <ChevronRight size={14} />
                                        </Link>
                                    ) : (
                                        <Link to="/#contact" className="text-green-500 text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all">
                                            Mesaj Gönder <ChevronRight size={14} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Feed */}
                <div className="lg:col-span-1">
                    <LiveProjectWidget />
                </div>

            </div>

            {/* Quick Actions / Recent Apps Placeholder could go here */}
            {/* Keeping it simple for now as requested */}

        </div>
    );
};

export default ClientDashboard;
