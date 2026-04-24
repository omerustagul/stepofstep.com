import { useState } from 'react';
import { useSiteSettings } from '../../context/SiteContext';
import { Save } from 'lucide-react';

const AdminSettings = () => {
    const { settings, updateSettings } = useSiteSettings();
    const [formData, setFormData] = useState(settings);
    const [isSaved, setIsSaved] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-zinc-900">Site Settings</h1>
                <p className="text-zinc-500">Manage your website's identity and SEO.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-4xl space-y-6 bg-white/50">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Site Title (SEO)</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Meta Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400 h-24 resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Logo Image URL</label>
                    <input
                        type="text"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-zinc-900 placeholder:text-zinc-400"
                    />
                    <p className="text-xs text-zinc-500">Leave empty to use text logo.</p>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-4xl flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
                    >
                        <Save size={20} />
                        {isSaved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSettings;
