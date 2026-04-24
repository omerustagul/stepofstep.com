
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Clock, CheckCircle, XCircle, Video } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const PortalJobs = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
    const { user } = useAuth();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            if (!user?.email) return;
            setLoading(true);
            const { data } = await supabase
                .from('job_applications')
                .select('*')
                .eq('email', user.email)
                .order('created_at', { ascending: false });

            if (data) setApplications(data);
            setLoading(false);
        };
        fetchApps();
    }, [user]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Değerlendirmede</span>;
            case 'interview': return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1"><Briefcase size={12} /> Mülakat</span>;
            case 'hired': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> İşe Alındı</span>;
            case 'rejected': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Olumsuz</span>;
            default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Bilinmiyor</span>;
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Yükleniyor...</div>;

    return (
        <div className="space-y-6">
            {!isEmbedded && (
                <div>
                    <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]">İş Başvurularım</h1>
                    <p className="text-[rgb(var(--text-secondary))]">Step of Step kariyer başvurularınızın durumu.</p>
                </div>
            )}

            {applications.length === 0 ? (
                <div className="bg-[rgb(var(--card-color))] p-12 rounded-2xl border border-[rgb(var(--border-primary))] text-center">
                    <div className="w-16 h-16 bg-[rgb(var(--border-primary))] rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                        <Briefcase size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">Henüz bir başvurunuz yok</h3>
                    <p className="text-[rgb(var(--text-secondary))] mt-1">Kariyer sayfamızdan açık pozisyonlara göz atabilirsiniz.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <div key={app.id} className="bg-[rgb(var(--bg-card))] p-6 rounded-2xl border border-[rgb(var(--border-primary))] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center mb-1">
                                    <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">{app.position}</h3>
                                    {getStatusBadge(app.status)}
                                </div>
                                <p className="text-sm text-zinc-500 flex items-center gap-2">
                                    <span>Başvuru ID: #{app.id.slice(0, 8)}</span>
                                    <span>•</span>
                                    <span>{format(new Date(app.created_at), 'd MMMM yyyy', { locale: tr })}</span>
                                </p>
                            </div>

                            {(app.status === 'new' || app.status === 'interview') && (
                                <div className="space-y-3">
                                    <div className="bg-blue-50 px-4 py-2 rounded-xl text-blue-700 text-sm font-medium border border-blue-100">
                                        {app.status === 'new'
                                            ? 'Başvurunuz "İnsan Kaynakları" ekibimiz tarafından inceleniyor.'
                                            : 'Başvurunuz mülakat aşamasındadır. Lütfen toplantı saatinde linke tıklayınız.'}
                                    </div>

                                    {app.status === 'interview' && (
                                        <>
                                            {app.meeting_link && app.meeting_confirmed ? (
                                                <a
                                                    href={app.meeting_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/20"
                                                >
                                                    <Video size={18} />
                                                    Toplantıya Katıl
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-2 text-zinc-500 text-sm bg-zinc-50 px-4 py-2 rounded-xl">
                                                    <Clock size={16} />
                                                    <span>Toplantı linki için admin onayı bekleniyor.</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {app.status === 'hired' && (
                                <div className="bg-green-50 px-4 py-3 rounded-xl text-green-700 text-sm font-medium border border-green-100 flex items-start gap-3">
                                    <CheckCircle size={20} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-base mb-1">Tebrikler!</p>
                                        <p>Başvurunuz olumlu sonuçlanmıştır. İnsan Kaynakları ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PortalJobs;
