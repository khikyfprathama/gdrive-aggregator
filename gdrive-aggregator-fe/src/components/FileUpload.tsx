import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp, Sparkles } from 'lucide-react';
import type { Account } from '../types';
import { apiService } from '../services/api';

interface FileUploadProps {
  accounts: Account[];
  onUploadSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accounts,
  onUploadSuccess,
  onShowToast,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      await apiService.uploadFile(selectedFile, selectedAccountId, (percent) => {
        setUploadProgress(percent);
      });

      onShowToast(`File "${selectedFile.name}" berhasil diunggah!`, 'success');
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Gagal mengunggah file';
      onShowToast(`Upload gagal: ${errorMsg}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            Upload File ke Google Drive
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Unggah file ke storage pool. Smart Allocation akan otomatis memilih akun yang paling lega.
          </p>
        </div>

        {/* Account Destination Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400 whitespace-nowrap">Tujuan:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            disabled={isUploading}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value={0}>✨ Smart Auto-Routing (Paling Lega)</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.email} ({acc.free_storage_str || 'Sisa kuota'} free)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
          <FileUp className="w-7 h-7" />
        </div>

        {selectedFile ? (
          <div className="space-y-1">
            <p className="text-sm font-bold text-white max-w-md truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Ukuran: {formatFileSize(selectedFile.size)}
            </p>
            <p className="text-[11px] text-blue-400 font-medium pt-1">
              Klik atau drag file lain untuk mengganti
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop file Anda ke sini, atau <span className="text-blue-400 underline">pilih dari komputer</span>
            </p>
            <p className="text-xs text-slate-500">
              Mendukung semua format file (PDF, Video, Gambar, ZIP, Dokumen, dll.)
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress or Action Buttons */}
      {isUploading ? (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Mengunggah ke Google Drive...
            </span>
            <span className="font-mono font-bold text-blue-400">{uploadProgress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : selectedFile ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>
              Siap diunggah via <strong>{selectedAccountId === 0 ? 'Smart Auto-Allocation' : 'Akun Terpilih'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFile(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              onClick={handleUpload}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Mulai Upload</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
