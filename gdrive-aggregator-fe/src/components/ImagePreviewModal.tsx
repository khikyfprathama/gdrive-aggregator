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

      <div className="relative z-10 max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <span className="font-semibold text-xs text-white truncate max-w-md" title={file.name}>
              {file.name}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              ({formatFileSize(file.size)})
            </span>
            {/* Quality badge */}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
              showFull
                ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-400'
                : 'bg-blue-950/50 border-blue-700/50 text-blue-400'
            }`}>
              {showFull ? 'Penuh' : 'Pratinjau'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle full quality button */}
            {!showFull && (
              <button
                onClick={() => { setShowFull(true); setLoading(true); setHasError(false); }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition border border-zinc-700"
                title="Muat gambar kualitas penuh (lebih lambat)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Kualitas Penuh</span>
              </button>
            )}
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              title="Buka gambar penuh di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => onDownload(file)}
              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              title="Tutup pratinjau (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative flex-1 min-h-[250px] max-h-[70vh] bg-zinc-950/90 flex items-center justify-center p-4 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-xs">
                {showFull ? 'Memuat kualitas penuh...' : 'Memuat pratinjau...'}
              </span>
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center gap-2 text-rose-400 p-8 text-center">
              <AlertCircle className="w-8 h-8" />
              <p className="text-xs font-semibold">Gagal memuat pratinjau gambar</p>
              <p className="text-[11px] text-zinc-500 max-w-xs">
                File mungkin tidak mendukung pratinjau langsung atau terjadi masalah jaringan.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="mt-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition"
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
              className={`max-h-[68vh] max-w-full object-contain rounded transition-opacity duration-200 ${
                loading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span>Disimpan di Drive:</span>
            <span className="font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              {file.account_email || '-'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-zinc-500">
              Mime: {file.mime_type || 'image'}
            </span>
            {!showFull && (
              <span className="text-blue-500/70 italic">
                ⚡ Pratinjau cepat aktif
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
