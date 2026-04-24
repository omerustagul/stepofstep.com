
import { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planId: string;
    price: number;
}

const PaymentModal = ({ isOpen, onClose, planId, price }: PaymentModalProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [iframeToken, setIframeToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen && user && planId) {
            initializePayment();
        } else {
            setIframeToken(null);
            setError(null);
            setLoading(true);
        }
    }, [isOpen, planId, user]);

    const initializePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('paytr-init', {
                body: {
                    user_id: user?.id,
                    email: user?.email,
                    plan_name: planId,
                    payment_amount: price,
                    user_ip: '127.0.0.1' // Frontend should try to get real IP or let backend handle it
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            if (data?.token) {
                setIframeToken(data.token);
            } else {
                throw new Error('Token alınamadı.');
            }

        } catch (err: any) {
            console.error('Payment init error:', err);
            setError('Ödeme sistemi başlatılamadı. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[rgb(var(--bg-secondary))] w-full max-w-4xl h-[600px] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))]/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[rgb(var(--text-primary))]">Güvenli Ödeme</h3>
                                <p className="text-xs text-[rgb(var(--text-secondary))] font-medium">256-bit SSL ile korunmaktadır</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                            <X size={20} className="text-zinc-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-[rgb(var(--bg-secondary))] relative">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-400">
                                <Loader2 className="animate-spin text-orange-500" size={40} />
                                <p className="font-medium animate-pulse">Ödeme sayfası hazırlanıyor...</p>
                            </div>
                        ) : error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
                                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
                                    <CreditCard size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-[rgb(var(--text-primary))]">Bağlantı Hatası</h4>
                                <p className="text-[rgb(var(--text-secondary))] max-w-md">{error}</p>
                                <button onClick={initializePayment} className="mt-4 px-6 py-3 bg-[rgb(var(--accent-primary))] text-[rgb(var(--text-primary))] rounded-xl font-bold hover:bg-[rgb(var(--accent-hover))] hover:text-[rgb(var(--text-primary))] transition-colors">
                                    Tekrar Dene
                                </button>
                            </div>
                        ) : iframeToken ? (
                            <iframe
                                src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                                className="w-full h-full border-none"
                                title="PayTR Ödeme Formu"
                            />
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default PaymentModal;
