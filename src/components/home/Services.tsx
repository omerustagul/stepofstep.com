import { motion } from 'framer-motion';
import { Palette, Share2, TrendingUp, Monitor, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Services = () => {
    const { t } = useTranslation();

    const services = [
        {
            icon: <Palette size={20} />,
            title: t('services.brand_identity'),
            description: t('services.brand_desc'),
            link: '/services/branding'
        },
        {
            icon: <Share2 size={20} />,
            title: t('services.social_media'),
            description: t('services.social_desc'),
            link: '/services/marketing'
        },
        {
            icon: <TrendingUp size={20} />,
            title: t('services.digital_marketing'),
            description: t('services.marketing_desc'),
            link: '/services/marketing'
        },
        {
            icon: <Monitor size={20} />,
            title: t('services.web_dev'),
            description: t('services.web_desc'),
            link: '/services/development'
        }
    ];

    return (
        <section id="services" className="max-w-6xl mx-auto px-6 py-20 relative">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-5xl font-bold mb-4 text-[rgb(var(--text-primary))]"
                    >
                        {t('services.title')}
                    </motion.h2>
                    <div className="w-20 h-1 bg-orange-500 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card p-8 rounded-3xl bg-[rgb(var(--bg-card))]/50 relative border border-[rgb(var(--border-primary))] group hover:-translate-y-2 transition-transform duration-300"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                                    {service.icon}
                                </div>
                                <Link
                                    to={service.link}
                                    className="h-10 w-10 flex items-center justify-center p-2 bg-[rgb(var(--bg-card))] rounded-2xl text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--bg-icon-orange))] transition-colors shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300 border border-[rgb(var(--border-primary))]"
                                >
                                    <Eye size={20} />
                                </Link>
                            </div>

                            <h3 className="text-xl font-bold mb-3 text-[rgb(var(--text-primary))]">{service.title}</h3>
                            <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
