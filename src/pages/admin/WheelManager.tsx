import { useState, useEffect, useCallback } from 'react';
import {
    Gift,
    Plus,
    Save,
    Trash2,
    History,
    CheckCircle2,
    XCircle,
    Loader2,
    Sparkles,
    Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoles } from '../../context/RoleContext';
import { Navigate } from 'react-router-dom';

interface Reward {
    id: string;
    label: string;
    value: number;
    color: string;
    text_color: string;
    probability: number;
    is_active: boolean;
    type: 'text' | 'membership_discount' | 'file' | 'discount' | 'free_month' | 'xp' | 'badge' | 'empty';
    reward_value: string;
    file_url?: string;
}

interface MembershipPlan {
    id: string;
    name: string;
    price_monthly: number;
    features: string[];
    color: string;
    icon: string;
    is_popular: boolean;
}

const WheelManager = () => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const { user } = useAuth();
    const { canView, canEdit } = useRoles();
    const [spins, setSpins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
    const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);

    const hasViewPermission = user?.role_id ? canView(user.role_id, 'wheel') : user?.role === 'admin';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'wheel') : user?.role === 'admin';

    if (!hasViewPermission) {
        return <Navigate to="/admin" replace />;
    }

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch rewards
            const { data: rewardsData, error: rewardsError } = await supabase
                .from('wheel_rewards')
                .select('*')
                .order('created_at', { ascending: true });

            if (rewardsError) throw rewardsError;
            
            // Map database field to state field 'type' (handling both possible column names)
            const formattedRewards = (rewardsData || []).map((r: any) => ({
                ...r,
                type: r.type || r.reward_type // Handle both possible DB column names
            }));
            
            setRewards(formattedRewards);

            // Fetch recent spins
            const { data: spinsData, error: spinsError } = await supabase
                .from('wheel_spins')
                .select('*, wheel_rewards(label), app_users(name, email)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (spinsError) throw spinsError;
            setSpins(spinsData || []);

            // Fetch membership plans
            const { data: plansData, error: plansError } = await supabase
                .from('membership_plans')
                .select('*')
                .order('price_monthly', { ascending: true });

            if (plansError) throw plansError;

            // Parse features if they are stringified
            const formattedPlans = (plansData || []).map((p: any) => ({
                ...p,
                features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
            }));
            setMembershipPlans(formattedPlans);

        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddReward = () => {
        const newReward: Reward = {
            id: 'new-' + Date.now(),
            label: 'Yeni Ödül',
            value: 0,
            color: '#f97316',
            text_color: '#ffffff',
            probability: 10,
            is_active: true,
            type: 'text',
            reward_value: 'Ödül Detayı',
            file_url: ''
        };
        setRewards([...rewards, newReward]);
    };

    const handleRemoveReward = async (id: string) => {
        if (!window.confirm('Bu ödülü silmek istediğinize emin misiniz?')) return;

        if (id.startsWith('new-')) {
            setRewards(rewards.filter(r => r.id !== id));
            return;
        }

        try {
            const { error } = await supabase.from('wheel_rewards').delete().eq('id', id);
            if (error) throw error;
            setRewards(rewards.filter(r => r.id !== id));
        } catch (err) {
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const reward of rewards) {
                const isNew = reward.id.startsWith('new-');
                
                // CRITICAL: Database schema alignment
                // 1. 'type' must map to 'reward_type' if the SQL script was run
                // 2. 'value' must be a string if the SQL script was run to convert it to TEXT
                // 3. Optional fields should be handled safely
                const dbData: any = {
                    label: reward.label,
                    reward_type: reward.type, 
                    value: reward.value ? String(reward.value) : "", 
                    reward_value: reward.value ? String(reward.value) : "", 
                    probability: Number(reward.probability) || 0,
                    color: reward.color || '#FF6B35',
                    text_color: reward.text_color || '#ffffff',
                    is_active: reward.is_active,
                    file_url: reward.file_url || null
                };

                const { error } = isNew
                    ? await supabase.from('wheel_rewards').insert(dbData)
                    : await supabase.from('wheel_rewards').update(dbData).eq('id', reward.id);

                if (error) {
                    console.error(`Error saving reward ${reward.label}:`, error);
                    // Provide visual feedback for the specific field error
                    alert(`"${reward.label}" kaydedilemedi!\n\nVeritabanı Hatası: ${error.message}\n${error.details ? 'Detay: ' + error.details : ''}`);
                    failCount++;
                } else {
                    successCount++;
                }
            }

            if (failCount === 0) {
                alert('Tüm ödüller başarıyla kaydedildi!');
            } else {
                alert(`${successCount} ödül kaydedildi, ${failCount} ödül hata verdi. Lütfen yukarıdaki hataları kontrol edin.`);
            }
            fetchData();
        } catch (err: any) {
            console.error('Save error:', err);
            alert('Kayıt işlemi sırasında bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };


    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const updateRewardField = (id: string, field: keyof Reward, value: any) => {
        setRewards(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleFileUpload = async (rewardId: string, file: File) => {
        console.log('Starting upload for reward:', rewardId, file.name);
        setUploadingId(rewardId);
        try {
            // const fileExt = file.name.split('.').pop();
            // Keep original name but prepend ID and append random string for uniqueness
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${rewardId}-${safeName}`;
            const filePath = `wheel-prizes/${fileName}`;

            console.log('Uploading to path:', filePath);

            const { data, error: uploadError } = await supabase.storage
                .from('wheel-rewards')
                .upload(filePath, file, {
                    upsert: true
                });

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                throw uploadError;
            }

            console.log('Upload successful:', data);

            const { data: { publicUrl } } = supabase.storage
                .from('wheel-rewards')
                .getPublicUrl(filePath);

            console.log('Generated Public URL:', publicUrl);

            updateRewardField(rewardId, 'file_url', publicUrl);
            updateRewardField(rewardId, 'type', 'file');

            // Force a small delay to ensure state updates visible if needed, though functional update usually instant
            // alert('Dosya yüklendi: ' + safeName); 
        } catch (err: any) {
            console.error('Upload error full object:', err);
            alert(`Dosya yükleme başarısız oldu: ${err.message || 'Bilinmeyen hata'}`);
        } finally {
            setUploadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Gift className="text-orange-500" />
                        Çark Yönetimi
                    </h1>
                    <p className="text-zinc-500">Çark ödüllerini ve kullanım geçmişini yönetin.</p>
                </div>
                <div className="flex items-center gap-2 h-10 bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] p-1 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={`h-8 flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-all ${activeTab === 'rewards' ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Ödüller
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`h-8 flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-all ${activeTab === 'history' ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Geçmiş
                    </button>
                </div>
            </div>

            {activeTab === 'rewards' ? (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Ödül Etiketi</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Tip</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Bağlı İçerik</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Açıklama</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Renk</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-zinc-600">İhtimal (%)</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Durum</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-zinc-600 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {rewards.map((reward) => (
                                    <tr key={reward.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={reward.label}
                                                onChange={(e) => updateRewardField(reward.id, 'label', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium text-zinc-900 p-0"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={reward.type}
                                                onChange={(e) => updateRewardField(reward.id, 'type', e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-orange-600 p-0 uppercase"
                                            >
                                                <option value="text">METİN</option>
                                                <option value="membership_discount">ÜYELİK İNDİRİMİ</option>
                                                <option value="file">DOSYA</option>
                                                <option value="discount">İNDİRİM</option>
                                                <option value="xp">XP</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            {reward.type === 'membership_discount' ? (
                                                <div className="flex flex-col gap-2">
                                                    <select
                                                        value={reward.reward_value?.split(':')[0] || ''}
                                                        onChange={(e) => {
                                                            const rate = reward.reward_value?.split(':')[1] || '0';
                                                            updateRewardField(reward.id, 'reward_value', `${e.target.value}:${rate}`);
                                                        }}
                                                        className="bg-zinc-100 rounded px-2 py-1 text-[10px] font-medium focus:ring-1 focus:ring-orange-500 outline-none"
                                                    >
                                                        <option value="">Plan Seçin</option>
                                                        {membershipPlans.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={reward.reward_value?.split(':')[1] || '0'}
                                                            onChange={(e) => {
                                                                const plan = reward.reward_value?.split(':')[0] || '';
                                                                updateRewardField(reward.id, 'reward_value', `${plan}:${e.target.value}`);
                                                            }}
                                                            className="w-12 bg-zinc-100 rounded px-2 py-1 text-[10px] font-medium outline-none"
                                                            placeholder="20"
                                                        />
                                                        <span className="text-[10px] text-zinc-400">%</span>
                                                    </div>
                                                </div>
                                            ) : reward.type === 'file' ? (
                                                <div className="flex items-center gap-2">
                                                    {uploadingId === reward.id ? (
                                                        <Loader2 className="animate-spin text-orange-500" size={14} />
                                                    ) : (
                                                        <label className={`cursor-pointer p-1.5 rounded-lg transition-colors flex items-center gap-2 ${reward.file_url ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                                                            {reward.file_url ? <CheckCircle2 size={14} /> : <Upload size={14} />}
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(reward.id, e.target.files[0])}
                                                            />
                                                            <span className="text-[10px] font-medium truncate max-w-[80px]">
                                                                {reward.file_url ? reward.file_url.split('/').pop()?.split('-').slice(0, -1).join('-') || 'Dosya' : 'Yükle'}
                                                            </span>
                                                        </label>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={reward.value}
                                                onChange={(e) => updateRewardField(reward.id, 'value', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-xs text-zinc-600 p-0"
                                                placeholder="Ödül açıklaması..."
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <label className="relative group cursor-pointer">
                                                    <input
                                                        type="color"
                                                        value={reward.color}
                                                        onChange={(e) => updateRewardField(reward.id, 'color', e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-zinc-200 transition-transform group-hover:scale-110"
                                                        style={{ backgroundColor: reward.color }}
                                                    />
                                                </label>
                                                <span className="text-[10px] font-mono text-zinc-400 font-bold tracking-tight">{reward.color.toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={reward.probability}
                                                    onChange={(e) => updateRewardField(reward.id, 'probability', parseInt(e.target.value) || 0)}
                                                    className="w-16 bg-zinc-100/50 border border-zinc-200 rounded-lg px-2 py-1 text-sm font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                                                />
                                                <span className="text-xs text-zinc-400 font-bold">%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => updateRewardField(reward.id, 'is_active', !reward.is_active)}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${reward.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {reward.is_active ? (
                                                    <><CheckCircle2 size={14} /> Aktif</>
                                                ) : (
                                                    <><XCircle size={14} /> Pasif</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRemoveReward(reward.id)}
                                                className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rewards.length === 0 && (
                            <div className="p-12 text-center text-zinc-500">
                                <Gift className="mx-auto mb-4 opacity-20" size={48} />
                                <p>Henüz ödül eklenmemiş.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Sparkles className="text-orange-500" size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Toplam Çıkma Olasılığı</h4>
                                <p className="text-xs text-zinc-500">Tüm aktif ödüllerin toplam ihtimali %100 olmalıdır.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-3xl font-black ${rewards.filter(r => r.is_active).reduce((sum, r) => sum + (r.probability || 0), 0) === 100
                                ? 'text-green-600'
                                : 'text-orange-600'
                                }`}>
                                %{rewards.filter(r => r.is_active).reduce((sum, r) => sum + (r.probability || 0), 0)}
                            </span>
                            <div className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                                {rewards.filter(r => r.is_active).reduce((sum, r) => sum + (r.probability || 0), 0) < 100 ? 'Eksik Paylaşım' : rewards.filter(r => r.is_active).reduce((sum, r) => sum + (r.probability || 0), 0) > 100 ? 'Fazla Paylaşım' : 'Tam Dengeli'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        {hasEditPermission && (
                            <button
                                onClick={handleAddReward}
                                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95"
                            >
                                <Plus size={20} /> Ödül Ekle
                            </button>
                        )}
                        {hasEditPermission && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Değişiklikleri Kaydet
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Kullanıcı</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Kazanılan Ödül</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {spins.map((spin) => (
                                <tr key={spin.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-zinc-900">{spin.app_users?.name || 'Anonim'}</span>
                                            <span className="text-xs text-zinc-500">{spin.app_users?.email || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                            {spin.wheel_rewards?.label || 'Bilinmeyen'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-sm">
                                        {spin.created_at ? new Date(spin.created_at).toLocaleString('tr-TR') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {spins.length === 0 && (
                        <div className="p-12 text-center text-zinc-500">
                            <History className="mx-auto mb-4 opacity-20" size={48} />
                            <p>Henüz çevirme kaydı bulunmuyor.</p>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
};

export default WheelManager;
