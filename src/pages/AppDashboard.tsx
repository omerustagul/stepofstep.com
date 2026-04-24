import { Users, Eye, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useActivity } from '../context/ActivityContext';
import { useSiteSettings } from '../context/SiteContext';
import SEO from '../components/common/SEO';

const DashboardHome = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { appUsage, recentActivity, formatTime } = useActivity();
    const { getPagePath } = useSiteSettings();

    return (
        <div className="space-y-8 p-3 pt-16">
            <SEO path={getPagePath('App Dashboard', '/app')} />
            <div>
                <h1 className="text-3xl font-bold mb-2 text-zinc-900">{t('dashboard.welcome')} {user?.name}</h1>
                <p className="text-zinc-500">Bugünki aktivitelerinizi takip edin.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'Toplam Kullanılan Süre',
                        value: formatTime(Object.values(appUsage).reduce((a, b) => a + b, 0)),
                        change: 'Güncel Süre',
                        icon: Zap,
                        color: 'text-orange-500'
                    },
                    {
                        label: 'En Çok Kullanılan Uygulama',
                        value: Object.entries(appUsage).sort(([, a], [, b]) => b - a)[0]?.[0].split('/').pop() || 'Henüz yok',
                        change: 'En Çok Kullanılan Uygulama',
                        icon: Eye,
                        color: 'text-blue-500'
                    },
                    {
                        label: 'Son Etkileşimler',
                        value: recentActivity.length.toString(),
                        change: 'Giriş Yaptığınızdan Sonra',
                        icon: Users,
                        color: 'text-green-500'
                    },
                ].map((stat, index) => (
                    <div key={index} className="glass-panel p-6 rounded-3xl bg-white/50">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-white shadow-sm ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-xs font-medium bg-green-100 text-green-600 px-3 py-1 rounded-full">
                                {stat.change}
                            </span>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-sm mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-zinc-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="glass-panel p-8 rounded-3xl bg-white/50">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-zinc-900">{t('dashboard.recent_activity')}</h3>
                </div>
                <div className="space-y-4">
                    {recentActivity.length > 0 ? recentActivity.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 hover:bg-white/60 rounded-3xl transition-colors cursor-pointer group border border-transparent hover:border-zinc-100">
                            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                                <Zap size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-zinc-900 group-hover:text-orange-500 transition-colors">{item.app_name}</h4>
                                <p className="text-sm text-zinc-500">{new Date(item.created_at).toLocaleTimeString()}</p>
                            </div>
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                {item.action}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-zinc-500">
                            Hiç etkileşim yok. Uygulama açarak takip etmeye başlayın.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
