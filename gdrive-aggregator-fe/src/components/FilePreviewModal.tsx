import React, { useEffect, useState } from 'react';
import type { FileRecord } from '../types';
import { apiService } from '../services/api';
import {
  X,
  Download,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ZoomIn,
  FileText,
  FileAudio,
  FileArchive,
  File,
  Copy,
  Check,
} from 'lucide-react';

interface FilePreviewModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onDownload: (file: FileRecord) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    setLoading(true);
    setHasError(false);
    setShowFull(false);
    setTextContent(null);
    setTextLoading(false);
    setCopiedText(false);

    if (!file) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // If file is text or code, fetch content
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isTextFile =
      ['txt', 'md', 'json', 'csv', 'log', 'xml', 'yaml', 'yml', 'js', 'ts', 'jsx', 'tsx', 'go', 'py', 'html', 'css', 'sql', 'sh', 'env', 'conf'].includes(ext) ||
      file.mime_type?.startsWith('text/') ||
      file.mime_type?.includes('json');

    if (isTextFile) {
      setTextLoading(true);
      fetch(apiService.getFilePreviewUrl(file.id))
        .then((res) => {
          if (!res.ok) throw new Error('Gagal memuat teks');
          return res.text();
        })
        .then((text) => {
          // Limit text display to 500KB to avoid DOM freezing on huge files
          if (text.length > 500000) {
            setTextContent(text.slice(0, 500000) + '\n\n... [Konten dipotong karena ukuran file terlalu besar]');
          } else {
            setTextContent(text);
          }
          setTextLoading(false);
          setLoading(false);
        })
        .catch(() => {
          setTextLoading(false);
          setHasError(true);
          setLoading(false);
        });
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mime = file.mime_type || '';

  const isImg =
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext) ||
    mime.startsWith('image/');

  const isVideo =
    ['mp4', 'mkv', 'webm', 'mov', 'avi', 'm4v', 'ogv'].includes(ext) ||
    mime.startsWith('video/');

  const isAudio =
    ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'wma'].includes(ext) ||
    mime.startsWith('audio/');

  const isPdf = ext === 'pdf' || mime.includes('pdf');

  const isTextOrCode =
    ['txt', 'md', 'json', 'csv', 'log', 'xml', 'yaml', 'yml', 'js', 'ts', 'jsx', 'tsx', 'go', 'py', 'html', 'css', 'sql', 'sh', 'env', 'conf'].includes(ext) ||
    mime.startsWith('text/') ||
    mime.includes('json');

  const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  const isArchive = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'].includes(ext);

  const thumbnailUrl = apiService.getFileThumbnailUrl(file.id);
  const previewUrl = apiService.getFilePreviewUrl(file.id);
  const activeImageUrl = showFull ? previewUrl : thumbnailUrl;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1500);
    }
  };

  const getCategoryBadge = () => {
    if (isImg) {
      return {
        label: showFull ? 'GAMBAR (PENUH)' : 'GAMBAR (CEPAT)',
        color: showFull ? 'bg-emerald-400 text-black' : 'bg-cyan-400 text-black',
      };
    }
    if (isVideo) return { label: 'VIDEO', color: 'bg-purple-400 text-black' };
    if (isAudio) return { label: 'AUDIO', color: 'bg-amber-400 text-black' };
    if (isPdf) return { label: 'PDF DOKUMEN', color: 'bg-rose-400 text-black' };
    if (isTextOrCode) return { label: 'KODE / TEKS', color: 'bg-lime-400 text-black' };
    if (isOfficeDoc) return { label: 'OFFICE DOC', color: 'bg-blue-400 text-black' };
    if (isArchive) return { label: 'ARSIP', color: 'bg-orange-400 text-black' };
    return { label: 'BERKAS', color: 'bg-zinc-300 text-black' };
  };

  const badge = getCategoryBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 max-w-5xl w-full bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] font-sans">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 truncate min-w-0">
            <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md" title={file.name}>
              {file.name}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono shrink-0">
              ({formatFileSize(file.size)})
            </span>
            {/* Category badge */}
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                isImg
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : isVideo
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : isAudio
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : isPdf
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : isTextOrCode
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle full quality button (Images only) */}
            {isImg && !showFull && (
              <button
                onClick={() => {
                  setShowFull(true);
                  setLoading(true);
                  setHasError(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-cyan-500 hover:bg-cyan-400 rounded-xl shadow-sm transition-all"
                title="Muat gambar kualitas penuh (resolusi asli)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kualitas Penuh</span>
              </button>
            )}

            {/* Copy button for text/code */}
            {isTextOrCode && textContent && (
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/70 rounded-xl transition"
                title="Salin isi teks"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            )}

            {/* Open in new tab */}
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition"
              title="Buka file langsung di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Download */}
            <button
              onClick={() => onDownload(file)}
              className="p-2 text-zinc-400 hover:text-emerald-400 rounded-xl hover:bg-zinc-800/80 transition"
              title="Unduh file ini"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition"
              title="Tutup pratinjau (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="relative flex-1 min-h-[300px] max-h-[72vh] bg-zinc-950/80 flex items-center justify-center p-3 sm:p-5 overflow-hidden border-b border-zinc-800/80">
          {/* IMAGE VIEWER */}
          {isImg && (
            <>
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs font-medium">
                    {showFull ? 'Memuat resolusi penuh...' : 'Memuat pratinjau gambar...'}
                  </span>
                </div>
              )}

              {hasError ? (
                <div className="flex flex-col items-center justify-center gap-2 text-rose-400 p-8 text-center">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-xs font-semibold">Gagal memuat pratinjau gambar</p>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    File gambar tidak dapat dimuat atau terjadi gangguan jaringan.
                  </p>
                  <button
                    onClick={() => onDownload(file)}
                    className="mt-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Unduh File Secara Manual
                  </button>
                </div>
              ) : (
                <img
                  key={activeImageUrl}
                  src={activeImageUrl}
                  alt={file.name}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    if (!showFull) {
                      setShowFull(true);
                      setLoading(true);
                    } else {
                      setHasError(true);
                    }
                  }}
                  className={`max-h-[68vh] max-w-full object-contain rounded-xl border border-zinc-800/80 shadow-lg transition-opacity duration-200 ${
                    loading ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              )}
            </>
          )}

          {/* VIDEO VIEWER */}
          {isVideo && (
            <div className="w-full h-full flex items-center justify-center">
              <video
                controls
                playsInline
                autoPlay={false}
                src={previewUrl}
                className="max-h-[68vh] max-w-full rounded-xl border border-zinc-800 bg-black shadow-lg outline-none"
              >
                Browser Anda tidak mendukung pemutar video HTML5. Silakan unduh file untuk memutarnya.
              </video>
            </div>
          )}

          {/* AUDIO VIEWER */}
          {isAudio && (
            <div className="w-full max-w-md p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <FileAudio className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-zinc-400 font-mono mt-1">{formatFileSize(file.size)}</p>
              </div>
              <audio controls src={previewUrl} className="w-full mt-2 outline-none">
                Browser Anda tidak mendukung pemutar audio HTML5.
              </audio>
            </div>
          )}

          {/* PDF VIEWER */}
          {isPdf && (
            <div className="w-full h-full flex flex-col items-stretch">
              <iframe
                src={previewUrl}
                title={file.name}
                className="w-full h-[68vh] border border-zinc-800 rounded-xl bg-zinc-900 shadow-lg"
              />
            </div>
          )}

          {/* TEXT & SOURCE CODE VIEWER */}
          {isTextOrCode && (
            <div className="w-full h-full flex flex-col">
              {textLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs font-medium">Membaca berkas teks/kode...</span>
                </div>
              ) : hasError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-rose-400 text-center">
                  <AlertCircle className="w-7 h-7" />
                  <p className="text-xs font-semibold">Tidak dapat menampilkan isi teks</p>
                  <button
                    onClick={() => onDownload(file)}
                    className="mt-2 px-3 py-1.5 bg-cyan-500 text-black font-semibold text-xs rounded-xl"
                  >
                    Unduh File
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-auto bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono text-xs text-zinc-200">
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed select-text">
                    {textContent || '(File kosong)'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* OFFICE DOCUMENTS & ARCHIVES & FALLBACK */}
          {!isImg && !isVideo && !isAudio && !isPdf && !isTextOrCode && (
            <div className="w-full max-w-lg p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-xl flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                {isArchive ? (
                  <FileArchive className="w-8 h-8" />
                ) : isOfficeDoc ? (
                  <FileText className="w-8 h-8" />
                ) : (
                  <File className="w-8 h-8" />
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-md">{file.name}</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Format: <span className="text-cyan-400 font-mono uppercase">{ext || 'Berkas'}</span> &bull; {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
                  {isOfficeDoc
                    ? 'Dokumen office dapat dilihat langsung lewat Google Drive Web Viewer atau diunduh.'
                    : isArchive
                    ? 'Berkas arsip kompresi siap diunduh ke komputer Anda.'
                    : 'Format berkas ini dapat langsung diunduh atau dibuka melalui tautan web Google Drive.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                {file.web_view_link && (
                  <a
                    href={file.web_view_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-750 rounded-xl text-xs font-medium transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Google Drive</span>
                  </a>
                )}
                <button
                  onClick={() => onDownload(file)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-zinc-950/90 text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-xs">Akun Drive:</span>
            <span className="font-mono text-cyan-300 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800 text-[11px]">
              {file.account_email || '-'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-zinc-500 text-[11px]">
              MIME: {file.mime_type || ext || 'file'}
            </span>
            {isImg && !showFull && (
              <span className="text-cyan-400 font-medium text-[11px]">
                ⚡ Pratinjau Cepat Aktif
              </span>
            )}
            {isVideo && (
              <span className="text-purple-400 font-medium text-[11px]">
                🎬 Video Player Aktif
              </span>
            )}
            {isPdf && (
              <span className="text-rose-400 font-medium text-[11px]">
                📄 PDF Viewer Aktif
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
