import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Bell, Send, Users, User, Loader2, Info, Check, AlertTriangle, AlertCircle, Eye } from 'lucide-react';

interface AppUser {
    id: string;
    auth_id: string;
    name: string;
    email: string;
}

const AdminNotifications = () => {
    const { } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Form State
    const [targetType, setTargetType] = useState<'all' | 'specific'>('specific');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [type, setType] = useState<'info' | 'success' | 'warning' | 'error' | 'promo' | 'system'>('info');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setUsersLoading(true);
            try {
                const { data, error } = await supabase
                    .from('app_users')
                    .select('id, auth_id, name, email')
                    .order('name');

                if (error) throw error;
                setUsers(data || []);
                // If specific is selected and no user selected, select first one
                if (data && data.length > 0 && !selectedUserId) {
                    setSelectedUserId(data[0].id);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Kullanıcı listesi alınamadı.');
            } finally {
                setUsersLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error('Lütfen başlık ve mesaj alanlarını doldurun.');
            return;
        }

        if (targetType === 'specific' && !selectedUserId) {
            toast.error('Lütfen bir kullanıcı seçin.');
            return;
        }

        if (!confirm(targetType === 'all' ? 'Tüm kullanıcılara bildirim gönderilecek. Emin misiniz?' : 'Seçili kullanıcıya bildirim gönderilecek. Emin misiniz?')) {
            return;
        }

        setLoading(true);

        try {
            let targetUsers: string[] = [];

            if (targetType === 'all') {
                targetUsers = users.map(u => u.auth_id);
            } else {
                const selectedUser = users.find(u => u.id === selectedUserId);
                if (selectedUser) {
                    targetUsers = [selectedUser.auth_id];
                }
            }

            // Chunk inserts if too many users (e.g. batches of 50)
            // But for now simple loop or single batch
            const notifications = targetUsers.map(uid => ({
                user_id: uid,
                type,
                title,
                message,
                link: link || null,
                is_read: false
            }));

            const { error } = await supabase
                .from('notifications')
                .insert(notifications);

            if (error) throw error;

            toast.success(`${notifications.length} kullanıcıya bildirim gönderildi.`);

            // Reset form
            setTitle('');
            setMessage('');
            setLink('');

        } catch (error: any) {
            console.error('Send error:', error);
            toast.error('Bildirim gönderilirken hata oluştu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Bildirim Gönder</h1>
                    <p className="text-zinc-500">Kullanıcılara sistem içi bildirim gönderin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSend} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">

                        {/* Target Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-700 block">Hedef Kitle</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setTargetType('specific')}
                                    className={`p-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${targetType === 'specific' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-500'}`}
                                >
                                    <User size={20} /> Tekil Kullanıcı
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetType('all')}
                                    className={`p-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${targetType === 'all' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-500'}`}
                                >
                                    <Users size={20} /> Tüm Kullanıcılar
                                </button>
                            </div>
                        </div>

                        {/* User Selector (if specific) */}
                        {targetType === 'specific' && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 block">Kullanıcı Seç</label>
                                {usersLoading ? (
                                    <div className="p-3 bg-zinc-50 rounded-xl flex items-center gap-2 text-zinc-500 text-sm">
                                        <Loader2 className="animate-spin" size={16} /> Kullanıcılar yükleniyor...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-orange-500 transition-colors"
                                    >
                                        <option value="" disabled>Kullanıcı Seçin</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Type Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 block">Bildirim Tipi</label>
                                <select
                                    value={type}
                                    onChange={(e: any) => setType(e.target.value)}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-orange-500 transition-colors"
                                >
                                    <option value="info">Bilgi (Mavi)</option>
                                    <option value="success">Başarılı (Yeşil)</option>
                                    <option value="warning">Uyarı (Sarı)</option>
                                    <option value="error">Hata (Kırmızı)</option>
                                    <option value="promo">Promo (Mor)</option>
                                    <option value="system">Sistem (Gri)</option>
                                </select>
                            </div>

                            {/* Link Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 block">Link (Opsiyonel)</label>
                                <input
                                    type="text"
                                    placeholder="/portal/apps"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 block">Başlık</label>
                            <input
                                type="text"
                                placeholder="Örn: Yeni Özellik Yayında!"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>

                        {/* Message Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 block">Mesaj</label>
                            <textarea
                                rows={4}
                                placeholder="Bildirim içeriğini buraya yazın..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-orange-500 transition-colors resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            {loading ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
                        </button>

                    </form>
                </div>

                {/* Preview Section */}
                <div className="space-y-6">
                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2"><Eye size={18} /> Önizleme</h3>

                        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
                            <div className="flex gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    {type === 'success' && <Check className="text-green-500" size={20} />}
                                    {type === 'error' && <AlertCircle className="text-red-500" size={20} />}
                                    {type === 'warning' && <AlertTriangle className="text-amber-500" size={20} />}
                                    {type === 'info' && <Info className="text-blue-500" size={20} />}
                                    {(type === 'promo' || type === 'system') && <Bell className={type === 'promo' ? 'text-purple-500' : 'text-zinc-500'} size={20} />}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-zinc-900">{title || 'Başlık Alanı'}</p>
                                        <span className="text-[10px] text-zinc-400 whitespace-nowrap ml-2">Şimdi</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        {message || 'Bildirim mesajı burada görünecek.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-zinc-500">
                            * Bildirimler kullanıcının bildirim merkezine düşecektir.
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2"><Info size={16} /> Bilgi</h4>
                        <p className="text-xs text-blue-800 leading-relaxed">
                            "Tüm Kullanıcılar" seçeneği, veritabanındaki kayıtlı {users.length} kullanıcıya ayrı ayrı bildirim oluşturur. Bu işlem biraz zaman alabilir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
