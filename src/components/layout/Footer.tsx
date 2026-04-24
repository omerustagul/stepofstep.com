import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Instagram, Linkedin, MessageCircle, Mail } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteContext';

const Footer = () => {
    const { t } = useTranslation();
    const { settings, getPagePath } = useSiteSettings();

    return (
        <footer id="main-footer" className="bg-[rgb(var(--bg-primary))] border-t border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] pt-20 pb-10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-6">
                    {/* Brand Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            {settings.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" className="h-8 md:h-10 w-auto object-contain br" />
                            ) : (
                                <div className="text-2xl font-bold tracking-tighter">
                                    Step Of Step
                                </div>
                            )}
                        </div>
                        <p className="text-[rgb(var(--text-secondary))] leading-relaxed">
                            {t('footer.desc')}
                        </p>
                        <div className="flex gap-4">
                            {[
                                { icon: Facebook, link: 'https://facebook.com/sosagency' },
                                { icon: Twitter, link: 'https://twitter.com/sosagency' },
                                { icon: Instagram, link: 'https://instagram.com/sosagency' },
                                { icon: Linkedin, link: 'https://linkedin.com/company/sosagency' }
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-[rgb(var(--bg-secondary))] flex items-center justify-center text-[rgb(var(--text-secondary))] hover:bg-orange-500 hover:text-white transition-all"
                                >
                                    <social.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-[rgb(var(--text-primary))] font-bold mb-4">{t('footer.company')}</h4>
                        <ul className="space-y-2 text-[rgb(var(--text-secondary))]">
                            <li><Link to={getPagePath('Portal', '/portal')} className="hover:text-orange-500 transition-colors">{t('footer.portal')}</Link></li>
                            <li><Link to={getPagePath('Hakkımızda', '/about')} className="hover:text-orange-500 transition-colors">{t('footer.about')}</Link></li>
                            <li><Link to={getPagePath('Kariyer', '/careers')} className="hover:text-orange-500 transition-colors">{t('footer.careers')}</Link></li>
                            <li><Link to={getPagePath('İletişim', '/contact')} className="hover:text-orange-500 transition-colors">{t('footer.contact')}</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-[rgb(var(--text-primary))] font-bold mb-4">{t('footer.services')}</h4>
                        <ul className="space-y-2 text-[rgb(var(--text-secondary))]">
                            <li><Link to={getPagePath('Markalama Hizmeti', '/services/branding')} className="hover:text-orange-500 transition-colors">{t('services.brand_identity')}</Link></li>
                            <li><Link to={getPagePath('Dijital Pazarlama', '/services/marketing')} className="hover:text-orange-500 transition-colors">{t('services.social_media')}</Link></li>
                            <li><Link to={getPagePath('Dijital Pazarlama', '/services/marketing')} className="hover:text-orange-500 transition-colors">{t('services.digital_marketing')}</Link></li>
                            <li><Link to={getPagePath('Yazılım Geliştirme', '/services/development')} className="hover:text-orange-500 transition-colors">{t('services.web_dev')}</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-[rgb(var(--text-primary))] font-bold mb-4">{t('footer.legal')}</h4>
                        <ul className="space-y-2 text-[rgb(var(--text-secondary))] mb-8">
                            {settings.policies?.map(policy => (
                                <li key={policy.id}>
                                    <Link to={`/legal/${policy.slug}`} className="hover:text-orange-500 transition-colors">
                                        {policy.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[rgb(var(--border-primary))] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[rgb(var(--text-secondary))] text-sm">
                    <p>&copy; {new Date().getFullYear()} Step Of Step. {t('footer.rights')}</p>
                    <div className="flex gap-8">
                        <a href="mailto:support@stepofstep.com" className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                            <Mail size={14} />
                            <span> support@stepofstep.com</span>
                        </a>
                        <a href="https://wa.me/908503033853" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                            <MessageCircle size={14} />
                            <span>Live Support</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
