import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Save } from 'lucide-react';

interface AvailabilityDay {
    id: number;
    day_of_week: number;
    is_working_day: boolean;
    start_time: string;
    end_time: string;
}

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const AvailabilitySettings = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'exceptions'>('general');
    const [schedule, setSchedule] = useState<AvailabilityDay[]>([]);
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New Exception Form State
    const [newExceptionDate, setNewExceptionDate] = useState('');
    const [newExceptionIsAvailable, setNewExceptionIsAvailable] = useState(false);
    const [newExceptionStart, setNewExceptionStart] = useState('09:00');
    const [newExceptionEnd, setNewExceptionEnd] = useState('18:00');
    const [newExceptionReason, setNewExceptionReason] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Weekly Schedule
            const { data: scheduleData } = await supabase
                .from('appointment_availability')
                .select('*')
                .order('day_of_week');

            if (scheduleData) setSchedule(scheduleData as AvailabilityDay[]);

            // Fetch Exceptions
            const { data: exceptionsData } = await supabase
                .from('appointment_exceptions')
                .select('*')
                .order('date', { ascending: true });

            if (exceptionsData) setExceptions(exceptionsData);

        } catch (error) {
            console.error('Error fetching availability data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDay = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule[index].is_working_day = !newSchedule[index].is_working_day;
        setSchedule(newSchedule);
    };

    const handleChangeTime = (index: number, field: 'start_time' | 'end_time', value: string) => {
        const newSchedule = [...schedule];
        newSchedule[index][field] = value;
        setSchedule(newSchedule);
    };

    const saveSchedule = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('appointment_availability')
            .upsert(schedule);

        if (error) {
            alert('Hata oluştu.');
        } else {
            alert('Haftalık program güncellendi.');
        }
        setSaving(false);
    };

    const addException = async () => {
        if (!newExceptionDate) return alert('Lütfen tarih seçin');

        setSaving(true);
        const { error } = await supabase
            .from('appointment_exceptions')
            .insert({
                date: newExceptionDate,
                is_available: newExceptionIsAvailable,
                start_time: newExceptionStart,
                end_time: newExceptionEnd,
                reason: newExceptionReason
            });

        if (error) {
            console.error(error);
            alert('Özel gün eklenirken hata oluştu (Aynı tarihe birden fazla kayıt eklenemez).');
        } else {
            // Refresh list
            fetchData();
            // Reset form
            setNewExceptionReason('');
            setNewExceptionDate('');
        }
        setSaving(false);
    };

    const deleteException = async (id: number) => {
        if (!confirm('Bu özel günü silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase
            .from('appointment_exceptions')
            .delete()
            .eq('id', id);

        if (!error) {
            setExceptions(exceptions.filter(e => e.id !== id));
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    const displayOrder = [1, 2, 3, 4, 5, 6, 0];

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm max-w-3xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-100">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'general' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                    Genel Program
                </button>
                <button
                    onClick={() => setActiveTab('exceptions')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'exceptions' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                    Özel Günler & Tatiller
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'general' ? (
                    /* Weekly Schedule Tab */
                    <>
                        <h2 className="text-lg font-bold text-zinc-900 mb-6">Haftalık Çalışma Saatleri</h2>
                        <div className="space-y-4">
                            {displayOrder.map(dayIndex => {
                                const dayData = schedule.find(d => d.day_of_week === dayIndex);
                                if (!dayData) return null;

                                return (
                                    <div key={dayIndex} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-300 transition-colors">
                                        <div className="flex items-center gap-4 w-40">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={dayData.is_working_day}
                                                    onChange={() => handleToggleDay(schedule.indexOf(dayData))}
                                                />
                                                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                            </label>
                                            <span className={`font-medium ${dayData.is_working_day ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                                {DAYS[dayIndex]}
                                            </span>
                                        </div>

                                        {dayData.is_working_day ? (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="time"
                                                    value={dayData.start_time.slice(0, 5)}
                                                    onChange={(e) => handleChangeTime(schedule.indexOf(dayData), 'start_time', e.target.value)}
                                                    className="p-2 border border-zinc-300 rounded-lg text-sm focus:border-orange-500 outline-none"
                                                />
                                                <span className="text-zinc-400">-</span>
                                                <input
                                                    type="time"
                                                    value={dayData.end_time.slice(0, 5)}
                                                    onChange={(e) => handleChangeTime(schedule.indexOf(dayData), 'end_time', e.target.value)}
                                                    className="p-2 border border-zinc-300 rounded-lg text-sm focus:border-orange-500 outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-zinc-400 italic px-4">Kapalı</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={saveSchedule}
                                disabled={saving}
                                className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Değişiklikleri Kaydet
                            </button>
                        </div>
                    </>
                ) : (
                    /* Exceptions Tab */
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 mb-4">Yeni İstisna Ekle</h2>
                            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1">Tarih</label>
                                        <input
                                            type="date"
                                            value={newExceptionDate}
                                            onChange={e => setNewExceptionDate(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1">Durum</label>
                                        <div className="flex bg-white rounded-xl border border-zinc-300 p-1">
                                            <button
                                                onClick={() => setNewExceptionIsAvailable(false)}
                                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${!newExceptionIsAvailable ? 'bg-red-100 text-red-700' : 'text-zinc-500 hover:bg-zinc-50'}`}
                                            >
                                                Kapalı
                                            </button>
                                            <button
                                                onClick={() => setNewExceptionIsAvailable(true)}
                                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${newExceptionIsAvailable ? 'bg-green-100 text-green-700' : 'text-zinc-500 hover:bg-zinc-50'}`}
                                            >
                                                Açık (Özel Saat)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {newExceptionIsAvailable && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1">Başlangıç</label>
                                            <input
                                                type="time"
                                                value={newExceptionStart}
                                                onChange={e => setNewExceptionStart(e.target.value)}
                                                className="w-full p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-1">Bitiş</label>
                                            <input
                                                type="time"
                                                value={newExceptionEnd}
                                                onChange={e => setNewExceptionEnd(e.target.value)}
                                                className="w-full p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Açıklama (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: Resmi Tatil, Doktor Randevusu..."
                                        value={newExceptionReason}
                                        onChange={e => setNewExceptionReason(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={addException}
                                        disabled={saving}
                                        className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Ekleniyor...' : 'Ekle'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 mb-4">Eklenen Özel Günler</h2>
                            {exceptions.length === 0 ? (
                                <p className="text-zinc-400 text-sm italic">Henüz özel bir gün tanımlanmamış.</p>
                            ) : (
                                <div className="space-y-3">
                                    {exceptions.map(ex => (
                                        <div key={ex.id} className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl group hover:border-orange-200 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${ex.is_available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {new Date(ex.date).getDate()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">
                                                        {new Date(ex.date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', weekday: 'long' })}
                                                    </p>
                                                    <p className="text-sm text-zinc-500">
                                                        {ex.is_available
                                                            ? `${ex.start_time.slice(0, 5)} - ${ex.end_time.slice(0, 5)}`
                                                            : 'KAPALI'
                                                        }
                                                        {ex.reason && <span className="ml-2 text-zinc-400">• {ex.reason}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteException(ex.id)}
                                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Loader2 size={18} className={saving ? 'animate-spin' : 'hidden'} />
                                                {!saving && <Save className="hidden" />} {/* Dummy icon to keep imports valid if needed, actually we usetrash icon here usually but I will use X to be safe with existing imports or use Text */}
                                                <span className="text-sm font-bold">Sil</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvailabilitySettings;
