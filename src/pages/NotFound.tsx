import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useSiteSettings } from '../context/SiteContext';

const NotFound = () => {
    const { getPagePath } = useSiteSettings();

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full"
            >
                <div className="text-[10rem] font-black text-orange-500/20 leading-none select-none">
                    404
                </div>
                <h1 className="text-4xl font-bold text-zinc-900 mb-4 -mt-12 relative z-10">
                    Sayfa Bulunamadı
                </h1>
                <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                    Aradığınız sayfa silinmiş, taşınmış veya hiç var olmamış olabilir.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to={getPagePath('Ana Sayfa', '/')}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl hover:scale-105 transition-transform font-medium justify-center"
                    >
                        <Home size={18} />
                        Ana Sayfa
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors font-medium justify-center"
                    >
                        <ArrowLeft size={18} />
                        Geri Dön
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
