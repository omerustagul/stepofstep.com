import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Rocket } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import NotificationCenter from '../common/NotificationCenter';

const Navbar = () => {
    // const [isOpen, setIsOpen] = useState(false); // Validated removal
    const { t } = useTranslation();
    const { settings, getPagePath } = useSiteSettings();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if admin bar should be visible
    const isAdminUser = user && ['admin', 'marketing', 'designer'].includes(user.role);

    const scrollToSection = (id: string) => {
        // setIsOpen(false); // Removed

        const homePath = getPagePath('Ana Sayfa', '/');

        if (location.pathname !== homePath) {
            // Farklı sayfadayız, önce ana sayfaya git
            navigate(`${homePath}#${id}`);
        } else {
            // Ana sayfadayız, doğrudan scroll et
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // URL hash değiştiğinde scroll et
    useEffect(() => {
        const homePath = getPagePath('Ana Sayfa', '/');
        if (location.pathname === homePath && location.hash) {
            const id = location.hash.replace('#', '');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, [location, getPagePath]);

    return (
        <nav className={`fixed left-0 right-0 z-50 py-4 ${isAdminUser ? 'top-8' : 'top-0'}`}>
            <div className="max-w-6xl mx-auto px-6">
                <div className="glass-panel h-16 rounded-3xl bg-[rgb(var(--bg-card))]/50 backdrop-blur-[6px] border border-[rgb(var(--border-primary))]/60 px-4 pr-3 md:pr-4 py-2 flex items-center justify-between">

                    {/* Logo */}
                    <Link to={getPagePath('Ana Sayfa', '/')} className="flex items-center gap-2 group">
                        {settings.logoUrl ? (
                            <img
                                src={settings.logoUrl}
                                alt={settings.title}
                                className="object-contain transition-transform group-hover:scale-105"
                                style={{
                                    width: `${window.innerWidth < 768 ? (settings.logoWidthMobile || 80) : (settings.logoWidthDesktop || 100)}px`,
                                    height: 'auto'
                                }}
                            />
                        ) : (
                            <>
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                                    S
                                </div>
                                <span className="font-bold text-xl tracking-tight">
                                    STEP OF <span className="text-orange-500">STEP</span>
                                </span>
                            </>
                        )}
                    </Link>



                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => {
                                    if (location.pathname !== '/') {
                                        navigate('/');
                                        // wrapper to ensure scroll happens after nav
                                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                                    } else {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                className="text-sm font-medium text-[rgb(var(--text-primary))] hover:text-orange-500 transition-colors"
                            >
                                {t('nav.home')}
                            </button>
                            <button onClick={() => scrollToSection('services')} className="text-sm font-medium text-[rgb(var(--text-primary))] hover:text-orange-500 transition-colors">
                                {t('nav.services')}
                            </button>
                            <button onClick={() => scrollToSection('portfolio')} className="text-sm font-medium text-[rgb(var(--text-primary))] hover:text-orange-500 transition-colors">
                                {t('nav.portfolio')}
                            </button>
                            <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-[rgb(var(--text-primary))] hover:text-orange-500 transition-colors">
                                İletişim
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <NotificationCenter />

                            <Link
                                to="/portal"
                                className="glass-button px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 text-orange-500 hover:bg-orange-500 hover:text-white"
                            >
                                Portal <Rocket size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Mobile: Contact Button (Text + Icon) */}
                    <button
                        onClick={() => scrollToSection('contact')}
                        className="md:hidden glass-button h-10 px-3 py-2 bg-white hover:bg-orange-500 hover:text-white rounded-2xl text-orange-500 text-[12px] font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/10 active:scale-95 transition-all"
                    >
                        <span>Dijital Dönüşüm</span>
                        <Rocket size={12} />
                    </button>

                    {/* Mobile Toggle (Hidden as per request, replaced by bottom nav) */}
                    {/* <button
                        className="md:hidden text-orange-500 hover:text-orange-600"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X /> : <Menu />}
                    </button> */}
                </div>
            </div>

            {/* Mobile Menu */}

        </nav>
    );
};

export default Navbar;
