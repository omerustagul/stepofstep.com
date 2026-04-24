import { useState, useEffect, useRef } from 'react';
import { useActivity } from '../../context/ActivityContext';

interface AppWrapperProps {
    appUrl: string;
    title: string;
}

const AppWrapper = ({ appUrl, title }: AppWrapperProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const { trackVisit, updateTime } = useActivity();

    const hasLoggedVisit = useRef(false);

    useEffect(() => {
        // Log visit on mount - only once
        if (!hasLoggedVisit.current) {
            trackVisit(appUrl, title);
            hasLoggedVisit.current = true;
        }

        // Track time every 10 seconds
        const timer = setInterval(() => {
            updateTime(appUrl, title, 10);
        }, 10000);

        return () => clearInterval(timer);
    }, [appUrl, title, trackVisit, updateTime]); // these are now stable!

    return (
        <div className="h-screen w-full flex flex-col relative bg-zinc-50">
            {/* Navigation Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
                <button
                    onClick={() => window.location.href = '/portal/apps'}
                    className="flex items-center gap-2 text-xs font-bold bg-white/90 hover:bg-white text-zinc-600 px-4 py-2 rounded-full border border-zinc-200 shadow-sm transition-all hover:text-orange-600 hover:shadow-md backdrop-blur-sm"
                >
                    ✕ Kapat
                </button>
            </div>

            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={() => window.open(appUrl, '_blank')}
                    className="text-xs font-bold bg-zinc-900/80 hover:bg-zinc-900 px-4 py-2 rounded-full backdrop-blur-md transition-colors text-white shadow-lg"
                >
                    Yeni Sekmede Aç ↗
                </button>
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 z-0">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                        <p className="text-zinc-400 font-medium text-sm animate-pulse">Uygulama Yükleniyor...</p>
                    </div>
                </div>
            )}

            <iframe
                src={appUrl}
                title={title}
                className="w-full h-full bg-white"
                frameBorder="0"
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
};

export default AppWrapper;
