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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 max-w-5xl w-full bg-zinc-900 border-2 border-zinc-750 rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_#000] flex flex-col max-h-[92vh] font-mono">
        {/* Header Bar */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-zinc-700 bg-zinc-950 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 truncate min-w-0">
            <span className="font-bold text-xs text-white truncate max-w-[130px] sm:max-w-xs md:max-w-md" title={file.name}>
              {file.name}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-bold shrink-0">
              ({formatFileSize(file.size)})
            </span>
            {/* Category badge */}
            <span
              className={`text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded border border-black sm:border-2 shadow-[1px_1px_0px_0px_#000] shrink-0 ${badge.color}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Toggle full quality button (Images only) */}
            {isImg && !showFull && (
              <button
                onClick={() => {
                  setShowFull(true);
                  setLoading(true);
                  setHasError(false);
                }}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 rounded border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
                title="Muat gambar kualitas penuh (resolusi asli)"
              >
                <ZoomIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Kualitas Penuh</span>
              </button>
            )}

            {/* Copy button for text/code */}
            {isTextOrCode && textContent && (
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-750 border-2 border-zinc-700 rounded shadow-[1.5px_1.5px_0px_0px_#000] transition"
                title="Salin isi teks"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                    <span className="text-emerald-400">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
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
              className="p-1.5 text-zinc-400 hover:text-white rounded border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
              title="Buka file langsung di tab baru"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>

            {/* Download */}
            <button
              onClick={() => onDownload(file)}
              className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
              title="Unduh file ini"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
              title="Tutup pratinjau (Esc)"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="relative flex-1 min-h-[300px] max-h-[72vh] bg-zinc-950 flex items-center justify-center p-3 sm:p-5 overflow-hidden border-b-2 border-zinc-700">
          {/* IMAGE VIEWER */}
          {isImg && (
            <>
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 stroke-[2.5]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {showFull ? 'Memuat resolusi penuh...' : 'Memuat pratinjau gambar...'}
                  </span>
                </div>
              )}

              {hasError ? (
                <div className="flex flex-col items-center justify-center gap-2 text-rose-400 p-8 text-center">
                  <AlertCircle className="w-8 h-8 stroke-[2.5]" />
                  <p className="text-xs font-black uppercase">Gagal memuat pratinjau gambar</p>
                  <p className="text-[11px] text-zinc-400 font-sans max-w-xs">
                    File gambar tidak dapat dimuat atau terjadi gangguan jaringan.
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
                  className={`max-h-[68vh] max-w-full object-contain rounded border border-zinc-800 shadow-[4px_4px_0px_0px_#000] transition-opacity duration-200 ${
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
                className="max-h-[68vh] max-w-full rounded-lg border-2 border-zinc-700 bg-black shadow-[4px_4px_0px_0px_#000] outline-none"
              >
                Browser Anda tidak mendukung pemutar video HTML5. Silakan unduh file untuk memutarnya.
              </video>
            </div>
          )}

          {/* AUDIO VIEWER */}
          {isAudio && (
            <div className="w-full max-w-md p-6 bg-zinc-900 border-2 border-zinc-700 rounded-xl shadow-[5px_5px_0px_0px_#000] flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-lg bg-amber-400 text-black border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                <FileAudio className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white truncate max-w-xs">{file.name}</h4>
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
                className="w-full h-[68vh] border-2 border-zinc-700 rounded-lg bg-zinc-900 shadow-[4px_4px_0px_0px_#000]"
              />
            </div>
          )}

          {/* TEXT & SOURCE CODE VIEWER */}
          {isTextOrCode && (
            <div className="w-full h-full flex flex-col">
              {textLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 stroke-[2.5]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Membaca berkas teks/kode...</span>
                </div>
              ) : hasError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-rose-400 text-center">
                  <AlertCircle className="w-7 h-7 stroke-[2.5]" />
                  <p className="text-xs font-bold uppercase">Tidak dapat menampilkan isi teks</p>
                  <button
                    onClick={() => onDownload(file)}
                    className="mt-2 px-3 py-1 bg-cyan-400 text-black font-black uppercase text-xs rounded border border-black"
                  >
                    Unduh File
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-auto bg-zinc-950 border-2 border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-200 shadow-inner">
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed select-text">
                    {textContent || '(File kosong)'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* OFFICE DOCUMENTS & ARCHIVES & FALLBACK */}
          {!isImg && !isVideo && !isAudio && !isPdf && !isTextOrCode && (
            <div className="w-full max-w-lg p-6 bg-zinc-900 border-2 border-zinc-750 rounded-xl shadow-[6px_6px_0px_0px_#000] flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-cyan-400 text-black border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                {isArchive ? (
                  <FileArchive className="w-8 h-8 stroke-[2.5]" />
                ) : isOfficeDoc ? (
                  <FileText className="w-8 h-8 stroke-[2.5]" />
                ) : (
                  <File className="w-8 h-8 stroke-[2.5]" />
                )}
              </div>

              <div>
                <h4 className="font-black text-sm text-white truncate max-w-md">{file.name}</h4>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Format: <span className="text-cyan-400 font-bold uppercase">{ext || 'Berkas'}</span> &bull; {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-zinc-400 font-sans mt-2 max-w-sm leading-relaxed">
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
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-white border-2 border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:shadow-none transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Buka di Google Drive</span>
                  </a>
                )}
                <button
                  onClick={() => onDownload(file)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:shadow-none transition-all"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Unduh File Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-zinc-950 text-[11px] text-zinc-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-zinc-400">Akun Drive:</span>
            <span className="font-mono text-cyan-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 shadow-[1px_1px_0px_0px_#000]">
              {file.account_email || '-'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-zinc-400">
              MIME: {file.mime_type || ext || 'file'}
            </span>
            {isImg && !showFull && (
              <span className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider">
                ⚡ Pratinjau Cepat Aktif
              </span>
            )}
            {isVideo && (
              <span className="text-purple-400 font-bold uppercase text-[10px] tracking-wider">
                🎬 Video Player Aktif
              </span>
            )}
            {isPdf && (
              <span className="text-rose-400 font-bold uppercase text-[10px] tracking-wider">
                📄 PDF Viewer Aktif
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
