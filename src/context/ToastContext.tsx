import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    toast: {
        success: (message: string, title?: string) => void;
        error: (message: string, title?: string) => void;
        info: (message: string, title?: string) => void;
        warning: (message: string, title?: string) => void;
    };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback(({ type, title, message, duration = 5000 }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, title, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const toast = {
        success: (message: string, title?: string) => addToast({ type: 'success', message, title }),
        error: (message: string, title?: string) => addToast({ type: 'error', message, title }),
        info: (message: string, title?: string) => addToast({ type: 'info', message, title }),
        warning: (message: string, title?: string) => addToast({ type: 'warning', message, title }),
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = React.forwardRef<HTMLDivElement, { toast: Toast, onRemove: () => void }>(({ toast, onRemove }, ref) => {
    const icons = {
        success: <CheckCircle className="text-green-500" size={24} />,
        error: <AlertCircle className="text-red-500" size={24} />,
        info: <Info className="text-blue-500" size={24} />,
        warning: <AlertTriangle className="text-amber-500" size={24} />
    };

    const styles = {
        success: 'border-green-500/20 bg-green-500/10',
        error: 'border-red-500/20 bg-red-500/10',
        info: 'border-blue-500/20 bg-blue-500/10',
        warning: 'border-amber-500/20 bg-amber-500/10'
    };

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-xl ${styles[toast.type]} min-w-[300px] relative overflow-hidden group`}
        >
            {/* Glossy Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />

            <div className="shrink-0 mt-0.5 relative z-10">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0 relative z-10">
                {toast.title && <h4 className="font-bold text-[rgb(var(--text-primary))] text-sm">{toast.title}</h4>}
                <p className="text-sm text-[rgb(var(--text-secondary))] font-medium leading-relaxed">{toast.message}</p>
            </div>
            <button
                onClick={onRemove}
                className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] relative z-10"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
});

ToastItem.displayName = 'ToastItem';

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
