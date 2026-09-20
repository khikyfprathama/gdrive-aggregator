import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StorageHero } from './components/StorageHero';
import { AccountCards } from './components/AccountCards';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { Toast, type ToastMessage } from './components/Toast';
import { apiService } from './services/api';
import type { StorageOverview, Account, FileRecord } from './types';

export function App() {
  const [overview, setOverview] = useState<StorageOverview | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAccountId, setFilterAccountId] = useState<number>(0);

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
      // 1. Check Ping
      await apiService.ping();
      setIsOnline(true);

      // 2. Fetch Storage Overview & Accounts
      const overviewData = await apiService.getStorageOverview();
      setOverview(overviewData);

      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);

      // 3. Fetch Files
      const filesData = await apiService.getFiles({
        account_id: filterAccountId > 0 ? filterAccountId : undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setFiles(filesData.data || []);
      setTotalFiles(filesData.total || 0);
    } catch (err: any) {
      setIsOnline(false);
      console.error('Failed to connect to backend:', err);
      showToast('Gagal terhubung ke backend Go. Pastikan server aktif.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterAccountId, searchQuery, showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-300">
      <Navbar
        onRefresh={fetchDashboardData}
        loading={loading}
        isOnline={isOnline}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Storage Pool Hero */}
        <StorageHero overview={overview} loading={loading} />

        {/* Connected Accounts Cards */}
        <AccountCards
          accounts={accounts}
          onAccountUpdated={fetchDashboardData}
          onShowToast={showToast}
        />

        {/* Upload Box */}
        <FileUpload
          accounts={accounts}
          onUploadSuccess={fetchDashboardData}
          onShowToast={showToast}
        />

        {/* Unified File Explorer */}
        <FileList
          files={files}
          accounts={accounts}
          loading={loading}
          totalFiles={totalFiles}
          onRefresh={fetchDashboardData}
          onShowToast={showToast}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterAccountId={filterAccountId}
          setFilterAccountId={setFilterAccountId}
        />
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <p>Google Drive Aggregator &copy; 2026. Built with Go & React.</p>
      </footer>

      {/* Global Toast */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
