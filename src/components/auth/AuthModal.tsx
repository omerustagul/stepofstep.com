import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Sparkles, Loader2, AlertCircle, Smartphone, ChevronLeft, RefreshCw, Lock, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidName, isValidEmail, isValidPhone } from '../../utils/validation';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
    onSuccess?: () => void;
}

const AuthModal = ({ isOpen, onClose, initialMode = 'login', onSuccess }: AuthModalProps) => {
    const { sendOtp, verifyOtp, isAuthenticated, user } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);

    // Auth State
    const [step, setStep] = useState<'input' | 'verify'>('input');
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

    // Inputs
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [otpCode, setOtpCode] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);

    // Initial sync
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setStep('input');
            setError(null);
        }
    }, [isOpen, initialMode]);

    // Timer countdown
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Close if authenticated successfully
    useEffect(() => {
        if (isOpen && isAuthenticated && user) {
            onSuccess?.();
            onClose();
        }
    }, [isAuthenticated, user, isOpen]);

    if (!isOpen) return null;

    // --- LOGIC HANDLERS ---

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation based on Mode
        if (mode === 'register') {
            if (!isValidName(name)) {
                setError('Lütfen geçerli bir isim giriniz.');
                return;
            }
        }

        let identifier = loginMethod === 'email' ? email : phone;
        let finalIdentifier = identifier.trim();

        if (loginMethod === 'phone') {
            finalIdentifier = finalIdentifier.replace(/[^0-9]/g, '');
            if (finalIdentifier.startsWith('0')) finalIdentifier = finalIdentifier.substring(1);
            finalIdentifier = '+90' + finalIdentifier;

            if (!isValidPhone(identifier)) {
                setError('Lütfen geçerli bir telefon numarası giriniz.');
                return;
            }
        } else {
            if (!isValidEmail(identifier)) {
                setError('Lütfen geçerli bir e-posta adresi giriniz.');
                return;
            }
        }

        setLoading(true);

        try {
            if (mode === 'register') {
                // For Register, we still use the "register" function but now it will use OTP flow
                // But wait, the current AuthContext register uses password.
                // We need to implement a "registerWithOtp" or just use sendOtp flow for registration too
                // For now, let's assume we use sendOtp for both flows since we are removing passwords.
                // The backend needs to know if user exists or not.

                // Temporary: Since we haven't updated AuthContext 'register' yet to be purely OTP,
                // we will use sendOtp for both. 
                // IF it's register, we might need to store the NAME somewhere to update profile later.
                localStorage.setItem('temp_reg_name', name);
            }

            const { error: sendError } = await sendOtp(finalIdentifier);

            if (sendError) {
                setError(sendError);
            } else {
                setStep('verify');
                setTimer(120);
                setError(null);
            }
        } catch (err: any) {
            setError(err.message || 'Kod gönderilirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!otpCode || otpCode.length < 6) {
            setError('Lütfen 6 haneli kodu giriniz.');
            return;
        }

        let identifier = loginMethod === 'email' ? email : phone;
        let finalIdentifier = identifier.trim();

        if (loginMethod === 'phone') {
            finalIdentifier = finalIdentifier.replace(/[^0-9]/g, '');
            if (finalIdentifier.startsWith('0')) finalIdentifier = finalIdentifier.substring(1);
            finalIdentifier = '+90' + finalIdentifier;
        }

        setLoading(true);
        const { error: verifyError } = await verifyOtp(finalIdentifier, otpCode);

        if (verifyError) {
            setError(verifyError);
            setLoading(false);
        } else {
            // Success handled by useEffect
            // If Register mode, we might want to update the name
            if (mode === 'register') {
                // Check if we need to update name
                // Since verifyOtp updates state, we rely on that for now.
                // A real implementation would call updateProfile here if new user.
            }
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        let identifier = loginMethod === 'email' ? email : phone;
        // Same cleaning logic...
        if (loginMethod === 'phone') {
            let clean = identifier.replace(/[^0-9]/g, '');
            if (clean.startsWith('0')) clean = clean.substring(1);
            identifier = '+90' + clean;
        }

        setLoading(true);
        const { error: sendError } = await sendOtp(identifier);
        setLoading(false);
        if (sendError) setError(sendError);
        else setTimer(120);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-3xl shadow-2xl overflow-hidden p-8"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                            <Sparkles className="text-white" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] tracking-tighter">
                            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                        </h2>
                        <p className="text-[rgb(var(--text-secondary))] text-sm mt-1">
                            {step === 'verify'
                                ? 'Doğrulama kodunu gir'
                                : (mode === 'login' ? 'Devam etmek için giriş yap' : 'Ücretsiz hesabını oluştur')}
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm font-medium"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}

                    {step === 'input' ? (
                        <div className="space-y-6">
                            {/* Method Switcher */}
                            <div className="bg-[rgb(var(--bg-tertiary))] p-1 rounded-xl border border-[rgb(var(--border-primary))] flex relative">
                                <motion.div
                                    className="absolute top-1 bottom-1 rounded-lg bg-[rgb(var(--accent-primary))] shadow-sm"
                                    initial={false}
                                    animate={{
                                        x: loginMethod === 'email' ? 0 : '100%',
                                        width: '49%'
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                                <button
                                    onClick={() => { setLoginMethod('email'); setError(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold relative z-10 transition-colors ${loginMethod === 'email' ? 'text-[rgb(var(--bg-card))]' : 'text-[rgb(var(--text-primary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'}`}
                                >
                                    <Mail size={16} /> E-posta
                                </button>
                                <button
                                    onClick={() => { setLoginMethod('phone'); setError(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold relative z-10 transition-colors ${loginMethod === 'phone' ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'}`}
                                >
                                    <Smartphone size={16} /> Telefon
                                </button>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-4">
                                {mode === 'register' && (
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Ad Soyad"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:font-normal"
                                        />
                                    </div>
                                )}

                                <div className="relative">
                                    {loginMethod === 'email' ? (
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    ) : (
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">+90</span>
                                    )}
                                    <input
                                        type={loginMethod === 'email' ? 'email' : 'tel'}
                                        required
                                        value={loginMethod === 'email' ? email : phone}
                                        onChange={e => {
                                            if (loginMethod === 'email') setEmail(e.target.value);
                                            else setPhone(e.target.value.replace(/[^0-9]/g, ''));
                                        }}
                                        placeholder={loginMethod === 'email' ? 'E-posta adresi' : '555 444 3322'}
                                        className={`w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-2xl py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:font-normal ${loginMethod === 'phone' ? 'pl-12 pr-4' : 'pl-12 pr-4'}`}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Devam Et <ArrowRight size={20} /></>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center">
                                <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs font-mono">
                                    {loginMethod === 'email' ? email : '+90 ' + phone}
                                </span>
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                <input
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="301225"
                                    maxLength={6}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-orange-500 transition-colors"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otpCode.length < 6}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Giriş Yap'}
                            </button>

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => { setStep('input'); setOtpCode(''); setError(null); }}
                                    className="text-sm font-bold text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <ChevronLeft size={16} /> Değiştir
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={timer > 0 || loading}
                                    className={`text-sm font-bold flex items-center gap-2 transition-colors ${timer > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-orange-500 hover:text-orange-400'}`}
                                >
                                    {timer > 0 ? `${timer}s` : <>Tekrar Gönder <RefreshCw size={14} /></>}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'input' && (
                        <div className="mt-8 text-center">
                            <p className="text-zinc-500 text-sm">
                                {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
                                <button
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'register' : 'login');
                                        setError(null);
                                    }}
                                    className="ml-2 text-orange-500 font-bold hover:text-orange-400 transition-colors"
                                >
                                    {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
                                </button>
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AuthModal;
