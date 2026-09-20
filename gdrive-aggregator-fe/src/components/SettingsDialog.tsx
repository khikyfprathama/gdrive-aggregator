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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <Server className="w-4 h-4 text-zinc-400" />
            <span>Backend Server Configuration</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Backend API Base URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.18.18:8081"
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-zinc-700"
              required
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Default points to your home server laptop IP & port.
            </p>
          </div>

          {saved && (
            <p className="text-xs text-emerald-400">Settings saved. Reloading console...</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg transition font-semibold"
            >
              Save & Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
