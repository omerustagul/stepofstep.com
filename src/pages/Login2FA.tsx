import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const Login2FA = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth(); // needs2FA and verify2FA removed as they are missing in AuthContext
    const navigate = useNavigate();

    useEffect(() => {
        // If already authenticated, redirect to app
        if (isAuthenticated) {
            navigate('/app');
        }
        // If not needing 2FA (and not authenticated), direct to login
        // else if (!needs2FA) {
        //     navigate('/login');
        // }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // const { error } = await verify2FA(code);
        const error = "2FA özelliği şu anda devre dışı.";
        if (!error) {
            navigate('/admin');
        } else {
            setError(error || 'Girdiğiniz kod hatalı. Lütfen tekrar deneyiniz.');
        }
    };

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center p-6 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[rgb(var(--bg-card))] p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-[rgb(var(--border-primary))]"
            >
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} />
                </div>

                <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">İki Faktörlü Doğrulama</h2>
                <p className="text-[rgb(var(--text-secondary))] text-sm mb-6">
                    Güvenliğiniz için telefonunuza gönderilen 6 haneli doğrulama kodunu giriniz.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value);
                            setError('');
                        }}
                        placeholder="301225"
                        maxLength={6}
                        className={`w-full bg-[rgb(var(--bg-input))] border text-center text-2xl tracking-widest font-mono rounded-2xl px-4 py-4 focus:outline-none focus:ring-1 transition-all text-[rgb(var(--text-primary))] ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[rgb(var(--border-primary))] focus:border-orange-500 focus:ring-orange-500'
                            }`}
                        autoFocus
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
                    >
                        Doğrula
                    </button>
                </form>

                <p className="mt-6 text-xs text-[rgb(var(--text-tertiary))]">
                    Kod gelmedi mi? <button className="text-orange-500 font-bold hover:underline">Tekrar Gönder</button>
                </p>
            </motion.div>
        </div>
    );
};

export default Login2FA;
