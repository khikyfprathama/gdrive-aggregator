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
} from 'lucide-react';
import { apiService } from '../services/api';

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
  onOpenUpload,
}) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'docs' | 'media' | 'archives' | 'code'>('all');

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
    if (!window.confirm(`Delete "${file.name}" permanently from Google Drive?`)) {
      return;
    }

    try {
      setDeletingId(file.id);
      await apiService.deleteFile(file.id);
      onShowToast(`File "${file.name}" deleted.`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
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
              placeholder="Search file name..."
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

        {/* Right: Drive Filter & Upload Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none pr-1"
            >
              <option value={0} className="bg-zinc-900">All Drives ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-zinc-900">
                  {acc.email}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Refresh files"
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

      {/* Drag & Drop Hint Banner (Only shows when dragging) */}
      {isDragOver && (
        <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-3 flex items-center justify-center gap-2 text-xs font-medium text-blue-400 animate-pulse">
          <FileUp className="w-4 h-4" />
          <span>Release mouse to upload file into Google Drive</span>
        </div>
      )}

      {/* Files Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 text-zinc-400 font-semibold border-b border-zinc-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-4 font-medium">Name</th>
              <th className="py-2.5 px-4 font-medium hidden sm:table-cell">Target Drive</th>
              <th className="py-2.5 px-4 font-medium">Size</th>
              <th className="py-2.5 px-4 font-medium hidden md:table-cell">Uploaded</th>
              <th className="py-2.5 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-zinc-500" />
                    <span>Loading file records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-zinc-300">No files found</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm">
                      Drag and drop any file here, or click the Upload button to store your first file across your Google Drive pool.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredFiles.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-800/40 transition group">
                  {/* File Name */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      {getFileIcon(f.name, f.mime_type)}
                      <span className="font-medium text-white truncate max-w-xs sm:max-w-md" title={f.name}>
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
                      <button
                        onClick={() => handleDownload(f)}
                        disabled={downloadingId === f.id}
                        className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition"
                        title="Download file"
                      >
                        <Download className={`w-3.5 h-3.5 ${downloadingId === f.id ? 'animate-bounce text-emerald-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
                        disabled={deletingId === f.id}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/40 flex justify-between items-center text-[11px] text-zinc-500">
        <span>Showing {filteredFiles.length} of {totalFiles} total files</span>
        <span>Drag & drop files anywhere over this panel to upload</span>
      </div>
    </div>
  );
};
