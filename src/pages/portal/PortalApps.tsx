import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Zap, Brain, PenTool, Search, ArrowRight } from 'lucide-react';
import appsConfig from '../../config/apps.json';

const PortalApps = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const coreApps = [
        {
            id: 'brand-architect',
            name: 'Brand Architect',
            description: 'Marka kimliğinizi oluşturun ve yönetin.',
            path: '/app/brand-architect',
            icon: PenTool,
            color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
            textColor: 'text-purple-100'
        },
        {
            id: 'foundry',
            name: 'The Foundry',
            description: 'İçerik üretim fabrikası.',
            path: '/app/foundry',
            icon: Zap,
            color: 'bg-gradient-to-br from-orange-400 to-red-500',
            textColor: 'text-orange-100'
        },
        {
            id: 'social-mind',
            name: 'Social Mind',
            description: 'Sosyal medya yapay zekası.',
            path: '/app/social-mind',
            icon: Brain,
            color: 'bg-gradient-to-br from-blue-400 to-cyan-500',
            textColor: 'text-blue-100'
        },
        {
            id: 'product-gen',
            name: 'Ürün Fotoğrafı',
            description: 'AI ile ürün fotoğrafları oluşturun.',
            path: '/app/product-gen',
            icon: Rocket,
            color: 'bg-gradient-to-br from-pink-500 to-rose-500',
            textColor: 'text-pink-100'
        },
        {
            id: 'logo-gen',
            name: 'Logo Oluşturucu',
            description: 'Hızlıca modern logolar tasarlayın.',
            path: '/app/logo-gen',
            icon: PenTool,
            color: 'bg-gradient-to-br from-indigo-500 to-violet-600',
            textColor: 'text-indigo-100'
        }
    ];

    const allApps = [...coreApps, ...appsConfig.map((app: any) => ({
        id: app.id,
        name: app.name,
        description: 'Özel Uygulama',
        path: `/app/${app.id}`,
        icon: Rocket,
        color: 'bg-zinc-800',
        textColor: 'text-zinc-400',
        isPending: false
    }))];

    const filteredApps = allApps.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[rgb(var(--text-primary))] tracking-tight">Uygulamalar</h1>
                    <p className="text-[rgb(var(--text-secondary))] font-medium">İşinizi büyütecek yapay zeka araçları.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="text"
                        placeholder="Uygulama ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] rounded-full pl-10 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:border-orange-500 transition-all shadow-sm text-[rgb(var(--text-primary))]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredApps.map((app) => (
                    <Link
                        key={app.id}
                        to={app.path}
                        className="group relative bg-[rgb(var(--bg-card))] rounded-3xl border border-[rgb(var(--border-primary))] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-64 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${app.color} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`} />

                        <div className={`w-14 h-14 rounded-2xl ${app.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-300`}>
                            <app.icon size={26} />
                        </div>

                        <div className="relative z-10 flex-1">
                            <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2 group-hover:text-orange-600 transition-colors">
                                {app.name}
                            </h3>
                            <p className="text-sm text-[rgb(var(--text-secondary))] font-medium leading-relaxed">
                                {app.description}
                            </p>
                        </div>

                        <div className="relative z-10 pt-4 mt-auto flex items-center text-sm font-bold text-zinc-400 group-hover:text-orange-500 transition-colors">
                            <span>Uygulamayı Aç</span>
                            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default PortalApps;
