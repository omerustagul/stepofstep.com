import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, MoreHorizontal } from 'lucide-react';
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
            text: `Merhaba ${user?.name || ''}! Ben yapay zeka marka danışmanınız. Markanızı bir sonraki seviyeye taşımanızda size nasıl yardımcı olabilirim?`,
            sender: 'ai',
            timestamp: new Date(),
            suggestions: ['Marka stratejisi oluştur', 'Hedef kitle analizi', 'İçerik fikirleri ver']
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        // User Message
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
            // AI Response
            const response = await sendMessageToAI(text, { userName: user?.name });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'ai',
                timestamp: new Date(),
                suggestions: response.suggestions
            };

            setMessages(prev => [...prev, aiMsg]);

            // Occasional achievement trigger (mock)
            if (Math.random() > 0.8) {
                // Future integration to unlock "AI Explorer" badge
            }

        } catch (error) {
            console.error('AI Error:', error);
            addNotification({ type: 'error', title: 'Hata', message: 'Bağlantı sorunu, lütfen tekrar deneyin.' });
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-[rgb(var(--bg-primary))] rounded-3xl border border-[rgb(var(--border-primary))] shadow-sm overflow-hidden relative">
            {/* Header */}
            <div className="p-4 border-b border-[rgb(var(--border-primary))] flex items-center justify-between bg-[rgb(var(--bg-secondary))]/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
                            AI Marka Danışmanı
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] uppercase font-bold tracking-wider">BETA</span>
                        </h2>
                        <p className="text-xs text-[rgb(var(--text-secondary))]">7/24 Aktif • GPT-4o Mode</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Actions like Clear History could go here */}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[rgb(var(--bg-primary))]">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${msg.sender === 'user' ? 'bg-[rgb(var(--bg-primary))] border-[rgb(var(--border-primary))]' : 'bg-gradient-to-br from-orange-500 to-red-500 border-none text-[rgb(var(--text-primary))]'
                            }`}>
                            {msg.sender === 'user' ? <User size={14} className="text-[rgb(var(--text-primary))]" /> : <Bot size={16} />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[80%] space-y-2`}>
                            <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                                ? 'bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] rounded-tr-none'
                                : 'bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] rounded-tl-none'
                                }`}>
                                {msg.text}
                            </div>

                            {/* Actions (Only for AI) */}
                            {msg.sender === 'ai' && (
                                <div className="flex gap-2">
                                    {msg.suggestions?.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(suggestion)}
                                            className="text-xs px-3 py-1.5 bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] rounded-xl hover:bg-[rgb(var(--bg-secondary))] transition-colors shadow-sm"
                                        >
                                            ✨ {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Timestamp */}
                            <div className={`text-[10px] text-[rgb(var(--text-tertiary))] px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0">
                            <Bot size={16} className="text-[rgb(var(--text-primary))]" />
                        </div>
                        <div className="bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[rgb(var(--bg-primary))] border-t border-[rgb(var(--border-primary))]">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Markanız hakkında bir şeyler sorun..."
                        className="w-full p-4 pr-12 bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-inner transition-all"
                        disabled={isTyping}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-3 top-3 p-2 bg-orange-500 text-[rgb(var(--text-primary))] rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:bg-zinc-300 transition-colors shadow-lg shadow-orange-500/20"
                    >
                        {isTyping ? <MoreHorizontal size={20} className="animate-pulse" /> : <Send size={20} />}
                    </button>
                </div>
                <p className="text-[10px] text-center text-[rgb(var(--text-tertiary))] mt-2 flex items-center justify-center gap-1">
                    <Sparkles size={10} /> AI asistan hata yapabilir. Önemli kararlar için uzman onayı alınız.
                </p>
            </div>
        </div>
    );
};

export default BrandConsultant;
