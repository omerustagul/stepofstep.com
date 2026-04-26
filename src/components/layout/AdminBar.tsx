import { Link } from 'react-router-dom';
import { Settings, Users, Briefcase, Image, Shield, LayoutDashboard, X, ChevronDown, MessageSquare, Calendar, Gift, FileText, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRoles, type ScreenId } from '../../context/RoleContext';

const AdminBar = () => {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const { canView } = useRoles();

    // Access Control Check
    if (!user || (!user.role_id && !['admin', 'marketing', 'designer'].includes(user.role))) {
        return null;
    }

    if (!isVisible) {
        return null;
    }

    type MenuItem = {
        to: string;
        icon: any;
        label: string;
        id: ScreenId;
    };

    type MenuGroup = {
        title: string;
        items: MenuItem[];
    };

    const navigationGroups: (MenuGroup | MenuItem)[] = [
        { to: '/admin', icon: LayoutDashboard, label: 'Kontrol Paneli', id: 'dashboard' as ScreenId },
        {
            title: 'Operasyon',
            items: [
                { to: '/admin/messages', icon: MessageSquare, label: 'Mesajlar', id: 'messages' as ScreenId },
                { to: '/admin/jobs', icon: Briefcase, label: 'Başvurular', id: 'jobs' as ScreenId },
                { to: '/admin/appointments', icon: Calendar, label: 'Randevular', id: 'appointments' as ScreenId },
            ]
        },
        {
            title: 'Ekip & CRM',
            items: [
                { to: '/admin/users', icon: Users, label: 'Personel', id: 'users' as ScreenId },
                { to: '/admin/members', icon: Users, label: 'Üyeler', id: 'members' as ScreenId },
                { to: '/admin/plans', icon: CreditCard, label: 'Paketler', id: 'plans' as ScreenId },
            ]
        },
        {
            title: 'İçerik',
            items: [
                { to: '/admin/portfolios', icon: Image, label: 'Portfolyo', id: 'portfolios' as ScreenId },
                { to: '/admin/wheel', icon: Gift, label: 'Çark', id: 'wheel' as ScreenId },
            ]
        },
        {
            title: 'Ayarlar',
            items: [
                { to: '/admin/policies', icon: FileText, label: 'Politikalar', id: 'policies' as ScreenId },
                { to: '/admin/settings', icon: Settings, label: 'Ayarlar', id: 'settings' as ScreenId },
            ]
        }
    ];

    const hasPermission = (id: ScreenId) => {
        if (user.role_id) return canView(user.role_id, id);
        if (user.role === 'admin') return true;
        if (user.role === 'marketing' && ['dashboard', 'portfolios', 'jobs', 'messages'].includes(id)) return true;
        if (user.role === 'designer' && ['dashboard', 'portfolios'].includes(id)) return true;
        return false;
    };

    const allMobileItems = navigationGroups.flatMap((group) => {
        if ('to' in group) {
            return hasPermission(group.id as ScreenId) ? [group] : [];
        }
        return group.items.filter(item => hasPermission(item.id));
    });

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-zinc-900 text-white border-b border-zinc-800 shadow-xl">
            <div className="max-w-full mx-auto h-10 md:h-8 flex items-center justify-between pl-4 pr-2 md:px-4">

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1 h-full">
                    <div className="flex items-center gap-2 mr-4 text-orange-500 font-bold text-xs bg-orange-500/10 px-2 py-1 rounded">
                        <Shield size={12} />
                        <span>Yönetici Paneli</span>
                    </div>

                    {navigationGroups.map((group, idx) => {
                        // Single Item
                        if ('to' in group) {
                            if (!hasPermission(group.id as ScreenId)) return null;
                            return (
                                <Link
                                    key={group.to}
                                    to={group.to}
                                    className="flex items-center gap-2 px-3 h-8 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                >
                                    <group.icon size={14} />
                                    <span>{group.label}</span>
                                </Link>
                            );
                        }

                        // Check if user has permission to see ANY item in the group
                        const visibleItems = group.items.filter(item => hasPermission(item.id));
                        if (visibleItems.length === 0) return null;

                        // Dropdown Group
                        return (
                            <div key={idx} className="relative group h-full flex items-center">
                                <button className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-zinc-300 group-hover:text-white group-hover:bg-zinc-800 rounded-md transition-colors">
                                    <span>{group.title}</span>
                                    <ChevronDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                </button>

                                {/* Dropdown Menu */}
                                <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left translate-y-2 group-hover:translate-y-0">
                                    <div className="p-1">
                                        {visibleItems.map(item => (
                                            <Link
                                                key={item.to}
                                                to={item.to}
                                                className="flex items-center gap-3 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                            >
                                                <item.icon size={14} />
                                                <span>{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Nav (Scrollable Icon List) */}
                <div className="flex md:hidden items-center gap-1 overflow-x-auto no-scrollbar mask-gradient flex-1 mr-4 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                    {/* Mobile Badge (Icon Only) */}
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 mr-2">
                        <Shield size={16} />
                    </div>

                    {allMobileItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors relative"
                        >
                            <item.icon size={18} />
                            {/* Optional: Active Indicator could be added here checking location.pathname, but hook not imported */}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3 shrink-0 pl-2 border-l border-zinc-800">
                    <span className="text-xs text-zinc-500 hidden sm:inline font-medium">
                        {user.name}
                    </span>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full text-zinc-500 transition-colors"
                        title="Admin barını gizle"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminBar;
