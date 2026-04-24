import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { isValidName, isValidEmail, isValidPhone } from '../utils/validation';
import { Loader2, ArrowRight, User, Mail, Lock, CheckCircle, ChevronLeft, RefreshCw } from 'lucide-react';
import SEO from '../components/common/SEO';

const Register = () => {
    // State
    const [step, setStep] = useState<'input' | 'verify'>('input');

    // Inputs
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');

    // UI
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [timer, setTimer] = useState(0);

    // Context & Hooks
    const { sendOtp, verifyOtp } = useAuth(); // We might repurpose register or use sendOtp
    const { settings } = useSiteSettings();
    const navigate = useNavigate();

    // Timer Logic
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};

        if (!isValidName(name)) {
            newErrors.name = 'Geçerli bir isim giriniz.';
        }

        let identifier = email.trim(); // Always use email for verification based on current flow
        let phoneNumber = phone.trim();

        if (phoneNumber.startsWith('0')) phoneNumber = phoneNumber.substring(1);
        if (!phoneNumber.startsWith('+90')) phoneNumber = '+90' + phoneNumber;

        // Validations
        if (!isValidEmail(email)) {
            newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
        }
        if (!isValidPhone(phoneNumber)) {
            newErrors.phone = 'Geçerli bir telefon numarası giriniz.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        // Send OTP to email, but pass phone and name as metadata, explicitly allowing user creation
        const { error: sendError } = await sendOtp(identifier, {
            metadata: {
                name: name.trim(),
                phone: phoneNumber
            },
            shouldCreateUser: true
        });

        if (sendError) {
            setErrors({ general: sendError });
        } else {
            setStep('verify');
            setTimer(120);
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!otpCode || otpCode.length < 6) {
            setErrors({ general: 'Lütfen 6 haneli doğrulama kodunu giriniz.' });
            return;
        }

        let identifier = email.trim();

        setLoading(true);

        // This validates the code
        const { error: verifyError } = await verifyOtp(identifier, otpCode);

        if (verifyError) {
            setErrors({ general: verifyError });
            setLoading(false);
        } else {
            // Success! 
            // HERE IS THE TRICK: OTP Login just logged us in. 
            // BUT we may need to create the profile row if it doesn't exist.
            // AuthContext fetchUserProfile handles profile retrieval. 
            // If the user is NEW, fetchUserProfile might return a fallback or try to insert.
            // We should ensure the NAME is updated.
            setIsSuccess(true);
            // Delay and redirect
            setTimeout(() => {
                navigate('/app');
            }, 2000);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        let identifier = email.trim();

        setLoading(true);
        const { error } = await sendOtp(identifier);
        setLoading(false);
        if (error) setErrors({ general: error });
        else setTimer(120);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
                <SEO title="Kayıt Başarılı - Step of Step" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-12 rounded-[2.5rem] w-full max-w-md bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl border border-[rgb(var(--border-primary))] shadow-2xl relative z-10 text-center"
                >
                    <div className="w-20 h-20 bg-green-100/50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-[rgb(var(--text-primary))] mb-2 tracking-tight">Hoş Geldiniz!</h2>
                    <p className="text-[rgb(var(--text-secondary))] font-medium mb-8">
                        Hesabınız doğrulandı. Yönlendiriliyorsunuz...
                    </p>
                    <div className="flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
            <SEO title="Kayıt Ol - Step of Step" />

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 md:p-12 rounded-[2.5rem] w-full max-w-2xl bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl border border-[rgb(var(--border-primary))]/50 shadow-2xl relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-5">
                    <Link to="/" className="inline-block mb-6 hover:scale-105 transition-transform">
                        {settings.faviconUrl ? (
                            <img
                                src={settings.faviconUrl}
                                alt="Logo"
                                className="glass-panel w-16 h-16 rounded-full mx-auto shadow-xl object-contain bg-orange-500/5 bg-blur-sm p-0.5"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-xl shadow-orange-500/30">
                                S
                            </div>
                        )}
                    </Link>
                    <h2 className="text-2xl md:text-3xl font-black text-[rgb(var(--text-primary))] tracking-tight">
                        {step === 'input' ? 'Kayıt Ol' : 'Doğrulama'}
                    </h2>
                    <p className="text-[rgb(var(--text-secondary))] text-xs md:text-sm font-medium mt-2">
                        {step === 'input'
                            ? 'Yeni bir hesap oluşturun ve aramıza katılın.'
                            : 'E-posta adresinize gönderilen kodu girin.'}
                    </p>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {(errors.general) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold text-center mb-8 border border-red-100"
                        >
                            {errors.general}
                        </motion.div>
                    )}
                </AnimatePresence>

                {step === 'input' ? (
                    <div className="space-y-8">
                        {/* Tab Switcher */}


                        <form onSubmit={handleSendOtp} className="space-y-5">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Name Input */}
                                <div className="relative group max">
                                    <div className="item-center justify-center absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[rgb(var(--text-tertiary))] group-focus-within:text-orange-500 transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (errors.name) setErrors({ ...errors, name: '' });
                                        }}
                                        placeholder="Ad Soyad"
                                        className={`item-center justify-center w-full bg-[rgb(var(--bg-input))] border ${errors.name ? 'border-red-300 ring-2 ring-red-100' : 'border-[rgb(var(--border-primary))]'} max-h-12 rounded-3xl py-4 pl-12 pr-4 font-bold text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:font-medium placeholder:text-[rgb(var(--text-tertiary))]`}
                                        disabled={loading}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1 ml-4 font-bold">{errors.name}</p>}
                                </div>

                                {/* Phone Input - Compact Layout */}
                                <div className={`relative group flex items-center bg-[rgb(var(--bg-input))] border ${errors.phone ? 'border-red-300 ring-2 ring-red-100' : 'border-[rgb(var(--border-primary))]'} max-h-12 rounded-3xl focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all overflow-hidden`}>
                                    <div className="pl-5 pr-3 py-4 bg-[rgb(var(--bg-secondary))]/50 border-r border-[rgb(var(--border-primary))]/60 text-[rgb(var(--text-secondary))] font-bold text-sm flex items-center gap-2 select-none">
                                        <span>+90</span>
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => {
                                            setPhone(e.target.value.replace(/[^0-9]/g, ''));
                                            if (errors.phone) setErrors({ ...errors, phone: '' });
                                        }}
                                        placeholder="555 123 4567"
                                        maxLength={10}
                                        className="w-full bg-transparent border-none py-4 px-4 font-bold text-[rgb(var(--text-primary))] focus:outline-none focus:ring-0 placeholder:font-medium placeholder:text-[rgb(var(--text-tertiary))]"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div className="relative group">
                                <div className="item-center justify-center absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[rgb(var(--text-tertiary))] group-focus-within:text-orange-500 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    placeholder="E-posta Adresi"
                                    className={`w-full bg-[rgb(var(--bg-input))] border ${errors.email ? 'border-red-300 ring-2 ring-red-100' : 'border-[rgb(var(--border-primary))]'} rounded-3xl py-4 pl-12 pr-4 font-bold text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:font-medium placeholder:text-[rgb(var(--text-tertiary))]`}
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-orange-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Devam Et <ArrowRight size={20} /></>}
                            </button>
                        </form>
                    </div>
                ) : (
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleVerifyOtp}
                        className="space-y-6"
                    >
                        <div className="text-center mb-2">
                            <span className="bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] px-4 py-1 rounded-full text-xs font-bold font-mono">
                                {email}
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[rgb(var(--text-primary))] mb-2 pl-1 text-center">Doğrulama Kodu</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} // Numeric only
                                    placeholder="123456"
                                    maxLength={6}
                                    className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-3xl px-12 py-4 font-black text-center text-2xl tracking-[0.5em] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-lg placeholder:text-[rgb(var(--text-tertiary))]"
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otpCode.length < 6}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-orange-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Doğrula ve Tamamla'}
                        </button>

                        <div className="flex items-center justify-between pt-4 border-t border-[rgb(var(--border-primary))]">
                            <button
                                type="button"
                                onClick={() => { setStep('input'); setOtpCode(''); setErrors({}); }}
                                className="text-sm font-bold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] flex items-center gap-1 transition-colors"
                            >
                                <ChevronLeft size={16} /> Değiştir
                            </button>

                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={timer > 0 || loading}
                                className={`text-sm font-bold flex items-center gap-2 transition-colors ${timer > 0 ? 'text-zinc-300 cursor-not-allowed' : 'text-orange-600 hover:text-orange-700'}`}
                            >
                                {timer > 0 ? `${timer}s bekleyin` : <>Tekrar Gönder <RefreshCw size={14} /></>}
                            </button>
                        </div>
                    </motion.form>
                )}

                <div className="mt-8 space-y-4 text-center">
                    <p className="text-[rgb(var(--text-secondary))] text-sm font-medium">
                        Zaten hesabınız var mı?{' '}
                        <Link to="/login" className="text-orange-600 font-bold hover:underline">
                            Giriş Yap
                        </Link>
                    </p>
                    <div className="w-full h-px bg-[rgb(var(--border-primary))]" />
                    <p className="text-xs text-[rgb(var(--text-tertiary))] font-medium leading-relaxed">
                        Kayıt olarak <Link to="/legal/terms" className="text-[rgb(var(--text-secondary))] hover:text-orange-500 underline">Kullanım Şartları</Link>'nı ve <Link to="/legal/privacy" className="text-[rgb(var(--text-secondary))] hover:text-orange-500 underline">Gizlilik Politikası</Link>'nı kabul etmiş olursunuz.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
