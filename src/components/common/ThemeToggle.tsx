import { Sun, Moon, Monitor } from 'lucide-react';
import { useSiteSettings, type Theme } from '../../context/SiteContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

const ThemeToggle = () => {
    const { theme, setTheme, effectiveTheme } = useSiteSettings();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
        { id: 'light', label: 'Açık', icon: Sun },
        { id: 'dark', label: 'Koyu', icon: Moon },
        { id: 'system', label: 'Sistem', icon: Monitor },
    ];

    const CurrentIcon = effectiveTheme === 'dark' ? Moon : Sun;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full bg-[rgb(var(--bg-card))] hover:bg-orange-500 border border-[rgb(var(--border-primary))] transition-all duration-300 group"
                aria-label="Tema Değiştir"
            >
                <motion.div
                    key={effectiveTheme}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <CurrentIcon
                        size={18}
                        className="text-orange-500 group-hover:text-white transition-colors"
                    />
                </motion.div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-4 w-36 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-xl overflow-hidden z-50"
                    >
                        {themes.map((t) => {
                            const Icon = t.icon;
                            const isActive = theme === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setTheme(t.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${isActive
                                        ? 'bg-[rgb(var(--accent-light))] text-[rgb(var(--accent-primary))]'
                                        : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] hover:text-[rgb(var(--text-primary))]'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {t.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTheme"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-primary))]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ThemeToggle;
