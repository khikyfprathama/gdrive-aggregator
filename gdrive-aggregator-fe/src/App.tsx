// Copyright (c) 2024 Garagarabug Studio. All rights reserved.
// Licensed under the MIT License with Attribution Requirement.
// Source: https://github.com/khikyfprathama/gdrive-aggregator
import { useState, useEffect, useCallback } from 'react';

import { StorageHeader } from './components/StorageHeader';
import { FileBrowser } from './components/FileBrowser';
import { AccountsManager } from './components/AccountsManager';
import { UploadModal } from './components/UploadModal';
import { SettingsDialog } from './components/SettingsDialog';
import { Toast, type ToastMessage } from './components/Toast';
import { apiService, getBaseURL } from './services/api';
import type { StorageOverview, Account, FileRecord } from './types';
import { Files, HardDrive, UploadCloud, RefreshCw, Settings } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'files' | 'drives'>('files');
  const [overview, setOverview] = useState<StorageOverview | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  // Search, Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAccountId, setFilterAccountId] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [folderTrail, setFolderTrail] = useState<{ id: string; name: string }[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await apiService.ping();
      setIsOnline(true);

      const overviewData = await apiService.getStorageOverview();
      setOverview(overviewData);

      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);

      const currentFolder = folderTrail.length > 0 ? folderTrail[folderTrail.length - 1] : null;
      const filesData = await apiService.getFiles({
        account_id: filterAccountId > 0 ? filterAccountId : undefined,
        search: searchQuery || undefined,
        parent_id: currentFolder ? currentFolder.id : undefined,
        limit: pageSize === -1 ? 5000 : pageSize,
        offset: pageSize === -1 ? 0 : (page - 1) * pageSize,
      });
      setFiles(filesData.data || []);
      setTotalFiles(filesData.total || 0);
    } catch (err: any) {
      setIsOnline(false);
      showToast('Cannot connect to backend server. Check connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterAccountId, searchQuery, folderTrail, page, pageSize, showToast]);

  const handleEnterFolder = (folder: { id: string; name: string }) => {
    setFolderTrail((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].id === folder.id) {
        return prev;
      }
      return [...prev, folder];
    });
    setSearchQuery('');
    setPage(1);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    if (index < 0) {
      setFolderTrail([]);
    } else {
      setFolderTrail((prev) => prev.slice(0, index + 1));
    }
    setSearchQuery('');
    setPage(1);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenUpload = (file?: File) => {
    if (file) {
      setDroppedFile(file);
    } else {
      setDroppedFile(null);
    }
    setIsUploadOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      {/* Top Application Bar Neo-Brutalist */}
      <header className="border-b-2 border-zinc-800 bg-zinc-950 sticky top-0 z-30 shadow-[0_4px_0px_0px_#000000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="GDrive Aggregator" className="w-8 h-8 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]" />
              <span className="font-black text-sm uppercase tracking-wider text-white font-mono">Drive Aggregator</span>
            </div>

            {/* Segmented Tab Switcher Neo-Brutalist */}
            <nav className="flex items-center bg-zinc-900 border-2 border-zinc-700 rounded-lg p-1 text-xs gap-1 shadow-[2px_2px_0px_0px_#000]">
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-black tracking-wide uppercase transition ${
                  activeTab === 'files'
                    ? 'bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'text-zinc-400 hover:text-zinc-200 border-2 border-transparent'
                }`}
              >
                <Files className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Files</span>
                {totalFiles > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black border ${
                    activeTab === 'files' ? 'bg-black text-cyan-400 border-black' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}>
                    {totalFiles}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('drives')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-black tracking-wide uppercase transition ${
                  activeTab === 'drives'
                    ? 'bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'text-zinc-400 hover:text-zinc-200 border-2 border-transparent'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Connected Drives</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black border ${
                  activeTab === 'drives' ? 'bg-black text-cyan-400 border-black' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}>
                  {accounts.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Right Actions Neo-Brutalist */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenUpload()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <UploadCloud className="w-4 h-4 stroke-[3]" />
              <span>Upload</span>
            </button>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border-2 border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border-2 border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              title="Server Settings"
            >
              <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Compact Storage Overview Header */}
        <StorageHeader
          overview={overview}
          serverUrl={getBaseURL()}
          isOnline={isOnline}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Tab 1: File Browser (Default Workspace) */}
        {activeTab === 'files' && (
          <FileBrowser
            files={files}
            accounts={accounts}
            loading={loading}
            totalFiles={totalFiles}
            onRefresh={fetchDashboardData}
            onShowToast={showToast}
            searchQuery={searchQuery}
            setSearchQuery={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            filterAccountId={filterAccountId}
            setFilterAccountId={(id) => {
              setFilterAccountId(id);
              setPage(1);
            }}
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            folderTrail={folderTrail}
            onEnterFolder={handleEnterFolder}
            onNavigateBreadcrumb={handleNavigateBreadcrumb}
            onOpenUpload={handleOpenUpload}
          />
        )}

        {/* Tab 2: Connected Drives Management */}
        {activeTab === 'drives' && (
          <AccountsManager
            accounts={accounts}
            onAccountUpdated={fetchDashboardData}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer Status Line */}
      <footer className="border-t border-zinc-900 px-6 py-3 text-xs text-zinc-500 flex justify-between items-center">
        <span className="flex items-center gap-1.5">
          <span>Drive Aggregator</span>
          <span className="text-zinc-700">•</span>
          <span>Pure Go · SQLite · React</span>
        </span>
        <a
          href="https://github.com/khikyfprathama"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Garagarabug Studio — Developer"
        >
          <span>© {new Date().getFullYear()}</span>
          <span className="font-semibold text-zinc-400 hover:text-white transition-colors">Garagarabug Studio</span>
        </a>
      </footer>


      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        accounts={accounts}
        onUploadSuccess={fetchDashboardData}
        onShowToast={showToast}
        initialFile={droppedFile}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Toast Feedback */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
