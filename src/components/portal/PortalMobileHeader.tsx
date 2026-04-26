import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteContext';
import ThemeToggle from '../common/ThemeToggle';
import NotificationCenter from '../common/NotificationCenter';
import { motion } from 'framer-motion';

const PortalMobileHeader = ({ isSidebarOpen, setSidebarOpen }: { isSidebarOpen: boolean; setSidebarOpen: (v: boolean) => void }) => {
    const { user } = useAuth();
    const { settings } = useSiteSettings();

    return (
        <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="md:hidden fixed top-4 left-6 right-8 h-16 rounded-[24px] bg-[rgb(var(--bg-card))]/50 backdrop-blur-sm border border-[rgb(var(--border-primary))] rounded-full flex items-center justify-between px-2 z-40 shadow-xl shadow-black/5"
        >
            {/* Left: Menu & Logo */}
            <div className="flex items-center gap-1 pl-0">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] bg-[rgb(var(--bg-tertiary))]/50 hover:bg-[rgb(var(--bg-tertiary))] rounded-[12px] transition-all"
                >
                    <Menu size={20} />
                </motion.button>

                <Link to="/portal" className="flex items-center gap-2 pl-1">
                    {settings.portalLogoUrl ? (
                        <img src={settings.portalLogoUrl} alt="Portal Logo" className="h-6 w-auto object-contain" />
                    ) : (
                        <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-md uppercase font-black shadow-md shadow-orange-500/20">
                            S
                        </div>
                    )}
                </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 pr-1">
                <div className="scale-90 origin-right">
                    <ThemeToggle />
                </div>
                <div className="scale-90 origin-right">
                    <NotificationCenter />
                </div>

                <Link to="/portal/profile" className="ml-1 w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 p-[2px] shadow-sm active:scale-95 transition-transform">
                    <div className="w-full h-full rounded-full gradient-to-tr from-[rgb(var(--bg-secondary))] to-[rgb(var(--bg-primary))] flex items-center justify-center overflow-hidden">
                        {user?.photo_url ? (
                            <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg uppercase font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                </Link>
            </div>
        </motion.header>
    );
};

export default PortalMobileHeader;
