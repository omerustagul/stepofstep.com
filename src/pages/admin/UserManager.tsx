import { useState } from 'react';
import { Plus, Trash2, Mail, Phone, Calendar, Shield, Edit2, X, Check, Users, Key, AlertCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoles, ADMIN_SCREENS, type ScreenId, type PermissionLevel, type Role, type TeamMember } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { useToast } from '../../context/ToastContext';

const UserManager = () => {
    const { user } = useAuth();
    const {
        roles, teamMembers, createRole, updateRole, deleteRole,
        createTeamMember, updateTeamMember, deleteTeamMember,
        getRoleById, canView, canEdit
    } = useRoles();
    const { showLoading, hideLoading } = useLoading();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

    // Form states
    const [memberForm, setMemberForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        start_date: '',
        end_date: '',
        position: '',
        role_id: ''
    });

    const [roleForm, setRoleForm] = useState({
        name: '',
        permissions: {} as Record<ScreenId, PermissionLevel>
    });

    const hasViewPermission = user?.role_id ? canView(user.role_id, 'users') : user?.role === 'admin';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'users') : user?.role === 'admin';

    if (!hasViewPermission) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">Erişim Reddedildi</h2>
                    <p className="text-zinc-500">Ekip yönetimi için yetkiniz bulunmamaktadır.</p>
                </div>
            </div>
        );
    }

    const resetMemberForm = () => {
        setMemberForm({ name: '', email: '', phone: '', address: '', start_date: '', end_date: '', position: '', role_id: '' });
        setEditingMember(null);
        setShowMemberForm(false);
    };

    const resetRoleForm = () => {
        const defaultPerms: Record<ScreenId, PermissionLevel> = {} as any;
        ADMIN_SCREENS.forEach(s => { defaultPerms[s.id] = 'none'; });
        setRoleForm({ name: '', permissions: defaultPerms });
        setEditingRole(null);
        setShowRoleForm(false);
    };

    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!memberForm.role_id) {
            toast.error('Lütfen bir rol seçin! Rol seçimi zorunludur.');
            return;
        }

        showLoading(editingMember ? 'Kullanıcı güncelleniyor...' : 'Kullanıcı oluşturuluyor...');

        const sanitizedData = {
            ...memberForm,
            start_date: memberForm.start_date || undefined,
            end_date: memberForm.end_date || undefined,
            address: memberForm.address || undefined,
            position: memberForm.position || undefined,
            phone: memberForm.phone || ''
        };

        try {
            if (editingMember) {
                await updateTeamMember(editingMember.id, sanitizedData);
                resetMemberForm();
            } else {
                const { error } = await createTeamMember(sanitizedData);
                if (error) {
                    toast.error(error);
                } else {
                    toast.success('Ekip üyesi başarıyla oluşturuldu.');
                    resetMemberForm();
                }
            }
        } catch (error) {
            console.error('Üye kaydetme hatası:', error);
        } finally {
            hideLoading();
        }
    };

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roleForm.name.trim()) {
            toast.error('Rol adı zorunludur.');
            return;
        }

        showLoading(editingRole ? 'Rol güncelleniyor...' : 'Rol oluşturuluyor...');

        try {
            if (editingRole) {
                await updateRole(editingRole.id, roleForm.name, roleForm.permissions);
            } else {
                await createRole(roleForm.name, roleForm.permissions);
            }
            resetRoleForm();
        } catch (error) {
            console.error('Rol kaydetme hatası:', error);
        } finally {
            hideLoading();
        }
    };

    const handleEditMember = (member: TeamMember) => {
        setMemberForm({
            name: member.name,
            email: member.email,
            phone: member.phone,
            address: member.address || '',
            start_date: member.start_date || '',
            end_date: member.end_date || '',
            position: member.position || '',
            role_id: member.role_id
        });
        setEditingMember(member);
        setShowMemberForm(true);
    };

    const handleEditRole = (role: Role) => {
        setRoleForm({
            name: role.name,
            permissions: { ...role.permissions }
        });
        setEditingRole(role);
        setShowRoleForm(true);
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
        showLoading('Kullanıcı siliniyor...');
        await new Promise(r => setTimeout(r, 500));
        deleteTeamMember(id);
        hideLoading();
    };

    const handleDeleteRole = async (id: string) => {
        showLoading('Rol siliniyor...');
        await new Promise(r => setTimeout(r, 500));
        deleteRole(id);
        hideLoading();
    };

    const permissionLabels: Record<PermissionLevel, string> = {
        none: 'Göremez',
        view: 'Görüntüleyebilir',
        edit: 'Düzenleyebilir'
    };

    const permissionColors: Record<PermissionLevel, string> = {
        none: 'bg-zinc-100 text-zinc-500',
        view: 'bg-blue-100 text-blue-600',
        edit: 'bg-green-100 text-green-600'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Ekip Yönetimi</h1>
                    <p className="text-zinc-500">Ekip üyelerini ve rollerini yönetin.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'members' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                >
                    <Users size={18} className="inline mr-2" />
                    Üyeler ({teamMembers.length})
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'roles' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                >
                    <Key size={18} className="inline mr-2" />
                    Roller ({roles.length})
                </button>
            </div>

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="space-y-4">
                    {hasEditPermission && (
                        <button
                            onClick={() => { resetMemberForm(); setShowMemberForm(true); }}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                        >
                            <Plus size={16} />
                            Yeni Üye Ekle
                        </button>
                    )}

                    {/* Member Form Modal */}
                    <AnimatePresence>
                        {showMemberForm && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-auto"
                                onClick={() => resetMemberForm()}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl my-8"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-zinc-900">
                                            {editingMember ? 'Üyeyi Düzenle' : 'Yeni Üye Ekle'}
                                        </h3>
                                        <button onClick={() => resetMemberForm()} className="p-2 hover:bg-zinc-100 rounded-full">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleMemberSubmit} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">Ad Soyad *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={memberForm.name}
                                                    onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                                                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                                                    placeholder="Adınız Soyadınız"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">E-posta *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={memberForm.email}
                                                    onChange={e => setMemberForm({ ...memberForm, email: e.target.value.toLowerCase() })}
                                                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                                                    placeholder="mailadresiniz@mail.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">Telefon *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={memberForm.phone}
                                                    onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                                                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                                                    placeholder="+90 555 123 4567"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">Görevi</label>
                                                <input
                                                    type="text"
                                                    value={memberForm.position}
                                                    onChange={e => setMemberForm({ ...memberForm, position: e.target.value })}
                                                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                                                    placeholder="Frontend Developer"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">Adres</label>
                                            <input
                                                type="text"
                                                value={memberForm.address}
                                                onChange={e => setMemberForm({ ...memberForm, address: e.target.value })}
                                                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                                                placeholder="İstanbul, Türkiye"
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">İşe Başlama Tarihi</label>
                                                <input
                                                    type="date"
                                                    value={memberForm.start_date}
                                                    onChange={e => setMemberForm({ ...memberForm, start_date: e.target.value })}
                                                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">Ayrılma Tarihi</label>
                                                <input
                                                    type="date"
                                                    value={memberForm.end_date}
                                                    onChange={e => setMemberForm({ ...memberForm, end_date: e.target.value })}
                                                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Info Box */}
                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                            <AlertCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-blue-800">Şifre Belirleme Hakkında</p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Güvenlik için şifreleri buradan belirlemiyoruz. Bu kişiyi ekledikten sonra, kendisi bu e-posta adresiyle
                                                    siteye kayıt olduğunda sistem otomatik olarak onu tanıyacak ve belirlediğiniz yetkileri verecektir.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Role Selection */}
                                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                            <label className="block text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                                                <Shield size={16} />
                                                Rol Seçimi * (Zorunlu)
                                            </label>
                                            <select
                                                required
                                                value={memberForm.role_id}
                                                onChange={e => setMemberForm({ ...memberForm, role_id: e.target.value })}
                                                className="w-full border border-orange-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 bg-white"
                                            >
                                                <option value="">-- Rol Seçin --</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                            {!memberForm.role_id && (
                                                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    Rol seçmeden kullanıcı oluşturamazsınız
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button type="button" onClick={() => resetMemberForm()} className="flex-1 py-3 rounded-xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200">
                                                İptal
                                            </button>
                                            <button type="submit" className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 flex items-center justify-center gap-2">
                                                <Check size={18} />
                                                {editingMember ? 'Güncelle' : 'Oluştur'}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Members Table */}
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                        {teamMembers.length === 0 ? (
                            <div className="p-12 text-center">
                                <Users size={48} className="mx-auto text-zinc-300 mb-4" />
                                <p className="text-zinc-500">Henüz ekip üyesi bulunmuyor.</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Üye</th>
                                        <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">İletişim</th>
                                        <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Rol</th>
                                        <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Görevi</th>
                                        <th className="text-right py-4 px-6 font-medium text-zinc-500 text-sm">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {teamMembers.map(member => {
                                        const role = getRoleById(member.role_id);
                                        return (
                                            <tr key={member.id} className="hover:bg-zinc-50/50">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-zinc-900">{member.name}</p>
                                                            {member.start_date && (
                                                                <p className="text-xs text-zinc-400">
                                                                    <Calendar size={10} className="inline mr-1" />
                                                                    {new Date(member.start_date).toLocaleDateString('tr-TR')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="space-y-1 text-sm">
                                                        <p className="flex items-center gap-1 text-zinc-600">
                                                            <Mail size={12} /> {member.email}
                                                        </p>
                                                        <p className="flex items-center gap-1 text-zinc-400">
                                                            <Phone size={12} /> {member.phone}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                                                        {role?.name || 'Bilinmiyor'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-zinc-600">{member.position || '-'}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {hasEditPermission ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditMember(member)}
                                                                    className="p-2 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                    title="Düzenle"
                                                                >
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMember(member.id)}
                                                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Sil"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleEditMember(member)}
                                                                className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Görüntüle"
                                                            >
                                                                <Eye size={18} />
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
                </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
                <div className="space-y-4">
                    {hasEditPermission && (
                        <button
                            onClick={() => { resetRoleForm(); setShowRoleForm(true); }}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                        >
                            <Plus size={16} />
                            Yeni Rol Oluştur
                        </button>
                    )}

                    {/* Role Form Modal */}
                    <AnimatePresence>
                        {showRoleForm && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-auto"
                                onClick={() => resetRoleForm()}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl my-8"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-zinc-900">
                                            {editingRole ? 'Rolü Düzenle' : 'Yeni Rol Oluştur'}
                                        </h3>
                                        <button onClick={() => resetRoleForm()} className="p-2 hover:bg-zinc-100 rounded-full">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleRoleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">Rol Adı *</label>
                                            <input
                                                type="text"
                                                required
                                                value={roleForm.name}
                                                onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                                                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                                                placeholder="Örn: Pazarlama Uzmanı"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Ekran Yetkileri</label>
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {ADMIN_SCREENS.map(screen => (
                                                    <div key={screen.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                                                        <span className="font-medium text-zinc-700">{screen.name}</span>
                                                        {screen.alwaysVisible ? (
                                                            <span className="text-xs text-zinc-400">Her zaman görünür</span>
                                                        ) : (
                                                            <select
                                                                value={roleForm.permissions[screen.id] || 'none'}
                                                                onChange={e => setRoleForm({
                                                                    ...roleForm,
                                                                    permissions: { ...roleForm.permissions, [screen.id]: e.target.value as PermissionLevel }
                                                                })}
                                                                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                                                            >
                                                                <option value="none">Göremez</option>
                                                                <option value="view">Görüntüleyebilir</option>
                                                                <option value="edit">Düzenleyebilir</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button type="button" onClick={() => resetRoleForm()} className="flex-1 py-3 rounded-xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200">
                                                İptal
                                            </button>
                                            <button type="submit" className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 flex items-center justify-center gap-2">
                                                <Check size={18} />
                                                {editingRole ? 'Güncelle' : 'Oluştur'}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Roles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.map((role) => (
                            <div key={role.id} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Shield size={24} />
                                        </div>
                                        <h3 className="font-bold text-zinc-900">{role.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {hasEditPermission && (
                                            <>
                                                <button
                                                    onClick={() => handleEditRole(role)}
                                                    className="p-2 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                        {!hasEditPermission && (
                                            <button
                                                onClick={() => handleEditRole(role)}
                                                className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    {ADMIN_SCREENS.filter(s => !s.alwaysVisible).map(screen => (
                                        <div key={screen.id} className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-600">{screen.name}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${permissionColors[role.permissions[screen.id] || 'none']}`}>
                                                {permissionLabels[role.permissions[screen.id] || 'none']}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
