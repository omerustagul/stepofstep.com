import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, CreditCard, Shield, Zap, Star, Loader2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserPlan } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import PaymentModal from '../payment/PaymentModal';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
    const { upgradePlan, user } = useAuth();
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const currentPlan = user?.plan || 'free';

    const [dbPlans, setDbPlans] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);

    const iconMap: { [key: string]: any } = {
        Shield,
        Zap,
        Star,
        CreditCard
    };

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { data, error } = await supabase
                    .from('membership_plans')
                    .select('*')
                    .order('price_monthly', { ascending: true });

                if (error) throw error;

                setDbPlans(data || []);
            } catch (err) {
                console.error('Error fetching plans:', err);
            } finally {
                setPlansLoading(false);
            }
        };

        if (isOpen) {
            fetchPlans();
        }
    }, [isOpen]);

    const handleUpgrade = async () => {
        if (!selectedPlan) return;

        const plan = dbPlans.find(p => p.id === selectedPlan);
        if (!plan) return;

        // If Paid Plan -> Show Payment Modal
        if (plan.price_monthly > 0) {
            setShowPaymentModal(true);
            return;
        }

        // Only handle Free downgrades/switches directly here
        setLoading(true);

        try {
            // Update plan in database
            const { error } = await upgradePlan(selectedPlan as UserPlan);

            if (error) {
                alert(`Yükseltme başarısız: ${error}`);
                setLoading(false);
                return;
            }

            setLoading(false);
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                setSelectedPlan(null);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Upgrade error:', error);
            setLoading(false);
            alert('Beklenmedik bir hata oluştu.');
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl w-full max-w-6xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-[rgb(var(--border-primary))]"
                    >
                        {!success ? (
                            <>
                                <div className="p-2 px-6 md:p-2 md:px-8 border-b border-[rgb(var(--border-primary))] flex justify-between items-center backdrop-blur-sm bg-[rgb(var(--bg-secondary))]/50">
                                    <div>
                                        <h2 className="text-xl font-black text-[rgb(var(--text-primary))] tracking-tight">{t('dashboard.upgrade_plan')}</h2>
                                        <p className="text-[rgb(var(--text-secondary))] font-medium text-sm mt-0">{t('auth.unlock_full_power', 'Hizmetlerimizin tam gücünü keşfedin.')}</p>
                                    </div>
                                    <button onClick={onClose} className="p-1 hover:bg-[rgb(var(--bg-tertiary))] rounded-full transition-colors group">
                                        <X size={24} className="text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-primary))]" />
                                    </button>
                                </div>

                                <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                        {plansLoading ? (
                                            <div className="col-span-3 py-32 flex flex-col items-center justify-center gap-4 text-[rgb(var(--text-primary))]">
                                                <Loader2 className="animate-spin text-orange-500" size={48} />
                                                <p className="font-bold text-lg">Planlar yükleniyor...</p>
                                            </div>
                                        ) : dbPlans.length > 0 ? dbPlans.map((plan) => {
                                            const isCurrentPlan = plan.id === currentPlan;
                                            const isSelected = selectedPlan === plan.id;
                                            const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                                            const Icon = iconMap[plan.icon] || Shield;

                                            // Calc discount
                                            const hasDiscount = user?.discount_plan === plan.id && (user?.discount_rate ?? 0) > 0;

                                            let isDiscountValid = hasDiscount;
                                            let timeLeft = '';

                                            if (hasDiscount && user?.discount_deadline) {
                                                const deadline = new Date(user.discount_deadline);
                                                const now = new Date();
                                                if (now > deadline) {
                                                    isDiscountValid = false;
                                                } else {
                                                    const diffTime = Math.abs(deadline.getTime() - now.getTime());
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                    timeLeft = `${diffDays} gün kaldı`;
                                                }
                                            }

                                            const originalPrice = plan.price_monthly;
                                            const discountedPrice = isDiscountValid
                                                ? Math.floor(originalPrice * (1 - (user?.discount_rate ?? 0) / 100))
                                                : originalPrice;

                                            return (
                                                <div
                                                    key={plan.id}
                                                    onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                                                    className={`relative rounded-3xl p-8 transition-all duration-300 flex flex-col h-full bg-[rgb(var(--bg-secondary))] border-2 ${isCurrentPlan
                                                        ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)] cursor-default'
                                                        : isSelected
                                                            ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.15)] scale-[1.02] -translate-y-2 z-10'
                                                            : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))] hover:scale-[1.01] hover:shadow-xl cursor-pointer'
                                                        }`}
                                                >
                                                    {isCurrentPlan && (
                                                        <div className="absolute -top-4 inset-x-0 mx-auto w-fit bg-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg tracking-widest uppercase flex items-center gap-1">
                                                            <Check size={12} strokeWidth={4} /> Mevcut Plan
                                                        </div>
                                                    )}
                                                    {plan.is_popular && !isCurrentPlan && (
                                                        <div className="absolute -top-4 inset-x-0 mx-auto w-fit bg-gradient-to-r from-orange-500 to-pink-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg tracking-widest uppercase flex items-center gap-1">
                                                            <Star size={12} fill="currentColor" /> En Çok Tercih Edilen
                                                        </div>
                                                    )}

                                                    <div className={`w-14 h-14 ${plan.color || 'bg-[rgb(var(--bg-tertiary))]'} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                                                        <Icon size={28} className={isCurrentPlan ? 'text-green-600' : 'text-[rgb(var(--text-primary))]'} />
                                                    </div>

                                                    <h3 className="font-black text-2xl mb-2 text-[rgb(var(--text-primary))]">{plan.name}</h3>
                                                    <p className="text-sm text-[rgb(var(--text-secondary))] mb-6 leading-relaxed min-h-[40px]">
                                                        {plan.description || "Profesyoneller için gelişmiş özellikler."}
                                                    </p>

                                                    {plan.price_monthly === 0 ? (
                                                        <div className="text-4xl font-black mb-8 text-[rgb(var(--text-primary))]">Ücretsiz</div>
                                                    ) : (
                                                        <div className="mb-8">
                                                            {hasDiscount ? (
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm text-[rgb(var(--text-tertiary))] line-through font-bold">₺{originalPrice}</span>
                                                                        <span className="bg-orange-500/10 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-500/20">
                                                                            <Sparkles size={8} /> %{user?.discount_rate} İNDİRİM
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-4xl font-black text-orange-500">₺{discountedPrice}</span>
                                                                        <span className="text-sm font-bold text-[rgb(var(--text-secondary))]">/ay</span>
                                                                    </div>
                                                                    {timeLeft && (
                                                                        <span className="text-[10px] font-bold text-red-500 animate-pulse mt-1">
                                                                            Kampanya {timeLeft} bitiyor!
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-4xl font-black text-[rgb(var(--text-primary))]">₺{plan.price_monthly}</span>
                                                                    <span className="text-sm font-bold text-[rgb(var(--text-secondary))]">/ay</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="border-t border-[rgb(var(--border-primary))] my-6 w-full" />

                                                    <ul className="space-y-4 mb-8 flex-1">
                                                        {features.map((feature: string, i: number) => (
                                                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-[rgb(var(--text-secondary))]">
                                                                <div className={`mt-0.5 p-0.5 rounded-full ${isCurrentPlan || isSelected ? 'bg-green-500 text-white' : 'bg-[rgb(var(--text-tertiary))] text-[rgb(var(--bg-primary))]'}`}>
                                                                    <Check size={10} strokeWidth={4} />
                                                                </div>
                                                                {feature}
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <button
                                                        className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${isCurrentPlan
                                                            ? 'bg-green-500/10 text-green-600 cursor-default border border-green-500/20'
                                                            : isSelected
                                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 scale-105'
                                                                : 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--text-primary))] hover:text-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))]'
                                                            }`}
                                                    >
                                                        {isCurrentPlan ? (
                                                            <>Mevcut Planınız</>
                                                        ) : isSelected ? (
                                                            <>Seçildi <CheckCircle2 size={16} /></>
                                                        ) : (
                                                            <>Seç</>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        }) : (
                                            <div className="col-span-3 py-20 text-center">
                                                <p className="text-[rgb(var(--text-secondary))] font-medium">Henüz üyelik planı tanımlanmamış.</p>
                                                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2">Lütfen admin panelinden planları oluşturun.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-2 px-4 md:p-2 md:px-8 bg-[rgb(var(--bg-tertiary))]/30 border-t border-[rgb(var(--border-primary))] flex flex-col-reverse md:flex-row items-center justify-between gap-4 backdrop-blur-md">
                                    {currentPlan !== 'free' ? (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Emin misiniz? Ücretli planınız iptal edilecek ve ücretsiz plana döneceksiniz.')) {
                                                    upgradePlan('free');
                                                    onClose();
                                                }
                                            }}
                                            className="px-4 py-1 md:px-6 md:py-3 text-red-500 font-bold hover:bg-red-500/5 rounded-full transition-colors text-[10px] md:text-sm"
                                        >
                                            Mevcut Planı İptal Et
                                        </button>
                                    ) : (
                                        <div /> // Spacer
                                    )}

                                    <div className="flex gap-1 md:gap-4 w-full md:w-auto">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 md:flex-none px-3 py-3 md:px-6 md:py-3 font-bold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-input))] rounded-full transition-all text-sm border border-transparent hover:border-[rgb(var(--border-primary))]"
                                        >
                                            {t('common.cancel', 'Vazgeç')}
                                        </button>
                                        <button
                                            onClick={handleUpgrade}
                                            disabled={!selectedPlan || loading || selectedPlan === currentPlan}
                                            className="flex-1 md:flex-none px-3 py-3 md:px-6 md:py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black rounded-full hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-3 text-sm"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    İşleniyor...
                                                </>
                                            ) : (
                                                <>
                                                    Ödemeye Geç <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 px-6 text-center h-full">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="w-28 h-28 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-8 ring-8 ring-green-500/10"
                                >
                                    <Check size={56} strokeWidth={4} />
                                </motion.div>
                                <h2 className="text-4xl font-black text-[rgb(var(--text-primary))] mb-4">{t('auth.upgrade_success', 'Harika Seçim!')}</h2>
                                <p className="text-[rgb(var(--text-secondary))] max-w-lg text-lg leading-relaxed">
                                    {t('auth.upgrade_success_desc', 'Planınız başarıyla yükseltildi. Artık markanız için çok daha güçlüsünüz. Keyfini çıkarın!')}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {showPaymentModal && selectedPlan && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    planId={selectedPlan}
                    price={dbPlans.find(p => p.id === selectedPlan)?.price_monthly || 0}
                />
            )}
        </AnimatePresence>,
        document.body
    );
};

export default UpgradeModal;
