import React, { useState } from 'react';
import { X, Server } from 'lucide-react';
import { getBaseURL, setBaseURL } from '../services/api';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(getBaseURL());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setBaseURL(url);
    setSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl shadow-black/80 overflow-hidden font-sans">
        <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white text-xs font-semibold">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Server className="w-4 h-4" />
            </span>
            <span>Backend Server Config</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800/80 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Backend API Base URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.18.18:8081"
              className="w-full px-3.5 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
              required
            />
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Default mengarah ke IP laptop server port 8081.
            </p>
          </div>

          {saved && (
            <p className="text-xs text-emerald-400 font-medium">Pengaturan disimpan. Memuat ulang...</p>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl shadow-sm transition-all"
            >
              Simpan & Terapkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
