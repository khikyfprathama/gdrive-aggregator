import React, { useState } from 'react';
import {
  Files,
  HardDrive,
  UploadCloud,
  RefreshCw,
  Settings,
  Menu,
  X,
  Server,
  ArrowUpRight,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'files' | 'drives';
  setActiveTab: (tab: 'files' | 'drives') => void;
  totalFiles: number;
  accountsCount: number;
  isOnline: boolean;
  loading: boolean;
  onRefresh: () => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  serverUrl: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalFiles,
  accountsCount,
  isOnline,
  loading,
  onRefresh,
  onOpenUpload,
  onOpenSettings,
  serverUrl,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: 'files' | 'drives') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Sleek Modern Application Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/80 shadow-sm transition-all">
        {/* Subtle accent glow line at the top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 opacity-80" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              onClick={() => handleTabChange('files')}
              className="flex items-center gap-3 cursor-pointer group select-none"
              title="Drive Aggregator"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 shadow-inner group-hover:border-cyan-400/60 transition-all">
                <img
                  src="/favicon.svg"
                  alt="Drive Aggregator"
                  className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 border-2 border-zinc-950 ${
                      isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                    Drive Aggregator
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  Unified Cloud Storage Manager
                </p>
              </div>
            </div>
          </div>

          {/* Center: Desktop Segmented Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 gap-1 shadow-inner">
            <button
              onClick={() => handleTabChange('files')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'files'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Files className="w-4 h-4 text-cyan-400" />
              <span>Semua File</span>
              {totalFiles > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                    activeTab === 'files'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {totalFiles}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('drives')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'drives'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Connected Drives</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                  activeTab === 'drives'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {accountsCount}
              </span>
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-zinc-950 text-xs font-semibold rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>Upload File</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all cursor-pointer shadow-sm"
              title="Server Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 text-zinc-950 text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Upload</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg active:scale-95 transition-all"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-cyan-400" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xl">
            {/* Mobile Tab Switcher */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTabChange('files')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  activeTab === 'files'
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                <Files className="w-4 h-4 text-cyan-400" />
                <span>Files</span>
                {totalFiles > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300">
                    {totalFiles}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('drives')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  activeTab === 'drives'
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Drives</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                  {accountsCount}
                </span>
              </button>
            </div>

            {/* Mobile Quick Action Buttons & Server Info */}
            <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 shadow-sm"
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Pengaturan</span>
              </button>

              <a
                href={`${serverUrl}/swagger/index.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 shadow-sm"
              >
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Swagger API</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Server Online Status Banner */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/70 rounded-xl border border-zinc-800 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
                  }`}
                />
                <span>Server {isOnline ? 'Terhubung' : 'Terputus'}</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-500 truncate max-w-[150px]">
                {serverUrl.replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Ergonomic Mobile Bottom Navigation Bar (Hidden on desktop md:) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Files Tab */}
          <button
            onClick={() => handleTabChange('files')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
              activeTab === 'files'
                ? 'text-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Files className="w-5 h-5 stroke-[2]" />
              {totalFiles > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-cyan-500 text-black text-[9px] font-bold rounded-full font-mono leading-none">
                  {totalFiles > 99 ? '99+' : totalFiles}
                </span>
              )}
            </div>
            <span className="text-[11px]">Files</span>
          </button>

          {/* Center Elevated Floating Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center justify-center -mt-5 w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-zinc-950 rounded-full shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
            title="Upload File"
          >
            <UploadCloud className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Connected Drives Tab */}
          <button
            onClick={() => handleTabChange('drives')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
              activeTab === 'drives'
                ? 'text-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <HardDrive className="w-5 h-5 stroke-[2]" />
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-emerald-500 text-black text-[9px] font-bold rounded-full font-mono leading-none">
                {accountsCount}
              </span>
            </div>
            <span className="text-[11px]">Drives</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
            <span className="text-[11px]">Server</span>
          </button>
        </div>
      </nav>
    </>
  );
};
