import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Mail, Lock, ChevronLeft, RefreshCw, Smartphone } from 'lucide-react';
import SEO from '../components/common/SEO';

const Login = () => {
    // State
    const [step, setStep] = useState<'input' | 'verify'>('input');
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);

    // Context & Hooks
    const { sendOtp, verifyOtp, isAuthenticated, user, isLoading: authLoading } = useAuth();
    const { settings } = useSiteSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            const from = (location.state as any)?.from?.pathname ||
                (['admin', 'marketing', 'designer'].includes(user.role) ? '/admin' : '/app');
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, authLoading, navigate, location]);

    // Timer Logic
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Handlers
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        let identifier = loginMethod === 'email' ? email : phone;
        let finalIdentifier = identifier.trim();

        if (loginMethod === 'phone') {
            // Remove all non-digit chars first for cleaning
            finalIdentifier = finalIdentifier.replace(/[^0-9]/g, '');

            // If starts with 0, remove it
            if (finalIdentifier.startsWith('0')) {
                finalIdentifier = finalIdentifier.substring(1);
            }
            // Prepend +90
            finalIdentifier = '+90' + finalIdentifier;
        }

        if (finalIdentifier.length < 3) {
            setError(loginMethod === 'email' ? 'Lütfen geçerli bir e-posta adresi giriniz.' : 'Lütfen geçerli bir telefon numarası giriniz.');
            return;
        }

        setLoading(true);
        const { error: sendError } = await sendOtp(finalIdentifier, { shouldCreateUser: false });
        setLoading(false);

        if (sendError) {
            setError(sendError);
        } else {
            setStep('verify');
            setTimer(120); // 2 minutes cooldown
            setError(null);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!otpCode || otpCode.length < 6) {
            setError('Lütfen 6 haneli doğrulama kodunu giriniz.');
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
        setLoading(false);

        if (verifyError) {
            setError(verifyError);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        let identifier = loginMethod === 'email' ? email : phone;
        let finalIdentifier = identifier.trim();

        if (loginMethod === 'phone') {
            finalIdentifier = finalIdentifier.replace(/[^0-9]/g, '');
            if (finalIdentifier.startsWith('0')) finalIdentifier = finalIdentifier.substring(1);
            finalIdentifier = '+90' + finalIdentifier;
        }

        setLoading(true);
        const { error: sendError } = await sendOtp(finalIdentifier, { shouldCreateUser: false });
        setLoading(false);
        if (sendError) setError(sendError);
        else setTimer(120);
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
            <SEO title="Giriş Yap - Step of Step" />

            {/* Background Decor */}
            <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 md:p-12 rounded-[2.5rem] w-full max-w-md bg-[rgb(var(--bg-card))]/90 backdrop-blur-sm border border-[rgb(var(--border-primary))]/50 shadow-2xl relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                            title="Geri Dön"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <Link to="/" className="inline-block hover:scale-105 transition-transform">
                            {settings.faviconUrl ? (
                                <img
                                    src={settings.faviconUrl}
                                    alt="Logo"
                                    className="glass-panel w-16 h-16 rounded-full shadow-xl object-contain bg-orange-500/5 bg-blur-sm p-0.5"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-orange-500/30">
                                    S
                                </div>
                            )}
                        </Link>

                        {/* Spacer for visual balance if needed, or just leave it left-heavy? 
                            Let's add a dummy spacer of same size so logo stays centered relative to the container if we want perfect center.
                            But user said "next to logo", not necessarily keeping logo dead center of card. 
                            However, the header says "text-center", so centering is likely desired. 
                        */}
                        <div className="w-12" /> {/* Invisible spacer to balance the button */}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-[rgb(var(--text-primary))] tracking-tight">
                        {step === 'input' ? t('auth.welcome_back') : 'Doğrulama'}
                    </h2>
                    <p className="text-[rgb(var(--text-secondary))] text-xs md:text-sm font-medium mt-2">
                        {step === 'input'
                            ? 'Hesabınıza güvenle giriş yapın.'
                            : `${loginMethod === 'email' ? 'E-posta adresinize' : 'Telefonunuza'} gönderilen kodu girin.`}
                    </p>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold text-center mb-6 border border-red-100"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {step === 'input' ? (
                    <div className="space-y-8">
                        {/* Tab Switcher */}
                        <div className="bg-[rgb(var(--bg-secondary))] p-1.5 rounded-2xl flex relative overflow-hidden">
                            {/* Active Tab Indicator Background */}
                            <motion.div
                                className="absolute top-1.5 bottom-1.5 rounded-xl bg-[rgb(var(--bg-primary))] shadow-sm border border-black/5 dark:border-white/5"
                                initial={false}
                                animate={{
                                    x: loginMethod === 'email' ? 0 : '100%',
                                    width: '48%'
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />

                            <button
                                onClick={() => { setLoginMethod('email'); setError(null); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors ${loginMethod === 'email' ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
                            >
                                <Mail size={18} />
                                E-posta
                            </button>
                            <button
                                onClick={() => { setLoginMethod('phone'); setError(null); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors ${loginMethod === 'phone' ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
                            >
                                <Smartphone size={18} />
                                Telefon
                            </button>
                        </div>

                        <form onSubmit={handleSendOtp} className="relative mt-8">
                            <div className="relative group">
                                {/* Animated Icon/Prefix Section */}
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                    <AnimatePresence mode="wait" initial={false}>
                                        {loginMethod === 'email' ? (
                                            <motion.div
                                                key="email-icon"
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: -20, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-[rgb(var(--text-tertiary))] group-focus-within:text-orange-500 transition-colors"
                                            >
                                                <Mail size={20} />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="phone-icon"
                                                initial={{ x: 20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: 20, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex items-center gap-2 text-[rgb(var(--text-primary))]"
                                            >
                                                <div className="w-6 h-4 rounded overflow-clip shadow-sm">
                                                    <img src="https://flagcdn.com/tr.svg" alt="TR" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-bold text-lg tracking-tight">+90</span>
                                                <div className="w-px h-5 bg-zinc-200 ml-0.5"></div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Input Field */}
                                <input
                                    type={loginMethod === 'email' ? 'email' : 'tel'}
                                    value={loginMethod === 'email' ? email : phone}
                                    onChange={(e) => {
                                        if (loginMethod === 'email') {
                                            setEmail(e.target.value);
                                        } else {
                                            setPhone(e.target.value.replace(/[^0-9]/g, ''));
                                        }
                                    }}
                                    placeholder={loginMethod === 'email' ? 'ornek@mail.com' : '5554443322'}
                                    className={`w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-3xl py-4 font-bold text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:font-normal placeholder:text-[rgb(var(--text-tertiary))] ${loginMethod === 'phone' ? 'pl-[6.5rem] pr-6' : 'px-12'}`}
                                    disabled={loading}
                                    autoFocus
                                    maxLength={loginMethod === 'phone' ? 10 : undefined}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || (loginMethod === 'email' ? !email : !phone)}
                                className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-orange-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Giriş Yap <ArrowRight size={20} /></>}
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
                                {loginMethod === 'email' ? email : '+90 ' + phone}
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
                            {loading ? <Loader2 className="animate-spin" /> : 'Giriş Yap'}
                        </button>

                        <div className="flex items-center justify-between pt-4 border-t border-[rgb(var(--border-primary))]">
                            <button
                                type="button"
                                onClick={() => { setStep('input'); setOtpCode(''); setError(null); }}
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

                {!loading && step === 'input' && (
                    <div className="mt-8 space-y-4 text-center">
                        <p className="text-[rgb(var(--text-secondary))] text-sm font-medium">
                            Hesabınız yok mu?{' '}
                            <Link to="/register" className="text-orange-600 font-bold hover:underline">
                                Hemen Kayıt Olun
                            </Link>
                        </p>
                        <div className="w-full h-px bg-[rgb(var(--border-primary))]" />
                        <p className="text-xs text-[rgb(var(--text-tertiary))] font-medium leading-relaxed">
                            Giriş yaparak <Link to="/legal/kullanim-kosullari" className="text-[rgb(var(--text-secondary))] hover:text-orange-500 underline">Kullanım Şartları</Link>'nı ve <Link to="/legal/gizlilik-politikasi" className="text-[rgb(var(--text-secondary))] hover:text-orange-500 underline">Gizlilik Politikası</Link>'nı kabul etmiş olursunuz.
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Login;
