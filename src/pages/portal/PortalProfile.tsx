import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Edit, Phone as PhoneIcon, X, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PortalProfile = () => {
    const { user, updateProfile, updatePassword } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const formatPlanName = (p: string) => {
        if (!p) return 'Ücretsiz';
        if (p === 'free') return 'Ücretsiz';
        if (p.startsWith('plan_')) return 'Pro';
        return p.toUpperCase();
    }
    const planName = formatPlanName(user?.plan || '');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        const result = await updateProfile(formData.name, formData.email, formData.phone);
        if (result.error) setMessage({ type: 'error', text: result.error });
        else { setMessage({ type: 'success', text: 'Profil güncellendi!' }); setIsEditing(false); }
        setIsSaving(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) { setMessage({ type: 'error', text: 'Şifreler eşleşmiyor.' }); return; }
        setIsSaving(true);
        const result = await updatePassword(passwordData.newPassword);
        if (result.error) setMessage({ type: 'error', text: result.error });
        else { setMessage({ type: 'success', text: 'Şifre güncellendi!' }); setIsChangingPassword(false); setPasswordData({ newPassword: '', confirmPassword: '' }); }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[rgb(var(--text-primary))] tracking-tighter">Profil & Üyelik</h1>
                    <p className="text-[rgb(var(--text-secondary))] font-medium">Hesap detaylarınız ve üyelik durumunuz.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--bg-card))] rounded-2xl border border-[rgb(var(--border-primary))] shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-sm font-bold text-[rgb(var(--text-primary))]">{planName}</span>
                </div>
            </div>

            {/* Notifications */}
            {message && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                    <span className="font-bold text-sm">{message.text}</span>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Info Card */}
                <div className="bg-[rgb(var(--bg-card))] p-6 rounded-3xl border border-[rgb(var(--border-primary))] shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-bold flex items-center gap-2 text-[rgb(var(--text-primary))]"><User size={18} className="text-orange-500" /> Kişisel Bilgiler</h2>
                        <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-[rgb(var(--bg-tertiary))] rounded-full text-[rgb(var(--text-tertiary))] hover:text-orange-500 transition-colors"><Edit size={16} /></button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 text-2xl font-black border-4 border-white dark:border-[rgb(var(--border-primary))]/10 shadow-lg">
                            {user?.name?.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[rgb(var(--text-primary))]">{user?.name}</h3>
                            <p className="text-[rgb(var(--text-secondary))] text-sm flex items-center gap-1"><Mail size={12} /> {user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="p-4 bg-[rgb(var(--bg-tertiary))] rounded-2xl flex items-center gap-3">
                            <PhoneIcon className="text-[rgb(var(--text-tertiary))]" size={18} />
                            <div>
                                <p className="text-xs font-bold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">TELEFON</p>
                                <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{user?.phone || 'Eklenmedi'}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-[rgb(var(--bg-tertiary))] rounded-2xl flex items-center gap-3">
                            <Shield className="text-[rgb(var(--text-tertiary))]" size={18} />
                            <div>
                                <p className="text-xs font-bold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">HESAP TÜRÜ</p>
                                <p className="text-sm font-bold text-[rgb(var(--text-primary))] capitalize">{user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsChangingPassword(true)} className="w-full p-4 mt-4 bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-secondary))] transition-colors rounded-2xl flex items-center justify-center font-bold text-sm text-[rgb(var(--text-primary))] border border-[rgb(var(--border-primary))]">
                            Şifre Değiştir
                        </button>
                    </div>
                </div>

                {/* Membership Plan Card */}
                <div className="bg-gradient-to-br from-[rgb(var(--bg-primary))] to-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] p-6 rounded-3xl text-[rgb(var(--text-primary))] shadow-xl relative overflow-hidden flex flex-col justify-between h-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative z-10 flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-sm font-bold text-[rgb(var(--text-secondary))] flex items-center gap-2 mb-1"><Sparkles size={12} className="text-orange-500" /> Mevcut Plan</h2>
                            <h3 className="text-3xl font-black tracking-tight">{planName}</h3>
                        </div>
                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 text-xs font-bold text-[rgb(var(--text-primary))]">Aktif</div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        {/* Expiry Countdown */}
                        <div className="space-y-2">
                            {user?.subscription_end_date ? (() => {
                                const end = new Date(user.subscription_end_date);
                                const now = new Date();
                                const diff = end.getTime() - now.getTime();
                                const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                const total = 30; // Assuming 30 days cycle for visual
                                const percent = Math.max(0, Math.min(100, (daysLeft / total) * 100));

                                return (
                                    <>
                                        <div className="flex justify-between text-xs font-bold text-zinc-400">
                                            <span>Kalan Süre</span>
                                            <span className={daysLeft < 5 ? 'text-red-400' : 'text-green-400'}>{daysLeft > 0 ? `${daysLeft} Gün` : 'Süresi Doldu'}</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-1000 ${daysLeft < 5 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${percent}%` }} />
                                        </div>
                                        <p className="text-xs text-zinc-500">Üyeliğiniz {end.toLocaleDateString('tr-TR')} tarihinde yenilenecektir.</p>
                                    </>
                                );
                            })() : (
                                <>
                                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                                        <span>Üyelik Durumu</span>
                                        <span className="text-zinc-500">Limitsiz</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                                    </div>
                                    <p className="text-xs text-zinc-500">Aktif bir süre kısıtlaması yok.</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[rgb(var(--bg-card))] rounded-3xl p-6 w-full max-w-md relative shadow-2xl border border-[rgb(var(--border-primary))]">
                            <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"><X /></button>
                            <h3 className="text-xl font-bold mb-6 text-[rgb(var(--text-primary))]">Profili Düzenle</h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[rgb(var(--text-secondary))] ml-1">İsim Soyisim</label>
                                    <input
                                        className="w-full p-3 bg-[rgb(var(--bg-tertiary))] rounded-xl border-[rgb(var(--border-primary))] border font-bold text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-orange-500 placeholder-[rgb(var(--text-tertiary))]"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[rgb(var(--text-secondary))] ml-1">Telefon</label>
                                    <input
                                        className="w-full p-3 bg-[rgb(var(--bg-tertiary))] rounded-xl border-[rgb(var(--border-primary))] border font-bold text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-orange-500 placeholder-[rgb(var(--text-tertiary))]"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+90 5XX XXX XX XX"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-secondary))] transition-colors rounded-xl font-bold text-[rgb(var(--text-secondary))]">İptal</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 transition-colors rounded-xl font-bold text-white shadow-lg shadow-orange-500/20">{isSaving ? '...' : 'Kaydet'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
                {isChangingPassword && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[rgb(var(--bg-card))] rounded-3xl p-6 w-full max-w-md relative shadow-2xl border border-[rgb(var(--border-primary))]">
                            <button onClick={() => setIsChangingPassword(false)} className="absolute top-6 right-6 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"><X /></button>
                            <h3 className="text-xl font-bold mb-6 text-[rgb(var(--text-primary))]">Şifre Değiştir</h3>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[rgb(var(--text-secondary))] ml-1">Yeni Şifre</label>
                                    <input
                                        type="password"
                                        className="w-full p-3 bg-[rgb(var(--bg-tertiary))] rounded-xl border-[rgb(var(--border-primary))] border font-bold text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-orange-500 placeholder-[rgb(var(--text-tertiary))]"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[rgb(var(--text-secondary))] ml-1">Yeni Şifre (Tekrar)</label>
                                    <input
                                        type="password"
                                        className="w-full p-3 bg-[rgb(var(--bg-tertiary))] rounded-xl border-[rgb(var(--border-primary))] border font-bold text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-orange-500 placeholder-[rgb(var(--text-tertiary))]"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 py-3 bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-secondary))] transition-colors rounded-xl font-bold text-[rgb(var(--text-secondary))]">İptal</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 transition-colors rounded-xl font-bold text-white shadow-lg shadow-orange-500/20">{isSaving ? '...' : 'Güncelle'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PortalProfile;
