import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X } from 'lucide-react';
import type { Account } from '../types';
import { apiService } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onUploadSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  initialFile?: File | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onUploadSuccess,
  onShowToast,
  initialFile,
}) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [accountId, setAccountId] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
    }
  }, [initialFile]);

  if (!isOpen) return null;

  const formatBytes = (b: number): string => {
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleStartUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setProgress(0);

      await apiService.uploadFile(file, accountId, (percent) => {
        setProgress(percent);
      });

      onShowToast(`File "${file.name}" uploaded successfully`, 'success');
      onUploadSuccess();
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      onShowToast(`Upload error: ${msg}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setFile(null);
    setProgress(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/80 overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <UploadCloud className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold">Unggah ke Google Drive</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800/80 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target Account Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Tujuan Akun Drive
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
              disabled={isUploading}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 cursor-pointer"
            >
              <option value={0}>Auto-Routing (Akun dengan sisa ruang terbanyak)</option>
              {accounts.map((acc) => {
                const freeBytes = acc.storage_limit > acc.storage_usage ? acc.storage_limit - acc.storage_usage : 0;
                return (
                  <option key={acc.id} value={acc.id}>
                    {acc.email} ({formatBytes(freeBytes)} tersedia)
                  </option>
                );
              })}
            </select>
          </div>

          {/* File Selector / Drop Area */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
              file
                ? 'border-cyan-500/50 bg-cyan-500/5'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              className="hidden"
            />

            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white truncate max-w-sm">{file.name}</p>
                <p className="text-xs font-mono text-cyan-400 font-medium">{formatBytes(file.size)}</p>
                <p className="text-[11px] text-zinc-400 pt-1">Klik untuk mengganti file</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-750/60 flex items-center justify-center text-zinc-300 mx-auto mb-2">
                  <UploadCloud className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-xs font-medium text-zinc-200">
                  Pilih file dari komputer atau seret ke sini
                </p>
                <p className="text-[11px] text-zinc-500">Semua format file didukung</p>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-zinc-300 font-medium">
                <span>Mengunggah file...</span>
                <span className="text-cyan-400 font-mono font-semibold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-zinc-950/70 border-t border-zinc-800/80 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={!file || isUploading}
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isUploading ? 'Mengunggah...' : 'Mulai Unggah'}
          </button>
        </div>
      </div>
    </div>
  );
};
