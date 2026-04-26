import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, MoreHorizontal, Eraser, Zap, MessageCircle, ArrowDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendMessageToAI } from '../../services/aiService';
import { useNotifications } from '../../context/NotificationContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    suggestions?: string[];
}

const BrandConsultant = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Merhaba ${user?.name?.split(' ')[0] || 'Dostum'}! Ben senin kişisel marka stratejistinim. Bugün markanı dijital dünyada parlatmak için ne yapalım? Strateji mi kuralım, yoksa sadece fikir mi fırtınası yapalım?`,
            sender: 'ai',
            timestamp: new Date(),
            suggestions: ['Marka kimliği oluştur', 'İçerik stratejisi planla', 'Logomu yorumla']
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setShowScrollButton(scrollHeight - scrollTop > clientHeight + 100);
    };

    useEffect(() => {
        scrollToBottom('auto');
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await sendMessageToAI(text, { userName: user?.name });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'ai',
                timestamp: new Date(),
                suggestions: response.suggestions
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('AI Error:', error);
            addNotification({ type: 'error', title: 'Bağlantı Hatası', message: 'Yapay zeka asistanına şu an ulaşılamıyor.' });
        } finally {
            setIsTyping(false);
        }
    };

    const clearHistory = () => {
        if (window.confirm('Tüm sohbet geçmişini silmek istediğine emin misin?')) {
            setMessages([{
                id: '1',
                text: `Sohbet temizlendi. Yeni bir başlangıca hazır mısın ${user?.name?.split(' ')[0] || ''}? Nasıl yardımcı olabilirim?`,
                sender: 'ai',
                timestamp: new Date(),
                suggestions: ['Marka stratejisi', 'Hedef kitle', 'Pazarlama fikirleri']
            }]);
        }
    };

    return (
        <div className="h-[calc(100vh-9rem)] flex flex-col bg-[rgb(var(--bg-primary))] rounded-[2.5rem] border border-[rgb(var(--border-primary))] shadow-2xl shadow-black/5 overflow-hidden relative">
            {/* Elegant Header */}
            <div className="px-6 py-5 border-b border-[rgb(var(--border-primary))] flex items-center justify-between bg-[rgb(var(--bg-card))]/40 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <Bot size={26} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[rgb(var(--bg-card))] rounded-full" />
                    </div>
                    <div>
                        <h2 className="font-black text-lg text-[rgb(var(--text-primary))] flex items-center gap-2 tracking-tight">
                            Marka Danışmanı
                            <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 text-[10px] uppercase font-black tracking-widest border border-orange-500/20">PRO</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">Canlı ve yardıma hazır</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={clearHistory}
                        className="p-2.5 rounded-xl bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 group"
                        title="Geçmişi Temizle"
                    >
                        <Eraser size={20} className="group-active:scale-90" />
                    </button>
                    <div className="h-8 w-[1px] bg-[rgb(var(--border-primary))] mx-1" />
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg">
                        <Zap size={14} fill="currentColor" />
                        V 4.0
                    </button>
                </div>
            </div>

            {/* Main Chat Interface */}
            <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 bg-dot-pattern custom-scrollbar scroll-smooth"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex gap-4 md:gap-6 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Visual Identity */}
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                                msg.sender === 'user' 
                                ? 'bg-[rgb(var(--bg-card))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]' 
                                : 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-none text-white'
                            }`}>
                                {msg.sender === 'user' ? (
                                    user?.photo_url ? <img src={user.photo_url} className="w-full h-full rounded-2xl object-cover" /> : <User size={18} />
                                ) : <Bot size={20} />}
                            </div>

                            {/* Message Bubble System */}
                            <div className={`max-w-[85%] md:max-w-[70%] space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className={`relative px-5 py-4 rounded-[2rem] text-sm md:text-base leading-relaxed shadow-sm transition-all ${
                                    msg.sender === 'user'
                                    ? 'bg-orange-500 text-white rounded-tr-none font-medium'
                                    : 'bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] rounded-tl-none'
                                }`}>
                                    {msg.text}
                                    
                                    {/* Bubble Tail Design (Optional/Stylized) */}
                                    <div className={`absolute top-0 w-4 h-4 ${
                                        msg.sender === 'user' 
                                        ? '-right-1 bg-orange-500' 
                                        : '-left-1 bg-[rgb(var(--bg-card))] border-l border-t border-[rgb(var(--border-primary))]'
                                    } rotate-45 -z-10`} />
                                </div>

                                {/* Contextual Suggestions (Only latest AI msg) */}
                                {msg.sender === 'ai' && index === messages.length - 1 && msg.suggestions && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {msg.suggestions.map((suggestion, idx) => (
                                            <motion.button
                                                key={idx}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleSend(suggestion)}
                                                className="text-xs md:text-sm px-4 py-2 bg-orange-500/5 border border-orange-500/20 text-orange-600 rounded-full hover:bg-orange-500/10 transition-all font-bold flex items-center gap-2"
                                            >
                                                <Sparkles size={12} className="text-orange-500" />
                                                {suggestion}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                <div className="text-[10px] font-bold text-[rgb(var(--text-tertiary))] uppercase tracking-widest px-2 opacity-50">
                                    {formatTime(msg.timestamp)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4 items-end">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center shrink-0 shadow-lg">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] px-6 py-4 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                        </div>
                    </motion.div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll Indicator */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-32 right-8 p-3 bg-white dark:bg-zinc-800 text-[rgb(var(--text-primary))] rounded-full shadow-2xl border border-[rgb(var(--border-primary))] z-30 hover:scale-110 active:scale-95 transition-all"
                    >
                        <ArrowDown size={20} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Premium Input Bar */}
            <div className="p-6 md:px-12 md:pb-8 bg-[rgb(var(--bg-card))]/40 backdrop-blur-xl border-t border-[rgb(var(--border-primary))] relative z-20">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition duration-500" />
                    
                    <div className="relative flex items-center">
                        <div className="absolute left-4 text-[rgb(var(--text-tertiary))]">
                            <MessageCircle size={20} />
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Bir soru sor veya fikrini paylaş..."
                            className="w-full pl-12 pr-28 py-5 bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xl transition-all text-base text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]/60"
                            disabled={isTyping}
                        />
                        <div className="absolute right-2 flex items-center gap-2">
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isTyping}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                            >
                                <span className="hidden md:inline font-bold text-sm tracking-tight">GÖNDER</span>
                                {isTyping ? <MoreHorizontal size={18} className="animate-pulse" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-[rgb(var(--text-tertiary))] text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60">
                    <span className="flex items-center gap-1.5"><Zap size={12} className="text-amber-500" /> ULTRA HIZLI YANIT</span>
                    <span className="w-1 h-1 bg-[rgb(var(--border-primary))] rounded-full" />
                    <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-green-500" /> %100 GİZLİLİK</span>
                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
                .bg-dot-pattern {
                    background-image: radial-gradient(rgba(var(--text-primary-rgb), 0.05) 1px, transparent 1px);
                    background-size: 24px 24px;
                }
            `}</style>
        </div>
    );
};

// Helper components
const ShieldCheck = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

export default BrandConsultant;
