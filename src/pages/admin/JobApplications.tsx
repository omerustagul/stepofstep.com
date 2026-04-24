import { useState } from 'react';
import { Search, Filter, Eye, Check, X, Calendar, FileText, Mail, Phone, LayoutDashboard, Video, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import { useJobs, type JobApplication } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { emailService } from '../../services/emailService';
import { useRoles } from '../../context/RoleContext';
import { Navigate } from 'react-router-dom';

const JobApplications = () => {
    const { applications, updateStatus } = useJobs();
    const { user } = useAuth();
    const { canView, canEdit } = useRoles();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const { showLoading, hideLoading } = useLoading();
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [draggedItem, setDraggedItem] = useState<JobApplication | null>(null);

    // Meeting Link Modal State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [meetingLinkInput, setMeetingLinkInput] = useState('');
    const [confirmingApp, setConfirmingApp] = useState<JobApplication | null>(null);

    const hasViewPermission = user?.role_id ? canView(user.role_id, 'jobs') : user?.role === 'admin' || user?.role === 'marketing';
    const hasEditPermission = user?.role_id ? canEdit(user.role_id, 'jobs') : user?.role === 'admin' || user?.role === 'marketing';

    if (!hasViewPermission) {
        return <Navigate to="/admin" replace />;
    }

    const statusColors: Record<string, string> = {
        new: 'bg-yellow-100 text-yellow-700',
        interview: 'bg-purple-100 text-purple-700',
        rejected: 'bg-red-100 text-red-700',
        hired: 'bg-green-100 text-green-700'
    };

    const statusLabels: Record<string, string> = {
        new: 'Yeni',
        interview: 'Değerlendirme',
        rejected: 'Başvuru Reddedildi',
        hired: 'Başvuru Onaylandı'
    };

    const kanbanColumns = [
        { id: 'new', label: 'Yeni', color: 'bg-yellow-500' },
        { id: 'interview', label: 'Değerlendirme', color: 'bg-purple-500' },
        { id: 'hired', label: 'İşe Alındı', color: 'bg-green-500' },
        { id: 'rejected', label: 'Reddedildi', color: 'bg-red-500' },
    ];

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, app: JobApplication) => {
        setDraggedItem(app);
        e.dataTransfer.effectAllowed = 'move';
        // Set drag image or data if needed
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, status: JobApplication['status']) => {
        e.preventDefault();
        if (draggedItem && draggedItem.status !== status) {
            // Update UI optimistically or wait for server
            // If dragging to 'hired' or 'rejected', we might want to trigger the specific handlers 
            // but for simple board movement, let's just update status.
            if (status === 'hired') {
                handleApprove(draggedItem);
            } else if (status === 'rejected') {
                handleReject(draggedItem);
            } else if (status === 'interview') {
                // Generate Google Meet Link
                const chars = 'abcdefghijklmnopqrstuvwxyz';
                const segment1 = Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
                const segment2 = Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
                const segment3 = Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
                const meetLink = `https://meet.google.com/${segment1}-${segment2}-${segment3}`;

                updateStatus(draggedItem.id, status, { meeting_link: meetLink });
            } else {
                updateStatus(draggedItem.id, status);
            }
        }
        setDraggedItem(null);
    };

    const handleViewCV = (cvUrl?: string) => {
        if (cvUrl) {
            // Base64 PDF ise yeni sekmede aç
            if (cvUrl.startsWith('data:application/pdf')) {
                const win = window.open();
                if (win) {
                    win.document.write(`<iframe width="100%" height="100%" src="${cvUrl}"></iframe>`);
                }
            } else {
                window.open(cvUrl, '_blank');
            }
        } else {
            alert('CV yüklenmemiş.');
        }
    };

    const handleViewDetails = (app: JobApplication) => {
        setSelectedApplication(app);
        setShowDetailModal(true);
    };

    const handleApprove = async (app: JobApplication) => {
        showLoading('Onay e-postası gönderiliyor...');

        try {
            await emailService.sendEmail({
                to: app.email,
                subject: 'İş Başvurunuz Onaylandı - Step of Step',
                html: `
                    <h1>Tebrikler ${app.name}!</h1>
                    <p>Step of Step ailesine katılma başvurunuz olumlu değerlendirilmiştir.</p>
                    <p>En kısa sürede İK ekibimiz sizinle iletişime geçecektir.</p>
                    <br>
                    <p>Saygılarımızla,<br>Step of Step Ekibi</p>
                `
            });

            updateStatus(app.id, 'hired' as any);
            alert(`Onay e-postası ${app.email} adresine gönderildi!`);
        } catch (error) {
            console.error('Email gönderilemedi:', error);
            alert('E-posta gönderilirken bir hata oluştu, ancak durum güncellendi.');
            updateStatus(app.id, 'hired' as any);
        } finally {
            hideLoading();
        }
    };

    const openConfirmModal = (app: JobApplication) => {
        setConfirmingApp(app);
        setMeetingLinkInput('');
        setShowLinkModal(true);
    };

    const handleSaveMeeting = async () => {
        if (!confirmingApp || !meetingLinkInput.trim()) {
            alert('Lütfen geçerli bir toplantı linki giriniz.');
            return;
        }

        // Basic URL validation
        if (!meetingLinkInput.includes('meet.google.com')) {
            alert('Lütfen geçerli bir Google Meet linki giriniz (meet.google.com içermeli).');
            return;
        }

        showLoading('Toplantı onaylanıyor...');
        try {
            await updateStatus(confirmingApp.id, 'interview', {
                meeting_link: meetingLinkInput,
                meeting_confirmed: true
            });

            setShowLinkModal(false);
            setConfirmingApp(null);
            alert('Toplantı onaylandı ve link kullanıcıya iletildi.');
        } catch (error) {
            console.error('Toplantı onaylanamadı:', error);
            alert('Bir hata oluştu.');
        } finally {
            hideLoading();
        }
    };

    const handleReject = async (app: JobApplication) => {
        showLoading('Red e-postası gönderiliyor...');

        try {
            await emailService.sendEmail({
                to: app.email,
                subject: 'İş Başvurunuz Hakkında - Step of Step',
                html: `
                    <p>Sayın ${app.name},</p>
                    <p>Step of Step'e yaptığınız başvuru için teşekkür ederiz. Yapılan değerlendirme sonucunda başvurunuzu şu an için olumlu değerlendiremediğimizi bildirmek isteriz.</p>
                    <p>Kariyerinizde başarılar dileriz.</p>
                    <br>
                    <p>Saygılarımızla,<br>Step of Step Ekibi</p>
                `
            });

            updateStatus(app.id, 'rejected');
            alert(`Red e-postası ${app.email} adresine gönderildi.`);
        } catch (error) {
            console.error('Email gönderilemedi:', error);
            alert('E-posta gönderilirken bir hata oluştu, ancak durum güncellendi.');
            updateStatus(app.id, 'rejected');
        } finally {
            hideLoading();
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR');
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">İş Başvuruları</h1>
                    <p className="text-zinc-500">Gelen başvuruları ve işe alım sürecini yönetin.</p>
                </div>
                {/* View Toggle */}
                <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                        title="Liste Görünümü"
                    >
                        <FileText size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                        title="Pano Görünümü"
                    >
                        <LayoutDashboard className="rotate-90" size={20} />
                    </button>
                </div>
            </div>

            {/* Filters - Hide in Board View to save space or adjust? Let's keep common filters */}
            <div className="flex flex-col md:flex-row gap-4 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Başvuran ara..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {viewMode === 'list' && (
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                        <select
                            className="pl-10 pr-8 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Tüm Durumlar</option>
                            <option value="new">Yeni</option>
                            <option value="reviewed">İncelendi</option>
                            <option value="interview">Mülakat</option>
                            <option value="rejected">Reddedildi</option>
                            <option value="hired">İşe Alındı</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {viewMode === 'list' ? (
                /* List View */
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex-1 overflow-y-auto">
                    <table className="w-full relative">
                        <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                            <tr>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Başvuran</th>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Tarih</th>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">İletişim</th>
                                <th className="text-left py-4 px-6 font-medium text-zinc-500 text-sm">Durum</th>
                                <th className="text-right py-4 px-6 font-medium text-zinc-500 text-sm">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                                        Henüz başvuru bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                filteredApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                    {app.name.charAt(0)}
                                                </div>
                                                <div className="font-medium text-zinc-900">{app.name}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-zinc-500 flex items-center gap-1">
                                                <Calendar size={14} /> {formatDate(app.created_at)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col text-sm text-zinc-600">
                                                <span>{app.email}</span>
                                                <span className="text-xs text-zinc-400">{app.phone}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${statusColors[app.status]}`}>
                                                {statusLabels[app.status]}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {app.status === 'interview' && !app.meeting_confirmed && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openConfirmModal(app); }}
                                                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Toplantıyı Onayla"
                                                    >
                                                        <CalendarCheck size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleViewCV(app.cv_url)}
                                                    className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                                    title="CV'yi Görüntüle"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleViewDetails(app)}
                                                    className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Detayları Göster"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {hasEditPermission && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(app)}
                                                            disabled={app.status === 'hired' || app.status === 'rejected'}
                                                            className="p-2 text-zinc-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Onayla"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(app)}
                                                            disabled={app.status === 'hired' || app.status === 'rejected'}
                                                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Reddet"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Board View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto flex-1 items-start h-full">
                    {kanbanColumns.map(column => {
                        const columnApps = applications.filter(app => {
                            // Apply search filter even in board view
                            const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                app.email.toLowerCase().includes(searchTerm.toLowerCase());
                            return app.status === column.id && matchesSearch;
                        });

                        return (
                            <div
                                key={column.id}
                                className="w-66 shrink-0 bg-zinc-50 rounded-2xl flex flex-col max-h-full border border-zinc-200"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id as JobApplication['status'])}
                            >
                                {/* Column Header */}
                                <div className="p-3 border-b border-zinc-200 flex items-center justify-between bg-white rounded-t-2xl sticky top-0 z-10">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                        <h3 className="font-bold text-sm text-zinc-700">{column.label}</h3>
                                    </div>
                                    <span className="bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {columnApps.length}
                                    </span>
                                </div>

                                {/* Column Content */}
                                <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                                    {columnApps.length === 0 ? (
                                        <div className="h-20 flex items-center justify-center text-xs text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl m-0.5">
                                            Başvuru Yok
                                        </div>
                                    ) : (
                                        columnApps.map(app => (
                                            <motion.div
                                                layout
                                                key={app.id}
                                                draggable={hasEditPermission}
                                                onDragStart={(e) => hasEditPermission && handleDragStart(e as unknown as React.DragEvent, app)}
                                                className={`bg-white p-3 rounded-xl border-zinc-100 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group border-l-4 ${statusColors[column.id].replace('text-', 'border-').split(' ')[0]}`}
                                                whileHover={{ y: -2 }}
                                                onClick={() => handleViewDetails(app)}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-xs">
                                                        {app.name.charAt(0)}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <h4 className="font-bold text-sm text-zinc-900 truncate">{app.name}</h4>
                                                        <p className="text-xs text-zinc-500 truncate">{app.email}</p>
                                                    </div>
                                                </div>
                                                {app.meeting_link && app.status === 'interview' && (
                                                    <div className="mb-2">
                                                        {!app.meeting_confirmed ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openConfirmModal(app); }}
                                                                className="w-full py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                                            >
                                                                <CalendarCheck size={12} /> Toplantıyı Onayla
                                                            </button>
                                                        ) : (
                                                            <div className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold flex items-center gap-1 w-max border border-green-100">
                                                                <Check size={10} /> Toplantı Onaylandı
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                        <Calendar size={10} /> {formatDate(app.created_at)}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleViewCV(app.cv_url); }}
                                                        className="text-zinc-400 hover:text-orange-500"
                                                        title="CV"
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {showDetailModal && selectedApplication && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowDetailModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-zinc-900">Başvuru Detayları</h3>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl">
                                    <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl font-bold">
                                        {selectedApplication.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900">{selectedApplication.name}</h4>
                                        <p className="text-sm text-zinc-500">{formatDate(selectedApplication.created_at)}</p>
                                    </div>
                                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${statusColors[selectedApplication.status]}`}>
                                        {statusLabels[selectedApplication.status]}
                                    </span>
                                </div>

                                {selectedApplication.status === 'interview' && selectedApplication.meeting_link && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                            <Video size={16} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-70">Toplantı Linki</p>
                                            <a href={selectedApplication.meeting_link} target="_blank" rel="noreferrer" className="text-sm font-medium truncate block hover:underline">
                                                {selectedApplication.meeting_link}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl">
                                        <Mail size={16} className="text-zinc-400" />
                                        <span className="text-sm text-zinc-600">{selectedApplication.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl">
                                        <Phone size={16} className="text-zinc-400" />
                                        <span className="text-sm text-zinc-600">{selectedApplication.phone}</span>
                                    </div>
                                </div>

                                {selectedApplication.message && (
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <p className="text-sm font-medium text-orange-800 mb-2">Neden Step Of Step?</p>
                                        <p className="text-sm text-zinc-600">{selectedApplication.message}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => handleViewCV(selectedApplication.cv_url)}
                                        className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FileText size={18} />
                                        CV'yi Aç
                                    </button>
                                    {hasEditPermission && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    handleApprove(selectedApplication);
                                                    setShowDetailModal(false);
                                                }}
                                                disabled={selectedApplication.status === 'hired' || selectedApplication.status === 'rejected'}
                                                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Check size={18} />
                                                Onayla
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleReject(selectedApplication);
                                                    setShowDetailModal(false);
                                                }}
                                                disabled={selectedApplication.status === 'hired' || selectedApplication.status === 'rejected'}
                                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <X size={18} />
                                                Reddet
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Confirm Meeting Modal */}
                {showLinkModal && confirmingApp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowLinkModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-zinc-900">Toplantı Linkini Tanımla</h3>
                                <button
                                    onClick={() => setShowLinkModal(false)}
                                    className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                    <p className="text-sm text-purple-800 mb-3 font-medium">1. Adım: Google Meet Linki Oluşturun</p>
                                    <a
                                        href="https://meet.google.com/new"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-white border border-purple-200 text-purple-700 py-2.5 rounded-xl font-bold hover:bg-purple-50 transition-colors"
                                    >
                                        <Video size={18} />
                                        Yeni Toplantı Oluştur (Google Meet)
                                    </a>
                                </div>

                                <div>
                                    <p className="text-sm text-zinc-700 mb-2 font-medium">2. Adım: Linki Buraya Yapıştırın</p>
                                    <input
                                        type="text"
                                        placeholder="https://meet.google.com/..."
                                        className="w-full p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        value={meetingLinkInput}
                                        onChange={(e) => setMeetingLinkInput(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleSaveMeeting}
                                    disabled={!meetingLinkInput}
                                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Check size={18} />
                                    Kaydet ve Onayla
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default JobApplications;
