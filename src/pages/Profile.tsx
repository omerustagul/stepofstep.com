import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { User, Mail, Calendar, Shield, Edit, Phone as PhoneIcon, X, Save, Lock, Loader2, Gift, CheckCircle2, Clock, Sparkles, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UpgradeModal from '../components/common/UpgradeModal';
import { supabase } from '../lib/supabase';
import SEO from '../components/common/SEO';

const Profile = () => {
    const { user, updateProfile, updatePassword } = useAuth();
    const { t } = useTranslation();
    const { getPagePath } = useSiteSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [spinHistory, setSpinHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [dbPlans, setDbPlans] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const fetchSpinHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('wheel_spins')
                .select(`
                    id,
                    spin_date,
                    is_claimed,
                    claimed_at,
                    meta_data,
                    wheel_rewards (
                        label,
                        value,
                        reward_type,
                        reward_value,
                        file_url
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSpinHistory(data || []);
        } catch (err) {
            console.error('Error fetching spin history:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [user]);

    const RewardCountdown = ({ startDate }: { startDate: string }) => {
        const [timeLeft, setTimeLeft] = useState('');

        useEffect(() => {
            const calculateTime = () => {
                const start = new Date(startDate).getTime();
                const end = start + (7 * 24 * 60 * 60 * 1000); // 7 days valid
                const now = new Date().getTime();
                const diff = end - now;

                if (diff <= 0) {
                    setTimeLeft('Süresi Doldu');
                    return;
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                setTimeLeft(`${days}g ${hours}s ${minutes}d kaldı`);
            };

            calculateTime();
            const timer = setInterval(calculateTime, 60000); // Update every minute
            return () => clearInterval(timer);
        }, [startDate]);

        return <span className="text-[10px] text-zinc-400 pl-4">({timeLeft})</span>;
    };

    const fetchPlans = useCallback(async () => {
        setPlansLoading(true);
        try {
            const { data, error } = await supabase
                .from('membership_plans')
                .select('*');
            if (error) throw error;
            setDbPlans(data || []);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setPlansLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSpinHistory();
        fetchPlans();
    }, [fetchSpinHistory, fetchPlans]);

    const userPlanData = dbPlans.find(p => p.id === user?.plan);
    const planName = userPlanData?.name || (user?.plan === 'free' ? 'Free Plan' : user?.plan?.toUpperCase() || 'Free Plan');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const result = await updateProfile(formData.name, formData.email, formData.phone);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Şifreler eşleşmiyor.' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır.' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        const result = await updatePassword(passwordData.newPassword);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi!' });
            setIsChangingPassword(false);
            setPasswordData({ newPassword: '', confirmPassword: '' });
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-8 p-3 pt-16 md:pt-10 relative max-w-6xl mx-auto pb-20">
            <SEO path={getPagePath('Profil', '/profile')} />
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black mb-2 text-[rgb(var(--text-primary))] tracking-tighter">{t('profile.title')}</h1>
                    <p className="text-[rgb(var(--text-secondary))] font-medium">Hesap ayarlarınızı ve hediye geçmişinizi yönetin.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--bg-card))] rounded-2xl border border-[rgb(var(--border-primary))] shadow-sm">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-[rgb(var(--text-secondary))]">Hoşgeldin {user?.name}</span>
                </div>
            </div>

            {/* Feedback Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                >
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                    <span className="font-bold">{message.text}</span>
                </motion.div>
            )}

            <div className="flex flex-col gap-6">
                {/* Top Row: Personal Info & Plan Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <div className="glass-panel p-8 rounded-3xl bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-sm h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <User className="text-orange-500" />
                                {t('profile.personal_info')}
                            </h2>
                            <button
                                onClick={() => {
                                    setFormData({
                                        name: user?.name || '',
                                        email: user?.email || '',
                                        phone: user?.phone || ''
                                    });
                                    setIsEditing(true);
                                    setMessage(null);
                                }}
                                className="h-10 w-auto text-xs font-bold text-[rgb(var(--text-secondary))] hover:text-orange-500 flex items-center gap-1 transition-colors px-3 py-1 bg-[rgb(var(--bg-secondary))] rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                                <Edit size={14} /> {t('profile.edit_profile')}
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 text-sm font-bold border-4 border-[rgb(var(--bg-card))] shadow-lg">
                                    {user?.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-[rgb(var(--text-primary))] leading-tight">{user?.name}</h3>
                                    <p className="text-[rgb(var(--text-secondary))] text-sm font-medium capitalize flex items-center gap-1">
                                        <Shield size={12} /> {user?.role}
                                    </p>
                                </div>
                            </div>
                            <div className="h-px bg-[rgb(var(--border-primary))]" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-[rgb(var(--text-secondary))]">
                                    <Mail size={18} className="text-[rgb(var(--text-tertiary))]" />
                                    <span className="text-sm font-medium">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[rgb(var(--text-secondary))]">
                                    <PhoneIcon size={18} className="text-[rgb(var(--text-tertiary))]" />
                                    <span className="text-sm font-medium">{user?.phone || 'Telefon eklenmedi'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[rgb(var(--text-secondary))]">
                                    <Calendar size={18} className="text-[rgb(var(--text-tertiary))]" />
                                    <span className="text-sm font-medium">{t('profile.member_since')}: Ocak 2024</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setIsChangingPassword(true);
                                    setMessage(null);
                                }}
                                className="w-full py-3 rounded-2xl border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] font-bold text-sm hover:bg-[rgb(var(--bg-secondary))] transition-colors flex items-center justify-center gap-2 tracking-tight"
                            >
                                <Lock size={16} />
                                Şifre Değiştir
                            </button>
                        </div>
                    </div>

                    {/* Plan Details */}
                    <div className="flex-1 glass-panel p-8 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <Shield className="text-white" />
                                {t('profile.plan_details')}
                            </h2>
                            <span className="flex items-center gap-2 px-3 py-1 bg-white/70 text-orange-500 text-xs font-black rounded-full tracking-widest uppercase border border-white/80">
                                {planName}
                            </span>
                        </div>

                        <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-end">
                            <div>
                                <p className="text-sm text-white mb-2 font-medium tracking-tighter">{t('profile.current_plan')}</p>
                                <h3 className="text-3xl font-black text-white tracking-tighter">
                                    {plansLoading ? (
                                        <div className="h-8 w-32 bg-white/10 animate-pulse rounded-lg" />
                                    ) : (
                                        planName
                                    )}
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold tracking-widest">
                                    <span className="text-white">Kredi Kullanımı</span>
                                    <span className="text-white">75%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-white to-zinc-400 w-3/4 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                                </div>
                                <p className="text-xs text-white font-medium">1250 / 2000 Aylık Kredi Kalan</p>
                            </div>

                            <button
                                onClick={() => setUpgradeModalOpen(true)}
                                className="w-full py-4 rounded-2xl bg-white text-zinc-950 font-black text-sm tracking-widest hover:bg-gradient-to-r from-white/90 to-zinc-300 hover:text-zinc-950 transition-all mt-4 active:scale-95"
                            >
                                {t('dashboard.upgrade_plan')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Wheel History (Full Width) */}
                <div className="glass-panel rounded-3xl bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-[rgb(var(--border-primary))] flex items-center justify-between">
                        <h2 className="text-lg font-black text-[rgb(var(--text-primary))] flex items-center gap-3 tracking-tighter">
                            <div className="rounded-2xl">
                                <Gift className="text-orange-500" size={24} />
                            </div>
                            Çark Geçmişi & Hediyeler
                        </h2>
                        <span className="px-4 py-1.5 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] rounded-full text-xs font-bold font-mono">
                            Toplam: {spinHistory.length}
                        </span>
                    </div>

                    <div className="flex-1">
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center h-auto py-3 text-[rgb(var(--text-tertiary))]">
                                <Loader2 className="animate-spin mb-4" size={32} />
                                <p className="font-bold tracking-widest text-xs">Yükleniyor...</p>
                            </div>
                        ) : spinHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                                <div className="w-12 h-12 bg-[rgb(var(--bg-secondary))] rounded-full flex items-center justify-center mb-6">
                                    <Gift className="text-[rgb(var(--text-tertiary))]" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">Henüz hediye yok!</h3>
                                <p className="text-[rgb(var(--text-secondary))] max-w-xs mx-auto mb-8">
                                    Şans çarkını çevirerek birbirinden değerli ödüller kazanabilirsiniz.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[rgb(var(--border-primary))]">
                                {spinHistory.map((spin) => (
                                    <div key={spin.id} className="p-6 hover:bg-[rgb(var(--bg-secondary))]/50 transition-colors flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${spin.is_claimed ? 'bg-green-100 dark:bg-green-500/10 text-green-600' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600'}`}>
                                                {spin.is_claimed ? <CheckCircle2 size={24} /> : <Gift size={24} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-black text-sm text-[rgb(var(--text-primary))] truncate">
                                                        {spin.wheel_rewards?.label || 'Ödül'}
                                                    </h4>
                                                    {spin.is_claimed && (
                                                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black tracking-widest">
                                                            ALINDI
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--text-secondary))]">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(spin.spin_date).toLocaleDateString('tr-TR')}
                                                    </div>
                                                    {spin.wheel_rewards?.reward_type === 'file' && spin.wheel_rewards?.file_url && (
                                                        <a
                                                            href={spin.wheel_rewards.file_url}
                                                            download
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-1 text-white font-bold hover:text-orange-400 transition-colors"
                                                        >
                                                            <Download size={12} /> Dosyayı İndir
                                                        </a>
                                                    )}
                                                    {spin.wheel_rewards?.reward_type === 'membership_discount' && spin.wheel_rewards.reward_value && (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1 text-white font-bold">
                                                                <Sparkles size={12} />
                                                                {dbPlans.find(p => p.id === spin.wheel_rewards.reward_value?.split(':')[0])?.name || spin.wheel_rewards.reward_value?.split(':')[0]?.toUpperCase()}
                                                                paketinde %{spin.wheel_rewards.reward_value.split(':')[1]} İndirim
                                                            </div>
                                                            <RewardCountdown startDate={spin.created_at || spin.spin_date} />
                                                        </div>
                                                    )}
                                                    {spin.wheel_rewards?.reward_type === 'membership' && (
                                                        <div className="flex items-center gap-1 text-orange-400/80 italic">
                                                            <Sparkles size={12} /> {dbPlans.find(p => p.id === spin.wheel_rewards.reward_value)?.name || spin.wheel_rewards.reward_value?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-[rgb(var(--text-primary))] mb-1">{spin.wheel_rewards?.value || '-'}</p>
                                            {spin.claimed_at && (
                                                <p className="text-[10px] text-[rgb(var(--text-tertiary))] font-mono italic">
                                                    <Clock size={8} className="inline mr-1" />
                                                    {new Date(spin.claimed_at).toLocaleString('tr-TR')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-orange-50 border-t border-orange-100 mt-auto">
                        <p className="text-xs text-orange-700 font-bold leading-relaxed">
                            <Sparkles className="inline mr-2" size={14} />
                            Hediyeler hesabınıza otomatik olarak tanımlanır. Kullanım süresi ve detayları için destek ekibiyle iletişime geçebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[rgb(var(--bg-card))]/80 border border-[rgb(var(--border-primary))]/90 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative"
                        >
                            <button onClick={() => setIsEditing(false)} className="absolute top-8 right-8 p-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
                                <X size={24} />
                            </button>

                            <div className="mb-10 text-center">
                                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <User className="text-white" size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-[rgb(var(--text-primary))] tracking-tighter">{t('profile.edit_profile')}</h3>
                                <p className="text-[rgb(var(--text-secondary))] text-sm">Profil bilgilerinizi buradan güncelleyin.</p>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-[rgb(var(--text-secondary))] tracking-widest mb-2 ml-1">İsim Soyisim</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[rgb(var(--bg-input))] border border-orange-500/50 rounded-2xl px-5 py-4 text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[rgb(var(--text-secondary))] tracking-widest mb-2 ml-1">E-posta Adresi</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[rgb(var(--bg-input))] border border-orange-500/50 rounded-2xl px-5 py-4 text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold opacity-50 cursor-not-allowed"
                                        disabled={true}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[rgb(var(--text-secondary))] tracking-widest mb-2 ml-1">Telefon Numarası</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+90 555 123 45 67"
                                        className="w-full bg-[rgb(var(--bg-input))] border border-orange-500/50 rounded-2xl px-5 py-4 text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-4 rounded-2xl bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-tertiary))] font-black tracking-widest hover:bg-[rgb(var(--bg-secondary))]/80 transition-colors"
                                        disabled={isSaving}
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-black tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                        KAYDET
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Change Password Modal */}
            <AnimatePresence>
                {isChangingPassword && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-blur-lg bg-black/20 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-blur-lg bg-[rgb(var(--bg-card))]/80 border border-[rgb(var(--border-primary))]/90 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative"
                        >
                            <button onClick={() => setIsChangingPassword(false)} className="absolute top-8 right-8 p-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
                                <X size={24} />
                            </button>

                            <div className="mb-10 text-center">
                                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Lock className="text-white" size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-[rgb(var(--text-primary))] tracking-tighter">Şifreni Güncelle</h3>
                                <p className="text-[rgb(var(--text-secondary))] text-sm">Giriş güvenliğiniz için şifrenizi yenileyin.</p>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-[rgb(var(--text-secondary))] tracking-widest mb-2 ml-1">Yeni Şifre</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[rgb(var(--bg-input))]/50 border border-orange-500/20 rounded-2xl px-5 py-4 text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[rgb(var(--text-secondary))] tracking-widest mb-2 ml-1">Şifre Tekrar</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[rgb(var(--bg-input))]/50 border border-orange-500/20 rounded-2xl px-5 py-4 text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsChangingPassword(false)}
                                        className="flex-1 py-4 rounded-2xl bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-tertiary))] font-black tracking-widest hover:bg-[rgb(var(--bg-secondary))]/80 transition-colors"
                                        disabled={isSaving}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-black tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                                        Güncelle
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default Profile;
