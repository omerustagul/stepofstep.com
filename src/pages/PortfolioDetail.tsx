import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { usePortfolio, type PortfolioItem } from '../context/PortfolioContext';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const PortfolioDetail = () => {
    const { id } = useParams();
    const { getItemBySlug } = usePortfolio();
    const navigate = useNavigate();
    const [portfolio, setPortfolio] = useState<PortfolioItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPortfolio = async () => {
            if (!id) return;
            setLoading(true);
            const data = await getItemBySlug(id);
            setPortfolio(data);
            setLoading(false);
        };
        loadPortfolio();
    }, [id, getItemBySlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (!portfolio) {
        return <Navigate to="/404" replace />;
    }

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] pt-28 transition-colors duration-300">
            {/* Hero Section - Contained with rounded corners */}
            <div className="max-w-6xl mx-auto pt-6 px-6">
                {/* Back Button - Compact inline */}
                <button
                    onClick={() => navigate('/#portfolio')}
                    className="inline-flex items-center gap-1.5 text-[rgb(var(--text-secondary))] hover:text-orange-500 mb-3 text-sm transition-colors"
                >
                    <ArrowLeft size={16} />
                    Projelere Dön
                </button>

                {/* Hero Image Card */}
                <div className="relative h-[45vh] md:h-[55vh] w-full overflow-hidden rounded-3xl shadow-xl">
                    <img
                        src={portfolio.image || portfolio.imageUrl}
                        alt={portfolio.name || portfolio.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl"
                        >
                            <div className="flex flex-wrap gap-2 mb-4">
                                {((Array.isArray(portfolio.serviceType) ? portfolio.serviceType : (portfolio.serviceType ? [portfolio.serviceType] : (portfolio.category ? [portfolio.category] : []))) as string[]).map((cat, i) => (
                                    <span key={i} className="px-4 py-1.5 bg-orange-500 text-white text-[10px] font-black rounded-full shadow-lg border border-orange-400/50">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-white mb-3 leading-tight">
                                {portfolio.name || portfolio.title}
                            </h1>
                            <p className="text-sm md:text-sm text-zinc-200 max-w-2xl font-light">
                                {portfolio.description}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-16">

                        {/* Challenge & Solution */}
                        {(portfolio.challenge || portfolio.solution) && (
                            <section className="grid md:grid-cols-2 gap-8">
                                {portfolio.challenge && (
                                    <div className="bg-[rgb(var(--bg-card))] p-4 rounded-3xl shadow-sm border border-[rgb(var(--border-primary))]">
                                        <h3 className="text-lg font-bold text-[rgb(var(--text-primary))] mb-3">Markanın Problemi</h3>
                                        <p className="text-[rgb(var(--text-secondary))] leading-relaxed">{portfolio.challenge}</p>
                                    </div>
                                )}
                                {portfolio.solution && (
                                    <div className="bg-zinc-900 p-4 rounded-3xl text-white shadow-xl">
                                        <h3 className="text-lg font-bold mb-3 text-orange-400">Çözüm Planı</h3>
                                        <p className="text-zinc-300 leading-relaxed">{portfolio.solution}</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Gallery */}
                        {portfolio.galleryImages && portfolio.galleryImages.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-8">Proje Görselleri</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {portfolio.galleryImages.map((img, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="rounded-3xl overflow-hidden shadow-lg h-64 md:h-80"
                                        >
                                            <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Client Info */}
                        <div className="bg-[rgb(var(--bg-card))] p-4 rounded-3xl shadow-lg border border-[rgb(var(--border-primary))] sticky top-8 text-[rgb(var(--text-primary))]">
                            <h3 className="text-lg font-bold text-[rgb(var(--text-primary))] mb-3 pb-3 border-b border-[rgb(var(--border-primary))]">Proje Detayları</h3>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-[rgb(var(--text-tertiary))] font-bold mb-1">Marka</p>
                                    <p className="text-[rgb(var(--text-primary))] font-medium text-lg">{portfolio.clientName || 'Confidential'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[rgb(var(--text-tertiary))] font-bold mb-2">Hizmet Türleri</p>
                                    <div className="flex flex-wrap gap-1">
                                        {((Array.isArray(portfolio.serviceType) ? portfolio.serviceType : (portfolio.serviceType ? [portfolio.serviceType] : (portfolio.category ? [portfolio.category] : []))) as string[]).map((cat, i) => (
                                            <span key={i} className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {portfolio.results && portfolio.results.length > 0 && (
                                    <div>
                                        <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-bold mb-3">Sonuçlar</p>
                                        <ul className="space-y-3">
                                            {portfolio.results.map((result, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-[rgb(var(--text-secondary))] text-sm">
                                                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                    <span>{result}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioDetail;
