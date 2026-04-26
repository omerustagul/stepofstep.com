import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Calendar, Home, Rocket, MessageSquare, Gift, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteContext';
import { motion, AnimatePresence } from 'framer-motion';
import MobileNavbar from '../layout/MobileNavbar';
import FloatingWheelButton from '../common/FloatingWheelButton';
import PortalMobileHeader from './PortalMobileHeader';
import UpgradeModal from '../common/UpgradeModal';

const PortalLayout = () => {
    const { logout, user } = useAuth();
    const { settings } = useSiteSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const sidebarItems = [
        {
            label: 'Genel Bakış',
            path: '/portal',
            icon: LayoutDashboard
        },
        {
            label: 'Uygulamalar',
            path: '/portal/apps',
            icon: Rocket // or Grid
        },
        {
            label: 'Randevularım',
            path: '/portal/appointments',
            icon: Calendar
        },
        {
            label: 'Destek',
            path: '/portal/support',
            icon: MessageSquare
        },
        {
            label: 'Ödüllerim',
            path: '/portal/rewards',
            icon: Gift
        },
        {
            label: 'AI Danışman',
            path: '/portal/consultant',
            icon: Bot
        }
    ];

    const menuItems = sidebarItems;

    return (
        <div className="h-screen overflow-hidden bg-[rgb(var(--bg-primary))] flex flex-col md:flex-row font-sans text-[rgb(var(--text-primary))]">

            <PortalMobileHeader isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Sidebar Container */}
            <AnimatePresence>
                {(isSidebarOpen || window.innerWidth >= 768) && (
                    <>
                        {/* Mobile Backdrop */}
                        {isSidebarOpen && window.innerWidth < 768 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSidebarOpen(false)}
                                className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
                            />
                        )}

                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: isSidebarOpen ? 0 : (window.innerWidth >= 768 ? 0 : -300) }}
                            exit={{ x: -300 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className={`fixed md:relative top-0 left-0 w-72 h-full z-50 md:z-auto bg-[rgb(var(--bg-card))] border-r border-[rgb(var(--border-primary))] flex flex-col shadow-2xl md:shadow-none`}
                        >
                            {/* Logo Area (Mobile Sidebar Header) */}
                            <div className="flex items-center justify-start md:hidden p-4 pb-4 bg-[rgb(var(--bg-card))] border-b border-[rgb(var(--border-primary))]">
                                <Link to="/" className="flex items-center gap-3 group">
                                    {settings.portalLogoUrl || settings.logoUrl ? (
                                        <img src={settings.portalLogoUrl || settings.logoUrl} alt="Logo" className="w-auto h-8 object-contain" />
                                    ) : (
                                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/20">S</div>
                                    )}
                                </Link>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center ml-auto p-2 bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] rounded-full"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Desktop Logo Area */}
                            <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-[rgb(var(--border-primary))]/50">
                                <Link to="/" className="flex flex-col items-center gap-3 group">
                                    {settings.portalLogoUrl || settings.logoUrl ? (
                                        <img src={settings.portalLogoUrl || settings.logoUrl} alt="Logo" className="w-auto h-6 object-contain group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">S</div>
                                    )}
                                </Link>
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                                {menuItems.map((item) => {
                                    const isActive = location.pathname === item.path || (item.path !== '/portal' && location.pathname.startsWith(item.path));
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
                                            className={`flex items-center gap-6 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                                                ${isActive
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                                                    : 'bg-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] hover:text-[rgb(var(--text-primary))]'
                                                }`}
                                        >
                                            <Icon size={20} className={isActive ? 'text-white' : 'text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-primary))] transition-colors'} />
                                            <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>

                                            {isActive && (
                                                <motion.div
                                                    layoutId="activePortalIndicator"
                                                    className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* User Profile & Actions at Bottom */}
                            <div className="p-4 border-t border-[rgb(var(--border-primary))] space-y-3">
                                <button
                                    onClick={() => setUpgradeModalOpen(true)}
                                    className="relative w-full group overflow-hidden rounded-2xl p-[1px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 border border-orange-300 rounded-[18px] animate-gradient-x" />
                                    <div className="relative gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:bg-transparent transition-colors duration-300 rounded-2xl px-4 py-3 flex items-center justify-center gap-2">
                                        <Sparkles size={18} className="text-white group-hover:text-white transition-colors animate-pulse" />
                                        <span className="font-black text-sm text-white group-hover:text-white tracking-wide uppercase">Paket Yükselt</span>
                                    </div>
                                </button>

                                <Link to="/portal/profile" className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[rgb(var(--bg-secondary))] transition-all group border border-transparent hover:border-[rgb(var(--border-primary))]">
                                    <div className="relative w-10 h-10">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-purple-600 rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative w-full h-full rounded-full bg-[rgb(var(--bg-card))] p-[2px] overflow-hidden">
                                            {user?.photo_url ? (
                                                <img src={user.photo_url} alt="User" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center">
                                                    <span className="font-bold text-lg uppercase text-white">{user?.name?.charAt(0) || 'U'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[rgb(var(--text-primary))] truncate group-hover:text-orange-500 transition-colors">{user?.name}</p>
                                        <p className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] truncate">Profil Ayarları</p>
                                    </div>
                                </Link>

                                <Link to="/" className="flex items-center gap-3 px-4 py-3 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] rounded-xl transition-colors text-sm font-medium">
                                    <Home size={18} />
                                    <span>Ana Sayfaya Dön</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-medium"
                                >
                                    <LogOut size={18} />
                                    <span>Çıkış Yap</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto w-full relative pb-24 md:pb-0">
                <div className="px-6 p-4 md:p-8 pt-28 md:pt-16 max-w-6xl mx-auto min-h-full">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNavbar />
            <FloatingWheelButton />
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default PortalLayout;
