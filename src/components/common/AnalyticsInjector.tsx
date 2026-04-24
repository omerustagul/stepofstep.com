
import { useEffect } from 'react';
import { useSiteSettings } from '../../context/SiteContext';

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

const AnalyticsInjector = () => {
    const { settings } = useSiteSettings();

    useEffect(() => {
        const googlePolicy = settings.policies.find(p => p.slug === 'google-scripts');
        if (!googlePolicy) return;

        try {
            const config = JSON.parse(googlePolicy.content);
            const analyticsId = config.analyticsId?.trim();
            const tagManagerId = config.tagManagerId?.trim();

            // Inject Google Analytics (GA4)
            if (analyticsId && !document.getElementById('ga-script')) {
                const script = document.createElement('script');
                script.id = 'ga-script';
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
                document.head.appendChild(script);

                window.dataLayer = window.dataLayer || [];
                function gtag(...args: any[]) {
                    window.dataLayer.push(args);
                }
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', analyticsId);
            }

            // Inject Google Tag Manager (GTM)
            if (tagManagerId && !document.getElementById('gtm-script')) {
                const script = document.createElement('script');
                script.id = 'gtm-script';
                script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${tagManagerId}');`;
                document.head.appendChild(script);

                // GTM requires a noscript body tag too, but React cannot easily inject that into body start safely without hydration mismatch.
                // Usually head script is enough for tracking unless JS is disabled.
            }

        } catch (e) {
            console.error('Error parsing Google Scripts config:', e);
        }
    }, [settings.policies]);

    return null;
};

export default AnalyticsInjector;
