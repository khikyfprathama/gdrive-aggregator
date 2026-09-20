import React, { useState } from 'react';
import type { Account } from '../types';
import { RefreshCw, Trash2, User, PlusCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface AccountCardsProps {
  accounts: Account[];
  onAccountUpdated: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const AccountCards: React.FC<AccountCardsProps> = ({
  accounts,
  onAccountUpdated,
  onShowToast,
}) => {
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleSync = async (account: Account) => {
    try {
      setSyncingId(account.id);
      await apiService.syncAccount(account.id);
      onShowToast(`Kuota akun ${account.email} berhasil diperbarui!`, 'success');
      onAccountUpdated();
    } catch (err: any) {
      onShowToast(`Gagal sinkronisasi kuota ${account.email}: ${err.message}`, 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (account: Account) => {
    if (!window.confirm(`Yakin ingin memutuskan akun ${account.email} dari aggregator?`)) {
      return;
    }

    try {
      setDeletingId(account.id);
      await apiService.deleteAccount(account.id);
      onShowToast(`Akun ${account.email} berhasil diputuskan.`, 'success');
      onAccountUpdated();
    } catch (err: any) {
      onShowToast(`Gagal menghapus akun ${account.email}: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddAccount = async () => {
    try {
      const authUrl = await apiService.getGoogleAuthURL();
      window.open(authUrl, '_blank');
    } catch (err: any) {
      onShowToast(`Gagal mengambil link login Google: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Akun Google Terhubung</h3>
          <p className="text-xs text-slate-400">Rincian kuota dan status dari masing-masing akun Gmail Anda.</p>
        </div>

        <button
          onClick={handleAddAccount}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
          title="Tambah Akun Google Baru"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Akun</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const usagePct = acc.usage_percent ?? (acc.storage_limit > 0 ? (acc.storage_usage / acc.storage_limit) * 100 : 0);
          const isHighUsage = usagePct > 80;

          return (
            <div
              key={acc.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
            >
              {/* Header: Avatar, Name, Email */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {acc.avatar_url ? (
                    <img
                      src={acc.avatar_url}
                      alt={acc.display_name}
                      className="w-11 h-11 rounded-full ring-2 ring-blue-500/30 object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate" title={acc.display_name}>
                      {acc.display_name || 'Google User'}
                    </h4>
                    <p className="text-xs text-slate-400 truncate" title={acc.email}>
                      {acc.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSync(acc)}
                    disabled={syncingId === acc.id}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                    title="Sinkronisasi Kuota dari Google Drive"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin text-blue-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(acc)}
                    disabled={deletingId === acc.id}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                    title="Putuskan Akun"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Storage Stats */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400 font-medium">Sisa Ruang</span>
                  <span className="font-bold text-emerald-400">
                    {acc.free_storage_str || '0 B'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHighUsage ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(usagePct, 1), 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Terpakai: {acc.storage_usage_str || '0 B'} ({usagePct.toFixed(1)}%)</span>
                  <span>Total: {acc.storage_limit_str || '0 B'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
