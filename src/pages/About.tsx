import { motion } from 'framer-motion';
import { Target, Zap, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/common/SEO';

const About = () => {
    const { t } = useTranslation();

    const stats = [
        { number: '150+', label: t('about.stats.projects') },
        { number: '98%', label: t('about.stats.satisfaction') },
        { number: '12', label: t('about.stats.awards') },
        { number: '24/7', label: t('about.stats.support') }
    ];

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] font-sans transition-colors duration-300">
            <SEO path="/about" />
            {/* Hero Section */}
            <section className="relative py-32 md:py-36 bg-zinc-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-12 md:pt-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <span className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-4 block">{t('about.our_story')}</span>
                        <h1 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
                            {t('about.title')} <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">{t('about.title_highlight')}</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-300 font-light leading-relaxed">
                            {t('about.description')}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-20 -mt-16 max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[rgb(var(--bg-card))] p-6 md:p-8 rounded-3xl shadow-xl text-center border border-[rgb(var(--border-primary))]"
                        >
                            <h3 className="text-4xl md:text-5xl font-black text-[rgb(var(--text-primary))] mb-2">{stat.number}</h3>
                            <p className="text-[rgb(var(--text-secondary))] font-medium text-sm uppercase tracking-wide">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="py-24 max-w-6xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold text-[rgb(var(--text-primary))] mb-6 whitespace-pre-line">{t('about.tagline')}</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 text-[rgb(var(--text-primary))]">{t('about.vision')}</h3>
                                    <p className="text-[rgb(var(--text-secondary))] leading-relaxed">{t('about.vision_desc')}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 text-[rgb(var(--text-primary))]">{t('about.mission')}</h3>
                                    <p className="text-[rgb(var(--text-secondary))] leading-relaxed">{t('about.mission_desc')}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
                            alt="Team meeting"
                            className="rounded-[2.5rem] shadow-2xl z-10 relative"
                        />
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-20 -z-0" />
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 -z-0" />
                    </motion.div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-24 bg-[rgb(var(--bg-secondary))] transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-orange-500 font-bold uppercase tracking-wider text-sm">{t('about.values.title')}</span>
                        <h2 className="text-4xl font-bold text-[rgb(var(--text-primary))] mt-2">{t('about.values.title')}</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: t('about.values.innovation'), desc: t('about.values.innovation_desc'), color: 'bg-purple-100 text-purple-600' },
                            { title: t('about.values.partnership'), desc: t('about.values.partnership_desc'), color: 'bg-green-100 text-green-600' },
                            { title: t('about.values.excellence'), desc: t('about.values.excellence_desc'), color: 'bg-yellow-100 text-yellow-600' }
                        ].map((val, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -10 }}
                                className="p-8 rounded-3xl bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] hover:shadow-xl transition-all"
                            >
                                <div className={`w-14 h-14 ${val.color} rounded-2xl flex items-center justify-center mb-6`}>
                                    <Award size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-3">{val.title}</h3>
                                <p className="text-[rgb(var(--text-secondary))] leading-relaxed">{val.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
