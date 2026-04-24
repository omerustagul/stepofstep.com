import { useState } from 'react';
import { usePortfolio, type PortfolioItem } from '../../context/PortfolioContext';
import { Plus, Edit2, Trash2, X, Save, Check, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import ImageUploader from '../../components/common/ImageUploader';
import { useAuth } from '../../context/AuthContext';
import { useRoles } from '../../context/RoleContext';
import { Link, Navigate } from 'react-router-dom';
import { useLoading } from '../../context/LoadingContext';
import { motion, AnimatePresence } from 'framer-motion';

const SERVICE_OPTIONS = [
    'Branding',
    'Yazılım Geliştirme',
    'Dijital Pazarlama',
    'UI/UX Tasarım',
    'Sosyal Medya',
    'SEO',
    'İçerik Üretimi',
    'Mobil Uygulama',
    'E-Ticaret',
    'Danışmanlık'
];

const PortfolioManager = () => {
    const { items, addItem, updateItem, deleteItem } = usePortfolio();
    const { user } = useAuth();
    const { canView, canEdit } = useRoles();
    const { showLoading, hideLoading } = useLoading();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState<Omit<PortfolioItem, 'id'>>({
        name: '',
        description: '',
        category: [],
        image: '',
        title: '',
        serviceType: [],
        imageUrl: '',
        logoUrl: '',
        slug: '',
        clientName: '',
        challenge: '',
        solution: '',
        results: [],
        galleryImages: [],
        latitude: undefined,
        longitude: undefined
    });

    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

    const [resultsText, setResultsText] = useState('');

    const hasViewPermission = user?.role_id ? canView(user.role_id, 'portfolios') : user?.role === 'admin' || user?.role === 'marketing';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'portfolios') : user?.role === 'admin' || user?.role === 'marketing';

    if (!hasViewPermission) {
        return <Navigate to="/admin" replace />;
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: [],
            image: '',
            title: '',
            serviceType: [],
            imageUrl: '',
            logoUrl: '',
            slug: '',
            clientName: '',
            challenge: '',
            solution: '',
            results: [],
            galleryImages: [],
            latitude: undefined,
            longitude: undefined
        });
        setResultsText('');
        setEditingItem(null);
        setStatusMessage(null);
        setIsSubmitting(false);
    };

    const handleOpenModal = (item?: PortfolioItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name || item.title || '',
                description: item.description || '',
                category: Array.isArray(item.category) ? item.category : (item.category ? [item.category] : []),
                image: item.image || item.imageUrl || '',
                title: item.title || item.name || '',
                serviceType: Array.isArray(item.serviceType) ? item.serviceType : (item.serviceType ? [item.serviceType] : []),
                imageUrl: item.imageUrl || item.image || '',
                logoUrl: item.logoUrl || '',
                slug: item.slug || '',
                clientName: item.clientName || '',
                challenge: item.challenge || '',
                solution: item.solution || '',
                results: item.results || [],
                galleryImages: item.galleryImages || [],
                latitude: item.latitude,
                longitude: item.longitude
            });
            setResultsText(item.results ? item.results.join('\n') : '');
        } else {
            resetForm();
        }
        setStatusMessage(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage(null);
        showLoading('Kaydediliyor...');

        // Process results text to array
        const processedResults = resultsText.split('\n').filter(line => line.trim() !== '');

        const finalData = {
            ...formData,
            name: formData.name || formData.title || '',
            title: formData.title || formData.name || '',
            category: formData.category && formData.category.length > 0 ? formData.category : formData.serviceType,
            serviceType: formData.serviceType && formData.serviceType.length > 0 ? formData.serviceType : formData.category,
            image: formData.image || formData.imageUrl || '',
            imageUrl: formData.imageUrl || formData.image || '',
            results: processedResults
        };

        // Auto-generate slug if empty
        if (!finalData.slug) {
            finalData.slug = (finalData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }

        try {
            if (editingItem) {
                await updateItem(editingItem.id, finalData);
            } else {
                await addItem(finalData);
            }
            setStatusMessage({ type: 'success', text: editingItem ? 'Başarıyla güncellendi.' : 'Yeni öğe eklendi.' });
            setTimeout(() => {
                setIsModalOpen(false);
                resetForm();
            }, 1000);
        } catch (error: any) {
            console.error('Portfolio kaydetme hatası:', error);
            setStatusMessage({
                type: 'error',
                text: `Hata: ${error.message || 'Beklenmedik bir hata oluştu.'}`
            });
        } finally {
            setIsSubmitting(false);
            hideLoading();
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu portfolyo öğesini silmek istediğinizden emin misiniz?')) {
            showLoading('Siliniyor...');
            try {
                await deleteItem(id);
            } catch (error) {
                console.error('Silme hatası:', error);
            } finally {
                hideLoading();
            }
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Portfolyolar</h1>
                    <p className="text-zinc-500">Projelerinizi ve çalışmalarınızı yönetin.</p>
                </div>
                {hasEditPermission && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Yeni Ekle</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200 group">
                        <div className="h-48 overflow-hidden relative">
                            <img src={item.imageUrl || item.image || 'https://via.placeholder.com/800x600?text=No+Image'} alt={item.title || item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Link
                                    to={`/portfolio/${item.slug || item.id}`}
                                    target="_blank"
                                    className="p-2 bg-white rounded-full text-zinc-900 hover:scale-110 transition-transform"
                                    title="View Page"
                                >
                                    <ExternalLink size={20} />
                                </Link>
                            </div>
                            {item.logoUrl && (
                                <div className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm">
                                    <img src={item.logoUrl} alt="logo" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            <div className="flex flex-wrap gap-1 mb-3">
                                {((Array.isArray(item.serviceType) ? item.serviceType : (item.serviceType ? [item.serviceType] : (item.category ? [item.category] : []))) as string[]).map((cat, i) => (
                                    <span key={i} className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 mt-3 mb-1">{item.title || item.name}</h3>
                            <p className="text-zinc-500 text-sm line-clamp-2">{item.description}</p>

                            <div className="flex items-center justify-end gap-2 mt-6 pt-2 border-t border-zinc-100">
                                {hasEditPermission ? (
                                    <>
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="p-2 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Görüntüle"
                                    >
                                        <Eye size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 my-8">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-2 text-zinc-900">
                            {editingItem ? (hasEditPermission ? 'Portfolyoyu Düzenle' : 'Portfolyo Detayı') : 'Yeni Portfolyo Ekle'}
                        </h2>

                        {statusMessage && (
                            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {statusMessage.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                                <p className="text-sm font-medium">{statusMessage.text}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-zinc-700 block mb-1">Proje Başlığı</label>
                                    <input
                                        type="text"
                                        value={formData.title || formData.name || ''}
                                        disabled={!hasEditPermission}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <label className="text-sm font-medium text-zinc-700 block mb-1">Hizmet Türleri</label>
                                    <div 
                                        className={`w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 cursor-pointer flex flex-wrap gap-2 min-h-[50px] items-center ${!hasEditPermission ? 'opacity-60 cursor-not-allowed' : 'hover:border-orange-500'}`}
                                        onClick={() => hasEditPermission && setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                                    >
                                        {formData.serviceType && formData.serviceType.length > 0 ? (
                                            formData.serviceType.map((service) => (
                                                <span key={service} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                    {service}
                                                    {hasEditPermission && (
                                                        <X 
                                                            size={12} 
                                                            className="hover:text-orange-900 cursor-pointer" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newServices = formData.serviceType.filter(s => s !== service);
                                                                setFormData({ ...formData, serviceType: newServices, category: newServices });
                                                            }}
                                                        />
                                                    )}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-zinc-400 text-sm">Hizmet seçin...</span>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {isServiceDropdownOpen && hasEditPermission && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-10" 
                                                    onClick={() => setIsServiceDropdownOpen(false)} 
                                                />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute z-20 left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 max-h-60 overflow-y-auto"
                                                >
                                                    {SERVICE_OPTIONS.map((option) => {
                                                        const isSelected = formData.serviceType.includes(option);
                                                        return (
                                                            <div
                                                                key={option}
                                                                onClick={() => {
                                                                    let newServices;
                                                                    if (isSelected) {
                                                                        newServices = formData.serviceType.filter(s => s !== option);
                                                                    } else {
                                                                        newServices = [...formData.serviceType, option];
                                                                    }
                                                                    setFormData({ ...formData, serviceType: newServices, category: newServices });
                                                                }}
                                                                className={`flex items-center justify-between px-4 py-2 rounded-xl cursor-pointer transition-colors ${
                                                                    isSelected ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-zinc-700'
                                                                }`}
                                                            >
                                                                <span className="text-sm font-medium">{option}</span>
                                                                {isSelected && <Check size={16} />}
                                                            </div>
                                                        );
                                                    })}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-zinc-700 block mb-1">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={formData.slug || ''}
                                    disabled={!hasEditPermission}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="proje-url-slug"
                                    className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-zinc-700 block mb-1">Müşteri Adı</label>
                                <input
                                    type="text"
                                    value={formData.clientName || ''}
                                    disabled={!hasEditPermission}
                                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                    className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-zinc-700 block mb-1">Enlem (Latitude)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude || ''}
                                        disabled={!hasEditPermission}
                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                        placeholder="41.0082"
                                        className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-700 block mb-1">Boylam (Longitude)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude || ''}
                                        disabled={!hasEditPermission}
                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                        placeholder="28.9784"
                                        className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-zinc-700 block mb-1">Kısa Açıklama</label>
                                <textarea
                                    value={formData.description || ''}
                                    disabled={!hasEditPermission}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 h-20 resize-none disabled:opacity-60"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-zinc-700 block mb-1">Zorluk (Challenge)</label>
                                    <textarea
                                        value={formData.challenge || ''}
                                        disabled={!hasEditPermission}
                                        onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                                        className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 h-24 resize-none disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-700 block mb-1">Çözüm (Solution)</label>
                                    <textarea
                                        value={formData.solution || ''}
                                        disabled={!hasEditPermission}
                                        onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                                        className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 h-24 resize-none disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-zinc-700 block mb-1">Sonuçlar (Her satıra bir tane)</label>
                                <textarea
                                    value={resultsText}
                                    disabled={!hasEditPermission}
                                    onChange={(e) => setResultsText(e.target.value)}
                                    placeholder="Trafikte %20 Artış&#10;5 Yıldızlı Değerlendirme"
                                    className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 h-24 resize-none disabled:opacity-60"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ImageUploader
                                    label="Kapak Görseli"
                                    value={formData.imageUrl || formData.image || ''}
                                    disabled={!hasEditPermission}
                                    onChange={(base64) => setFormData({ ...formData, imageUrl: base64, image: base64 })}
                                />
                                <ImageUploader
                                    label="Müşteri Logosu (Opsiyonel)"
                                    value={formData.logoUrl || ''}
                                    disabled={!hasEditPermission}
                                    onChange={(base64) => setFormData({ ...formData, logoUrl: base64 })}
                                />
                            </div>

                            {/* Gallery Images */}
                            <div className="border-t border-zinc-200 pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-zinc-700">Proje Galerisi</label>
                                    <span className="text-xs text-zinc-400">{formData.galleryImages?.length || 0} görsel</span>
                                </div>

                                {/* Existing Gallery Images */}
                                {formData.galleryImages && formData.galleryImages.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {formData.galleryImages.map((img, idx) => (
                                            <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden bg-zinc-100">
                                                <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                                {hasEditPermission && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newGallery = [...(formData.galleryImages || [])];
                                                            newGallery.splice(idx, 1);
                                                            setFormData({ ...formData, galleryImages: newGallery });
                                                        }}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add New Gallery Image */}
                                {hasEditPermission && (
                                    <ImageUploader
                                        label="Yeni Galeri Görseli Ekle"
                                        value=""
                                        onChange={(base64) => {
                                            if (base64) {
                                                setFormData({
                                                    ...formData,
                                                    galleryImages: [...(formData.galleryImages || []), base64]
                                                });
                                            }
                                        }}
                                    />
                                )}
                                {hasEditPermission && (
                                    <p className="text-xs text-zinc-400 mt-1">Birden fazla görsel eklemek için her seferinde bir görsel seçin</p>
                                )}
                            </div>

                            {hasEditPermission && (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full ${isSubmitting ? 'bg-zinc-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'} text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 sticky bottom-0 z-10`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Kaydediliyor...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>{editingItem ? 'Güncelle' : 'Oluştur'}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioManager;
