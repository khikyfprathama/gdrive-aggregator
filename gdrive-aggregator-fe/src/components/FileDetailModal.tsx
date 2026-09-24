import React, { useState } from 'react';
import type { FileRecord } from '../types';
import {
  X,
  FileText,
  Folder,
  Mail,
  HardDrive,
  Calendar,
  Hash,
  ExternalLink,
  Download,
  Trash2,
  Eye,
  Copy,
  Check,
  FolderOpen,
} from 'lucide-react';
import { apiService } from '../services/api';

interface FileDetailModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onDownload: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => void;
  onPreview: (file: FileRecord) => void;
  onOpenFolder?: (folder: { id: string; name: string }) => void;
}

export const FileDetailModal: React.FC<FileDetailModalProps> = ({
  file,
  onClose,
  onDownload,
  onDelete,
  onPreview,
  onOpenFolder,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!file) return null;

  const isFolder = file.is_folder === true || file.mime_type === 'application/vnd.google-apps.folder';
  const isImg = !isFolder && (file.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name));

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatFileSize = (bytes: number): string => {
    if (isFolder) return '- (Folder)';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]} (${bytes.toLocaleString('id-ID')} bytes)`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-zinc-900 border-2 border-zinc-750 rounded-xl shadow-[8px_8px_0px_0px_#000] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-zinc-700 bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 truncate font-mono">
            {isFolder ? (
              <div className="w-8 h-8 rounded bg-amber-400 text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
                <Folder className="w-4 h-4 fill-black/30 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded bg-cyan-400 text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
                <FileText className="w-4 h-4 stroke-[2.5]" />
              </div>
            )}
            <div className="truncate">
              <h3 className="font-black text-sm text-white truncate max-w-sm tracking-tight" title={file.name}>
                {file.name}
              </h3>
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                {isFolder ? 'Folder Google Drive' : 'File Metadata'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Image Preview Banner if Image */}
        {isImg && (
          <div
            onClick={() => onPreview(file)}
            className="relative h-48 bg-zinc-950 flex items-center justify-center overflow-hidden border-b-2 border-zinc-700 cursor-pointer group shrink-0"
          >
            <img
              src={apiService.getFilePreviewUrl(file.id)}
              alt={file.name}
              className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2 text-xs text-white font-mono font-bold uppercase tracking-wider">
              <Eye className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>Buka Resolusi Penuh</span>
            </div>
          </div>
        )}

        {/* Content Metadata List */}
        <div className="p-5 space-y-3.5 overflow-y-auto text-xs text-zinc-300">
          {/* Email Akun Google Drive (Target Request User) */}
          <div className="bg-zinc-950 border-2 border-zinc-750 rounded-lg p-3.5 shadow-[3px_3px_0px_0px_#000]">
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Akun Google Drive Penyimpan
            </span>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span className="font-mono text-xs font-bold text-white truncate">
                  {file.account_email || 'Tidak diketahui (Akun ID: ' + file.account_id + ')'}
                </span>
              </div>
              {file.account_email && (
                <button
                  onClick={() => copyToClipboard(file.account_email, 'email')}
                  className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition shrink-0"
                  title="Salin Email"
                >
                  {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Ukuran File */}
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-3 shadow-[2px_2px_0px_0px_#000]">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block mb-1">Ukuran Data</span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-mono font-bold">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0 stroke-[2.5]" />
                <span className="truncate">{formatFileSize(file.size)}</span>
              </div>
            </div>

            {/* Format / MIME Type */}
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-3 shadow-[2px_2px_0px_0px_#000]">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block mb-1">Format / MIME Type</span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-mono font-bold">
                <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0 stroke-[2.5]" />
                <span className="truncate">{file.mime_type || '-'}</span>
              </div>
            </div>

            {/* Tanggal Terdaftar */}
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-3 sm:col-span-2 shadow-[2px_2px_0px_0px_#000]">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block mb-1">Waktu Diunggah / Sinkronisasi</span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-mono">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0 stroke-[2.5]" />
                <span>{formatDate(file.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Google Drive File ID */}
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-3 shadow-[2px_2px_0px_0px_#000]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Google Drive File ID</span>
              <button
                onClick={() => copyToClipboard(file.drive_file_id, 'id')}
                className="text-zinc-400 hover:text-white transition flex items-center gap-1 text-[10px] font-mono"
              >
                {copiedKey === 'id' ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Disalin!</span>
                  </span>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin ID</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-[11px] text-zinc-300 break-all select-all">
              {file.drive_file_id}
            </p>
          </div>

          {/* MD5 Checksum (if available) */}
          {file.md5_checksum && (
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-lg p-3 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3 text-cyan-400 stroke-[2.5]" />
                  <span>MD5 Hash Integrity</span>
                </span>
                <button
                  onClick={() => copyToClipboard(file.md5_checksum || '', 'md5')}
                  className="text-zinc-400 hover:text-white transition flex items-center gap-1 text-[10px] font-mono"
                >
                  {copiedKey === 'md5' ? (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <p className="font-mono text-[11px] text-zinc-300 break-all select-all">
                {file.md5_checksum}
              </p>
            </div>
          )}

          {/* Web View Link in Google Drive */}
          {file.web_view_link && (
            <a
              href={file.web_view_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 bg-cyan-950/30 border-2 border-cyan-600/40 rounded-lg text-cyan-300 hover:bg-cyan-900/40 transition shadow-[2px_2px_0px_0px_#000] font-mono text-xs font-bold"
            >
              <span>Buka Langsung di Google Drive Web</span>
              <ExternalLink className="w-4 h-4 shrink-0 stroke-[2.5]" />
            </a>
          )}
        </div>

        {/* Footer Actions Neo-Brutalist */}
        <div className="px-5 py-3.5 border-t-2 border-zinc-700 bg-zinc-950 flex items-center justify-between gap-2 shrink-0 font-mono">
          <button
            onClick={() => {
              onDelete(file);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white border-2 border-black rounded-lg text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Hapus</span>
          </button>

          <div className="flex items-center gap-2">
            {isFolder ? (
              <button
                onClick={() => {
                  if (onOpenFolder) onOpenFolder({ id: file.drive_file_id, name: file.name });
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <FolderOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Buka Folder</span>
              </button>
            ) : (
              <>
                {!isFolder && (
                  <button
                    onClick={() => {
                      onPreview(file);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-2 border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Pratinjau</span>
                  </button>
                )}
                <button
                  onClick={() => onDownload(file)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Unduh File</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
