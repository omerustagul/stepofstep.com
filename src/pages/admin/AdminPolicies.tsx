import { useState } from 'react';
import { useSiteSettings, type Policy } from '../../context/SiteContext';
import { Plus, Trash2, Save, X, FileText, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoles } from '../../context/RoleContext';
import { Navigate } from 'react-router-dom';

const AdminPolicies = () => {
    const { settings, updateSettings } = useSiteSettings();
    const { user } = useAuth();
    const { canView, canEdit } = useRoles();
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Separate loading states
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasViewPermission = user?.role_id ? canView(user.role_id, 'policies') : user?.role === 'admin';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'policies') : user?.role === 'admin';

    if (!hasViewPermission) {
        return <Navigate to="/admin" replace />;
    }

    // Form State
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');

    const resetForm = () => {
        setTitle('');
        setSlug('');
        setContent('');
        setEditingPolicy(null);
        setIsCreating(false);
    };

    const handleEdit = (policy: Policy) => {
        setEditingPolicy(policy);
        setTitle(policy.title);
        setSlug(policy.slug);
        setContent(policy.content);
        setIsCreating(false);
    };

    const handleCreate = () => {
        setIsCreating(true);
        setEditingPolicy(null);
        setTitle('');
        setSlug('');
        setContent('');
    };

    const handleSave = async () => {
        setIsSaving(true);
        // UX için kısa bir bekleme süresi (Optimistic UI)
        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const newPolicy: Policy = {
                id: editingPolicy ? editingPolicy.id : Date.now().toString(),
                title,
                slug: slug.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
                content
            };

            let updatedPolicies = [...settings.policies];

            if (editingPolicy) {
                updatedPolicies = updatedPolicies.map(p => p.id === editingPolicy.id ? newPolicy : p);
            } else {
                updatedPolicies.push(newPolicy);
            }

            // Arka planda kaydet (Beklemeden devam et)
            updateSettings({ policies: updatedPolicies });
            resetForm();
        } catch (error) {
            console.error('Save failed:', error);
            alert('Kaydetme başarısız oldu.');
        } finally {
            setIsSaving(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; policyId: string | null }>({ isOpen: false, policyId: null });

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, policyId: id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.policyId) return;

        const id = deleteConfirmation.policyId;
        setIsDeleting(true);
        // UX için kısa bir bekleme süresi (Optimistic UI)
        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const updatedPolicies = settings.policies.filter(p => p.id !== id);
            // Arka planda kaydet (Beklemeden devam et)
            updateSettings({ policies: updatedPolicies });

            if (editingPolicy?.id === id) resetForm();
            setDeleteConfirmation({ isOpen: false, policyId: null });
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Silme başarısız oldu.');
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, policyId: null });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900">Yasal Politikalar</h1>
                    <p className="text-zinc-500">Sitenizin yasal metinlerini yönetin.</p>
                </div>
                {!isCreating && !editingPolicy && hasEditPermission && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                        <Plus size={18} /> Yeni Politika Oluştur
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Policy List */}
                <div className="lg:col-span-1 space-y-4">
                    {settings.policies.filter(p => p.slug !== 'google-scripts').map(policy => (
                        <div
                            key={policy.id}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${editingPolicy?.id === policy.id ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-500/20' : 'bg-white border-zinc-200 hover:border-orange-300'}`}
                            onClick={() => handleEdit(policy)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-zinc-900">{policy.title}</h3>
                                {hasEditPermission ? <FileText size={16} className="text-zinc-400" /> : <Eye size={16} className="text-zinc-400" />}
                            </div>
                            <p className="text-xs text-zinc-500 font-mono">/legal/{policy.slug}</p>
                        </div>
                    ))}

                    {settings.policies.length === 0 && (
                        <div className="text-center py-8 text-zinc-400 bg-white rounded-2xl border border-dashed border-zinc-300">
                            Henüz politika bulunmuyor.
                        </div>
                    )}
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-2">
                    {(isCreating || editingPolicy) ? (
                        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">{isCreating ? 'Yeni Politika' : 'Politikayı Düzenle'}</h2>
                                <button onClick={resetForm} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Başlık</label>
                                    <input
                                        type="text"
                                        value={title}
                                        disabled={!hasEditPermission}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-60"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">URL (Slug)</label>
                                    <input
                                        type="text"
                                        value={slug}
                                        disabled={!hasEditPermission}
                                        onChange={(e) => setSlug(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono text-sm disabled:opacity-60"
                                        placeholder="ornek: gizlilik-politikasi"
                                    />
                                    <p className="text-xs text-zinc-400 mt-1">Erişim adresi: /legal/{slug || '...'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">İçerik (Markdown)</label>
                                    <textarea
                                        value={content}
                                        disabled={!hasEditPermission}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={15}
                                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono text-sm disabled:opacity-60"
                                        placeholder="Politika içeriğini buraya girin..."
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
                                    {hasEditPermission && (
                                        <button
                                            onClick={handleSave}
                                            disabled={!title || !slug || !content || isSaving}
                                            className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                        </button>
                                    )}

                                    {!isCreating && editingPolicy && hasEditPermission && (
                                        <button
                                            onClick={() => handleDeleteClick(editingPolicy.id)}
                                            disabled={isSaving || isDeleting}
                                            className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors ml-auto font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={18} />
                                            Sil
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 min-h-[400px]">
                            <FileText size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Düzenlemek için bir politika seçin</p>
                            <p className="text-sm">veya yeni bir tane oluşturun</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 text-red-500 rounded-full mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-zinc-900">Politikayı Sil</h3>
                            <p className="text-zinc-500">Bu politikayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={cancelDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-zinc-100 text-zinc-700 font-medium rounded-xl hover:bg-zinc-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Evet, Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPolicies;
