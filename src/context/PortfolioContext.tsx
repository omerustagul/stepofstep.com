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
    getItemBySlug: (slugOrId: string) => Promise<PortfolioItem | null>;
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
            // OPTIMIZATION: Only fetch necessary fields for the list view
            // Large fields like gallery_images, challenge, and solution are excluded
            const { data, error } = await supabase
                .from('portfolios')
                .select('id, name, description, category, image_url, logo_url, slug, featured, created_at')
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
            const dbData = {
                name: item.name || item.title || '',
                description: item.description || '',
                category: Array.isArray(item.category) ? item.category : (Array.isArray(item.serviceType) ? item.serviceType : []),
                image_url: item.image || item.imageUrl || '',
                logo_url: item.logoUrl || '',
                slug: item.slug || (item.name || item.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                featured: item.featured || false,
                client_name: item.clientName || '',
                challenge: item.challenge || '',
                solution: item.solution || '',
                results: item.results || [],
                gallery_images: item.galleryImages || [],
                latitude: item.latitude || null,
                longitude: item.longitude || null
            };

            const { error } = await supabase
                .from('portfolios')
                .insert(dbData);

            if (error) throw error;
            await fetchData();
        } catch (error: any) {
            console.error('Portfolio ekleme hatası:', error);
            alert('Portfolyo eklenirken hata: ' + (error.message || 'Yetki hatası'));
            throw error;
        }
    }, [fetchData]);

    const updateItem = useCallback(async (id: string, updatedFields: Partial<PortfolioItem>) => {
        try {
            // Veritabanı şemasına göre alanları eşle
            const dbData: any = {
                id: id, // Upsert için ID gerekli
                updated_at: new Date().toISOString()
            };

            // Alanları tek tek kontrol et ve varsa ekle
            if (updatedFields.name !== undefined) dbData.name = updatedFields.name;
            else if (updatedFields.title !== undefined) dbData.name = updatedFields.title;
            
            if (updatedFields.description !== undefined) dbData.description = updatedFields.description;
            
            if (updatedFields.category !== undefined) dbData.category = updatedFields.category;
            else if (updatedFields.serviceType !== undefined) dbData.category = updatedFields.serviceType;
            
            if (updatedFields.imageUrl !== undefined) dbData.image_url = updatedFields.imageUrl;
            else if (updatedFields.image !== undefined) dbData.image_url = updatedFields.image;
            
            if (updatedFields.slug !== undefined) dbData.slug = updatedFields.slug;
            if (updatedFields.featured !== undefined) dbData.featured = updatedFields.featured;
            if (updatedFields.logoUrl !== undefined) dbData.logo_url = updatedFields.logoUrl;
            if (updatedFields.clientName !== undefined) dbData.client_name = updatedFields.clientName;
            if (updatedFields.challenge !== undefined) dbData.challenge = updatedFields.challenge;
            if (updatedFields.solution !== undefined) dbData.solution = updatedFields.solution;
            if (updatedFields.results !== undefined) dbData.results = updatedFields.results;
            if (updatedFields.galleryImages !== undefined) dbData.gallery_images = updatedFields.galleryImages;
            if (updatedFields.latitude !== undefined) dbData.latitude = updatedFields.latitude;
            if (updatedFields.longitude !== undefined) dbData.longitude = updatedFields.longitude;

            // 'update' yerine 'upsert' kullanıyoruz. 
            // Bu sayede kayıt yoksa oluşturur, varsa günceller.
            const { data, error } = await supabase
                .from('portfolios')
                .upsert(dbData, { onConflict: 'id' })
                .select();

            if (error) throw error;
            
            if (!data || data.length === 0) {
                throw new Error('Kayıt işlemi başarısız oldu.');
            }

            await fetchData();
        } catch (error: any) {
            console.error('Portfolio güncelleme hatası:', error);
            alert('Portfolyo güncellenirken hata: ' + (error.message || 'Yetki hatası'));
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

    const getItemBySlug = useCallback(async (slugOrId: string): Promise<PortfolioItem | null> => {
        // First check in local state
        const localItem = items.find(i => i.id === slugOrId || i.slug === slugOrId);
        
        // If local item exists and has galleryImages, it's already full
        if (localItem && localItem.galleryImages && localItem.galleryImages.length > 0) {
            return localItem;
        }

        // Fetch full data from Supabase
        try {
            const { data, error } = await supabase
                .from('portfolios')
                .select('*')
                .or(`id.eq.${slugOrId},slug.eq.${slugOrId}`)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                // Map DB to PortfolioItem
                return {
                    id: data.id,
                    name: data.name,
                    title: data.name,
                    description: data.description,
                    category: data.category || [],
                    serviceType: data.category || [],
                    image: data.image_url,
                    imageUrl: data.image_url,
                    logoUrl: data.logo_url,
                    clientName: data.client_name,
                    slug: data.slug,
                    featured: data.featured,
                    challenge: data.challenge,
                    solution: data.solution,
                    results: data.results || [],
                    galleryImages: data.gallery_images || [],
                    latitude: data.latitude,
                    longitude: data.longitude
                };
            }
        } catch (err) {
            console.error('Error fetching single portfolio:', err);
        }

        return localItem || null;
    }, [items]);

    const value = useMemo(() => ({ items, loading, addItem, updateItem, deleteItem, refreshData, getItemBySlug }), [items, loading, addItem, updateItem, deleteItem, refreshData, getItemBySlug]);

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
