import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, ChevronLeft, Loader2 } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { adminLogin, user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            navigate('/admin');
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: loginError } = await adminLogin(email, password);
            if (loginError) {
                setError(loginError);
            } else {
                navigate('/admin');
            }
        } catch (err) {
            setError('Beklenmedik bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] grayscale pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Back to Site */}
                <Link to="/" className="inline-flex items-center gap-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--accent-primary))] transition-colors mb-2 text-sm group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Siteye Geri Dön
                </Link>

                <div className="glass-panel p-3 md:p-6 rounded-3xl border border-[rgb(var(--border-primary))]/60 bg-[rgb(var(--bg-card))]/40 backdrop-blur-md shadow-2xl shadow-black/20">
                    <div className="flex flex-col items-center text-center mb-5">
                        <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Shield size={26} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-[rgb(var(--text-primary))] tracking-tight mb-2">Yönetici Girişi</h1>
                        <p className="text-[rgb(var(--text-secondary))] text-sm max-w-[240px]">Lütfen yetkili hesap bilgilerinizle giriş yapın.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[rgb(var(--text-secondary))] ml-1">E-Posta Adresi</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@stepofstep.com"
                                    className="w-full h-12 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl pl-12 pr-4 text-[rgb(var(--text-primary))] placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[rgb(var(--text-secondary))] ml-1">Şifre</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl pl-12 pr-4 text-[rgb(var(--text-primary))] placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                                >
                                    <AlertCircle size={16} className="shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    Giriş Yap
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-white/5 text-center">
                        <p className="text-[rgb(var(--text-secondary))] text-xs font-medium">
                            Step of Step | Yönetim Paneli ©2026
                        </p>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-zinc-400 text-[11px]">
                        &copy; {new Date().getFullYear()} Step of Step. Tüm Hakları Saklıdır.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
