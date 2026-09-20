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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Upload to Google Drive</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target Account Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Destination Drive
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
              disabled={isUploading}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
            >
              <option value={0}>Auto-Routing (Account with most free space)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.email} ({acc.free_storage_str || 'Free space'} available)
                </option>
              ))}
            </select>
          </div>

          {/* File Selector / Drop Area */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
              file ? 'border-zinc-700 bg-zinc-950/60' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/30'
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
                <p className="text-sm font-medium text-white truncate max-w-sm">{file.name}</p>
                <p className="text-xs font-mono text-zinc-400">{formatBytes(file.size)}</p>
                <p className="text-[11px] text-blue-400 pt-1">Click to select a different file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-200">
                  Select a file from your computer or drop here
                </p>
                <p className="text-[11px] text-zinc-500">Any file type accepted (binary stream upload)</p>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={!file || isUploading}
            className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {isUploading ? 'Uploading...' : 'Start Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};
