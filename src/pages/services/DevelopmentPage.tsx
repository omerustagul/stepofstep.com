import { motion } from 'framer-motion';
import { Code2, Smartphone, Globe } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { useSiteSettings } from '../../context/SiteContext';

const DevelopmentPage = () => {
    const { getPagePath } = useSiteSettings();

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] font-sans transition-colors duration-300">
            <SEO path={getPagePath('Yazılım Geliştirme', '/services/development')} />
            <section className="relative py-32 bg-blue-600 text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-zinc-900/60 opacity-40" />

                {/* Motion Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ y: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-400 rounded-full blur-[150px] opacity-20"
                    />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1"
                    >
                        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                            Geleceği <br /><span className="text-blue-300">Kodluyoruz</span>
                        </h1>
                        <p className="text-xl text-zinc-100 mb-8 max-w-lg leading-relaxed">
                            Ölçeklenebilir web uygulamalarından güçlü kurumsal yazılımlara, işletmenizi büyütecek teknolojiler ve dijital çözümler inşa ediyoruz.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 relative"
                    >
                        <div className="aspect-square bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-full blur-[100px] opacity-20 absolute inset-0" />
                        <img
                            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
                            alt="Yazılım Geliştirme"
                            className="rounded-3xl shadow-2xl relative z-10 -rotate-3 hover:rotate-0 transition-transform duration-700 border-2 border-white/10"
                        />
                    </motion.div>
                </div>
            </section>

            <section className="py-24 max-w-6xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Web Geliştirme', desc: 'React, Next.js ve Node.js ile modern, hızlı ve responsive web siteleri.', icon: Globe },
                        { title: 'Mobil Uygulama', desc: 'iOS ve Android için yüksek performanslı native ve cross-platform uygulamalar.', icon: Smartphone },
                        { title: 'Özel Yazılım', desc: 'İşletmenizin ihtiyaçlarına özel, verimliliği artıran kurumsal çözümler.', icon: Code2 }
                    ].map((service, idx) => (
                        <div key={idx} className="bg-[rgb(var(--bg-card))] p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-[rgb(var(--border-primary))] group">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
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

export default DevelopmentPage;
