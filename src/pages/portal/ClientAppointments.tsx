import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, Loader2, MapPin, Video, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Appointment {
    id: string;
    name: string;
    email: string; // user_email
    phone: string;
    service_type: string;
    date: string; // ISO date string
    start_time: string; // ISO date string
    end_time: string; // ISO date string
    meeting_type: 'online' | 'face-to-face';
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    notes?: string;
    meet_link?: string;
}

const ClientAppointments = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        if (user?.email) {
            fetchAppointments();
        }
    }, [user?.email]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('user_email', user?.email)
                .order('start_time', { ascending: false }); // Fetch all, sort by newest

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error("Appointments fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();
    const upcomingAppointments = appointments.filter(app => new Date(app.start_time) >= now && app.status !== 'cancelled').reverse(); // Show closest first
    const pastAppointments = appointments.filter(app => new Date(app.start_time) < now || app.status === 'cancelled');

    const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[rgb(var(--text-primary))]">Randevularım</h1>
                    <p className="text-[rgb(var(--text-secondary))] mt-1 text-sm">Planlanmış görüşmelerini yönet.</p>
                </div>
                <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                    <Plus size={24} />
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-[rgb(var(--bg-secondary))] rounded-full md:rounded-xl w-full md:w-fit">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-full md:rounded-xl text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                >
                    Yaklaşanlar
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-full md:rounded-xl text-sm font-bold transition-all ${activeTab === 'past' ? 'bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                >
                    Geçmiş
                </button>
            </div>

            <div className="space-y-4">
                {displayedAppointments.length === 0 ? (
                    <div className="text-center py-12 bg-[rgb(var(--bg-secondary))] rounded-3xl border border-[rgb(var(--border-primary))] border-dashed">
                        <Calendar size={32} className="mx-auto text-[rgb(var(--text-secondary))] mb-3" />
                        <h3 className="text-[rgb(var(--text-primary))] font-bold mb-1">
                            {activeTab === 'upcoming' ? 'Yaklaşan Randevun Yok' : 'Geçmiş Randevun Yok'}
                        </h3>
                        <p className="text-[rgb(var(--text-secondary))] text-sm mb-4">
                            {activeTab === 'upcoming' ? 'Yeni bir görüşme planlayabilirsin.' : 'Henüz tamamlanmış bir görüşmen bulunmuyor.'}
                        </p>
                        {activeTab === 'upcoming' && (
                            <Link to="/" className="inline-flex items-center gap-2 text-[rgb(var(--text-primary))] font-bold bg-[rgb(var(--accent-primary))] px-4 py-2 rounded-full hover:bg-[rgb(var(--accent-hover))] transition-colors">
                                <Plus size={16} />
                                Yeni Randevu Al
                            </Link>
                        )}
                    </div>
                ) : (
                    displayedAppointments.map((app) => (
                        <div key={app.id} className="bg-[rgb(var(--bg-secondary))] p-5 rounded-3xl border border-[rgb(var(--border-primary))] shadow-sm flex flex-col md:flex-row md:items-center gap-5 group hover:border-orange-500/20 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                        ${app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            app.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                        {app.status === 'pending' && 'Onay Bekliyor'}
                                        {app.status === 'approved' && 'Onaylandı'}
                                        {app.status === 'cancelled' && 'İptal Edildi'}
                                        {app.status === 'rejected' && 'Reddedildi'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-[rgb(var(--text-primary))]">{app.service_type || 'Genel Görüşme'}</h3>

                                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                    <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))]">
                                        <Calendar size={14} className="text-orange-500" />
                                        <span>{format(new Date(app.start_time), 'd MMMM yyyy, EEEE', { locale: tr })}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))]">
                                        <Clock size={14} className="text-orange-500" />
                                        <span>{format(new Date(app.start_time), 'HH:mm')} - {format(new Date(app.end_time), 'HH:mm')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))]">
                                        {app.meeting_type === 'online' ? (
                                            <Video size={14} className="text-blue-500" />
                                        ) : (
                                            <MapPin size={14} className="text-purple-500" />
                                        )}
                                        <span>{app.meeting_type === 'online' ? 'Online Görüşme' : 'Ofis Görüşmesi'}</span>
                                    </div>
                                </div>
                            </div>

                            {app.meet_link && app.status === 'approved' && (
                                <a
                                    href={app.meet_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="md:w-auto w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                >
                                    <Video size={18} />
                                    <span>Görüşmeye Katıl</span>
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClientAppointments;
