
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, User, Mail, Lock } from 'lucide-react';

const AdminProfile = () => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            updateProfile(formData.name, formData.email, formData.password);
            setMessage({ type: 'success', text: 'Profil başarıyla güncellendi.' });
            setFormData(prev => ({ ...prev, password: '' })); // Clear password
        } catch (error) {
            setMessage({ type: 'error', text: 'Güncelleme sırasında bir hata oluştu.' });
        }

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-zinc-900">Profil Ayarları</h1>
                <p className="text-zinc-500">Hesap bilgilerinizi güncelleyin.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl space-y-6 shadow-sm border border-zinc-200">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-zinc-700 block mb-2">Ad Soyad</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-50 border border-zinc-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-700 block mb-2">E-posta Adresi</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-50 border border-zinc-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-700 block mb-2">Yeni Şifre (İsteğe Bağlı)</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Değiştirmek istemiyorsanız boş bırakın"
                                className="w-full bg-slate-50 border border-zinc-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}

                <div className="pt-4">
                    <button
                        type="submit"
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-8 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-zinc-900/20"
                    >
                        <Save size={20} />
                        Değişiklikleri Kaydet
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminProfile;
