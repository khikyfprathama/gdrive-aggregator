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
  UploadCloud,
  FileUp,
  LayoutList,
  LayoutGrid,
  Eye,
} from 'lucide-react';
import { apiService } from '../services/api';
import { ImagePreviewModal } from './ImagePreviewModal';

interface FileBrowserProps {
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
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onOpenUpload: (file?: File) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
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
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  onOpenUpload,
}) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'docs' | 'media' | 'archives' | 'code'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const isImageFile = (filename: string, mime: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext) || mime.startsWith('image/');
  };

  const getFileIcon = (filename: string, mime: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) || mime.includes('image')) {
      return <FileImage className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext) || mime.includes('video')) {
      return <FileVideo className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext) || mime.includes('audio')) {
      return <FileAudio className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
      return <FileArchive className="w-4 h-4 text-orange-400 shrink-0" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'go', 'py', 'json', 'html', 'css', 'sql', 'sh'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx'].includes(ext) || mime.includes('pdf')) {
      return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-zinc-400 shrink-0" />;
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
    return d.toLocaleDateString('en-GB', {
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
      onShowToast(`Downloading ${file.name}...`, 'success');
      await apiService.downloadFile(file.id, file.name);
    } catch (err: any) {
      onShowToast(`Download failed: ${err.message}`, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (file: FileRecord) => {
    if (!window.confirm(`Hapus permanen "${file.name}" dari Google Drive?`)) {
      return;
    }

    try {
      setDeletingId(file.id);
      await apiService.deleteFile(file.id);
      onShowToast(`File "${file.name}" berhasil dihapus.`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(`Gagal menghapus: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSyncFiles = async () => {
    try {
      setIsSyncing(true);
      onShowToast('Memindai Google Drive dan mengimpor file...', 'success');
      const res = await apiService.syncFiles(filterAccountId > 0 ? filterAccountId : undefined);
      onShowToast(`Sinkronisasi selesai: ${res.synced_files} file ditemukan & diindeks.`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Gagal sinkronisasi file dari Google Drive', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onOpenUpload(e.dataTransfer.files[0]);
    }
  };

  // Filter by file type
  const filteredFiles = files.filter((f) => {
    if (typeFilter === 'all') return true;
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (typeFilter === 'docs') return ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx'].includes(ext);
    if (typeFilter === 'media') return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'mp4', 'mkv', 'webm', 'mov', 'mp3', 'wav'].includes(ext);
    if (typeFilter === 'archives') return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
    if (typeFilter === 'code') return ['js', 'ts', 'jsx', 'tsx', 'go', 'py', 'json', 'html', 'css', 'sql', 'sh'].includes(ext);
    return true;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalFiles / pageSize));
  const startItem = totalFiles === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalFiles);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-zinc-900 border rounded-xl overflow-hidden shadow-sm transition-all duration-150 ${
        isDragOver ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-zinc-800'
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search & Type Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Quick Type Filter Pills */}
          <div className="inline-flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-xs">
            {(['all', 'docs', 'media', 'archives', 'code'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition ${
                  typeFilter === t ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Drive Filter, View Mode, Sync, and Upload */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none pr-1"
            >
              <option value={0} className="bg-zinc-900">Semua Akun ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-zinc-900">
                  {acc.email}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher (List vs Grid) */}
          <div className="inline-flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tampilan Tabel"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tampilan Galeri / Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleSyncFiles}
            disabled={isSyncing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition border border-zinc-750"
            title="Scan & import file yang ada di Google Drive ke database lokal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-zinc-400'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync dari Drive'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading || isSyncing}
            className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Muat ulang data file"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            onClick={() => onOpenUpload()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Hint Banner */}
      {isDragOver && (
        <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-3 flex items-center justify-center gap-2 text-xs font-medium text-blue-400 animate-pulse">
          <FileUp className="w-4 h-4" />
          <span>Lepaskan mouse untuk mengunggah file ke Google Drive</span>
        </div>
      )}

      {/* Main Content: Table View vs Grid View */}
      {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 font-semibold border-b border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Nama File</th>
                <th className="py-2.5 px-4 font-medium hidden sm:table-cell">Akun Penyimpan</th>
                <th className="py-2.5 px-4 font-medium">Ukuran</th>
                <th className="py-2.5 px-4 font-medium hidden md:table-cell">Diunggah</th>
                <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                      <span>Memuat daftar file...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Belum ada file di halaman ini</p>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                          Jika akun Google Drive Anda sudah memiliki file sebelumnya, klik tombol <strong>Sync dari Drive</strong> di bawah untuk memindai dan mengimpor file yang ada.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={handleSyncFiles}
                          disabled={isSyncing || loading}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Memindai Drive...' : 'Scan & Sync dari Google Drive'}</span>
                        </button>
                        <button
                          onClick={() => onOpenUpload()}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition border border-zinc-700/60"
                        >
                          Upload File Baru
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((f) => {
                  const isImg = isImageFile(f.name, f.mime_type);
                  return (
                    <tr key={f.id} className="hover:bg-zinc-800/40 transition group">
                      {/* File Name & Thumbnail */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          {isImg ? (
                            <div
                              onClick={() => setPreviewFile(f)}
                              className="relative w-8 h-8 rounded bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 cursor-pointer group/thumb hover:border-blue-500 transition"
                              title="Klik untuk pratinjau gambar"
                            >
                              <img
                                src={apiService.getFilePreviewUrl(f.id)}
                                alt={f.name}
                                className="w-full h-full object-cover transition duration-150 group-hover/thumb:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition">
                                <Eye className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                              {getFileIcon(f.name, f.mime_type)}
                            </div>
                          )}

                          <span
                            onClick={() => isImg && setPreviewFile(f)}
                            className={`font-medium text-white truncate max-w-xs sm:max-w-md ${
                              isImg ? 'cursor-pointer hover:text-blue-400' : ''
                            }`}
                            title={f.name}
                          >
                            {f.name}
                          </span>
                        </div>
                      </td>

                      {/* Target Drive Account */}
                      <td className="py-2.5 px-4 hidden sm:table-cell">
                        <span className="font-mono text-[11px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {f.account_email}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-300">
                        {formatFileSize(f.size)}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-4 text-zinc-500 font-mono text-[11px] hidden md:table-cell">
                        {formatDate(f.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          {isImg && (
                            <button
                              onClick={() => setPreviewFile(f)}
                              className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition"
                              title="Pratinjau gambar"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(f)}
                            disabled={downloadingId === f.id}
                            className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition"
                            title="Unduh file"
                          >
                            <Download className={`w-3.5 h-3.5 ${downloadingId === f.id ? 'animate-bounce text-emerald-400' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(f)}
                            disabled={deletingId === f.id}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                            title="Hapus file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid / Gallery View */
        <div className="p-4">
          {loading ? (
            <div className="py-16 text-center text-zinc-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-xs">Memuat galeri file...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-xs font-medium text-zinc-400">Tidak ada file yang ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredFiles.map((f) => {
                const isImg = isImageFile(f.name, f.mime_type);
                return (
                  <div
                    key={f.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden group hover:border-zinc-700 transition flex flex-col"
                  >
                    {/* Media Thumbnail Container */}
                    <div
                      onClick={() => isImg && setPreviewFile(f)}
                      className={`relative h-32 bg-zinc-900 flex items-center justify-center overflow-hidden ${
                        isImg ? 'cursor-pointer' : ''
                      }`}
                    >
                      {isImg ? (
                        <>
                          <img
                            src={apiService.getFilePreviewUrl(f.id)}
                            alt={f.name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <div className="text-zinc-500">{getFileIcon(f.name, f.mime_type)}</div>
                      )}
                    </div>

                    {/* File Meta Info */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <p
                          className="font-medium text-xs text-white truncate hover:text-blue-400 cursor-pointer"
                          title={f.name}
                          onClick={() => isImg && setPreviewFile(f)}
                        >
                          {f.name}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mt-1">
                          <span>{formatFileSize(f.size)}</span>
                          <span className="truncate max-w-[80px]" title={f.account_email}>
                            {f.account_email?.split('@')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                        {isImg ? (
                          <button
                            onClick={() => setPreviewFile(f)}
                            className="text-zinc-400 hover:text-blue-400 p-1 rounded"
                            title="Lihat Gambar"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDownload(f)}
                            disabled={downloadingId === f.id}
                            className="text-zinc-400 hover:text-emerald-400 p-1 rounded"
                            title="Unduh"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(f)}
                            disabled={deletingId === f.id}
                            className="text-zinc-400 hover:text-rose-400 p-1 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer & Pagination Controls */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        {/* Left: Range and items per page */}
        <div className="flex items-center gap-3">
          <span>
            Menampilkan <span className="font-medium text-white">{startItem}-{endItem}</span> dari{' '}
            <span className="font-medium text-white">{totalFiles}</span> file
          </span>

          <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-800">
            <span className="text-[11px] text-zinc-500">Per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Pagination buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1 || loading}
            className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Halaman Pertama"
          >
            &laquo;
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || loading}
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Halaman Sebelumnya"
          >
            &lsaquo; Prev
          </button>

          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={idx}
                  onClick={() => onPageChange(p)}
                  disabled={loading}
                  className={`w-7 h-7 rounded text-xs font-medium transition ${
                    page === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={idx} className="px-1 text-zinc-600">
                  ...
                </span>
              )
            )}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || loading}
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Halaman Selanjutnya"
          >
            Next &rsaquo;
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages || loading}
            className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Halaman Terakhir"
          >
            &raquo;
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />
    </div>
  );
};
