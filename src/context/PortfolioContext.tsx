import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface PortfolioItem {
    id: string;
    name: string;
    description: string;
    category: string[];
    image: string;
    slug?: string;
    featured?: boolean;
    // Legacy fields for backward compatibility
    title?: string;
    serviceType?: string[];
    imageUrl?: string;
    logoUrl?: string;
    clientName?: string;
    challenge?: string;
    solution?: string;
    results?: string[];
    galleryImages?: string[];
    latitude?: number;
    longitude?: number;
}

interface PortfolioContextType {
    items: PortfolioItem[];
    loading: boolean;
    addItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
    updateItem: (id: string, item: Partial<PortfolioItem>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    refreshData: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const defaultItems: PortfolioItem[] = [
    {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Brand Evolution',
        title: 'Brand Evolution',
        description: 'Rebranding for a major tech startup',
        category: ['Branding'],
        serviceType: ['Branding'],
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1000',
        imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1000',
        slug: 'brand-evolution',
        clientName: 'TechFlow Inc.',
        challenge: 'Outdated brand identity failing to connect with Gen Z audience.',
        solution: 'Complete rebrand including logo, color palette, and voice guidelines emphasizing innovation.',
        results: ['200% increase in social engagement', '45% increase in lead generation'],
        latitude: 41.0082,
        longitude: 28.9784 // Istanbul
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Tech Forward',
        title: 'Tech Forward',
        description: 'Modern web application development',
        category: ['Development', 'UI/UX Design'],
        serviceType: ['Development', 'UI/UX Design'],
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000',
        slug: 'tech-forward',
        clientName: 'InnovateX',
        challenge: 'Legacy system causing performance bottlenecks and user churn.',
        solution: 'Rebuilt core platform using React and Node.js with a microservices architecture.',
        results: ['50% faster load times', '99.9% uptime achieved'],
        latitude: 40.7128,
        longitude: -74.0060 // New York
    },
    {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Market Growth',
        title: 'Market Growth',
        description: 'Comprehensive digital marketing campaign',
        category: ['Marketing', 'SEO'],
        serviceType: ['Marketing', 'SEO'],
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000',
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000',
        slug: 'market-growth',
        clientName: 'GrowthHackers',
        challenge: 'Low conversion rates on paid advertising channels.',
        solution: 'Data-driven campaign optimization and landing page A/B testing.',
        results: ['3x ROI on ad spend', '25% reduction in CPA'],
        latitude: 51.5074,
        longitude: -0.1278 // London
    }
];

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('portfolios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Portfolio çekme hatası:', error);
                // Hata durumunda localStorage'dan dene
                const stored = localStorage.getItem('step_portfolio');
                if (stored) {
                    setItems(JSON.parse(stored));
                } else {
                    setItems(defaultItems);
                }
            } else if (data && data.length > 0) {
                // Supabase'den gelen veriyi formatla
                const formatted = data.map((item: any) => {
                    const categories = Array.isArray(item.category) 
                        ? item.category 
                        : (item.category ? [item.category] : []);

                    return {
                        id: item.id,
                        name: item.name || item.title || '',
                        description: item.description || '',
                        category: categories,
                        image: item.image_url || item.image || '',
                        slug: item.slug || '',
                        featured: item.featured || false,
                        // Legacy uyumluluk
                        title: item.name || item.title || '',
                        serviceType: categories,
                        imageUrl: item.image_url || item.image || '',
                        // Ek alanlar - safe defaults
                        logoUrl: item.logo_url || '',
                        clientName: item.client_name || '',
                        challenge: item.challenge || '',
                        solution: item.solution || '',
                        results: Array.isArray(item.results) ? item.results : [],
                        galleryImages: Array.isArray(item.gallery_images) ? item.gallery_images : [],
                        latitude: item.latitude || null,
                        longitude: item.longitude || null
                    };
                });
                setItems(formatted);
            } else {
                // Veritabanı boş, varsayılanları ekle
                // NOT: Gerçek senaryoda bu kısmı kaldırıp boş dizi dönmek daha doğru olabilir,
                // ama demo içerik için tutuyoruz.
                setItems(defaultItems);
            }
        } catch (error) {
            console.error('Portfolio çekme hatası:', error);
            setItems(defaultItems);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refreshData = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    const addItem = useCallback(async (item: Omit<PortfolioItem, 'id'>) => {
        try {
            const { error } = await supabase
                .from('portfolios')
                .insert({
                    name: item.name || item.title,
                    description: item.description,
                    category: item.category || item.serviceType,
                    image_url: item.image || item.imageUrl,
                    slug: item.slug,
                    featured: item.featured || false,
                    logo_url: item.logoUrl || '',
                    client_name: item.clientName || '',
                    challenge: item.challenge || '',
                    solution: item.solution || '',
                    results: item.results || [],
                    gallery_images: item.galleryImages || [],
                    latitude: item.latitude || null,
                    longitude: item.longitude || null
                });

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Portfolio ekleme hatası:', error);
            throw error;
        }
    }, [fetchData]);

    const updateItem = useCallback(async (id: string, updatedFields: Partial<PortfolioItem>) => {
        try {
            const { error } = await supabase
                .from('portfolios')
                .update({
                    name: updatedFields.name || updatedFields.title,
                    description: updatedFields.description,
                    category: updatedFields.category || updatedFields.serviceType,
                    image_url: updatedFields.image || updatedFields.imageUrl,
                    slug: updatedFields.slug,
                    featured: updatedFields.featured,
                    logo_url: updatedFields.logoUrl,
                    client_name: updatedFields.clientName,
                    challenge: updatedFields.challenge,
                    solution: updatedFields.solution,
                    results: updatedFields.results,
                    gallery_images: updatedFields.galleryImages,
                    latitude: updatedFields.latitude,
                    longitude: updatedFields.longitude,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Portfolio güncelleme hatası:', error);
            throw error;
        }
    }, [fetchData]);

    const deleteItem = useCallback(async (id: string) => {
        try {
            const { error } = await supabase
                .from('portfolios')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Portfolio silme hatası:', error);
        }
    }, [fetchData]);

    const value = useMemo(() => ({ items, loading, addItem, updateItem, deleteItem, refreshData }), [items, loading, addItem, updateItem, deleteItem, refreshData]);

    return (
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
};

export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
};
