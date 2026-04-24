import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
    value: string;
    onChange: (base64: string) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
}

const ImageUploader = ({ value, onChange, label = "Görsel Yükle", className = "", disabled = false }: ImageUploaderProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = (file: File) => {
        setError(null);

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Lütfen geçerli bir resim dosyası seçin (PNG, JPG, WEBP).');
            return;
        }

        // Validate file size (max 2MB to prevent localStorage quota exceeded)
        if (file.size > 2 * 1024 * 1024) {
            setError('Dosya boyutu çok büyük. Lütfen 2MB altında bir görsel yükleyin.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                onChange(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium text-zinc-700 block">{label}</label>

            <div
                className={`relative group border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden
                    ${isDragging && !disabled ? 'border-orange-500 bg-orange-50' : 'border-zinc-200 bg-slate-50 hover:bg-zinc-100'}
                    ${value ? 'h-48' : 'h-32 flex items-center justify-center'}
                    ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
                onDragEnter={disabled ? undefined : handleDrag}
                onDragOver={disabled ? undefined : handleDrag}
                onDragLeave={disabled ? undefined : handleDrag}
                onDrop={disabled ? undefined : handleDrop}
                onClick={disabled ? undefined : triggerUpload}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                />

                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex gap-2">
                                    <button
                                        onClick={triggerUpload}
                                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2 rounded-lg transition-colors"
                                    >
                                        <Upload size={20} />
                                    </button>
                                    <button
                                        onClick={clearImage}
                                        className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center p-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-zinc-400 group-hover:text-orange-500 group-hover:scale-110 transition-all">
                            <Upload size={20} />
                        </div>
                        <p className="text-sm text-zinc-500 font-medium group-hover:text-zinc-700">
                            Tıklayın veya sürükleyin
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">PNG, JPG (Max 2MB)</p>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-red-500 text-xs flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <X size={12} /> {error}
                </p>
            )}
        </div>
    );
};

export default ImageUploader;
