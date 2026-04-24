import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, type PanInfo } from 'framer-motion';
import { ArrowUpRight, ArrowLeft, ArrowRight, Hand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePortfolio } from '../../context/PortfolioContext';
import { useNavigate } from 'react-router-dom';

const Portfolio = () => {
    const { t } = useTranslation();
    const { items: projects } = usePortfolio();
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    const categories = [
        { id: 'all', label: t('portfolio.filter_all') },
        { id: 'branding', label: t('portfolio.filter_branding') },
        { id: 'development', label: t('portfolio.filter_web') },
        { id: 'marketing', label: t('portfolio.filter_marketing') }
    ];

    const filteredProjects = filter === 'all'
        ? projects
        : projects.filter(project => {
            const cats = Array.isArray(project.category)
                ? project.category
                : (project.category ? [project.category] : []);
            const types = Array.isArray(project.serviceType)
                ? project.serviceType
                : (project.serviceType ? [project.serviceType] : []);

            return [...cats, ...types].some(c => c.toLowerCase() === filter);
        });

    // Deck Logic
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter change resets deck
    useEffect(() => {
        setCurrentIndex(0);
    }, [filter]);

    // Derived stack (visible cards)
    // We show up to 3 cards: Current, Next, Next+1
    const visibleStack = filteredProjects.slice(currentIndex, currentIndex + 3);
    // If we are near end, we might have fewer than 3. 

    const handleSwipe = (_direction: 'left' | 'right') => {
        setTimeout(() => {
            setCurrentIndex(prev => Math.min(prev + 1, filteredProjects.length));
        }, 200);
    };

    // Manual Navigation
    const nextCard = () => {
        if (currentIndex < filteredProjects.length - 1) {
            handleSwipe('left');
        } else {
            // Reset to start if at end? Or just stop. Let's loop for infinite feel?
            // For a portfolio, maybe loop is better or just showing a "End" card.
            // Let's loop for now to always ensure content.
            setCurrentIndex(0);
        }
    }

    const prevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }


    return (
        <section id="portfolio" className="py-20 md:py-32 bg-[rgb(var(--bg-primary))] relative overflow-hidden transition-colors duration-300 min-h-[900px]">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-md">
                        <span className="text-orange-500 font-bold tracking-widest mb-4 block text-xs uppercase">GELECEĞİ KEŞFET</span>
                        <h2 className="text-4xl md:text-6xl font-black text-[rgb(var(--text-primary))] mb-6 tracking-tight leading-none">
                            Sıradışı<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Projelerimiz.</span>
                        </h2>
                        <p className="text-[rgb(var(--text-secondary))] text-lg leading-relaxed">
                            Dijital dünyanın sınırlarını zorlayan, estetik ve teknolojinin mükemmel uyumuyla tasarlanmış seçkin işlerimiz.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 bg-[rgb(var(--bg-secondary))] p-1.5 rounded-2xl self-start md:self-end backdrop-blur-md border border-[rgb(var(--border-primary))]">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter === cat.id
                                    ? 'bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] shadow-lg scale-105'
                                    : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Deck Container */}
                <div className="relative flex-1 flex flex-col items-center justify-center min-h-[500px]" ref={containerRef}>
                    <div className="relative w-full max-w-[400px] md:max-w-[950px] aspect-[4/5] md:aspect-[2.2/1] perspective-1000">
                        <AnimatePresence>
                            {visibleStack.map((project, index) => {
                                // Calculate stacking index (0 is top)
                                // But since we slice, index=0 in visibleStack IS the top card actually.
                                // Wait, slice(currentIndex, ...) means index 0 of slice IS currentDate.
                                // So index 0 is TOP.

                                const isTop = index === 0;
                                const isHidden = index > 2; // Hide beyond 3rd

                                if (isHidden) return null;

                                return (
                                    <Card
                                        key={project.id}
                                        project={project}
                                        index={index}
                                        isTop={isTop}
                                        onSwipe={handleSwipe}
                                        onClick={() => navigate(`/portfolio/${project.id}`)}
                                    />
                                );
                            })}
                        </AnimatePresence>

                        {/* Empty State / End of List */}
                        {filteredProjects.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold">
                                Bu kategoride proje bulunamadı.
                            </div>
                        )}
                        {currentIndex >= filteredProjects.length && filteredProjects.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[rgb(var(--bg-card))] rounded-[2rem] border border-[rgb(var(--border-primary))] shadow-xl">
                                <SparklesIcon className="w-12 h-12 text-orange-500 mb-4 animate-pulse" />
                                <h3 className="text-2xl font-black mb-2">Hepsini İncelediniz!</h3>
                                <p className="text-zinc-500 mb-6">Bu kategorideki tüm projelerimizi gördünüz.</p>
                                <button
                                    onClick={() => setCurrentIndex(0)}
                                    className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                >
                                    Başa Dön
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="mt-10 flex items-center gap-6 z-20">
                        <button
                            onClick={prevCard}
                            disabled={currentIndex === 0}
                            className="w-12 h-12 rounded-full border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-card))] flex items-center justify-center text-[rgb(var(--text-primary))] hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2 text-[rgb(var(--text-tertiary))] text-xs font-bold uppercase tracking-wider">
                                <Hand size={14} className="animate-pulse" />
                                <span>Sürükle & Keşfet</span>
                            </div>
                            <div className="h-1 w-24 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-orange-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentIndex + 1) / filteredProjects.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={nextCard}
                            className="w-12 h-12 rounded-full border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-card))] flex items-center justify-center text-[rgb(var(--text-primary))] hover:scale-110 active:scale-95 transition-all shadow-sm"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
};

// Sub-Component for Individual Card
const Card = ({ project, index, isTop, onSwipe, onClick }: { project: any, index: number, isTop: boolean, onSwipe: (dir: 'left' | 'right') => void, onClick: () => void }) => {
    const x = useMotionValue(0);
    const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);
    const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
    const controls = useAnimation();

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
            onSwipe('right');
        } else if (info.offset.x < -threshold) {
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
            onSwipe('left');
        } else {
            controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        }
    };

    // Card Stack Styles
    // index 0: top, scale 1, y 0
    // index 1: middle, scale 0.95, y -20
    // index 2: back, scale 0.9, y -40

    // NOTE: Framer Motion uses zIndex, but we need to ensure HTML order or manual zIndex
    // Since we map visibleStack, index 0 is first in DOM, so it would be BEHIND if we don't fix zIndex.
    // We want index 0 to be FRONT. So zIndex = 100 - index.

    const initialScale = 1 - (index * 0.05);
    const initialY = -(index * 20);
    const zIndex = 100 - index;
    const itemOpacity = 1 - (index * 0.2); // Fade out back items slightly

    return (
        <motion.div
            style={{
                x: isTop ? x : 0,
                rotate: isTop ? rotate : 0,
                scale: isTop ? scale : 1, // Wired up scale
                opacity: isTop ? opacity : 1, // Wired up opacity
                zIndex
            }}
            animate={controls}
            onClick={() => {
                // Only click if it wasn't a drag
                if (Math.abs(x.get()) < 5) onClick();
            }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            initial={{ scale: initialScale, y: initialY, opacity: 0 }}
            whileInView={{ opacity: itemOpacity, scale: initialScale, y: initialY }} // Ensure stack position is maintained
            // We use animate prop to dynamically update stack position when index changes (handled by parent re-render mostly, but map key change triggers mounting)
            // Ideally we want layout animations but custom stack logic is easier here.

            // Updates when not top card
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}

            className={`absolute top-0 left-0 w-full h-full bg-[rgb(var(--bg-card))] rounded-[2.5rem] p-4 shadow-2xl border border-[rgb(var(--border-primary))] cursor-grab active:cursor-grabbing select-none origin-bottom`}
        >
            <div className="relative h-full flex flex-col">
                {/* Image Area */}
                <div className="relative w-full aspect-[1/1] md:aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 bg-[rgb(var(--bg-card))]">
                    <img
                        src={project.image || project.imageUrl}
                        alt={project.name}
                        className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* Floating Tags */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-1 max-w-[80%]">
                        {((Array.isArray(project.serviceType) ? project.serviceType : (project.serviceType ? [project.serviceType] : (project.category ? [project.category] : []))) as string[]).map((cat, i) => (
                            <span key={i} className="bg-[rgb(var(--accent-primary))] backdrop-blur-md text-[rgb(var(--text-primary))] text-[8px] md:text-[10px] font-black uppercase tracking-wider px-2 md:px-3 py-1 rounded-full shadow-lg border border-[rgb(var(--accent-primary))]/50">
                                {cat}
                            </span>
                        ))}
                    </div>

                    {/* Logo */}
                    {project.logoUrl && (
                        <div className="glass absolute bottom-4 right-4 w-10 h-10 bg-blur backdrop-blur-lg rounded-full p-1 shadow-lg flex items-center justify-center">
                            <img src={project.logoUrl} className="w-full h-full rounded-full object-contain" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 px-2 pb-2 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-2xl font-black text-[rgb(var(--text-primary))] leading-tight mb-1">{project.name || project.title}</h3>
                                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">{project.clientName || 'GİZLİ PROJE'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] flex items-center justify-center">
                                <ArrowUpRight size={20} />
                            </div>
                        </div>
                        <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed line-clamp-3">
                            {project.description}
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[rgb(var(--border-secondary))] flex items-center justify-between text-xs text-[rgb(var(--text-tertiary))] font-medium">
                        <span>Detayları İncele</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <div className="w-2 h-2 rounded-full bg-[rgb(var(--border-primary))]" />
                            <div className="w-2 h-2 rounded-full bg-[rgb(var(--border-primary))]" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

function SparklesIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}

export default Portfolio;
