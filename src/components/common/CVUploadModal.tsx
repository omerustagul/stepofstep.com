import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Check } from 'lucide-react';

interface CVUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (base64: string, fileName: string) => void;
}

const CVUploadModal = ({ isOpen, onClose, onUpload }: CVUploadModalProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        validateAndSetFile(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file: File) => {
        setError(null);

        // Sadece PDF kontrolü
        if (file.type !== 'application/pdf') {
            setError('Sadece PDF dosyaları kabul edilmektedir.');
            return;
        }

        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
            setError('Dosya boyutu 10MB\'ı geçemez.');
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = () => {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            onUpload(base64, selectedFile.name);
            handleClose();
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleClose = () => {
        setSelectedFile(null);
        setError(null);
        onClose();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-zinc-900">CV Yükle</h3>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                                ${isDragging
                                    ? 'border-orange-500 bg-orange-50'
                                    : selectedFile
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-zinc-300 hover:border-orange-400 hover:bg-zinc-50'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {selectedFile ? (
                                <div className="space-y-3">
                                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                                        <FileText size={32} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">{selectedFile.name}</p>
                                        <p className="text-sm text-zinc-500">{formatFileSize(selectedFile.size)}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                        }}
                                        className="text-sm text-red-500 hover:text-red-600"
                                    >
                                        Değiştir
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-colors ${isDragging ? 'bg-orange-100' : 'bg-zinc-100'
                                        }`}>
                                        <Upload size={32} className={isDragging ? 'text-orange-600' : 'text-zinc-400'} />
                                    </div>
                                    <div>
                                        <p className="text-zinc-600">
                                            CV'ni sürükle veya{' '}
                                            <span className="text-orange-500 font-bold">göz at</span>
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-1">Sadece PDF, maksimum 10MB</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleClose}
                                className="flex-1 py-3 rounded-xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile}
                                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                Yükle
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CVUploadModal;
