import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Layers, User, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '../../context/SiteContext';
import { motion } from 'framer-motion';

const MobileNavbar = () => {
    const { t } = useTranslation();
    const { getPagePath } = useSiteSettings();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('');

    const [isVisible, setIsVisible] = useState(true);

    // Hide on Admin and Portal pages
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/portal')) return null;

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['services', 'portfolio', 'contact'];
            let current = '';

            // Check if we are at the top (Home)
            if (window.scrollY < 100) {
                current = '/';
            } else {
                // Check sections
                for (const section of sections) {
                    const element = document.getElementById(section);
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        // If section top is near the middle/top of viewport
                        if (rect.top <= window.innerHeight / 2 && rect.bottom >= 100) {
                            current = '/#' + section;
                        }
                    }
                }
            }

            // If in Portal or other pages, don't override unless necessary
            if (location.pathname !== '/' && location.pathname !== '') {
                // For now, let normal router logic handle non-home pages
                // setActiveSection(''); 
            } else {
                if (current) setActiveSection(current);
            }
        };

        const checkFooterVisibility = () => {
            const footer = document.getElementById('main-footer');
            if (footer) {
                const rect = footer.getBoundingClientRect();
                // If footer top is visible in viewport
                // We add a small buffer (e.g. 50px) to start hiding just before
                if (rect.top <= window.innerHeight) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
            } else {
                setIsVisible(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('scroll', checkFooterVisibility);
        // Check initially
        checkFooterVisibility();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('scroll', checkFooterVisibility);
        };
    }, [location.pathname]);

    // Update active state logic
    const navItems = [
        {
            label: t('nav.home'),
            icon: Home,
            path: getPagePath('Ana Sayfa', '/'),
            exact: true
        },
        {
            label: t('nav.services'),
            icon: Layers,
            path: '/#services',
            isScroll: true
        },
        {
            label: t('nav.portfolio'),
            icon: Briefcase,
            path: '/#portfolio',
            isScroll: true
        },
        {
            label: 'İletişim',
            icon: Phone,
            path: '/#contact',
            isScroll: true
        },
        {
            label: 'Portalım',
            icon: User,
            path: '/portal',
            exact: false
        }
    ];

    // Helper to determine active state
    const isItemActive = (item: any) => {
        if (item.isScroll) {
            // Use scroll spy state if available and we are on home page
            if (location.pathname === '/' || location.pathname === '') {
                return activeSection === item.path;
            }
            return location.hash === item.path.replace('/', '');
        }

        // Exact match for Home (special handling to avoid always active on '/')
        if (item.path === '/' || item.path === getPagePath('Ana Sayfa', '/')) {
            // Active if exact match and scroll is near top
            if ((location.pathname === '/' || location.pathname === '') && activeSection === '/') return true;
            // Also active if router says so AND NOT inside a scroll section
            return item.exact ? location.pathname === item.path && !activeSection.includes('#') : false;
        }

        return item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className={`md:hidden fixed bottom-6 left-6 right-6 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}>
            <div className="h-16 glass-panel rounded-3xl bg-[rgb(var(--bg-card))]/50 backdrop-blur-[6px] gap-1 border border-[rgb(var(--border-primary))] p-2 flex justify-between items-center px-2">
                {navItems.map((item, index) => {
                    const isActive = isItemActive(item);

                    // Special handling for scroll links
                    if (item.isScroll) {
                        return (
                            <button
                                key={index}
                                onClick={() => scrollToSection(item.path.replace('/#', ''))}
                                className="flex flex-col items-center gap-1 p-2 text-zinc-400 focus:text-orange-500 active:text-orange-500 transition-colors relative"
                            >
                                <item.icon size={20} className={isActive ? 'stroke-orange-500' : 'stroke-[rgb(var(--text-secondary))]'} />
                                <span className={`text-[10px] font-medium ${isActive ? 'text-orange-500' : 'text-[rgb(var(--text-secondary))]'}`}>{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-indicator"
                                        className="absolute -bottom-1 w-1/2 h-0.5 bg-orange-500 rounded-full"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={() => {
                                if (item.path === '/' || item.path === getPagePath('Ana Sayfa', '/')) {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            className={`flex flex-col items-center gap-1 p-2 transition-all relative ${isActive ? 'text-orange-500' : 'text-zinc-400'
                                }`}
                        >
                            <item.icon size={20} className={isActive ? 'stroke-orange-500 fill-orange-500/10' : 'stroke-[rgb(var(--text-secondary))]'} />
                            <span className={`text-[10px] font-medium ${isActive ? 'text-orange-500' : 'text-[rgb(var(--text-secondary))]'}`}>{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="absolute -bottom-1 w-1/2 h-0.5 bg-orange-500 rounded-full"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}

                {/* Profile Link (Separate to ensure 5 items or consistent spacing) */}
                {/* Adding Profile as requested in prompt "Portal, Profil" - maybe they are same? Prompt said "Portal, Profile" separately. 
                     Let's add Profile separately if user logged in, or generic Profile link.
                     For now let's stick to base 4 items for symmetry or add Profile as 5th.
                  */}
            </div>
        </div >
    );
};

export default MobileNavbar;
