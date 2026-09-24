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
  Plus,
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
      {/* Top Application Bar with Modern Glassmorphism & Neo-Brutalist accents */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b-2 border-zinc-800 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
        {/* Subtle glowing accent line on top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div
              onClick={() => handleTabChange('files')}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Drive Aggregator Home"
            >
              <div className="relative">
                <img
                  src="/favicon.svg"
                  alt="GDrive Aggregator"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-2deg]"
                />
                {/* Live Pulse Dot on Logo */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-black ${
                      isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white font-mono group-hover:text-cyan-400 transition-colors">
                    Drive Aggregator
                  </span>
                  <span className="hidden sm:inline-flex text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 uppercase tracking-widest">
                    PRO
                  </span>
                </div>
                {/* Status indicator on desktop */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                  <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span className="truncate max-w-[130px]">{serverUrl.replace(/^https?:\/\//, '')}</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Segmented Switcher */}
            <nav className="hidden md:flex items-center bg-zinc-900 border-2 border-zinc-700 rounded-lg p-1 text-xs gap-1 shadow-[2px_2px_0px_0px_#000]">
              <button
                onClick={() => handleTabChange('files')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-black tracking-wide uppercase transition ${
                  activeTab === 'files'
                    ? 'bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'text-zinc-400 hover:text-zinc-200 border-2 border-transparent'
                }`}
              >
                <Files className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Files</span>
                {totalFiles > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black border ${
                      activeTab === 'files'
                        ? 'bg-black text-cyan-400 border-black'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {totalFiles}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('drives')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-black tracking-wide uppercase transition ${
                  activeTab === 'drives'
                    ? 'bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'text-zinc-400 hover:text-zinc-200 border-2 border-transparent'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Connected Drives</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black border ${
                    activeTab === 'drives'
                      ? 'bg-black text-cyan-400 border-black'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {accountsCount}
                </span>
              </button>
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 stroke-[3]" />
              <span>Upload</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border-2 border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border-2 border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              title="Server Settings"
            >
              <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Mobile Right Controls: Quick Upload + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Upload</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 text-zinc-300 hover:text-white bg-zinc-800 border-2 border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-zinc-200 bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              ) : (
                <Menu className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t-2 border-zinc-800 bg-zinc-950/95 backdrop-blur-xl px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
            {/* Mobile Tab Switcher */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTabChange('files')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-black tracking-wide uppercase text-xs transition ${
                  activeTab === 'files'
                    ? 'bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-zinc-900 text-zinc-300 border-2 border-zinc-700 hover:text-white'
                }`}
              >
                <Files className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Files</span>
                {totalFiles > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black border ${
                      activeTab === 'files'
                        ? 'bg-black text-cyan-400 border-black'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {totalFiles}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('drives')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-black tracking-wide uppercase text-xs transition ${
                  activeTab === 'drives'
                    ? 'bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-zinc-900 text-zinc-300 border-2 border-zinc-700 hover:text-white'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Drives</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black border ${
                    activeTab === 'drives'
                      ? 'bg-black text-cyan-400 border-black'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {accountsCount}
                </span>
              </button>
            </div>

            {/* Mobile Quick Action Buttons & Server Info */}
            <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-2 border-zinc-700 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400 stroke-[2.5]" />
                <span>Server Settings</span>
              </button>

              <a
                href={`${serverUrl}/swagger/index.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-2 border-zinc-700 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>API Swagger</span>
                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              </a>
            </div>

            {/* Server Online Status Banner */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500'
                  }`}
                />
                <span>Status: {isOnline ? 'Connected' : 'Offline'}</span>
              </span>
              <span className="truncate max-w-[150px]">{serverUrl.replace(/^https?:\/\//, '')}</span>
            </div>
          </div>
        )}
      </header>

      {/* Ergonomic Mobile Bottom Navigation Bar (Hidden on desktop md:) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t-2 border-zinc-800 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Files Tab */}
          <button
            onClick={() => handleTabChange('files')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'files'
                ? 'text-cyan-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Files className="w-5 h-5 stroke-[2.5]" />
              {totalFiles > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-cyan-400 text-black text-[9px] font-black rounded-full font-mono border border-black leading-none">
                  {totalFiles > 99 ? '99+' : totalFiles}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider">Files</span>
          </button>

          {/* Center Elevated Floating Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center justify-center -mt-5 w-12 h-12 bg-cyan-400 hover:bg-cyan-300 text-black rounded-full border-2 border-black shadow-[0_4px_10px_rgba(6,182,212,0.4),3px_3px_0px_0px_#000] active:scale-95 transition-all"
            title="Upload File"
          >
            <UploadCloud className="w-6 h-6 stroke-[3]" />
          </button>

          {/* Connected Drives Tab */}
          <button
            onClick={() => handleTabChange('drives')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
              activeTab === 'drives'
                ? 'text-cyan-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <HardDrive className="w-5 h-5 stroke-[2.5]" />
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-emerald-400 text-black text-[9px] font-black rounded-full font-mono border border-black leading-none">
                {accountsCount}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider">Drives</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Config</span>
          </button>
        </div>
      </nav>
    </>
  );
};
