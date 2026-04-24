import { useEffect } from 'react';
import { useSiteSettings } from '../../context/SiteContext';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title?: string;
    description?: string;
    path?: string;
    override?: boolean;
}

const SEO = ({ title, description, path, override = false }: SEOProps) => {
    const { pageSEO, settings } = useSiteSettings();
    const location = useLocation();

    // Determine current path if not provided
    const currentPath = path || location.pathname;

    useEffect(() => {
        // Find SEO settings for this page
        const pageSettings = pageSEO.find(p => p.path === currentPath);

        // Priority: 1. Manual props (if override is true), 2. Database settings, 3. Manual props (default), 4. Default Site Settings
        const metaTitle = (override ? title : null) || pageSettings?.title || title || settings.title || 'Step of Step';
        const metaDesc = (override ? description : null) || pageSettings?.description || description || settings.description || '';

        // 1. Update Document Title
        document.title = metaTitle;

        // 2. Update Meta Description
        // Find existing meta tag or create new one
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', metaDesc);

        // Optional: Open Graph Tags (Basic)
        updateMeta('og:title', metaTitle);
        updateMeta('og:description', metaDesc);
        // updateMeta('og:image', settings.logoUrl); // Could add if available

    }, [currentPath, pageSEO, settings, title, description, override]);

    return null; // This component doesn't render anything visible
};

// Helper to update meta property tags
const updateMeta = (name: string, content: string) => {
    let element = document.querySelector(`meta[property="${name}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', name);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
};

export default SEO;
