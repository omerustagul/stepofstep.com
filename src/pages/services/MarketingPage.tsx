import { motion } from 'framer-motion';
import { TrendingUp, Share2, BarChart } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { useSiteSettings } from '../../context/SiteContext';

const MarketingPage = () => {
    const { getPagePath } = useSiteSettings();

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] font-sans transition-colors duration-300">
            <SEO path={getPagePath('Dijital Pazarlama', '/services/marketing')} />
            <section className="relative py-32 bg-green-600 text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-zinc-900/60 opacity-50" />

                {/* Motion Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ x: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 7, repeat: Infinity }}
                        className="absolute top-10 left-10 w-64 h-64 bg-green-300 rounded-full blur-[90px] opacity-30"
                    />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1"
                    >
                        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                            Ölçeklenebilir <br /><span className="text-green-300">Büyüme</span>
                        </h1>
                        <p className="text-xl text-zinc-300 mb-8 max-w-lg leading-relaxed">
                            Yatırım getirisini (ROI) en üst düzeye çıkarmak ve markanızı doğru kitleyle doğru zamanda buluşturmak için veri odaklı stratejiler.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 relative"
                    >
                        <div className="aspect-square bg-gradient-to-tr from-green-500 to-emerald-500 rounded-full blur-[100px] opacity-20 absolute inset-0" />
                        <img
                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
                            alt="Dijital Pazarlama"
                            className="rounded-3xl shadow-2xl relative z-10 rotate-3 hover:rotate-0 transition-transform duration-700 border-2 border-white/10"
                        />
                    </motion.div>
                </div>
            </section>

            <section className="py-24 max-w-6xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Dijital Strateji', desc: 'Online büyüme ve etkileşim için kapsamlı, sonuç odaklı yol haritaları.', icon: TrendingUp },
                        { title: 'Sosyal Medya', desc: 'Etkileşimi artıran içerik yönetimi ve topluluk oluşturma stratejileri.', icon: Share2 },
                        { title: 'Performans Reklamları', desc: 'Dönüşüm optimizeli PPC, Meta ve Google reklam kampanyaları.', icon: BarChart }
                    ].map((service, idx) => (
                        <div key={idx} className="bg-[rgb(var(--bg-card))] p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-[rgb(var(--border-primary))] group">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <service.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">{service.title}</h3>
                            <p className="text-[rgb(var(--text-secondary))]">{service.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default MarketingPage;
