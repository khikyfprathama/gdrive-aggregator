import React, { useState } from 'react';
import type { FileRecord, Account } from '../types';
import {
  Download,
  Trash2,
  Search,
  FileText,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  File,
  Filter,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { apiService } from '../services/api';

interface FileListProps {
  files: FileRecord[];
  accounts: Account[];
  loading: boolean;
  totalFiles: number;
  onRefresh: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterAccountId: number;
  setFilterAccountId: (id: number) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  accounts,
  loading,
  totalFiles,
  onRefresh,
  onShowToast,
  searchQuery,
  setSearchQuery,
  filterAccountId,
  setFilterAccountId,
}) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getFileIcon = (filename: string, mime: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) || mime.includes('image')) {
      return <FileImage className="w-5 h-5 text-purple-400" />;
    }
    if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext) || mime.includes('video')) {
      return <FileVideo className="w-5 h-5 text-rose-400" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext) || mime.includes('audio')) {
      return <FileAudio className="w-5 h-5 text-amber-400" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
      return <FileArchive className="w-5 h-5 text-yellow-400" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'go', 'py', 'json', 'html', 'css'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-cyan-400" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext) || mime.includes('pdf')) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      setDownloadingId(file.id);
      onShowToast(`Menyiapkan streaming download ${file.name}...`, 'success');
      await apiService.downloadFile(file.id, file.name);
    } catch (err: any) {
      onShowToast(`Gagal mengunduh file: ${err.message}`, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (file: FileRecord) => {
    if (!window.confirm(`Hapus file "${file.name}" dari Google Drive?`)) {
      return;
    }

    try {
      setDeletingId(file.id);
      await apiService.deleteFile(file.id);
      onShowToast(`File "${file.name}" berhasil dihapus`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(`Gagal menghapus file: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            File Explorer Terpusat
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Menampilkan seluruh file dari 5 akun Google Drive dalam satu daftar ({totalFiles} file).
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Filter Account */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(Number(e.target.value))}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none pr-2 py-1"
            >
              <option value={0} className="bg-slate-900">Semua Akun</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900">
                  {acc.email}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh List */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Daftar File"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Files Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Nama File</th>
              <th className="py-3 px-4 hidden sm:table-cell">Akun Penyimpan</th>
              <th className="py-3 px-4">Ukuran</th>
              <th className="py-3 px-4 hidden md:table-cell">Tanggal Upload</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span>Memuat daftar file...</span>
                  </div>
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FolderOpen className="w-10 h-10 text-slate-700 stroke-1" />
                    <p className="text-sm font-semibold text-slate-400">Belum ada file di storage pool</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Gunakan form upload di atas untuk mengunggah file pertama Anda ke Google Drive.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-800/30 transition">
                  {/* File Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/40 shrink-0">
                        {getFileIcon(file.name, file.mime_type)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-white truncate max-w-xs sm:max-w-md" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate sm:hidden">
                          {file.account_email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Account Badge */}
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-[11px] font-mono text-slate-300">
                      {file.account_email}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {formatFileSize(file.size)}
                  </td>

                  {/* Upload Date */}
                  <td className="py-3.5 px-4 text-slate-400 hidden md:table-cell">
                    {formatDate(file.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={downloadingId === file.id}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition disabled:opacity-50"
                        title="Download File"
                      >
                        <Download className={`w-4 h-4 ${downloadingId === file.id ? 'animate-bounce text-emerald-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deletingId === file.id}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition disabled:opacity-50"
                        title="Hapus File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
