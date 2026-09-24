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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border-2 border-zinc-750 rounded-xl w-full max-w-lg shadow-[8px_8px_0px_0px_#000] overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b-2 border-zinc-700 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <UploadCloud className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
            <h3 className="text-xs font-black uppercase tracking-wider">Unggah ke Google Drive</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-zinc-400 hover:text-white p-1 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition disabled:opacity-50 shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target Account Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Tujuan Akun Drive
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
              disabled={isUploading}
              className="w-full bg-zinc-950 border-2 border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
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
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-[2px_2px_0px_0px_#000] ${
              file ? 'border-cyan-400 bg-cyan-950/20' : 'border-zinc-700 hover:border-cyan-400 bg-zinc-950'
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
                <p className="text-sm font-bold text-white truncate max-w-sm">{file.name}</p>
                <p className="text-xs font-mono text-cyan-400 font-bold">{formatBytes(file.size)}</p>
                <p className="text-[11px] text-zinc-400 pt-1 font-sans">Klik untuk mengganti file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Pilih file dari komputer atau seret ke sini
                </p>
                <p className="text-[11px] text-zinc-400 font-sans">Semua format file didukung</p>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono text-zinc-300 font-bold uppercase">
                <span>Mengunggah file...</span>
                <span className="text-cyan-400">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-950 border-2 border-zinc-700 rounded-md overflow-hidden p-0.5 shadow-[1px_1px_0px_0px_#000]">
                <div
                  className="h-full bg-cyan-400 transition-all duration-150 rounded-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t-2 border-zinc-700 flex justify-end gap-2 font-mono">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-3.5 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={!file || isUploading}
            className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 text-black border-2 border-black rounded shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isUploading ? 'Mengunggah...' : 'Mulai Unggah'}
          </button>
        </div>
      </div>
    </div>
  );
};
