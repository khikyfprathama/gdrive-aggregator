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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border-2 border-zinc-750 rounded-xl w-full max-w-sm shadow-[8px_8px_0px_0px_#000] overflow-hidden">
        <div className="px-4 py-3.5 border-b-2 border-zinc-700 bg-zinc-950 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-wider">
            <Server className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
            <span>Backend Server Config</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition">
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-3 font-mono">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Backend API Base URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.18.18:8081"
              className="w-full px-3 py-2 bg-zinc-950 border-2 border-zinc-700 rounded text-xs text-white font-mono shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:border-cyan-400"
              required
            />
            <p className="text-[11px] text-zinc-400 mt-1.5 font-sans">
              Default mengarah ke IP laptop server port 8081.
            </p>
          </div>

          {saved && (
            <p className="text-xs text-emerald-400 font-bold">Pengaturan disimpan. Memuat ulang...</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t-2 border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 text-black border-2 border-black rounded shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Simpan & Terapkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
