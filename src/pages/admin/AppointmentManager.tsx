import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Appointment } from '../../types/appointment';
import { format, isFuture, isPast } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Clock, Phone, Mail, Video, CheckCircle, XCircle, Settings, CalendarCheck, X } from 'lucide-react';
import AvailabilitySettings from '../../components/booking/AvailabilitySettings';
import { motion, AnimatePresence } from 'framer-motion';

const AppointmentManager = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

    const [activeTab, setActiveTab] = useState<'appointments' | 'settings'>('appointments');

    // Meeting Link Modal State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [meetingLinkInput, setMeetingLinkInput] = useState('');
    const [confirmingAppt, setConfirmingAppt] = useState<Appointment | null>(null);

    useEffect(() => {
        if (activeTab === 'appointments') {
            fetchAppointments();
        }
    }, [activeTab]);

    const fetchAppointments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching appointments:', error);
        } else {
            setAppointments(data as Appointment[] || []);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'completed', extraData?: any) => {
        const { error } = await supabase
            .from('appointments')
            .update({ status, ...extraData })
            .eq('id', id);

        if (error) {
            alert('Durum güncellenirken hata oluştu.');
        } else {
            fetchAppointments();
        }
    };

    const openConfirmModal = (apt: Appointment) => {
        setConfirmingAppt(apt);
        setMeetingLinkInput('');
        setShowLinkModal(true);
    };

    const handleSaveMeeting = async () => {
        if (!confirmingAppt || !meetingLinkInput.trim()) {
            alert('Lütfen geçerli bir toplantı linki giriniz.');
            return;
        }

        if (!meetingLinkInput.includes('meet.google.com')) {
            alert('Lütfen geçerli bir Google Meet linki giriniz (meet.google.com içermeli).');
            return;
        }

        await updateStatus(confirmingAppt.id, 'confirmed', {
            meeting_link: meetingLinkInput,
            meeting_confirmed: true
        });

        setShowLinkModal(false);
        setConfirmingAppt(null);
        alert('Randevu onaylandı ve toplantı linki kullanıcıya iletildi.');
    };

    const filteredAppointments = appointments.filter(apt => {
        const start = new Date(apt.start_time);
        if (filter === 'upcoming') return isFuture(start) && apt.status !== 'cancelled';
        if (filter === 'past') return isPast(start) || apt.status === 'completed';
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Randevu Yönetimi</h1>
                    <p className="text-zinc-500">Gelen görüşme taleplerini buradan yönetebilirsiniz.</p>
                </div>

                <div className="flex bg-[rgb(var(--bg-tertiary))] p-1 rounded-2xl shadow-sm border border-zinc-200">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'appointments'
                            ? 'bg-[rgb(var(--accent-primary))] text-[rgb(var(--bg-card))] shadow-md'
                            : 'text-[rgb(var(--text-primary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                            }`}
                    >
                        <Calendar size={16} />
                        Randevular
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'settings'
                            ? 'bg-[rgb(var(--accent-primary))] text-[rgb(var(--bg-card))] shadow-md'
                            : 'text-[rgb(var(--text-primary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                            }`}
                    >
                        <Settings size={16} />
                        Ayarlar
                    </button>
                </div>
            </div>

            {activeTab === 'settings' ? (
                <AvailabilitySettings />
            ) : (
                <>
                    <div className="flex justify-end">
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-zinc-200">
                            <button
                                onClick={() => setFilter('upcoming')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'upcoming' ? 'bg-orange-100 text-orange-700' : 'text-zinc-500 hover:text-zinc-900'}`}
                            >
                                Gelecek
                            </button>
                            <button
                                onClick={() => setFilter('past')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'past' ? 'bg-orange-100 text-orange-700' : 'text-zinc-500 hover:text-zinc-900'}`}
                            >
                                Geçmiş
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-orange-100 text-orange-700' : 'text-zinc-500 hover:text-zinc-900'}`}
                            >
                                Tümü
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredAppointments.length === 0 ? (
                                <div className="bg-[rgb(var(--bg-secondary))]/5 p-12 rounded-2xl border border-[rgb(var(--border-primary))]/5 text-center text-[rgb(var(--text-secondary))]">
                                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Görüntülenecek randevu bulunamadı.</p>
                                </div>
                            ) : (
                                filteredAppointments.map(apt => (
                                    <div key={apt.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-6 relative overflow-hidden group">
                                        {/* Status Strip */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${apt.status === 'confirmed' ? 'bg-green-500' :
                                            apt.status === 'cancelled' ? 'bg-red-500' :
                                                'bg-orange-500'
                                            }`} />

                                        {/* Date Block */}
                                        <div className="flex lg:flex-col items-center justify-center lg:w-24 bg-zinc-50 rounded-xl p-4 text-center border border-zinc-100 min-w-[100px]">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                                                {format(new Date(apt.start_time), 'MMM', { locale: tr })}
                                            </span>
                                            <span className="text-3xl font-black text-zinc-900 block my-1">
                                                {format(new Date(apt.start_time), 'd')}
                                            </span>
                                            <span className="text-sm font-medium text-zinc-500">
                                                {format(new Date(apt.start_time), 'EEE', { locale: tr })}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Clock size={16} className="text-orange-500" />
                                                        <span className="font-bold text-zinc-900">
                                                            {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ml-2 ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {apt.status === 'confirmed' ? 'Onaylı' : apt.status === 'cancelled' ? 'İptal' : 'Bekliyor'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-zinc-800">{apt.user_name}</h3>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-zinc-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={16} className="text-zinc-400" />
                                                    {apt.user_email}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={16} className="text-zinc-400" />
                                                    {apt.user_phone || '-'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Video size={16} className="text-zinc-400" />
                                                    <span className="capitalize">{apt.meeting_type} Toplantı</span>
                                                </div>
                                                {apt.meeting_link && (
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <Video size={16} />
                                                        <a href={apt.meeting_link} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px]">
                                                            {apt.meeting_link}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {apt.notes && (
                                                <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800 border border-orange-100 mt-2">
                                                    <span className="font-bold mr-1">Not:</span> {apt.notes}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex lg:flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-zinc-100 pt-4 lg:pt-0 lg:pl-6 min-w-[140px]">
                                            {apt.status !== 'cancelled' && (
                                                <>
                                                    {apt.status === 'pending' && (
                                                        <>
                                                            {apt.meeting_type === 'online' ? (
                                                                <button
                                                                    onClick={() => openConfirmModal(apt)}
                                                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 lg:justify-center w-full"
                                                                    title="Toplantıyı Onayla"
                                                                >
                                                                    <CalendarCheck size={18} />
                                                                    <span className="text-sm font-bold">Onayla</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => updateStatus(apt.id, 'confirmed')}
                                                                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2 lg:justify-center w-full"
                                                                    title="Onayla"
                                                                >
                                                                    <CheckCircle size={18} />
                                                                    <span className="text-sm font-bold">Onayla</span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {apt.status === 'confirmed' && (
                                                        <>
                                                            {apt.meeting_type === 'online' && (
                                                                <button
                                                                    onClick={() => openConfirmModal(apt)}
                                                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 lg:justify-start w-full"
                                                                    title="Toplantı Linkini Düzenle"
                                                                >
                                                                    <Video size={18} />
                                                                    <span className="text-sm font-bold">Linki Düzenle</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => updateStatus(apt.id, 'completed')}
                                                                className="p-2 bg-zinc-50 text-zinc-600 hover:bg-yellow-50 rounded-lg transition-colors flex items-center gap-2 lg:justify-start w-full"
                                                                title="Tamamlandı İşaretle"
                                                            >
                                                                <CheckCircle size={18} />
                                                                <span className="text-sm font-bold">Tamamla</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => updateStatus(apt.id, 'cancelled')}
                                                        className="p-2 bg-zinc-50 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-left gap-2 lg:justify-left w-full"
                                                        title="İptal Et"
                                                    >
                                                        <XCircle size={18} />
                                                        <span className="text-sm font-bold">İptal</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Confirm Meeting Modal */}
                    <AnimatePresence>
                        {showLinkModal && confirmingAppt && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                                onClick={() => setShowLinkModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-zinc-900">Toplantı Linkini Tanımla</h3>
                                        <button
                                            onClick={() => setShowLinkModal(false)}
                                            className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                            <p className="text-sm text-purple-800 mb-3 font-medium">1. Adım: Google Meet Linki Oluşturun</p>
                                            <a
                                                href="https://meet.google.com/new"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full flex items-center justify-center gap-2 bg-white border border-purple-200 text-purple-700 py-2.5 rounded-xl font-bold hover:bg-purple-50 transition-colors"
                                            >
                                                <Video size={18} />
                                                Yeni Toplantı Oluştur (Google Meet)
                                            </a>
                                        </div>

                                        <div>
                                            <p className="text-sm text-zinc-700 mb-2 font-medium">2. Adım: Linki Buraya Yapıştırın</p>
                                            <input
                                                type="text"
                                                placeholder="https://meet.google.com/..."
                                                className="w-full p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                                value={meetingLinkInput}
                                                onChange={(e) => setMeetingLinkInput(e.target.value)}
                                            />
                                        </div>

                                        <button
                                            onClick={handleSaveMeeting}
                                            disabled={!meetingLinkInput}
                                            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} />
                                            Kaydet ve Onayla
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};

export default AppointmentManager;
