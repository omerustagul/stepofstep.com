import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Briefcase, Plus, Search, CheckCheck, Clock, Send, Loader2, User, ShieldCheck } from 'lucide-react';
import PortalJobs from './PortalJobs';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// --- Message Components (Formerly PortalMessages.tsx) ---

interface Reply {
    id: string;
    content: string;
    sender_role: 'admin' | 'user';
    created_at: string;
}

interface Message {
    id: string;
    message: string;
    status: 'new' | 'replied' | 'closed' | 'archived';
    created_at: string;
    reply_content?: string; // Legacy support
    replied_at?: string;    // Legacy support
    replies?: Reply[];
}

const MessageCard = ({
    msg,
    replyText,
    setReplyText,
    sending,
    handleSendReply
}: {
    msg: Message;
    replyText: { [key: string]: string };
    setReplyText: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    sending: { [key: string]: boolean };
    handleSendReply: (id: string) => void;
}) => {
    // Auto-scroll to bottom of conversation
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showHistory, setShowHistory] = useState(false);
    const isClosed = msg.status === 'closed' || msg.status === 'archived';

    useEffect(() => {
        if (scrollRef.current && (!isClosed || showHistory)) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [msg.replies, msg.reply_content, showHistory, isClosed]);

    // If closed and history not shown, render summary card
    if (isClosed && !showHistory) {
        return (
            <div className="bg-[rgb(var(--bg-card))] rounded-2xl border border-[rgb(var(--border-primary))] overflow-hidden shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-bold flex items-center gap-1">
                            <CheckCheck size={14} /> Konu Kapandı
                        </span>
                        <span className="text-xs font-bold text-zinc-400">
                            ID: #{msg.id.slice(0, 8)}
                        </span>
                    </div>
                    <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-1">
                        {msg.message}
                    </p>
                    <span className="text-xs text-[rgb(var(--text-tertiary))] mt-1 block">
                        {format(new Date(msg.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                    </span>
                </div>
                <button
                    onClick={() => setShowHistory(true)}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium transition-colors whitespace-nowrap"
                >
                    Konuşma Geçmişini Gör
                </button>
            </div>
        );
    }

    return (
        <div className={`bg-[rgb(var(--bg-card))] rounded-2xl border border-[rgb(var(--border-primary))] overflow-hidden shadow-sm flex flex-col ${isClosed ? 'opacity-90' : ''}`}>
            {/* Thread Header */}
            <div className="p-4 border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[rgb(var(--text-tertiary))]">
                        Konu ID: #{msg.id.slice(0, 8)}
                    </span>
                    {isClosed && (
                        <button
                            onClick={() => setShowHistory(false)}
                            className="text-xs text-[rgb(var(--text-secondary))] hover:text-orange-500 underline"
                        >
                            Gizle
                        </button>
                    )}
                </div>

                {isClosed ? (
                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCheck size={14} /> Konu Kapandı
                    </span>
                ) : (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold flex items-center gap-1">
                        <Clock size={14} /> Açık
                    </span>
                )}
            </div>

            {/* Conversation Area */}
            <div
                ref={scrollRef}
                className="p-6 space-y-6 bg-[rgb(var(--bg-tertiary))]/10 h-auto max-h-[400px] overflow-y-auto scroll-smooth custom-scrollbar"
            >
                {/* Original Message */}
                <div className="flex gap-4 flex-row-reverse">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 flex-shrink-0">
                        <User size={20} />
                    </div>
                    <div className="flex-1 text-right">
                        <div className="text-xs text-[rgb(var(--text-tertiary))] mb-1">
                            {format(new Date(msg.created_at), 'd MMMM HH:mm', { locale: tr })}
                        </div>
                        <div className="bg-orange-500 text-white p-4 rounded-2xl rounded-tr-none text-sm inline-block text-left shadow-sm shadow-orange-200 dark:shadow-none">
                            {msg.message}
                        </div>
                    </div>
                </div>

                {/* Legacy Reply */}
                {msg.reply_content && (!msg.replies || msg.replies.length === 0) && (
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-zinc-800 dark:bg-zinc-700 rounded-full flex items-center justify-center text-white flex-shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm text-[rgb(var(--text-primary))]">Destek Ekibi</span>
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                                    {msg.replied_at ? format(new Date(msg.replied_at), 'd MMMM HH:mm', { locale: tr }) : ''}
                                </span>
                            </div>
                            <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] p-4 rounded-2xl rounded-tl-none text-sm shadow-sm text-[rgb(var(--text-secondary))]">
                                {msg.reply_content}
                            </div>
                        </div>
                    </div>
                )}

                {/* Threaded Replies */}
                {msg.replies?.map((reply) => (
                    <div key={reply.id} className={`flex gap-4 ${reply.sender_role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${reply.sender_role === 'user' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-zinc-800 dark:bg-zinc-700 text-white'
                            }`}>
                            {reply.sender_role === 'user' ? <User size={20} /> : <ShieldCheck size={20} />}
                        </div>
                        <div className={`flex-1 ${reply.sender_role === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${reply.sender_role === 'user' ? 'justify-end' : ''}`}>
                                {reply.sender_role === 'admin' && <span className="font-bold text-sm text-[rgb(var(--text-primary))]">Destek Ekibi</span>}
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                                    {format(new Date(reply.created_at), 'd MMMM HH:mm', { locale: tr })}
                                </span>
                            </div>
                            <div className={`p-4 rounded-2xl text-sm shadow-sm inline-block text-left ${reply.sender_role === 'user'
                                ? 'bg-orange-500 text-white rounded-tr-none shadow-orange-200 dark:shadow-none'
                                : 'bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-primary))] rounded-tl-none text-[rgb(var(--text-secondary))]'
                                }`}>
                                {reply.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reply Input - Only show if NOT closed/archived */}
            {!isClosed && (
                <div className="p-4 bg-[rgb(var(--bg-card))] border-t border-[rgb(var(--border-primary))]">
                    <div className="relative">
                        <textarea
                            value={replyText[msg.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                            placeholder="Bir yanıt yazın..."
                            className="w-full bg-[rgb(var(--bg-input))] border border-[rgb(var(--border-primary))] rounded-xl p-4 pr-14 min-h-[60px] max-h-32 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-[rgb(var(--text-primary))]"
                        />
                        <button
                            onClick={() => handleSendReply(msg.id)}
                            disabled={!replyText[msg.id]?.trim() || sending[msg.id]}
                            className="absolute right-2 bottom-3 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors"
                        >
                            {sending[msg.id] ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SupportMessages = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [sending, setSending] = useState<{ [key: string]: boolean }>({});

    const fetchMessages = async () => {
        if (!user?.email) return;
        setLoading(true);
        const { data } = await supabase
            .from('contact_messages')
            .select(`
                *,
                replies:message_replies(*)
            `)
            .eq('email', user.email)
            .order('created_at', { ascending: false });

        if (data) {
            const processedData = data.map((msg: any) => ({
                ...msg,
                replies: msg.replies?.sort((a: Reply, b: Reply) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ) || []
            }));
            setMessages(processedData);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMessages();
    }, [user]);

    const handleSendReply = async (messageId: string) => {
        const content = replyText[messageId]?.trim();
        if (!content) return;

        setSending(prev => ({ ...prev, [messageId]: true }));
        try {
            const { error } = await supabase
                .from('message_replies')
                .insert({
                    message_id: messageId,
                    content: content,
                    sender_role: 'user'
                });

            if (error) throw error;
            setReplyText(prev => ({ ...prev, [messageId]: '' }));
            await fetchMessages();
            toast.success('Yanıtınız gönderildi.');
        } catch (error) {
            console.error('Yanıt gönderilemedi:', error);
            toast.error('Mesaj gönderilirken bir hata oluştu.');
        } finally {
            setSending(prev => ({ ...prev, [messageId]: false }));
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
    );

    const activeMessages = messages.filter(m => m.status !== 'closed' && m.status !== 'archived');
    const closedMessages = messages.filter(m => m.status === 'closed' || m.status === 'archived');

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
            {messages.length === 0 ? (
                <div className="bg-[rgb(var(--bg-card))] p-12 rounded-2xl border border-[rgb(var(--border-primary))] text-center">
                    <div className="w-16 h-16 bg-[rgb(var(--bg-tertiary))] rounded-full flex items-center justify-center mx-auto mb-4 text-[rgb(var(--text-tertiary))]">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">Gönderilmiş mesajınız yok</h3>
                    <p className="text-[rgb(var(--text-secondary))] mt-1">İletişim sayfasından bize ulaşabilirsiniz.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {activeMessages.map((msg) => (
                        <MessageCard
                            key={msg.id}
                            msg={msg}
                            replyText={replyText}
                            setReplyText={setReplyText}
                            sending={sending}
                            handleSendReply={handleSendReply}
                        />
                    ))}

                    {activeMessages.length > 0 && closedMessages.length > 0 && (
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[rgb(var(--border-primary))]"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-[rgb(var(--bg-card))] px-4 text-sm text-[rgb(var(--text-tertiary))] font-medium">Geçmiş Konuşmalar</span>
                            </div>
                        </div>
                    )}

                    {closedMessages.map((msg) => (
                        <MessageCard
                            key={msg.id}
                            msg={msg}
                            replyText={replyText}
                            setReplyText={setReplyText}
                            sending={sending}
                            handleSendReply={handleSendReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main PortalSupport Component ---

const PortalSupport = () => {
    const [activeTab, setActiveTab] = useState<'messages' | 'jobs'>('messages');

    return (
        <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0 px-2">
                <div>
                    <h1 className="text-3xl font-black text-[rgb(var(--text-primary))] tracking-tighter">Destek & Başvurular</h1>
                    <p className="text-[rgb(var(--text-secondary))] font-medium">İletişim talepleriniz ve iş başvurularınız tek bir yerde.</p>
                </div>

                {/* Modern Tabs */}
                <div className="flex w-fit items-center gap-2 bg-[rgb(var(--bg-card))] p-1 rounded-full md:rounded-xl">
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full md:rounded-xl font-bold text-sm transition-all ${activeTab === 'messages'
                            ? 'bg-[rgb(var(--accent-primary))] text-white shadow-lg shadow-orange-500/20'
                            : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                            }`}
                    >
                        <MessageSquare size={18} />
                        Mesajlar
                    </button>
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full md:rounded-xl font-bold text-sm transition-all ${activeTab === 'jobs'
                            ? 'bg-[rgb(var(--accent-primary))] text-white shadow-lg shadow-orange-500/20'
                            : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                            }`}
                    >
                        <Briefcase size={18} />
                        Başvuru Takibi
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 relative bg-[rgb(var(--bg-card))] rounded-3xl border border-[rgb(var(--border-primary))] shadow-sm overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'messages' ? (
                        <motion.div
                            key="messages"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full overflow-hidden"
                        >
                            <div className="h-full overflow-y-auto custom-scrollbar">
                                <SupportMessages />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="jobs"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full overflow-hidden"
                        >
                            <div className="h-full overflow-y-auto custom-scrollbar p-6">
                                <PortalJobs isEmbedded={true} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PortalSupport;
