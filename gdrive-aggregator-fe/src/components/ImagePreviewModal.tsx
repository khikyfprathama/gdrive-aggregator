import React, { useEffect, useState } from 'react';
import type { FileRecord } from '../types';
import { apiService } from '../services/api';
import { X, Download, ExternalLink, RefreshCw, AlertCircle, ZoomIn } from 'lucide-react';

interface ImagePreviewModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onDownload: (file: FileRecord) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // Start with thumbnail URL; user can click to switch to full quality
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    setLoading(true);
    setHasError(false);
    setShowFull(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  // Fast thumbnail URL (redirect ke CDN Google Drive — ringan & cepat)
  const thumbnailUrl = apiService.getFileThumbnailUrl(file.id);
  // Full-res URL hanya dimuat jika user klik tombol "Kualitas Penuh"
  const fullUrl = apiService.getFilePreviewUrl(file.id);

  const activeUrl = showFull ? fullUrl : thumbnailUrl;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 max-w-4xl w-full bg-zinc-900 border-2 border-zinc-750 rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_#000] flex flex-col max-h-[90vh] font-mono">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b-2 border-zinc-700 bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <span className="font-bold text-xs text-white truncate max-w-md" title={file.name}>
              {file.name}
            </span>
            <span className="text-[11px] text-zinc-400 font-bold">
              ({formatFileSize(file.size)})
            </span>
            {/* Quality badge */}
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border-2 ${
              showFull
                ? 'bg-emerald-400 text-black border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                : 'bg-cyan-400 text-black border-black shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}>
              {showFull ? 'Kualitas Penuh' : 'Pratinjau Cepat'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle full quality button */}
            {!showFull && (
              <button
                onClick={() => { setShowFull(true); setLoading(true); setHasError(false); }}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                title="Muat gambar kualitas penuh (lebih lambat)"
              >
                <ZoomIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Kualitas Penuh</span>
              </button>
            )}
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-zinc-400 hover:text-white rounded border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
              title="Buka gambar penuh di tab baru"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>
            <button
              onClick={() => onDownload(file)}
              className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
              title="Download file"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
              title="Tutup pratinjau (Esc)"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative flex-1 min-h-[250px] max-h-[70vh] bg-zinc-950 flex items-center justify-center p-4 overflow-hidden border-b-2 border-zinc-700">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 stroke-[2.5]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {showFull ? 'Memuat kualitas penuh...' : 'Memuat pratinjau...'}
              </span>
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center gap-2 text-rose-400 p-8 text-center">
              <AlertCircle className="w-8 h-8 stroke-[2.5]" />
              <p className="text-xs font-black uppercase">Gagal memuat pratinjau gambar</p>
              <p className="text-[11px] text-zinc-400 font-sans max-w-xs">
                File mungkin tidak mendukung pratinjau langsung atau terjadi masalah jaringan.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="mt-2 px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black border-2 border-black rounded text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] transition-all"
              >
                Unduh File Secara Manual
              </button>
            </div>
          ) : (
            <img
              key={activeUrl}
              src={activeUrl}
              alt={file.name}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                if (!showFull) {
                  // Thumbnail failed, auto-fallback to full
                  setShowFull(true);
                  setLoading(true);
                } else {
                  setHasError(true);
                }
              }}
              className={`max-h-[68vh] max-w-full object-contain rounded border border-zinc-800 shadow-[4px_4px_0px_0px_#000] transition-opacity duration-200 ${
                loading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-zinc-950 text-[11px] text-zinc-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-zinc-400">Akun:</span>
            <span className="font-mono text-cyan-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 shadow-[1px_1px_0px_0px_#000]">
              {file.account_email || '-'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-zinc-400">
              MIME: {file.mime_type || 'image'}
            </span>
            {!showFull && (
              <span className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider">
                ⚡ Pratinjau Cepat Aktif
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
