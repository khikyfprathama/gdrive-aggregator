import React, { useState } from 'react';
import { HardDrive, Settings, RefreshCw, ExternalLink } from 'lucide-react';
import { getBaseURL, setBaseURL } from '../services/api';

interface NavbarProps {
  onRefresh: () => void;
  loading: boolean;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, loading, isOnline }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState(getBaseURL());
  const [savedMessage, setSavedMessage] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setBaseURL(apiUrl);
    setSavedMessage('URL Backend berhasil disimpan! Me-refresh...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">GDrive Aggregator</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Unified Multi-Account Cloud Storage</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Connection Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-300 hidden md:inline font-mono">
                {apiUrl.replace(/^https?:\/\//, '')}
              </span>
              <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Swagger UI link */}
            <a
              href={`${apiUrl}/swagger/index.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Buka Dokumentasi Swagger UI"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Swagger</span>
            </a>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
              title="Perbarui Data Kuota & File"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* Settings Modal Toggle */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Pengaturan URL Server"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Pengaturan URL Backend</h2>
            <p className="text-xs text-slate-400 mb-4">
              Tentukan alamat IP dan port backend Go laptop server Anda.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://192.168.18.18:8081"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              {savedMessage && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                  {savedMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-lg shadow-blue-600/20"
                >
                  Simpan & Terapkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
