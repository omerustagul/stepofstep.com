import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Eye, TrendingUp, Clock, Smartphone, Users, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoles } from '../../context/RoleContext';
import { Navigate } from 'react-router-dom';

interface Member {
    id: string;
    name: string;
    email: string;
    plan: string;
    screenTime: string;
    lastActive: string;
    topApp: string;
    joinedDate: string;
}

const MemberManager = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const { user } = useAuth();
    const { canView, canEdit } = useRoles();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const { showLoading, hideLoading } = useLoading();

    const hasViewPermission = user?.role_id ? canView(user.role_id, 'members') : user?.role === 'admin';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'members') : user?.role === 'admin';

    if (!hasViewPermission) {
        return <Navigate to="/admin" replace />;
    }

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedMembers: Member[] = (data || []).map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                plan: u.plan || 'free',
                screenTime: getRandomScreenTime(), // Placeholder as we don't track this in DB yet
                lastActive: u.updated_at ? new Date(u.updated_at).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                topApp: getTopApp(), // Placeholder
                joinedDate: u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-'
            }));

            setMembers(mappedMembers);
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Helpers for simulated data (to be replaced with real tracking later if needed)
    const getRandomScreenTime = () => {
        const hours = Math.floor(Math.random() * 5);
        const minutes = Math.floor(Math.random() * 60);
        return `${hours}s ${minutes}d`;
    };

    const getTopApp = () => {
        const apps = ['Brand Architect', 'The Foundry', 'Social Mind', 'Logo Tasarımcısı', 'Ürün Oluşturucu'];
        return apps[Math.floor(Math.random() * apps.length)];
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu üyeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

        showLoading('Üye siliniyor...');
        try {
            const { error } = await supabase
                .from('app_users')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMembers(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Üye silinirken bir hata oluştu.');
        } finally {
            hideLoading();
        }
    };

    // Helper for display badges - static heuristics for now since we don't fetch plans table here anymore
    //Ideally we could fetch plans to get colors, but keeping it simple for now as per legacy view
    const getPlanBadge = (planId: string) => {
        const id = planId?.toLowerCase() || 'free';
        if (id.includes('pro')) return { name: 'Pro', color: 'bg-orange-100 text-orange-600' };
        if (id.includes('advanced')) return { name: 'Advanced', color: 'bg-purple-100 text-purple-600' };
        if (id.includes('business') || id.includes('kurumsal')) return { name: 'Business', color: 'bg-blue-100 text-blue-600' };
        return { name: 'Free', color: 'bg-zinc-100 text-zinc-600' };
    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // İstatistikler
    const totalMembers = members.length;

    const proMembers = members.filter(m => m.plan?.toLowerCase().includes('pro')).length;
    const advancedMembers = members.filter(m => m.plan?.toLowerCase().includes('advanced')).length;
    const businessMembers = members.filter(m => m.plan?.toLowerCase().includes('business')).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Üye Yönetimi</h1>
                    <p className="text-zinc-500">Kayıtlı üyeleri ve analitikleri yönetin.</p>
                </div>
                <button
                    onClick={() => fetchMembers()}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? 'Yükleniyor...' : 'Yenile'}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-zinc-900">{totalMembers}</p>
                        <p className="text-sm text-zinc-500">Toplam Üye</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-zinc-900">{proMembers}</p>
                        <p className="text-sm text-zinc-500">Pro</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-zinc-900">{advancedMembers}</p>
                        <p className="text-sm text-zinc-500">Advanced</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-zinc-900">{businessMembers}</p>
                        <p className="text-sm text-zinc-500">Business</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                    type="text"
                    placeholder="Üye ara..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                {filteredMembers.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users size={48} className="mx-auto text-zinc-300 mb-4" />
                        <p className="text-zinc-500">Henüz kayıtlı üye bulunmuyor.</p>
                        <p className="text-sm text-zinc-400 mt-2">Kullanıcılar kayıt oldukça burada görünecek.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Üye</th>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Paket</th>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">
                                    <span className="flex items-center gap-1"><Clock size={14} /> Ekran Süresi</span>
                                </th>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Son Görülme</th>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">
                                    <span className="flex items-center gap-1"><Smartphone size={14} /> En Çok Kullanılan</span>
                                </th>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Kayıt Tarihi</th>
                                <th className="text-right py-4 px-6 font-medium text-zinc-500 text-sm">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredMembers.map((member) => {
                                const planBadge = getPlanBadge(member.plan);
                                return (
                                    <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-900">{member.name}</p>
                                                    <p className="text-xs text-zinc-500">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${planBadge.color}`}>
                                                {planBadge.name}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-zinc-600">{member.screenTime}</td>
                                        <td className="py-4 px-6 text-zinc-600">{member.lastActive}</td>
                                        <td className="py-4 px-6">
                                            <span className="text-zinc-600 bg-zinc-100 px-2 py-1 rounded-lg text-sm">
                                                {member.topApp}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-zinc-500 text-sm">{member.joinedDate}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedMember(member)}
                                                    className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Detayları Görüntüle"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {hasEditPermission && (
                                                    <button
                                                        onClick={() => handleDelete(member.id)}
                                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Üyeyi Sil"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Member Detail Modal */}
            <AnimatePresence>
                {selectedMember && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setSelectedMember(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                                    {selectedMember.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900">{selectedMember.name}</h3>
                                <p className="text-zinc-500">{selectedMember.email}</p>
                                {(() => {
                                    const badge = getPlanBadge(selectedMember.plan);
                                    return (
                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                                            {badge.name}
                                        </span>
                                    );
                                })()}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-zinc-50 rounded-xl">
                                    <span className="text-zinc-500">Ekran Süresi</span>
                                    <span className="font-medium text-zinc-900">{selectedMember.screenTime}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-zinc-50 rounded-xl">
                                    <span className="text-zinc-500">Son Görülme</span>
                                    <span className="font-medium text-zinc-900">{selectedMember.lastActive}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-zinc-50 rounded-xl">
                                    <span className="text-zinc-500">En Çok Kullanılan</span>
                                    <span className="font-medium text-zinc-900">{selectedMember.topApp}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-zinc-50 rounded-xl">
                                    <span className="text-zinc-500">Kayıt Tarihi</span>
                                    <span className="font-medium text-zinc-900">{selectedMember.joinedDate}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedMember(null)}
                                className="w-full mt-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                            >
                                Kapat
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MemberManager;
