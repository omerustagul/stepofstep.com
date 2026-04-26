import { useState, useEffect, useCallback } from 'react';
import { Loader2, CreditCard, Shield, Zap, Star, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLoading } from '../../context/LoadingContext';
import { useAuth } from '../../context/AuthContext';
import { useRoles } from '../../context/RoleContext';
import { Navigate } from 'react-router-dom';

interface MembershipPlan {
    id: string;
    name: string;
    price_monthly: number;
    features: string[];
    color: string;
    icon: string;
    is_popular: boolean;
}

const PlanManager = () => {
    const { user } = useAuth();
    const { canView, canEdit } = useRoles();
    const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { showLoading, hideLoading } = useLoading();

    // Reusing 'members' permission for plans for now, or could use 'settings'
    const hasViewPermission = user?.role_id ? canView(user.role_id, 'members') : user?.role === 'admin';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'members') : user?.role === 'admin';

    if (!hasViewPermission) {
        return <Navigate to="/admin" replace />;
    }

    const fetchPlans = useCallback(async () => {
        setPlansLoading(true);
        try {
            const { data: plansData, error: plansError } = await supabase
                .from('membership_plans')
                .select('*')
                .order('price_monthly', { ascending: true });

            if (plansError) throw plansError;

            // Filter out Free (0 price) plans from the management/edit list
            const formattedPlans = (plansData || [])
                .filter((p: any) => p.price_monthly > 0)
                .map((p: any) => ({
                    ...p,
                    features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
                }));
            setMembershipPlans(formattedPlans);
        } catch (err) {
            console.error('Plan fetch error:', err);
        } finally {
            setPlansLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Bu planı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

        showLoading('Plan siliniyor...');
        try {
            const { error } = await supabase
                .from('membership_plans')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMembershipPlans(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Delete plan error:', err);
            alert('Plan silinirken bir hata oluştu.');
        } finally {
            hideLoading();
        }
    };

    const handleSavePlans = async () => {
        setSaving(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const plan of membershipPlans) {
                const { error } = await supabase
                    .from('membership_plans')
                    .update({
                        name: plan.name,
                        price_monthly: plan.price_monthly,
                        features: JSON.stringify(plan.features),
                        is_popular: plan.is_popular,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', plan.id);

                if (error) {
                    console.error(`Error saving plan ${plan.name}:`, error);
                    failCount++;
                } else {
                    successCount++;
                }
            }
            
            if (failCount === 0) {
                alert('Tüm plan ayarları başarıyla kaydedildi!');
            } else {
                alert(`${successCount} plan kaydedildi, ${failCount} plan kaydedilemedi. Yetkilerinizi kontrol edin.`);
            }
            fetchPlans();
        } catch (err: any) {
            console.error('Plan save error:', err);
            alert('Beklenmedik bir hata oluştu: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddPlan = async () => {
        setSaving(true);
        try {
            const newPlanId = crypto.randomUUID();
            const newPlan: MembershipPlan = {
                id: newPlanId,
                name: 'Yeni Plan',
                price_monthly: 0,
                features: ['Özellik 1', 'Özellik 2'],
                color: 'bg-zinc-100 text-zinc-600',
                icon: 'Zap',
                is_popular: false
            };

            const { error } = await supabase
                .from('membership_plans')
                .insert({
                    ...newPlan,
                    features: JSON.stringify(newPlan.features)
                });

            if (error) throw error;

            setMembershipPlans(prev => [...prev, newPlan]);
            alert('Yeni plan oluşturuldu! Şimdi düzenleyebilirsiniz.');
        } catch (err) {
            console.error('Add plan error:', err);
            alert('Plan oluşturulurken bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const updatePlanField = (id: string, field: keyof MembershipPlan, value: any) => {
        setMembershipPlans(membershipPlans.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Üyelik Planları</h1>
                    <p className="text-zinc-500">SaaS abonelik paketlerini ve özelliklerini yönetin.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden min-h-[400px]">
                {plansLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400 gap-4">
                        <Loader2 className="animate-spin" size={40} />
                        <p className="font-medium">Planlar yükleniyor...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Plan Adı</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Aylık Fiyat (₺)</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Özellikler (Virgülle Ayırın)</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Popüler</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {membershipPlans.length > 0 ? membershipPlans.map((plan) => {
                                const Icon = plan.icon === 'Zap' ? Zap : plan.icon === 'Star' ? Star : plan.icon === 'Shield' ? Shield : CreditCard;
                                return (
                                    <tr key={plan.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-zinc-100 text-zinc-600`}>
                                                    <Icon size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={plan.name}
                                                    onChange={(e) => updatePlanField(plan.id, 'name', e.target.value)}
                                                    className="bg-transparent border-none focus:ring-0 text-sm font-bold text-zinc-900 p-0"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={plan.price_monthly}
                                                onChange={(e) => updatePlanField(plan.id, 'price_monthly', parseFloat(e.target.value) || 0)}
                                                className="w-24 bg-zinc-100/50 border border-zinc-200 rounded-lg px-2 py-1 text-sm font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <textarea
                                                value={plan.features.join(', ')}
                                                onChange={(e) => updatePlanField(plan.id, 'features', e.target.value.split(',').map(f => f.trim()))}
                                                className="w-full bg-transparent border-none focus:ring-0 text-xs text-zinc-600 p-0 resize-none"
                                                rows={2}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => updatePlanField(plan.id, 'is_popular', !plan.is_popular)}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${plan.is_popular ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-400'}`}
                                            >
                                                {plan.is_popular ? 'Evet' : 'Hayır'}
                                            </button>

                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeletePlan(plan.id)}
                                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Planı Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        Üyelik planı bulunamadı. Lütfen "Plan Oluştur" butonunu kullanın.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={handleAddPlan}
                        className="flex items-center gap-2 px-8 py-3 bg-orange-50 text-orange-600 rounded-2xl font-bold hover:bg-orange-100 transition-all text-sm"
                    >
                        <Plus size={16} /> Plan Oluştur
                    </button>
                </div>
                {hasEditPermission && (
                    <button
                        onClick={handleSavePlans}
                        disabled={saving || membershipPlans.length === 0}
                        className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white text-sm rounded-2xl font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Planları Kaydet
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlanManager;
