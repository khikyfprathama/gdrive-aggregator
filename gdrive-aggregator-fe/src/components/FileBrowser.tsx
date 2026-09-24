import React, { useState, useEffect } from 'react';
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
  FileUp,
  LayoutList,
  LayoutGrid,
  Eye,
  Folder,
  FolderOpen,
  ChevronRight,
  HardDrive,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  CornerLeftUp,
  Info,
  Mail,
} from 'lucide-react';
import { apiService } from '../services/api';
import { FilePreviewModal } from './FilePreviewModal';
import { FileDetailModal } from './FileDetailModal';

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
  typeFilter: 'all' | 'folders' | 'docs' | 'media' | 'archives' | 'code';
  setTypeFilter: (type: 'all' | 'folders' | 'docs' | 'media' | 'archives' | 'code') => void;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  folderTrail: { id: string; name: string }[];
  onEnterFolder: (folder: { id: string; name: string }) => void;
  onNavigateBreadcrumb: (index: number) => void;
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
  typeFilter,
  setTypeFilter,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  folderTrail,
  onEnterFolder,
  onNavigateBreadcrumb,
  onOpenUpload,
}) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingFolder, setIsSyncingFolder] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [detailFile, setDetailFile] = useState<FileRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Clear selection when page or folder changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, folderTrail]);

  const isFolderItem = (f: FileRecord): boolean => {
    return f.is_folder === true || f.mime_type === 'application/vnd.google-apps.folder';
  };

  const isImageFile = (filename: string, mime: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext) || mime.startsWith('image/');
  };

  const getFileIcon = (f: FileRecord) => {
    if (isFolderItem(f)) {
      return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />;
    }
    const filename = f.name;
    const mime = f.mime_type || '';
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

  const formatFileSize = (bytes: number, isFolder: boolean): string => {
    if (isFolder) return '-';
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

  const handleOpenFolder = (folder: { id: string; name: string }) => {
    setSearchQuery('');
    onEnterFolder(folder);
  };

  const handleDownload = async (file: FileRecord) => {
    if (isFolderItem(file)) {
      handleOpenFolder({ id: file.drive_file_id, name: file.name });
      return;
    }

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
    const itemType = isFolderItem(file) ? 'folder' : 'file';
    if (!window.confirm(`Hapus permanen ${itemType} "${file.name}" dari Google Drive?`)) {
      return;
    }

    try {
      setDeletingId(file.id);
      await apiService.deleteFile(file.id);
      onShowToast(`${itemType === 'folder' ? 'Folder' : 'File'} "${file.name}" berhasil dihapus.`, 'success');
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
      onShowToast('Memindai seluruh folder & file dari Google Drive...', 'success');
      const res = await apiService.syncFiles(filterAccountId > 0 ? filterAccountId : undefined);
      onShowToast(`Sinkronisasi selesai: ${res.synced_files} file/folder berhasil diindeks.`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Gagal sinkronisasi dari Google Drive', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCurrentFolder = async () => {
    if (folderTrail.length === 0) return;
    const currentFolder = folderTrail[folderTrail.length - 1];
    try {
      setIsSyncingFolder(true);
      onShowToast(`Memindai Google Drive untuk isi folder "${currentFolder.name}"...`, 'success');
      const res = await apiService.syncFolder(currentFolder.id);
      onShowToast(`Sinkronisasi folder selesai: ${res.synced_files} file berhasil disinkronkan.`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Gagal menyinkronkan isi folder', 'error');
    } finally {
      setIsSyncingFolder(false);
    }
  };

  // Multi-Selection handlers
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = files.length > 0 && files.every((f) => selectedIds.has(f.id));
  const someVisibleSelected = files.some((f) => selectedIds.has(f.id)) && !allVisibleSelected;

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  };

  const handleBatchDownload = async () => {
    const selectedFiles = files.filter((f) => selectedIds.has(f.id) && !isFolderItem(f));
    if (selectedFiles.length === 0) {
      onShowToast('Tidak ada file biner yang dipilih untuk diunduh.', 'error');
      return;
    }
    onShowToast(`Memulai unduhan bertahap ${selectedFiles.length} file...`, 'success');
    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      await apiService.downloadFile(f.id, f.name);
      if (i < selectedFiles.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  };

  const handleBatchDelete = async () => {
    const count = selectedIds.size;
    if (!window.confirm(`Hapus permanen ${count} file/folder yang dipilih dari Google Drive?`)) {
      return;
    }
    try {
      onShowToast(`Menghapus ${count} item...`, 'success');
      const res = await apiService.batchDeleteFiles(Array.from(selectedIds));
      onShowToast(`Berhasil menghapus ${res.deleted_count} file/folder.`, 'success');
      setSelectedIds(new Set());
      onRefresh();
    } catch (err: any) {
      onShowToast(`Gagal menghapus file: ${err.message}`, 'error');
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

  const isDocFile = (name: string, mime: string): boolean => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return (
      ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'rtf', 'odt', 'ods', 'odp'].includes(ext) ||
      mime.includes('pdf') ||
      mime.includes('document') ||
      mime.includes('text') ||
      mime.includes('sheet') ||
      mime.includes('presentation')
    );
  };

  const isMediaFile = (name: string, mime: string): boolean => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return (
      ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'mp4', 'mkv', 'webm', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) ||
      mime.startsWith('image/') ||
      mime.startsWith('video/') ||
      mime.startsWith('audio/')
    );
  };

  const isArchiveFile = (name: string, mime: string): boolean => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return (
      ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'tgz', 'tbz2'].includes(ext) ||
      mime.includes('zip') ||
      mime.includes('compressed') ||
      mime.includes('archive') ||
      mime.includes('tar') ||
      mime.includes('rar') ||
      mime.includes('7z')
    );
  };

  const isCodeFile = (name: string, mime: string): boolean => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return (
      ['js', 'ts', 'jsx', 'tsx', 'go', 'py', 'json', 'html', 'css', 'sql', 'sh', 'yaml', 'yml', 'xml', 'env', 'conf'].includes(ext) ||
      mime.includes('javascript') ||
      mime.includes('json') ||
      mime.includes('xml')
    );
  };

  // Filter by file type
  const filteredFiles = files.filter((f) => {
    const isFolder = isFolderItem(f);
    if (typeFilter === 'all') return true;
    if (typeFilter === 'folders') return isFolder;
    if (isFolder) return false; // Other filters only apply to files
    const mime = f.mime_type || '';
    if (typeFilter === 'docs') return isDocFile(f.name, mime);
    if (typeFilter === 'media') return isMediaFile(f.name, mime);
    if (typeFilter === 'archives') return isArchiveFile(f.name, mime);
    if (typeFilter === 'code') return isCodeFile(f.name, mime);
    return true;
  });

  // Pagination calculation
  const isAllPages = pageSize === -1;
  const totalPages = isAllPages ? 1 : Math.max(1, Math.ceil(totalFiles / (pageSize || 20)));
  const startItem = totalFiles === 0 ? 0 : isAllPages ? 1 : (page - 1) * pageSize + 1;
  const endItem = isAllPages ? totalFiles : Math.min(page * pageSize, totalFiles);

  const getPageNumbers = () => {
    if (isAllPages) return [1];
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
      className={`bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/20 transition-all duration-200 relative ${
        isDragOver ? 'border-cyan-400 ring-2 ring-cyan-400/30' : ''
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-800/80 bg-zinc-950/70 flex flex-col gap-3">
        {/* Row 1: Search & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari file atau folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Account Filter, View Mode, Sync, Refresh */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            {/* Account Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={filterAccountId}
                onChange={(e) => setFilterAccountId(Number(e.target.value))}
                className="bg-transparent text-xs font-sans text-zinc-300 focus:outline-none pr-1 max-w-[130px] sm:max-w-[170px] truncate cursor-pointer"
              >
                <option value={0} className="bg-zinc-900 text-white">Semua Akun ({accounts.length})</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-zinc-900 text-white">
                    {acc.email}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="inline-flex bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-zinc-800 text-cyan-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Tampilan Tabel"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-zinc-800 text-cyan-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Tampilan Galeri / Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Sync dari Drive */}
            <button
              onClick={handleSyncFiles}
              disabled={isSyncing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750/70 rounded-xl text-xs font-medium transition disabled:opacity-50"
              title="Scan & sinkronisasi semua file dan folder dari Google Drive"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Drive'}</span>
              <span className="sm:hidden">{isSyncing ? '...' : 'Sync'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading || isSyncing}
              className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl transition disabled:opacity-50"
              title="Muat ulang data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 2: Type Filter Pills - Dedicated full-width scrollable container */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { id: 'all', label: 'Semua File' },
            { id: 'folders', label: 'Folder' },
            { id: 'docs', label: 'Dokumen' },
            { id: 'media', label: 'Foto & Video' },
            { id: 'archives', label: 'Arsip / Zip' },
            { id: 'code', label: 'Kode' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-sans whitespace-nowrap transition-all ${
                typeFilter === t.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumbs Navigation Bar */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-sans">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
          <button
            onClick={() => onNavigateBreadcrumb(-1)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition text-xs shrink-0 ${
              folderTrail.length === 0
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 shrink-0" />
            <span>Root / Utama</span>
          </button>

          {folderTrail.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <button
                onClick={() => onNavigateBreadcrumb(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition truncate max-w-[150px] sm:max-w-[180px] shrink-0 ${
                  idx === folderTrail.length - 1
                    ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title={folder.name}
              >
                <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Folder Quick Actions */}
        {folderTrail.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-800 justify-between sm:justify-end w-full sm:w-auto">
            <span className="text-xs text-zinc-400 bg-zinc-850/80 border border-zinc-750/50 px-2.5 py-0.5 rounded-md font-mono">
              {totalFiles} item
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSyncCurrentFolder}
                disabled={isSyncingFolder || loading}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                title="Pindai ulang seluruh file di folder ini dari Google Drive"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingFolder ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncingFolder ? 'Memindai...' : 'Sync Folder'}</span>
                <span className="sm:hidden">{isSyncingFolder ? 'Sync...' : 'Sync'}</span>
              </button>

              {totalFiles > pageSize && pageSize !== -1 && (
                <button
                  onClick={() => onPageSizeChange(-1)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-medium transition-all"
                  title="Tampilkan seluruh file dalam folder ini sekaligus"
                >
                  <Eye className="w-3 h-3" />
                  <span>Semua ({totalFiles})</span>
                </button>
              )}

              {pageSize === -1 && totalFiles > 20 && (
                <button
                  onClick={() => onPageSizeChange(20)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-medium transition"
                  title="Bagi menjadi 20 file per halaman"
                >
                  <span>20/hlm</span>
                </button>
              )}

              <button
                onClick={() => onNavigateBreadcrumb(folderTrail.length - 2)}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-medium transition-all"
                title="Kembali ke folder sebelumnya"
              >
                <CornerLeftUp className="w-3 h-3" />
                <span>Naik</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Hint Banner */}
      {isDragOver && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/30 px-4 py-3 flex items-center justify-center gap-2 text-xs font-medium text-cyan-400 animate-pulse">
          <FileUp className="w-4 h-4" />
          <span>Lepaskan mouse untuk mengunggah file ke Google Drive</span>
        </div>
      )}

      {/* Main Content: Table View vs Grid View */}
      {viewMode === 'list' ? (
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] min-h-[360px] relative scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-zinc-950/90 text-zinc-400 font-semibold border-b border-zinc-800/80 text-[11px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                {/* Select All Checkbox */}
                <th className="py-3 px-3 w-8 text-center">
                  <button
                    onClick={toggleSelectAll}
                    disabled={loading || filteredFiles.length === 0}
                    className="text-zinc-500 hover:text-white transition disabled:opacity-40"
                    title={allVisibleSelected ? 'Batalkan pilihan semua' : 'Pilih semua di halaman ini'}
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : someVisibleSelected ? (
                      <MinusSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold">Nama</th>
                <th className="py-3 px-4 font-semibold hidden sm:table-cell">Akun Penyimpan</th>
                <th className="py-3 px-4 font-semibold">Ukuran</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Diunggah</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-2 font-sans">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                      <span className="font-medium text-xs">Memuat daftar file & folder...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-3 max-w-md mx-auto p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-750/60 flex items-center justify-center text-cyan-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Belum ada file atau folder di sini</p>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Jika akun Google Drive Anda memiliki file/folder sebelumnya, klik tombol <strong>Sync Drive</strong> untuk memindai seluruh strukturnya.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                        <button
                          onClick={handleSyncFiles}
                          disabled={isSyncing || loading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-semibold shadow-sm transition-all"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Memindai Drive...' : 'Scan & Sync Drive'}</span>
                        </button>
                        <button
                          onClick={() => onOpenUpload()}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-750 transition-all"
                        >
                          Upload File Baru
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((f) => {
                  const isFolder = isFolderItem(f);
                  const isImg = !isFolder && isImageFile(f.name, f.mime_type);
                  const isSelected = selectedIds.has(f.id);

                  return (
                    <tr
                      key={f.id}
                      className={`transition group border-b border-zinc-800/40 ${
                        isSelected ? 'bg-cyan-950/20 hover:bg-cyan-950/30' : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(f.id);
                          }}
                          className="text-zinc-600 hover:text-white transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                          )}
                        </button>
                      </td>

                      {/* File / Folder Name & Thumbnail */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-3">
                          {isFolder ? (
                            <div
                              onClick={() => handleOpenFolder({ id: f.drive_file_id, name: f.name })}
                              className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
                              title="Buka Folder"
                            >
                              <Folder className="w-4.5 h-4.5 fill-amber-400/20" />
                            </div>
                          ) : isImg ? (
                            <div
                              onClick={() => setPreviewFile(f)}
                              className="relative w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 cursor-pointer group/thumb hover:border-cyan-500/50 transition shadow-sm"
                              title="Klik untuk pratinjau gambar"
                            >
                              <img
                                src={apiService.getFileThumbnailUrl(f.id)}
                                alt={f.name}
                                className="w-full h-full object-cover transition duration-150 group-hover/thumb:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition">
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-zinc-800/40 border border-zinc-750/30 flex items-center justify-center shrink-0">
                              {getFileIcon(f)}
                            </div>
                          )}

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 truncate">
                              <span
                                onClick={() => {
                                  if (isFolder) handleOpenFolder({ id: f.drive_file_id, name: f.name });
                                  else setPreviewFile(f);
                                }}
                                className={`truncate max-w-[170px] sm:max-w-xs md:max-w-md text-sm font-medium ${
                                  isFolder
                                    ? 'text-zinc-100 hover:text-amber-300 cursor-pointer'
                                    : 'text-zinc-200 hover:text-cyan-400 cursor-pointer'
                                }`}
                                title={f.name}
                              >
                                {f.name}
                              </span>
                              {isFolder && (
                                <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                                  Folder
                                </span>
                              )}
                            </div>
                            {/* Mobile subline showing Account email & size */}
                            <div className="sm:hidden flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                              <span className="font-mono">{formatFileSize(f.size, isFolder)}</span>
                              <span>•</span>
                              <span className="truncate max-w-[120px] text-zinc-400">
                                {f.account_email?.split('@')[0]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Target Drive Account (Subtle, modern badge) */}
                      <td className="py-2.5 px-4 hidden sm:table-cell">
                        <button
                          onClick={() => setDetailFile(f)}
                          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/30 hover:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-750/40 transition truncate max-w-[210px]"
                          title={`Klik untuk detail akun: ${f.account_email}`}
                        >
                          <Mail className="w-3 h-3 text-cyan-400/80 shrink-0" />
                          <span className="truncate">{f.account_email || 'Akun Drive'}</span>
                        </button>
                      </td>

                      {/* Size */}
                      <td className="py-2.5 px-4 font-mono text-xs text-zinc-300">
                        {formatFileSize(f.size, isFolder)}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-4 text-zinc-400 text-xs hidden md:table-cell">
                        {formatDate(f.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setDetailFile(f)}
                            className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/80 rounded-lg transition"
                            title="Detail File"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {isFolder ? (
                            <button
                              onClick={() => handleOpenFolder({ id: f.drive_file_id, name: f.name })}
                              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 rounded-lg transition"
                              title="Buka Folder"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setPreviewFile(f)}
                                className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/80 rounded-lg transition"
                                title="Pratinjau File"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(f)}
                                disabled={downloadingId === f.id}
                                className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80 rounded-lg transition disabled:opacity-50"
                                title="Unduh File"
                              >
                                <Download className={`w-4 h-4 ${downloadingId === f.id ? 'animate-bounce text-emerald-400' : ''}`} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(f)}
                            disabled={deletingId === f.id}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded-lg transition disabled:opacity-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
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
            <div className="py-16 text-center text-zinc-400 flex flex-col items-center gap-2 font-sans">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs font-medium">Memuat galeri file...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-xs font-medium text-zinc-400">Tidak ada file atau folder yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh] min-h-[360px] scrollbar-thin p-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {filteredFiles.map((f) => {
                  const isFolder = isFolderItem(f);
                  const isImg = !isFolder && isImageFile(f.name, f.mime_type);
                  const isSelected = selectedIds.has(f.id);

                  return (
                    <div
                      key={f.id}
                      className={`bg-zinc-900/60 hover:bg-zinc-850/80 border rounded-xl overflow-hidden group transition-all flex flex-col relative shadow-sm hover:shadow-md ${
                        isSelected
                          ? 'border-cyan-500/80 bg-cyan-950/20 ring-1 ring-cyan-500/40'
                          : 'border-zinc-800/80 hover:border-zinc-700/80 hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Checkbox Overlay */}
                      <div className="absolute top-2 left-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(f.id);
                          }}
                          className="p-1 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-cyan-500 text-zinc-300 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500" />
                          )}
                        </button>
                      </div>

                      {/* Media / Folder Thumbnail Container */}
                      <div
                        onClick={() => {
                          if (isFolder) handleOpenFolder({ id: f.drive_file_id, name: f.name });
                          else setPreviewFile(f);
                        }}
                        className={`relative h-32 flex items-center justify-center overflow-hidden cursor-pointer border-b border-zinc-800/80 ${
                          isFolder ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-zinc-950/50'
                        }`}
                      >
                      {isFolder ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <Folder className="w-10 h-10 text-amber-400 fill-amber-400/20 transition-transform group-hover:scale-110" />
                          <span className="text-[10px] font-sans font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            Folder
                          </span>
                        </div>
                      ) : isImg ? (
                        <>
                          <img
                            src={apiService.getFileThumbnailUrl(f.id)}
                            alt={f.name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-6 h-6 text-cyan-400" />
                          </div>
                        </>
                      ) : (
                        <div className="text-zinc-400 scale-125">{getFileIcon(f)}</div>
                      )}
                    </div>

                    {/* File Meta Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between gap-2 font-sans">
                      <div>
                        <p
                          className="font-medium text-xs text-zinc-200 truncate hover:text-cyan-400 cursor-pointer"
                          title={f.name}
                          onClick={() => {
                            if (isFolder) handleOpenFolder({ id: f.drive_file_id, name: f.name });
                            else setPreviewFile(f);
                          }}
                        >
                          {f.name}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5">
                          <span className="font-mono">{formatFileSize(f.size, isFolder)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailFile(f);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-750/50 truncate max-w-[110px] transition"
                            title={`Akun: ${f.account_email}`}
                          >
                            <Mail className="w-2.5 h-2.5 text-cyan-400/80 shrink-0" />
                            <span className="truncate">{f.account_email ? f.account_email.split('@')[0] : 'Akun'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        {isFolder ? (
                          <button
                            onClick={() => handleOpenFolder({ id: f.drive_file_id, name: f.name })}
                            className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1 text-[11px] font-medium transition-all"
                            title="Buka Folder"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setPreviewFile(f)}
                            className="text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/80 p-1.5 rounded-lg transition-all"
                            title="Pratinjau File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => setDetailFile(f)}
                            className="text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/80 p-1.5 rounded-lg transition-all"
                            title="Detail File"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          {!isFolder && (
                            <button
                              onClick={() => handleDownload(f)}
                              disabled={downloadingId === f.id}
                              className="text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80 p-1.5 rounded-lg transition-all disabled:opacity-50"
                              title="Unduh"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(f)}
                            disabled={deletingId === f.id}
                            className="text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 p-1.5 rounded-lg transition-all disabled:opacity-50"
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
            </div>
          )}
        </div>
      )}

      {/* Footer & Pagination Controls */}
      <div className="px-3.5 sm:px-4 py-3 border-t border-zinc-800/80 bg-zinc-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-300 font-sans">
        {/* Left: Range and items per page */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
          <span>
            {isAllPages ? (
              <>
                Total <span className="font-semibold text-emerald-400">{totalFiles}</span> item
              </>
            ) : (
              <>
                Item <span className="font-semibold text-cyan-400">{startItem}-{endItem}</span> / <span className="font-semibold text-white">{totalFiles}</span>
              </>
            )}
          </span>

          <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-800">
            <span className="text-[11px] text-zinc-400">Per hlm:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5 text-xs font-sans text-zinc-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              {[10, 20, 50, 100, 250, 500].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value={-1}>Semua ({totalFiles})</option>
            </select>
          </div>
        </div>

        {/* Right: Pagination buttons */}
        {isAllPages ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 italic">
              Semua item ditampilkan
            </span>
            {totalFiles > 20 && (
              <button
                onClick={() => onPageSizeChange(20)}
                className="px-3 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750/70 rounded-lg text-xs font-medium text-zinc-200 transition-all"
                title="Bagi menjadi 20 item per halaman"
              >
                Bagi 20/hlm
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Compact Pagination (< sm) */}
            <div className="flex sm:hidden items-center justify-between w-full pt-2 border-t border-zinc-800/80 gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || loading}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &lsaquo; Prev
              </button>
              <span className="text-xs text-zinc-300">
                Hal. <span className="font-semibold text-cyan-400">{page}</span> / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages || loading}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next &rsaquo;
              </button>
            </div>

            {/* Desktop Full Pagination (>= sm) */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={page === 1 || loading}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman Pertama"
              >
                &laquo;
              </button>
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || loading}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        page === p
                          ? 'bg-cyan-500 text-black font-semibold shadow-sm shadow-cyan-500/20'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-zinc-600 font-bold">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages || loading}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman Selanjutnya"
              >
                Next &rsaquo;
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages || loading}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman Terakhir"
              >
                &raquo;
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating Multi-Select Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl shadow-black/80 rounded-2xl px-4 py-2.5 flex items-center justify-between sm:justify-start gap-3 text-xs font-sans animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-zinc-750 shrink-0">
            <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </span>
            <span className="text-zinc-200 font-medium hidden xs:inline">dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs shadow-sm transition-all"
              title="Unduh file yang dipilih"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh ({selectedIds.size})</span>
            </button>

            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
              title="Hapus permanen file/folder yang dipilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedIds.size})</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all shrink-0"
              title="Batalkan Pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Universal File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      {/* File & Folder Detail Modal */}
      <FileDetailModal
        file={detailFile}
        onClose={() => setDetailFile(null)}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onPreview={(f) => setPreviewFile(f)}
        onOpenFolder={(f) => {
          setDetailFile(null);
          handleOpenFolder(f);
        }}
      />
    </div>
  );
};
