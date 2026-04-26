import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Policy {
    id: string;
    slug: string;
    title: string;
    content: string;
}

// Theme type
export type Theme = 'light' | 'dark' | 'system';

interface SiteSettings {
    id?: string;
    title: string;
    description: string;
    logoUrl: string;
    portalLogoUrl: string;
    faviconUrl?: string;
    logoWidthDesktop?: number;
    logoWidthMobile?: number;
    policies: Policy[];
}

interface SiteContextType {
    settings: SiteSettings;
    loading: boolean;
    pageSEO: any[];
    theme: Theme;
    effectiveTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
    refreshData: () => Promise<void>;
    getPagePath: (pageName: string, defaultPath: string) => string;
}

const defaultSettings: SiteSettings = {
    title: 'Step of Step',
    description: 'Digital Marketing & Creative Agency',
    logoUrl: '',
    portalLogoUrl: '',
    faviconUrl: '',
    logoWidthDesktop: 120,
    logoWidthMobile: 40,
    policies: [
        {
            id: '1',
            slug: 'privacy',
            title: 'Gizlilik Politikası',
            content: `### 1. Veri Toplama
Step Of Step olarak gizliliğinize önem veriyoruz. Sitemizi ziyaret ettiğinizde, iletişim formlarını doldurduğunuzda veya hizmetlerimizi kullandığınızda adınız, e-posta adresiniz ve telefon numaranız gibi temel bilgileri toplayabiliriz.

### 2. Verilerin Kullanımı
Toplanan bilgiler, size daha iyi hizmet sunmak, taleplerinize yanıt vermek ve yasal yükümlülüklerimizi yerine getirmek amacıyla kullanılır.

### 3. Çerezler (Cookies)
Kullanıcı deneyimini geliştirmek için çerezler kullanmaktayız. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.`
        },
        {
            id: '2',
            slug: 'terms',
            title: 'Kullanım Şartları',
            content: `### 1. Giriş
Step Of Step web sitesine hoş geldiniz. Hizmetlerimizi kullanarak bu şartları kabul etmiş sayılırsınız.

### 2. Hizmetlerin Kullanımı
Sitemizi yasalara uygun şekilde kullanmayı kabul edersiniz. Zararlı içerik yüklemek, site güvenliğini tehdit etmek veya diğer kullanıcıların haklarını ihlal etmek yasaktır.`
        }
    ]
};

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider = ({ children }: { children: React.ReactNode }) => {
    // Initialize from LocalStorage (Stale-While-Revalidate Pattern)
    const [settings, setSettings] = useState<SiteSettings>(() => {
        try {
            const cached = localStorage.getItem('siteSettings');
            if (cached) {
                const parsed = JSON.parse(cached);
                return {
                    ...defaultSettings,
                    ...parsed,
                    policies: parsed.policies || defaultSettings.policies
                };
            }
            return defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    const [pageSEO, setPageSEO] = useState<any[]>(() => {
        try {
            const cached = localStorage.getItem('step_page_seo');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });

    // If we have cached data, we are not "loading" visually (instant load)
    const [loading, setLoading] = useState(() => {
        return !localStorage.getItem('siteSettings');
    });

    // Theme State - Initialize from localStorage or default to 'system'
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem('step_theme') as Theme;
            return saved || 'system';
        } catch {
            return 'system';
        }
    });

    // Compute effective theme based on system preference
    const getSystemTheme = useCallback((): 'light' | 'dark' => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    }, []);

    const effectiveTheme = useMemo((): 'light' | 'dark' => {
        return theme === 'system' ? getSystemTheme() : theme;
    }, [theme, getSystemTheme]);

    // Theme setter with localStorage persistence
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('step_theme', newTheme);
    }, []);

    // Apply theme to DOM
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', effectiveTheme);

        // Update ALL meta theme-color tags for mobile browsers
        const metaThemes = document.querySelectorAll('meta[name="theme-color"]');
        const themeColor = effectiveTheme === 'dark' ? '#09090b' : '#ffffff';
        
        if (metaThemes.length > 0) {
            metaThemes.forEach(meta => {
                meta.setAttribute('content', themeColor);
            });
        } else {
            // Create one if it doesn't exist
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = themeColor;
            document.head.appendChild(meta);
        }

        // Fix for iOS Safari status bar style
        const appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (appleStatus) {
            appleStatus.setAttribute('content', effectiveTheme === 'dark' ? 'black-translucent' : 'default');
        }
    }, [effectiveTheme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            document.documentElement.setAttribute('data-theme', getSystemTheme());
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, getSystemTheme]);

    const fetchData = useCallback(async () => {
        // If no cache, set loading true. If cache exists, keep loading false (background update)
        if (!localStorage.getItem('siteSettings')) {
            setLoading(true);
        }

        try {
            // 1. Fetch General Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('site_settings')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            // 2. Fetch Page SEO
            const { data: seoData, error: seoError } = await supabase
                .from('site_seo')
                .select('*');

            if (settingsError) console.error('[SiteContext] Settings fetch error:', settingsError);
            if (seoError) console.error('[SiteContext] SEO fetch error:', seoError);

            if (seoData) {
                setPageSEO(seoData);
                localStorage.setItem('step_page_seo', JSON.stringify(seoData));
            }

            if (settingsData) {
                // Determine effective settings merging with defaults
                const newSettings = {
                    id: settingsData.id,
                    title: settingsData.title || defaultSettings.title,
                    description: settingsData.description || defaultSettings.description,
                    logoUrl: settingsData.logo_url || '',
                    portalLogoUrl: settingsData.portal_logo_url || '',
                    faviconUrl: settingsData.favicon_url || '',
                    logoWidthDesktop: settingsData.logo_width_desktop || 120,
                    logoWidthMobile: settingsData.logo_width_mobile || 40,
                    policies: (settingsData.policies && settingsData.policies.length > 0) ? settingsData.policies : defaultSettings.policies
                };

                setSettings(newSettings);
                localStorage.setItem('siteSettings', JSON.stringify(newSettings));
            }
        } catch (error) {
            console.error('[SiteContext] Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Trigger background fetch on mount
        fetchData();
    }, [fetchData]);

    // Update browser favicon dynamically
    useEffect(() => {
        const updateFavicon = (url: string) => {
            if (!url) return;
            // Remove existing ones to be safe
            const links = document.querySelectorAll("link[rel*='icon']");
            links.forEach(link => link.parentNode?.removeChild(link));

            const link = document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = url;
            document.getElementsByTagName('head')[0].appendChild(link);

            // Also update standard icon
            const iconLink = document.createElement('link');
            iconLink.rel = 'icon';
            iconLink.href = url;
            document.getElementsByTagName('head')[0].appendChild(iconLink);
        };

        if (settings.faviconUrl) {
            updateFavicon(settings.faviconUrl);
        }
    }, [settings.faviconUrl]);

    const refreshData = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    const updateSettings = useCallback(async (newSettings: Partial<SiteSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        // Update LocalStorage (Backup)
        localStorage.setItem('siteSettings', JSON.stringify(updated));

        try {
            if (updated.id) {
                // Update existing
                const { error } = await supabase
                    .from('site_settings')
                    .update({
                        title: updated.title || '',
                        description: updated.description || '',
                        logo_url: updated.logoUrl || '',
                        portal_logo_url: updated.portalLogoUrl || '',
                        favicon_url: updated.faviconUrl || '',
                        logo_width_desktop: updated.logoWidthDesktop || 120,
                        logo_width_mobile: updated.logoWidthMobile || 40,
                        policies: updated.policies,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', updated.id);
                
                if (error) throw error;
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('site_settings')
                    .insert({
                        title: updated.title,
                        description: updated.description,
                        logo_url: updated.logoUrl,
                        portal_logo_url: updated.portalLogoUrl,
                        favicon_url: updated.faviconUrl,
                        logo_width_desktop: updated.logoWidthDesktop,
                        logo_width_mobile: updated.logoWidthMobile,
                        policies: updated.policies
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setSettings(prev => ({ ...prev, id: data.id }));
                }
            }
            console.log('[SiteContext] Settings updated successfully');
        } catch (error: any) {
            console.error('[SiteContext] Update error:', error);
            alert('Ayarlar kaydedilirken bir hata oluştu: ' + (error.message || 'Yetki hatası (RLS)'));
            // Re-fetch to sync with DB
            fetchData();
            throw error; // Re-throw so the caller (like SiteSettings) knows it failed
        }
    }, [settings, fetchData]);

    const getPagePath = useCallback((pageName: string, defaultPath: string) => {
        const page = pageSEO.find(p => p.name === pageName);
        return page ? page.path : defaultPath;
    }, [pageSEO]);

    const value = useMemo(() => ({
        settings,
        pageSEO,
        loading,
        theme,
        effectiveTheme,
        setTheme,
        updateSettings,
        refreshData,
        getPagePath
    }), [settings, pageSEO, loading, theme, effectiveTheme, setTheme, updateSettings, refreshData, getPagePath]);

    return (
        <SiteContext.Provider value={value}>
            {children}
        </SiteContext.Provider>
    );
};

export const useSiteSettings = () => {
    const context = useContext(SiteContext);
    if (!context) throw new Error('useSiteSettings must be used within a SiteProvider');
    return context;
};
