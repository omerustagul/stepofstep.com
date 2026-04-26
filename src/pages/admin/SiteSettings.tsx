import { useState, useEffect } from 'react';
import { useSiteSettings } from '../../context/SiteContext';
import { Save, Globe, FileText, ChevronDown, Mail, BarChart3 } from 'lucide-react';
import ImageUploader from '../../components/common/ImageUploader';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { useRoles } from '../../context/RoleContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface PageSEO {
    path: string;
    name: string;
    title: string;
    description: string;
}

const SMTPSettings = ({ hasEditPermission }: { hasEditPermission: boolean }) => {
    const [smtp, setSmtp] = useState({
        host: '',
        port: 587,
        username: '',
        password: '',
        from_name: 'Step of Step',
        from_email: '',
        secure: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testTarget, setTestTarget] = useState('');
    const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetchSMTP();
    }, []);

    const fetchSMTP = async () => {
        try {
            const { data, error } = await supabase
                .from('smtp_settings')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) {
                setSmtp({
                    host: data.host || '',
                    port: data.port || 587,
                    username: data.username || '',
                    password: data.password || '',
                    from_name: data.from_name || 'Step of Step',
                    from_email: data.from_email || '',
                    secure: data.secure ?? true,
                });
                setTestTarget(data.from_email || '');
            }
        } catch (error) {
            console.error('SMTP fetch error:', error);
        }
    };

    const handleSave = async () => {
        if (!hasEditPermission) return;
        setIsSaving(true);
        setSaveResult(null);
        try {
            const { error } = await supabase
                .from('smtp_settings')
                .upsert({
                    host: smtp.host,
                    port: smtp.port,
                    username: smtp.username,
                    password: smtp.password,
                    from_name: smtp.from_name,
                    from_email: smtp.from_email,
                    secure: smtp.secure,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            setSaveResult({ type: 'success', message: '✓ SMTP ayarları kaydedildi.' });
        } catch (error: any) {
            console.error('SMTP save error:', error);
            setSaveResult({ type: 'error', message: '✗ Kaydetme hatası: ' + (error.message || 'Bilinmeyen hata') });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveResult(null), 4000);
        }
    };

    const handleTest = async () => {
        if (!testTarget) return;
        setIsTesting(true);
        setTestResult(null);

        try {
            // Önce kaydet, sonra test et
            await supabase.from('smtp_settings').upsert({
                host: smtp.host, port: smtp.port, username: smtp.username,
                password: smtp.password, from_name: smtp.from_name,
                from_email: smtp.from_email, secure: smtp.secure,
                updated_at: new Date().toISOString(),
            });

            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    to: testTarget,
                    subject: '✅ SMTP Test Maili — Step of Step',
                    html: `
                        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;">
                            <h2 style="color:#f97316;">🎉 SMTP Bağlantısı Başarılı!</h2>
                            <p>Bu mail, <strong>${smtp.from_name}</strong> adından gönderildi.</p>
                            <p>SMTP sunucunuz doğru yapılandırılmış ve tüm uygulama e-postalarınız bu hesaptan gidecek.</p>
                            <hr style="margin:24px 0;border:none;border-top:1px solid #e4e4e7;" />
                            <p style="color:#71717a;font-size:12px;">Step of Step Admin Panel — SMTP Test</p>
                        </div>
                    `,
                },
            });

            if (error) throw error;
            if (data?.success === false) throw new Error(data.error || 'Email gönderilemedi');

            setTestResult({ type: 'success', message: `✓ Test maili ${testTarget} adresine gönderildi!` });
        } catch (err: any) {
            setTestResult({ type: 'error', message: '✗ Gönderim hatası: ' + (err.message || String(err)) });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl space-y-6 shadow-sm border border-zinc-200">
            <div>
                <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Mail size={20} className="text-orange-500" />
                    SMTP E-Posta Ayarları
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                    Tüm uygulama e-postaları (iletişim formu, bildirimler, hoş geldin vb.) buradan gönderilir.
                </p>
            </div>

            {/* Supabase Auth Bilgi Kutusu */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="text-blue-500 mt-0.5 shrink-0">ℹ️</div>
                <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">Giriş OTP ve Şifre Sıfırlama E-postaları</p>
                    <p className="text-blue-600">
                        Bu maillar Supabase Auth sistemi tarafından gönderilir. Kendi SMTP'nizi kullanmak için{' '}
                        <a
                            href="https://supabase.com/dashboard/project/xchdyfynsxylsnoxnrxn/settings/auth"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-semibold hover:text-blue-800"
                        >
                            Supabase → Authentication → Settings → SMTP Settings
                        </a>{' '}
                        bölümüne aşağıdaki bilgileri girmeniz gerekir.
                    </p>
                </div>
            </div>

            {/* Host & Port */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">SMTP Host</label>
                    <input
                        type="text"
                        value={smtp.host}
                        disabled={!hasEditPermission}
                        onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                        placeholder="mail.example.com"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">SMTP Port</label>
                    <select
                        value={smtp.port}
                        disabled={!hasEditPermission}
                        onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 disabled:opacity-60"
                    >
                        <option value={587}>587 — STARTTLS (Önerilen)</option>
                        <option value={465}>465 — SSL/TLS</option>
                        <option value={25}>25 — SMTP (Şifresiz)</option>
                    </select>
                </div>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Kullanıcı Adı (E-posta)</label>
                    <input
                        type="text"
                        value={smtp.username}
                        disabled={!hasEditPermission}
                        onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                        placeholder="info@stepofstep.com"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Şifre</label>
                    <input
                        type="password"
                        value={smtp.password}
                        disabled={!hasEditPermission}
                        onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                    />
                </div>
            </div>

            {/* From Name & From Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Gönderen Adı</label>
                    <input
                        type="text"
                        value={smtp.from_name}
                        disabled={!hasEditPermission}
                        onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })}
                        placeholder="Step of Step"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Gönderen E-posta</label>
                    <input
                        type="email"
                        value={smtp.from_email}
                        disabled={!hasEditPermission}
                        onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
                        placeholder="noreply@stepofstep.com"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                    />
                </div>
            </div>

            {/* SSL Toggle */}
            <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                <button
                    type="button"
                    disabled={!hasEditPermission}
                    onClick={() => setSmtp({ ...smtp, secure: !smtp.secure })}
                    className={`relative w-12 h-6 rounded-full transition-all ${smtp.secure ? 'bg-orange-500' : 'bg-zinc-300'} disabled:opacity-60`}
                >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${smtp.secure ? 'translate-x-6' : ''}`} />
                </button>
                <div>
                    <p className="text-sm font-medium text-zinc-700">Güvenli Bağlantı (SSL/TLS)</p>
                    <p className="text-xs text-zinc-500">Port 587 için STARTTLS, port 465 için SSL kullanılır.</p>
                </div>
            </div>

            {/* Önizleme */}
            {smtp.from_name && smtp.from_email && (
                <div className="p-3 bg-zinc-50 rounded-xl text-sm font-mono text-zinc-600">
                    📧 Gönderen görünümü: <strong>{smtp.from_name} &lt;{smtp.from_email}&gt;</strong>
                </div>
            )}

            {hasEditPermission && (
                <div className="space-y-4">
                    {/* Kaydet Butonu & Feedback */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-2xl transition-all text-sm flex items-center gap-2"
                        >
                            {isSaving ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Kaydediliyor...</>
                            ) : (
                                <><Save size={16} /> SMTP Ayarlarını Kaydet</>
                            )}
                        </button>
                        {saveResult && (
                            <span className={`text-sm font-medium ${saveResult.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {saveResult.message}
                            </span>
                        )}
                    </div>

                    {/* Test Email Bölümü */}
                    <div className="border-t border-zinc-200 pt-4">
                        <p className="text-sm font-semibold text-zinc-700 mb-3">🧪 SMTP Bağlantı Testi</p>
                        <div className="flex gap-3">
                            <input
                                type="email"
                                value={testTarget}
                                onChange={(e) => setTestTarget(e.target.value)}
                                placeholder="test@ornek.com"
                                className="flex-1 bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={isTesting || !testTarget || !smtp.host}
                                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl transition-all text-sm flex items-center gap-2 shrink-0"
                            >
                                {isTesting ? (
                                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Gönderiliyor...</>
                                ) : (
                                    <><Mail size={16} /> Test Gönder</>
                                )}
                            </button>
                        </div>
                        {testResult && (
                            <p className={`mt-2 text-sm font-medium ${testResult.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {testResult.message}
                            </p>
                        )}
                        <p className="text-xs text-zinc-400 mt-2">
                            Ayarları kaydetmeden de test gönderebilirsiniz — test sırasında otomatik kaydedilir.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};


const GoogleSettings = ({ hasEditPermission }: { hasEditPermission: boolean }) => {
    const { settings, updateSettings } = useSiteSettings();
    const [config, setConfig] = useState({ analyticsId: '', tagManagerId: '' });

    useEffect(() => {
        const policy = settings.policies.find(p => p.slug === 'google-scripts');
        if (policy) {
            try {
                const parsed = JSON.parse(policy.content);
                setConfig({
                    analyticsId: parsed.analyticsId || '',
                    tagManagerId: parsed.tagManagerId || ''
                });
            } catch {
                // ignore
            }
        }
    }, [settings.policies]);

    const handleSave = async () => {
        if (!hasEditPermission) return;

        try {
            const newContent = JSON.stringify(config);
            const policySlug = 'google-scripts';

            let updatedPolicies = [...settings.policies];
            const existingIndex = updatedPolicies.findIndex(p => p.slug === policySlug);

            if (existingIndex >= 0) {
                updatedPolicies[existingIndex] = {
                    ...updatedPolicies[existingIndex],
                    content: newContent,
                    title: 'Google Scripts'
                };
            } else {
                updatedPolicies.push({
                    id: Date.now().toString(),
                    slug: policySlug,
                    title: 'Google Scripts',
                    content: newContent
                });
            }

            await updateSettings({ policies: updatedPolicies });
            // alert('Google entegrasyon ayarları kaydedildi.');
        } catch (error) {
            console.error('Google settings save error:', error);
            // alert('Kaydetme hatası.');
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl space-y-6 shadow-sm border border-zinc-200">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-orange-500" />
                Google Entegrasyonları
            </h2>
            <p className="text-sm text-zinc-500">
                Google ürünlerini entegre ederek ziyaretçi istatistiklerini takip edin (Google Analytics 4 & Tag Manager).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Google Analytics ID (G-XXXXXX)</label>
                    <input
                        type="text"
                        value={config.analyticsId}
                        disabled={!hasEditPermission}
                        onChange={(e) => setConfig({ ...config, analyticsId: e.target.value })}
                        placeholder="G-ABC123456"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Google Tag Manager ID (GTM-XXXXXX)</label>
                    <input
                        type="text"
                        value={config.tagManagerId}
                        disabled={!hasEditPermission}
                        onChange={(e) => setConfig({ ...config, tagManagerId: e.target.value })}
                        placeholder="GTM-XYZ123"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                    />
                </div>
            </div>

            {hasEditPermission && (
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded-2xl transition-all text-sm"
                    >
                        Ayarları Kaydet
                    </button>
                </div>
            )}
        </div>
    );
};

const defaultPages: PageSEO[] = [
    { path: '/', name: 'Ana Sayfa', title: '', description: '' },
    { path: '/about', name: 'Hakkımızda', title: '', description: '' },
    { path: '/contact', name: 'İletişim', title: '', description: '' },
    { path: '/careers', name: 'Kariyer', title: '', description: '' },
    { path: '/services/branding', name: 'Markalama Hizmeti', title: '', description: '' },
    { path: '/services/development', name: 'Yazılım Geliştirme', title: '', description: '' },
    { path: '/services/marketing', name: 'Dijital Pazarlama', title: '', description: '' },
    { path: '/profile', name: 'Profil', title: '', description: '' },
    { path: '/app', name: 'App Dashboard', title: '', description: '' },
    { path: '/portal', name: 'Portal Dashboard', title: '', description: '' },
    { path: '/portal/apps', name: 'Portal Uygulamalar', title: '', description: '' },
    { path: '/portal/jobs', name: 'Portal İş Başvuruları', title: '', description: '' },
    { path: '/portal/messages', name: 'Portal Mesajlar', title: '', description: '' },
    { path: '/login', name: 'Giriş Yap', title: '', description: '' },
    { path: '/register', name: 'Kayıt Ol', title: '', description: '' },
];

const SiteSettings = () => {
    const { settings, updateSettings } = useSiteSettings();
    const { user } = useAuth();
    const { canView, canEdit } = useRoles();
    const [formData, setFormData] = useState(settings);
    const [isSaved, setIsSaved] = useState(false);
    const { showLoading, hideLoading } = useLoading();

    const hasViewPermission = user?.role_id ? canView(user.role_id, 'settings') : user?.role === 'admin' || user?.role === 'designer';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'settings') : user?.role === 'admin' || user?.role === 'designer';

    if (!hasViewPermission) {
        return <Navigate to="/admin" replace />;
    }

    // Sayfa bazlı SEO
    const [pageSEO, setPageSEO] = useState<PageSEO[]>([]);
    const [selectedPage, setSelectedPage] = useState<string>('/');
    const [isPageDropdownOpen, setPageDropdownOpen] = useState(false);

    // Sync formData with settings when settings are loaded async
    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const fetchSEO = async () => {
        try {
            const { data, error } = await supabase
                .from('site_seo')
                .select('*')
                .order('name');
            if (error) throw error;

            if (data && data.length > 0) {
                // Use a Map to deduplicate by path (keep DB data over defaults)
                const pageMap = new Map();
                
                // First add defaults
                defaultPages.forEach(p => pageMap.set(p.path, p));
                
                // Then override with DB data
                data.forEach((p: PageSEO) => pageMap.set(p.path, p));
                
                const mergedPages = Array.from(pageMap.values());

                // Sort by name for better UX
                mergedPages.sort((a, b) => a.name.localeCompare(b.name));

                setPageSEO(mergedPages);
            } else {
                setPageSEO(defaultPages);
            }
        } catch (err) {
            console.error('SEO fetching error:', err);
            setPageSEO(defaultPages);
        }
    };

    useEffect(() => {
        fetchSEO();
    }, []);

    if (!hasViewPermission) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">Erişim Reddedildi</h2>
                    <p className="text-zinc-500">Site ayarlarına erişim yetkiniz bulunmamaktadır.</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        showLoading('Ayarlar kaydediliyor...');

        try {
            // Fake delay for UX
            await new Promise(resolve => setTimeout(resolve, 800));

            // 1. Update Main Settings
            await updateSettings(formData);

            // 2. Save SEO to DB (Optimized: Batch Upsert)
            if (pageSEO.length > 0) {
                const seoDataToUpsert = pageSEO.map(page => ({
                    path: page.path,
                    name: page.name,
                    title: page.title || '',
                    description: page.description || '',
                    updated_at: new Date().toISOString()
                }));

                const { error: seoError } = await supabase
                    .from('site_seo')
                    .upsert(seoDataToUpsert, { onConflict: 'path' });

                if (seoError) {
                    console.error('[SiteSettings] SEO batch save error:', seoError);
                }
            }

            localStorage.setItem('step_page_seo', JSON.stringify(pageSEO));
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (err: any) {
            console.error('[SiteSettings] Submit error:', err);
            alert('Ayarlar kaydedilirken bir hata oluştu: ' + (err.message || String(err)));
        } finally {
            hideLoading();
        }
    };

    const currentPageSEO = pageSEO.find(p => p.path === selectedPage) || pageSEO[0];

    const updatePageSEO = (field: 'title' | 'description' | 'path', value: string) => {
        if (field === 'path') {
            // Prevent duplicate paths
            if (pageSEO.some(p => p.path === value && p.path !== selectedPage)) {
                return; // Optionally show error
            }
        }

        setPageSEO(prev => prev.map(page =>
            page.path === selectedPage
                ? { ...page, [field]: value }
                : page
        ));

        if (field === 'path') {
            setSelectedPage(value);
        }
    };



    return (
        <div className="max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-zinc-900">Site Ayarları</h1>
                <p className="text-zinc-500">Web sitenizin kimliğini ve SEO ayarlarını yönetin.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Genel Ayarlar */}
                <div className="bg-white p-8 rounded-3xl space-y-6 shadow-sm border border-zinc-200">
                    <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        <Globe size={20} className="text-orange-500" />
                        Genel Ayarlar
                    </h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Site Başlığı (SEO)</label>
                        <input
                            type="text"
                            value={formData.title}
                            disabled={!hasEditPermission}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Step of Step - Dijital Ajans"
                            className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Meta Açıklama</label>
                        <textarea
                            value={formData.description}
                            disabled={!hasEditPermission}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Web sitenizin kısa açıklaması..."
                            className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 h-24 resize-none disabled:opacity-60"
                        />
                    </div>

                    <div className="space-y-2">
                        <ImageUploader
                            label="Logo Görseli"
                            value={formData.logoUrl || ''}
                            onChange={(base64) => setFormData({ ...formData, logoUrl: base64 })}
                            disabled={!hasEditPermission}
                        />
                        <p className="text-xs text-zinc-500">Logo eklemezseniz metin logo kullanılır.</p>
                    </div>

                    <div className="space-y-2">
                        <ImageUploader
                            label="Portal Logo Görseli"
                            value={formData.portalLogoUrl || ''}
                            onChange={(base64) => setFormData({ ...formData, portalLogoUrl: base64 })}
                            disabled={!hasEditPermission}
                        />
                        <p className="text-xs text-zinc-500">Portal için özel logo. Eklenmezse varsayılan logo kullanılır.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Logo Genişliği (Masaüstü) px</label>
                            <input
                                type="number"
                                value={formData.logoWidthDesktop || 120}
                                disabled={!hasEditPermission}
                                onChange={(e) => setFormData({ ...formData, logoWidthDesktop: Number(e.target.value) })}
                                className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 disabled:opacity-60"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Logo Genişliği (Mobil) px</label>
                            <input
                                type="number"
                                value={formData.logoWidthMobile || 40}
                                disabled={!hasEditPermission}
                                onChange={(e) => setFormData({ ...formData, logoWidthMobile: Number(e.target.value) })}
                                className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-all text-zinc-900 disabled:opacity-60"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-zinc-200 my-4" />

                    <div className="space-y-2">
                        <ImageUploader
                            label="Favicon (Site İkonu)"
                            value={formData.faviconUrl || ''}
                            onChange={(base64) => setFormData({ ...formData, faviconUrl: base64 })}
                            disabled={!hasEditPermission}
                        />
                        <p className="text-xs text-zinc-500">
                            Favicon, tarayıcı sekmesinde ve giriş ekranında görünen küçük ikon.
                            Önerilen boyut: 32x32px veya 64x64px (kare format)
                        </p>
                        {formData.faviconUrl && (
                            <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                                <img
                                    src={formData.faviconUrl}
                                    alt="Favicon önizleme"
                                    className="w-8 h-8 rounded object-contain"
                                />
                                <span className="text-sm text-zinc-600">Mevcut favicon</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Google Ayarları */}
                <GoogleSettings hasEditPermission={hasEditPermission} />

                {/* SMTP Ayarları */}
                <SMTPSettings hasEditPermission={hasEditPermission} />

                {/* Sayfa Bazlı SEO */}
                <div className="bg-white p-8 rounded-3xl space-y-6 shadow-sm border border-zinc-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <FileText size={20} className="text-orange-500" />
                            Sayfa Bazlı SEO Ayarları
                        </h2>
                    </div>



                    {/* Sayfa Seçici */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Sayfa Seçin</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setPageDropdownOpen(!isPageDropdownOpen)}
                                className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 text-left flex items-center justify-between hover:border-orange-300 transition-colors"
                            >
                                <span className="text-zinc-900">{currentPageSEO?.name || 'Sayfa Seçin'}</span>
                                <ChevronDown size={20} className={`text-zinc-400 transition-transform ${isPageDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isPageDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-lg z-10 overflow-hidden">
                                    {pageSEO.map(page => (
                                        <button
                                            key={page.path}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPage(page.path);
                                                setPageDropdownOpen(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors ${selectedPage === page.path ? 'bg-orange-50 text-orange-600' : 'text-zinc-700'
                                                }`}
                                        >
                                            <span className="font-medium">{page.name}</span>
                                            <span className="text-xs text-zinc-400 ml-2">{page.path}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {currentPageSEO && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">SEO Eşleşme Yolu</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={currentPageSEO.path}
                                        onChange={(e) => updatePageSEO('path', e.target.value)}
                                        className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2 font-mono text-sm text-orange-600 font-bold focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div className="flex gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    <div className="min-w-[16px] pt-0.5">⚠️</div>
                                    <p>
                                        <strong>Önemli:</strong> Bu yolu değiştirmek sayfanın URL adresini <strong>günceller</strong>.
                                        Yazılım içerisindeki link yapısı otomatik olarak güncellenecektir.
                                        Lütfen geçerli bir URL yolu girdiğinizden emin olun.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Seçili Sayfa SEO */}
                    <div className="p-4 bg-zinc-50 rounded-2xl space-y-4">
                        <p className="text-sm font-medium text-zinc-500">
                            {currentPageSEO?.name} sayfası için SEO ayarları
                        </p>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Sayfa Başlığı</label>
                            <input
                                type="text"
                                value={currentPageSEO?.title || ''}
                                disabled={!hasEditPermission}
                                onChange={(e) => updatePageSEO('title', e.target.value)}
                                placeholder={`${currentPageSEO?.name} | Step of Step`}
                                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Sayfa Meta Açıklaması</label>
                            <textarea
                                value={currentPageSEO?.description || ''}
                                disabled={!hasEditPermission}
                                onChange={(e) => updatePageSEO('description', e.target.value)}
                                placeholder="Bu sayfa hakkında kısa bir açıklama..."
                                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 h-20 resize-none disabled:opacity-60"
                            />
                        </div>
                    </div>
                </div>

                {/* Kaydet Butonu */}
                <div className="pt-4">
                    {hasEditPermission && (
                        <button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                        >
                            <Save size={20} />
                            {isSaved ? 'Kaydedildi!' : 'Değişiklikleri Kaydet'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default SiteSettings;
