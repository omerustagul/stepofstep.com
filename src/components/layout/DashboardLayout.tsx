import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X, Box, Share2, Briefcase, ArrowLeft, Zap, User, ChevronRight, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../../context/SiteContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import UpgradeModal from '../common/UpgradeModal';
import WheelOfFortune from '../common/WheelOfFortune';

const SidebarItem = ({ icon: Icon, label, path, isActive }: any) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all mb-1 ${isActive
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
            : 'text-zinc-500 hover:text-orange-500 hover:bg-orange-50'
            }`}
    >
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
    </Link>
);

const DashboardLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [showWheel, setShowWheel] = useState(false);
    const location = useLocation();
    const { settings, getPagePath } = useSiteSettings();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const appPath = getPagePath('App Dashboard', '/app');

    const isAppMode = location.pathname.includes('/brand-architect') ||
        location.pathname.includes('/foundry') ||
        location.pathname.includes('/social-mind');

    const menuItems = [
        { icon: LayoutDashboard, label: t('nav.overview'), path: appPath },
        { type: 'divider' },
        { icon: Briefcase, label: t('nav.brand_architect'), path: `${appPath}/brand-architect` },
        { icon: Box, label: t('nav.foundry'), path: `${appPath}/foundry` },
        { icon: Share2, label: t('nav.social_mind'), path: `${appPath}/social-mind` }
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 flex overflow-hidden">
            {/* Mobile Sidebar Toggle - Visible only when sidebar is closed on mobile */}
            {!isSidebarOpen && (
                <button
                    className="fixed top-4 left-4 z-50 p-2 bg-white shadow-md rounded-xl md:hidden text-zinc-900"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {(isSidebarOpen || window.innerWidth >= 768) && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`fixed md:relative w-72 h-screen z-40 bg-white border-r border-zinc-200 flex flex-col shadow-2xl md:shadow-none`}
                    >
                        {/* Sidebar Header */}
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="App Logo" className="h-8 w-auto object-contain" />
                                ) : (
                                    <>
                                        <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-orange-500/20">S</div>
                                        <span className="font-bold text-lg text-zinc-900 tracking-tight">Step App</span>
                                    </>
                                )}
                            </div>

                            {/* Close Button Inside Sidebar */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden p-1 hover:bg-zinc-100 rounded-lg text-zinc-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto px-4 py-2">
                            {/* Profile Link */}
                            <Link
                                to={`${appPath}/profile`}
                                className={`flex items-center gap-3 p-3 rounded-2xl mb-6 border transition-all ${location.pathname === `${appPath}/profile` ? 'border-orange-200 bg-orange-50' : 'border-transparent hover:bg-zinc-50'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold overflow-hidden">
                                    {user?.name ? user.name.charAt(0) : <User size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 truncate">{user?.name || 'User'}</p>
                                    <p className="text-xs text-zinc-500 truncate">{t('profile.title')}</p>
                                </div>
                                <ChevronRight size={16} className="text-zinc-400" />
                            </Link>

                            <div className="space-y-1">
                                {menuItems.map((item: any, idx) => (
                                    item.type === 'divider' ? (
                                        <div key={idx} className="h-px bg-zinc-100 my-4 mx-2" />
                                    ) : (
                                        <SidebarItem
                                            key={item.path}
                                            {...item}
                                            isActive={location.pathname === item.path}
                                        />
                                    )
                                ))}
                            </div>
                        </nav>

                        {/* Sidebar Footer Actions */}
                        <div className="p-4 border-t border-zinc-100 space-y-3 bg-zinc-50/50">
                            <Link to={getPagePath('Ana Sayfa', '/')} className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                                <ArrowLeft size={16} />
                                {t('dashboard.back_to_site')}
                            </Link>

                            <button
                                onClick={() => setUpgradeModalOpen(true)}
                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-shadow"
                            >
                                <Zap size={16} fill="currentColor" />
                                {t('dashboard.upgrade_plan')}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full py-2 text-zinc-400 hover:text-red-500 transition-colors text-xs font-medium mt-2"
                            >
                                <LogOut size={14} />
                                <span>{t('nav.logout')}</span>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className={`flex-1 overflow-y-auto h-screen w-full bg-zinc-50 transition-all ${isAppMode ? 'p-0' : 'p-4 md:p-8'}`}>
                {/* Fixed Header is removed as buttons are now in sidebar */}

                <div className={`${isAppMode ? 'w-full h-full max-w-none' : 'max-w-6xl mx-auto'}`}>
                    <Outlet />
                </div>
            </main>

            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />

            {/* Wheel of Fortune Implementation in Dashboard */}
            <AnimatePresence>
                {showWheel && <WheelOfFortune onClose={() => setShowWheel(false)} />}
            </AnimatePresence>

            <AnimatePresence>
                {!showWheel && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowWheel(true)}
                        className="fixed bottom-8 right-8 z-[50] bg-gradient-to-br from-orange-500 to-amber-500 text-white p-4 rounded-full shadow-2xl shadow-orange-500/40 border-4 border-white/20 group"
                    >
                        <Gift size={28} className="group-hover:rotate-12 transition-transform" />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />

                        {/* Tooltip */}
                        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-zinc-700">
                            Hediye Çarkını Çevir!
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardLayout;
