import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, Info, AlertTriangle, CheckCircle, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, type Notification } from '../../context/NotificationContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-green-500" size={20} />;
            case 'error': return <X className="text-red-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
            case 'promo': return <Zap className="text-purple-500" size={20} />;
            case 'achievement': return <Zap className="text-yellow-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            // Navigate or open link
            window.location.href = notification.link; // Basic navigation
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-full bg-[rgb(var(--bg-card))] hover:bg-orange-500 border border-[rgb(var(--border-primary))] transition-all duration-300 group"
            >
                <Bell size={18} className="text-orange-500 group-hover:text-white transition-colors" />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right--1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed w-[100%] left-0 right-0 top-20 md:absolute md:right-0 md:left-auto md:top-full md:mt-5 md:w-96 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] rounded-2xl shadow-2xl overflow-hidden z-[9999] origin-top md:origin-top-right"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[rgb(var(--border-primary))] flex items-center justify-between bg-[rgb(var(--bg-secondary))]">
                            <h3 className="font-bold text-[rgb(var(--text-primary))]">Bildirimler ({notifications.length})</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="p-1.5 hover:bg-black/10 rounded-full dark:hover:bg-white/10 transition-colors"
                                    title="Yenile"
                                >
                                    <RefreshCw size={14} className="text-[rgb(var(--text-secondary))]" />
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs font-medium text-[rgb(var(--accent-primary))] hover:text-[rgb(var(--accent-hover))] flex items-center gap-1 transition-colors"
                                    >
                                        <Check size={14} /> Tümünü Okundu İşaretle
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-[rgb(var(--text-tertiary))] flex flex-col items-center gap-3">
                                    <Bell size={32} className="opacity-20" />
                                    <p className="text-sm">Henüz bildiriminiz yok.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[rgb(var(--border-secondary))]">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-[rgb(var(--bg-tertiary))] transition-colors group relative ${!notification.is_read ? 'bg-[rgb(var(--bg-secondary))]' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 space-y-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                                                    <div className="flex justify-between items-start">
                                                        <p className={`text-sm font-medium ${!notification.is_read ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))]'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[10px] text-[rgb(var(--text-tertiary))] whitespace-nowrap ml-2">
                                                            {format(new Date(notification.created_at), 'd MMM HH:mm', { locale: tr })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                            className="p-1 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--accent-primary))] rounded-full hover:bg-[rgb(var(--bg-elevated))]"
                                                            title="Okundu İşaretle"
                                                        >
                                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                        className="p-1 text-[rgb(var(--text-tertiary))] hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {/* <div className="p-2 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] text-center">
                            <button className="text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                                Bildirim Ayarları
                            </button>
                        </div> */}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
