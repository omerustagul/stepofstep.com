import { useParams } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteContext';
import SEO from '../../components/common/SEO';

const LegalPage = () => {
    const { slug } = useParams();
    const { settings } = useSiteSettings();

    const policy = settings.policies.find(p => p.slug === slug);

    if (!policy) {
        return <div className="min-h-screen pt-32 text-center text-[var(--color-text-secondary)]">Politika bulunamadı.</div>;
    }

    const title = `${policy.title} - Step of Step`;
    const description = policy.title;

    // Simple markdown-ish parser for display
    const renderContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            if (line.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-bold text-[var(--color-text)] mt-6 mb-2">{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-bold text-[var(--color-text)] mt-8 mb-3">{line.replace('## ', '')}</h2>;
            }
            if (line.trim() === '') {
                return <br key={i} />;
            }
            return <p key={i} className="mb-2 leading-relaxed">{line}</p>;
        });
    };

    return (
        <div className="min-h-screen pt-48 pb-20 px-6 max-w-4xl mx-auto">
            <SEO title={title} description={description} />
            <h1 className="text-4xl font-bold mb-4">{policy.title}</h1>
            <div className="text-sm text-zinc-400 mb-8">
                Son güncellenme tarihi: {new Date().toLocaleDateString()}
            </div>
            <div className="prose max-w-none text-zinc-600">
                {renderContent(policy.content)}
            </div>
        </div>
    );
};

export default LegalPage;
