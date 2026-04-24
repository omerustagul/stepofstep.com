
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Menu, X, Globe, Lock, FileText, ChevronRight, Gift, MessageSquare, Calendar, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoles, type ScreenId } from '../../context/RoleContext';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
    const { user, logout, isLoading } = useAuth();
    const { canView } = useRoles();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadJobs, setUnreadJobs] = useState(0);
    const [pendingAppointments, setPendingAppointments] = useState(0);

    // Admin SEO: Set title and prevent indexing
    useEffect(() => {
        document.title = "Admin Paneli | Step of Step";

        // Add noindex, nofollow meta tag
        const metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        metaRobots.setAttribute('content', 'noindex, nofollow');
        document.head.appendChild(metaRobots);

        return () => {
            // Cleanup: reset title and remove meta tag when leaving admin
            if (document.head.contains(metaRobots)) {
                document.head.removeChild(metaRobots);
            }
            // Note: We don't reset title here because the next page will handle it via normal SEO flow
        };
    }, []);

    // Fetch unread counts
    useEffect(() => {
        const fetchCounts = async () => {
            // Messages
            const { count: msgCount } = await supabase
                .from('contact_messages')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new'); // Fallback to status for now

            if (msgCount !== null) setUnreadMessages(msgCount);

            // Job Applications
            const { count: jobCount } = await supabase
                .from('job_applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new');

            if (jobCount !== null) setUnreadJobs(jobCount);

            // Appointments (Use active confirmed appointments since we auto-confirm)
            const { count: apptCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'cancelled')
                .neq('status', 'completed'); // exclude completed too

            if (apptCount !== null) setPendingAppointments(apptCount);
        };

        fetchCounts();

        // Subscribe to changes
        const msgSub = supabase
            .channel('admin:messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, fetchCounts)
            .subscribe();

        const jobSub = supabase
            .channel('admin:jobs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, fetchCounts)
            .subscribe();

        const apptSub = supabase
            .channel('admin:appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchCounts)
            .subscribe();

        return () => {
            msgSub.unsubscribe();
            jobSub.unsubscribe();
            apptSub.unsubscribe();
        };
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Access Control Check
    if (!user || (!user.role_id && !['admin', 'marketing', 'designer'].includes(user.role))) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-lg w-full">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-zinc-900">Erişim Reddedildi</h1>
                    <p className="mb-8 text-zinc-500">Bu panele erişim yetkiniz bulunmamaktadır. Lütfen yönetici ile iletişime geçin veya ana sayfaya dönün.</p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/"
                            className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded-xl transition-colors"
                        >
                            Ana Sayfaya Dön
                        </Link>
                        <Link
                            to="/app"
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                        >
                            Uygulama Paneline Git
                        </Link>
                    </div>
                </div>
            </div>
        );
    }



    // Navigation Structure
    type MenuItem = {
        id: ScreenId;
        label: string;
        path: string;
        icon: any;
        badge?: number;
    };

    type MenuGroup = {
        title: string;
        items: MenuItem[];
    };

    // Sidebar Group Component - Controlled
    const SidebarGroup = ({
        title,
        items,
        currentPath,
        isOpen,
        onToggle
    }: {
        title: string,
        items: MenuItem[],
        currentPath: string,
        isOpen: boolean,
        onToggle: () => void
    }) => {
        const hasActiveChild = items.some(i => i.path === currentPath);
        const totalBadge = items.reduce((sum, item) => sum + (item.badge || 0), 0);

        return (
            <div className="mb-2 px-2">
                <button
                    onClick={onToggle}
                    className={`flex items-center justify-between w-full px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group ${isOpen
                        ? 'bg-zinc-800 text-white shadow-lg shadow-black/20'
                        : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                        } ${hasActiveChild && !isOpen ? 'text-orange-500 bg-zinc-800/30' : ''}`}
                >
                    <span className="flex items-center gap-2">
                        {title}
                        {totalBadge > 0 && !isOpen && (
                            <span className="bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{totalBadge}</span>
                        )}
                    </span>
                    <div className="flex items-center gap-2">
                        {totalBadge > 0 && isOpen && (
                            <span className="bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{totalBadge}</span>
                        )}
                        <ChevronRight
                            size={16}
                            className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-orange-500' : 'text-zinc-600 group-hover:text-zinc-400'}`}
                        />
                    </div>
                </button>
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-1 mt-1 pb-2 pl-2 border-l-2 border-zinc-800 ml-4">
                                {items.map(item => {
                                    const Icon = item.icon;
                                    const isActive = currentPath === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center justify-between px-4 py-2.5 rounded-r-xl transition-all ${isActive
                                                ? 'bg-orange-500/10 text-orange-500 border-l-2 border-orange-500 -ml-[2px]'
                                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                                                } ${item.badge && item.badge > 0 ? 'animate-pulse-slow' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={16} />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </div>
                                            {item.badge !== undefined && item.badge > 0 && (
                                                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-orange-500 text-white' : 'bg-orange-500/20 text-orange-500'}`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const rawGroups: (MenuGroup | MenuItem)[] = [
        // Top Level Item
        {
            id: 'dashboard' as ScreenId,
            icon: LayoutDashboard,
            label: 'Kontrol Paneli',
            path: '/admin',
        },
        // Groups
        {
            title: 'Operasyon',
            items: [
                {
                    id: 'messages' as ScreenId,
                    icon: MessageSquare,
                    label: 'Mesajlar',
                    path: '/admin/messages',
                    badge: unreadMessages > 0 ? unreadMessages : undefined
                },
                {
                    id: 'jobs' as ScreenId,
                    icon: Users,
                    label: 'İş Başvuruları',
                    path: '/admin/jobs',
                    badge: unreadJobs > 0 ? unreadJobs : undefined,
                },
                {
                    id: 'notifications' as ScreenId,
                    icon: Bell,
                    label: 'Bildirim Gönder',
                    path: '/admin/notifications',
                },
                {
                    id: 'appointments' as ScreenId, // We need to update ScreenId type later or cast
                    icon: Calendar,
                    label: 'Randevular',
                    path: '/admin/appointments',
                    badge: pendingAppointments > 0 ? pendingAppointments : undefined,
                },
            ]
        },
        {
            title: 'Ekip ve CRM',
            items: [
                {
                    id: 'users' as ScreenId,
                    icon: Users,
                    label: 'Personeller',
                    path: '/admin/users',
                },
                {
                    id: 'members' as ScreenId,
                    icon: Users,
                    label: 'Üyeler',
                    path: '/admin/members',
                },
                {
                    id: 'plans' as ScreenId,
                    icon: CreditCard,
                    label: 'Üyelik Paketleri',
                    path: '/admin/plans',
                },
            ]
        },
        {
            title: 'İçerik Yönetimi',
            items: [
                {
                    id: 'portfolios' as ScreenId,
                    icon: Briefcase,
                    label: 'Portfolyolar',
                    path: '/admin/portfolios',
                },
                {
                    id: 'wheel' as ScreenId,
                    icon: Gift,
                    label: 'Çark Yönetimi',
                    path: '/admin/wheel',
                },
            ]
        },
        {
            title: 'Ayarlar',
            items: [
                {
                    id: 'policies' as ScreenId,
                    icon: FileText,
                    label: 'Politikalar',
                    path: '/admin/policies',
                },
                {
                    id: 'settings' as ScreenId,
                    icon: Settings,
                    label: 'Site Ayarları',
                    path: '/admin/settings',
                },
            ]
        }
    ];

    // Permission Filter Logic
    const filterItem = (item: MenuItem) => {
        // If user has a specific role assigned via Team Members, use strict permissions
        if (user.role_id) {
            return canView(user.role_id, item.id);
        }

        // Super Admin / Owner Bypass (only if not a team member with specific role)
        if (user.role === 'admin') return true;

        return false;
    };

    const visibleGroups = rawGroups.map(group => {
        if ('title' in group) {
            // It's a group, filter its items
            const filteredItems = group.items.filter(filterItem);
            if (filteredItems.length === 0) return null;
            return { ...group, items: filteredItems };
        } else {
            // It's a single item
            return filterItem(group) ? group : null;
        }
    }).filter(g => g !== null);

    // State for accordion: Default null (all closed) or maybe find the active one?
    // User requested "Default kapalı olsun" (Default closed)
    const [openGroup, setOpenGroup] = useState<string | null>(null);

    // Effect to open the group containing active page on mount (optional - user said "sadece bir menü açık kalacak")
    // If we want FULLY closed default, we remove this. But for UX, showing where you are is usually good.
    // However, the prompt says "default kapalı olarak gelsin", implying initial state is closed.
    // "ve açık bir menü varken diğer bir menü açılırsa açık olan kapansın" -> this is handled by setOpenGroup.

    // We will stick to initial null.

    const handleToggleGroup = (title: string) => {
        setOpenGroup(prev => prev === title ? null : title);
    };

    return (
        // Use h-screen and overflow-hidden to create a fixed frame
        <div className="h-screen bg-zinc-100 flex font-sans text-zinc-900 overflow-hidden">
            {/* Mobile Sidebar Toggle */}
            {!isSidebarOpen && (
                <button
                    className="fixed top-4 left-4 z-50 p-2 bg-white shadow-md rounded-xl md:hidden text-zinc-900"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={24} />
                </button>
            )}

            <AnimatePresence mode="wait">
                {(isSidebarOpen || window.innerWidth >= 768) && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        className="fixed md:relative w-64 h-full z-40 bg-zinc-900 text-white flex flex-col shadow-2xl flex-shrink-0"
                    >
                        <div className="p-6 py-8 flex items-center justify-between border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white">A</div>
                                <span className="font-bold text-sm tracking-tight">Yönetici Paneli</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-zinc-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <Link to="/admin/profile" className="block p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] flex items-center justify-center font-bold text-[rgb(var(--text-primary))] uppercase">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <p className="text-sm font-bold truncate">{user?.name || 'Admin'}</p>
                                    <p className="text-xs text-zinc-400 capitalize">{user?.role || 'user'}</p>
                                </div>
                                <ChevronRight size={16} className="text-zinc-600 group-hover:text-orange-400 transition-colors" />
                            </div>
                        </Link>

                        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                            {visibleGroups.map((group, index) => {
                                if ('title' in group) {
                                    return (
                                        <SidebarGroup
                                            key={index}
                                            title={group.title}
                                            items={group.items}
                                            currentPath={location.pathname}
                                            isOpen={openGroup === group.title}
                                            onToggle={() => handleToggleGroup(group.title)}
                                        />
                                    );
                                } else {
                                    // Single Item
                                    // @ts-ignore
                                    const item = group as MenuItem;
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <div key={item.path} className="mb-2 px-2">
                                            <Link
                                                to={item.path}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20'
                                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                                                    }`}
                                            >
                                                <Icon size={18} />
                                                <span className="text-sm font-bold">{item.label}</span>
                                            </Link>
                                        </div>
                                    );
                                }
                            })}
                        </nav>

                        <div className="p-4 border-t border-zinc-800 space-y-2">
                            <Link to="/" className="flex items-center gap-3 px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">
                                <Globe size={18} />
                                <span>Web Sitesini Görüntüle</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2 w-full text-zinc-400 hover:text-red-400 transition-colors text-sm"
                            >
                                <LogOut size={18} />
                                <span>Çıkış Yap</span>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <main className="flex-1 w-full bg-zinc-100 p-4 pt-20 md:p-8 md:pt-10 pb-20 overflow-y-auto h-full">
                <div className="max-w-6xl mx-auto pb-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
