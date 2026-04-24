import { motion } from 'framer-motion';
import { PenTool } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { useSiteSettings } from '../../context/SiteContext';

const BrandingPage = () => {
    const { getPagePath } = useSiteSettings();

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] font-sans transition-colors duration-300">
            <SEO path={getPagePath('Markalama Hizmeti', '/services/branding')} />
            {/* Hero */}
            <section className="relative py-32 bg-purple-600 text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-zinc-900/60 opacity-90" />

                {/* Motion Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute -top-20 -right-20 w-96 h-96 bg-purple-300 rounded-full blur-[100px] opacity-30"
                    />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1"
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                            İz Bırakan <br /><span className="text-purple-300">Marka Kimliği</span>
                        </h1>
                        <p className="text-xl text-zinc-300 mb-8 max-w-lg leading-relaxed">
                            Sadece iyi görünmekle kalmayan, kim olduğunuzu ve neden önemli olduğunuzu anlatan unutulmaz marka hikayeleri tasarlıyoruz.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 relative"
                    >
                        <div className="aspect-square bg-gradient-to-tr from-purple-500 to-orange-500 rounded-full blur-[100px] opacity-20 absolute inset-0" />
                        <img
                            src="https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800"
                            alt="Marka Tasarımı"
                            className="rounded-3xl shadow-2xl relative z-10 rotate-3 hover:rotate-0 transition-transform duration-700 border border-white/10"
                        />
                    </motion.div>
                </div>
            </section>

            <section className="py-24 max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))]">Markalama Hizmetlerimiz</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Logo Tasarımı', desc: 'Görsel kimliğinizi yansıtan, akılda kalıcı ve özgün logo çalışmaları.' },
                        { title: 'Marka Rehberi', desc: 'Tüm kanallarda tutarlılık sağlayan kapsamlı kurumsal kimlik kılavuzları.' },
                        { title: 'Görsel Kimlik', desc: 'Renk paletleri, tipografi ve görüntü sistemleriyle bütüncül tasarım dili.' }
                    ].map((service, idx) => (
                        <div key={idx} className="bg-[rgb(var(--bg-card))] p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-[rgb(var(--border-primary))] group">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <PenTool size={24} />
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

export default BrandingPage;
