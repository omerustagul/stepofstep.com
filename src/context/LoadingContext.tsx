import { createContext, useContext, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingContextType {
    isLoading: boolean;
    loadingMessage: string;
    showLoading: (message?: string) => void;
    hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Yükleniyor...');

    const showLoading = (message: string = 'Yükleniyor...') => {
        setLoadingMessage(message);
        setIsLoading(true);
    };

    const hideLoading = () => {
        setIsLoading(false);
    };

    return (
        <LoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
            {children}

            {/* Global Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center"
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

                        {/* Loading Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 min-w-[280px]"
                        >
                            {/* Animated Logo/Spinner */}
                            <div className="relative w-16 h-16">
                                <motion.div
                                    className="absolute inset-0 border-4 border-orange-200 rounded-full"
                                />
                                <motion.div
                                    className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-orange-500">S</span>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="text-center">
                                <p className="text-zinc-900 font-semibold text-lg">{loadingMessage}</p>
                                <p className="text-zinc-500 text-sm mt-1">Lütfen bekleyin...</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
