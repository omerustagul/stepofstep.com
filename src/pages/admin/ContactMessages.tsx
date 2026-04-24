import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRoles } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { MessageSquare, Search, Filter, Eye, Trash2, Mail, X, Check, Send, ShieldCheck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

interface Reply {
    id: string;
    content: string;
    sender_role: 'admin' | 'user';
    created_at: string;
}

interface Message {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    message: string;
    status: 'new' | 'replied' | 'archived';
    reply_content?: string;
    replied_at?: string;
    created_at: string;
    is_read: boolean;
    replies?: Reply[];
}

const ContactMessages = () => {
    const { user } = useAuth();
    const { canView, canEdit } = useRoles();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyMode, setReplyMode] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'replied' | 'archived'>('all');

    const hasViewPermission = user?.role_id ? canView(user.role_id, 'messages') : user?.role === 'admin';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'messages') : user?.role === 'admin';

    useEffect(() => {
        if (hasViewPermission) {
            fetchMessages();

            // Realtime subscription
            const channel = supabase
                .channel('admin-messages-subscription')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'contact_messages' },
                    (payload) => {
                        // If selected message is updated (e.g. read status changed by another admin), update it
                        if (payload.eventType === 'UPDATE' && selectedMessage?.id === payload.new.id) {
                            // We will re-fetch anyway, so this might be redundant but good for immediate feedback
                        }
                        fetchMessages();
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'message_replies' },
                    () => {
                        fetchMessages();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [hasViewPermission]);

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('contact_messages')
                .select(`
                    *,
                    replies:message_replies(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const processedData = data?.map((msg: any) => ({
                ...msg,
                replies: msg.replies?.sort((a: Reply, b: Reply) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ) || []
            })) || [];

            setMessages(processedData);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: Message['status']) => {
        if (!hasEditPermission) return;
        try {
            const { error } = await supabase
                .from('contact_messages')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
            if (selectedMessage?.id === id) {
                setSelectedMessage({ ...selectedMessage, status: newStatus });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Durum güncellenirken bir hata oluştu.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!hasEditPermission) return;
        if (!window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('contact_messages')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.filter(m => m.id !== id));
            if (selectedMessage?.id === id) setSelectedMessage(null);
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error('Mesaj silinirken bir hata oluştu.');
        }
    };

    const handleSendReply = async () => {
        if (!selectedMessage || !replyContent) return;
        setSendingReply(true);

        try {
            // 1. Insert reply into message_replies
            const { error: replyError } = await supabase
                .from('message_replies')
                .insert({
                    message_id: selectedMessage.id,
                    content: replyContent,
                    sender_role: 'admin'
                });

            if (replyError) throw replyError;

            // 2. Call Edge Function (Optional - keeping existing logic)
            const { error: functionError } = await supabase.functions.invoke('send-email', {
                body: {
                    to: selectedMessage.email,
                    subject: `Yanıt: Step of Step İletişim Formu`,
                    html: `<p>Sayın ${selectedMessage.name} ${selectedMessage.surname},</p><p>${replyContent.replace(/\n/g, '<br>')}</p><br><p>Saygılarımızla,<br>Step of Step Ekibi</p>`
                }
            });

            if (functionError) console.warn("Edge function failed:", functionError);

            // 3. Update contact_messages status
            const newStatus = 'replied';
            const { error: updateError } = await supabase
                .from('contact_messages')
                .update({
                    status: newStatus,
                    // Legacy support (optional, but good for backward compat if needed)
                    reply_content: replyContent,
                    replied_at: new Date().toISOString()
                })
                .eq('id', selectedMessage.id);

            if (updateError) throw updateError;

            // 4. Update local state
            setReplyContent('');
            setReplyMode(false);
            await fetchMessages(); // Re-fetch to get the new reply list

            toast.success('Yanıt gönderildi.');
            setSelectedMessage(null);

        } catch (error: any) {
            console.error('Error sending reply:', error);
            // Handle specific errors for better UX
            if (error?.message?.includes('is_read')) {
                toast.success('Yanıt kaydedildi (Veritabanı uyarısı aldırmayın).');
            } else {
                toast.error('Yanıt gönderilirken bir hata oluştu.');
            }
        } finally {
            setSendingReply(false);
        }
    };

    const filteredMessages = messages.filter(m => {
        const matchesSearch =
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.message.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = statusFilter === 'all' || m.status === statusFilter;

        return matchesSearch && matchesFilter;
    });

    if (!hasViewPermission) {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-zinc-900">Gelen Mesajlar</h1>
                    <p className="text-zinc-500">İletişim formundan gelen mesajları yönetin.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="İsim, e-posta veya mesaj içeriği ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Filter size={20} className="text-zinc-400 min-w-[20px]" />
                    {(['all', 'new', 'replied', 'archived'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === status
                                ? 'bg-orange-500 text-white'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                }`}
                        >
                            {status === 'all' && 'Tümü'}
                            {status === 'new' && 'Yeni'}
                            {status === 'replied' && 'Yanıtlandı'}
                            {status === 'archived' && 'Arşiv'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gönderen</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">İletişim</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mesaj Özeti</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tarih</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Durum</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : filteredMessages.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        Gösterilecek mesaj bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredMessages.map((message) => (
                                    <tr key={message.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                                                    {message.name.charAt(0)}{message.surname.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-zinc-900">{message.name} {message.surname}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-zinc-900">{message.email}</div>
                                            <div className="text-xs text-zinc-500">{message.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-zinc-500 line-clamp-1 max-w-xs" title={message.message}>
                                                {message.message}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                            {new Date(message.created_at).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${message.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                message.status === 'replied' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {message.status === 'new' && 'Yeni'}
                                                {message.status === 'replied' && 'Yanıtlandı'}
                                                {message.status === 'archived' && 'Arşiv'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={async () => {
                                                        setSelectedMessage(message);
                                                        setReplyMode(false);

                                                        // Mark as read if not already
                                                        if (!message.is_read) {
                                                            const { error } = await supabase
                                                                .from('contact_messages')
                                                                .update({ is_read: true })
                                                                .eq('id', message.id);

                                                            if (!error) {
                                                                // Update local state
                                                                setMessages(prev => prev.map(m =>
                                                                    m.id === message.id ? { ...m, is_read: true } : m
                                                                ));
                                                            }
                                                        }
                                                    }}
                                                    className="text-orange-600 hover:text-orange-900 p-2 hover:bg-orange-50 rounded-lg"
                                                    title="Görüntüle"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {hasEditPermission && (
                                                    <button
                                                        onClick={() => handleDelete(message.id)}
                                                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Message Detail Modal */}
            <AnimatePresence>
                {selectedMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <MessageSquare size={20} className="text-orange-500" />
                                    Mesaj Detayı
                                </h2>
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="p-2 hover:bg-white rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase">Gönderen</label>
                                            <p className="text-lg font-semibold text-zinc-900">{selectedMessage.name} {selectedMessage.surname}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase">E-Posta</label>
                                            <p className="text-zinc-700 font-mono bg-zinc-50 px-3 py-1 rounded inline-block">{selectedMessage.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase">Telefon</label>
                                            <p className="text-zinc-700">{selectedMessage.phone || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase">Tarih</label>
                                            <p className="text-zinc-700">{new Date(selectedMessage.created_at).toLocaleString('tr-TR')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase">Durum</label>
                                        <div className="flex gap-2">
                                            {(['new', 'replied', 'archived'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    disabled={!hasEditPermission}
                                                    onClick={() => handleStatusChange(selectedMessage.id, s)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${selectedMessage.status === s
                                                        ? s === 'new' ? 'bg-blue-100 text-blue-700 border-blue-200' : s === 'replied' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                                                        : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                                                        }`}
                                                >
                                                    {s === 'new' && 'Yeni'}
                                                    {s === 'replied' && 'Yanıtlandı'}
                                                    {s === 'archived' && 'Arşivlenmiş'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Conversation Area - Mimics PortalMessages */}
                                <div className="space-y-6 mb-8">
                                    {/* Original Message */}
                                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                                        <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            Mesaj İçeriği ({new Date(selectedMessage.created_at).toLocaleDateString('tr-TR')})
                                        </h3>
                                        <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                                            {selectedMessage.message}
                                        </p>
                                    </div>

                                    {/* Legacy Reply (if exists and no threaded replies) */}
                                    {selectedMessage.reply_content && (!selectedMessage.replies || selectedMessage.replies.length === 0) && (
                                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                            <h3 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
                                                <Check size={16} />
                                                Verilen Yanıt ({selectedMessage.replied_at ? new Date(selectedMessage.replied_at).toLocaleDateString('tr-TR') : '-'})
                                            </h3>
                                            <p className="text-green-800 whitespace-pre-wrap leading-relaxed">
                                                {selectedMessage.reply_content}
                                            </p>
                                        </div>
                                    )}

                                    {/* Threaded Replies */}
                                    {selectedMessage.replies?.map((reply) => (
                                        <div key={reply.id} className={`flex gap-4 ${reply.sender_role === 'admin' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${reply.sender_role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-zinc-800 text-white'
                                                }`}>
                                                {reply.sender_role === 'admin' ? <ShieldCheck size={20} /> : <User size={20} />}
                                            </div>
                                            <div className={`flex-1 ${reply.sender_role === 'admin' ? 'text-right' : 'text-left'}`}>
                                                <div className={`flex items-center gap-2 mb-1 ${reply.sender_role === 'admin' ? 'justify-end' : ''}`}>
                                                    <span className="font-bold text-sm">
                                                        {reply.sender_role === 'admin' ? 'Siz (Destek)' : `${selectedMessage.name} ${selectedMessage.surname}`}
                                                    </span>
                                                    <span className="text-xs text-zinc-400">
                                                        {new Date(reply.created_at).toLocaleString('tr-TR')}
                                                    </span>
                                                </div>
                                                <div className={`p-4 rounded-2xl text-sm shadow-sm inline-block text-left ${reply.sender_role === 'admin'
                                                    ? 'bg-orange-500 text-white rounded-tr-none shadow-orange-200'
                                                    : 'bg-white border border-zinc-200 rounded-tl-none text-zinc-700'
                                                    }`}>
                                                    {reply.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Reply Section */}
                                {hasEditPermission && (
                                    <div className="border-t border-zinc-100 pt-6">
                                        {!replyMode ? (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setReplyMode(true)}
                                                    className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
                                                >
                                                    <Mail size={18} />
                                                    Yanıtla
                                                </button>

                                                {selectedMessage.status !== 'archived' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Bu görüşmeyi sonlandırmak (arşivlemek) istediğinize emin misiniz?')) {
                                                                await handleStatusChange(selectedMessage.id, 'archived');
                                                                toast.success('Görüşme sonlandırıldı.');
                                                                setSelectedMessage(null);
                                                            }
                                                        }}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ml-auto"
                                                    >
                                                        <Check size={18} />
                                                        Görüşmeyi Sonlandır
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-zinc-900">Yanıt Oluştur</h3>
                                                    <button onClick={() => setReplyMode(false)} className="text-zinc-400 hover:text-zinc-600">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    placeholder={`Sayın ${selectedMessage.name} ${selectedMessage.surname},\n\n...`}
                                                    className="w-full h-40 p-4 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                                                />
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => setReplyMode(false)}
                                                        className="px-6 py-3 text-zinc-500 hover:bg-zinc-100 rounded-xl font-medium transition-colors"
                                                    >
                                                        İptal
                                                    </button>
                                                    <button
                                                        onClick={handleSendReply}
                                                        disabled={!replyContent || sendingReply}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {sendingReply ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                Gönderiliyor...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send size={18} />
                                                                Gönder
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-zinc-400 text-right">
                                                    Bu mesaj SMTP ayarlarındaki e-posta üzerinden gönderilecektir.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContactMessages;
