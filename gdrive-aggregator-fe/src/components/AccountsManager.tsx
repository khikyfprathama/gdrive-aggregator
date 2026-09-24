import React, { useState } from 'react';
import type { Account } from '../types';
import { RefreshCw, Trash2, User, Plus, HardDrive } from 'lucide-react';
import { apiService } from '../services/api';

interface AccountsManagerProps {
  accounts: Account[];
  onAccountUpdated: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({
  accounts,
  onAccountUpdated,
  onShowToast,
}) => {
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSync = async (account: Account) => {
    try {
      setSyncingId(account.id);
      await apiService.syncAccount(account.id);
      onShowToast(`Berhasil menyinkronkan kuota ${account.email}`, 'success');
      onAccountUpdated();
    } catch (err: any) {
      onShowToast(`Gagal sync ${account.email}: ${err.message}`, 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (account: Account) => {
    if (!window.confirm(`Putuskan integrasi Google Drive akun "${account.email}"?`)) {
      return;
    }

    try {
      setDeletingId(account.id);
      await apiService.deleteAccount(account.id);
      onShowToast(`Akun ${account.email} berhasil diputus.`, 'success');
      onAccountUpdated();
    } catch (err: any) {
      onShowToast(`Gagal memutus akun: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddAccount = async () => {
    try {
      const authUrl = await apiService.getGoogleAuthURL();
      window.open(authUrl, '_blank');
    } catch (err: any) {
      onShowToast(`Tidak dapat membuka otorisasi Google: ${err.message}`, 'error');
    }
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/20 space-y-0">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
              <HardDrive className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold text-white">
              Connected Google Drives ({accounts.length})
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Akun Google yang digabungkan ke dalam satu Storage Pool terpusat.
          </p>
        </div>

        <button
          onClick={handleAddAccount}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Drive</span>
        </button>
      </div>

      {/* Mobile Cards View (< md) */}
      <div className="md:hidden divide-y divide-zinc-800/60">
        {accounts.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <p className="text-sm font-medium text-zinc-300">Belum ada akun Google Drive terhubung.</p>
            <button
              onClick={handleAddAccount}
              className="mt-3 px-4 py-2 bg-cyan-500 text-black font-semibold text-xs rounded-xl shadow-sm"
            >
              Hubungkan Drive Sekarang
            </button>
          </div>
        ) : (
          accounts.map((acc) => {
            const capacity = acc.storage_limit || 0;
            const used = acc.storage_usage || 0;
            const available = Math.max(0, capacity - used);
            const usagePct =
              acc.usage_percent ??
              (capacity > 0 ? (used / capacity) * 100 : 0);

            const isHigh = usagePct > 85;
            const isMid = usagePct > 60;

            return (
              <div key={acc.id} className="p-4 space-y-3 bg-zinc-900/40">
                {/* Account info row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {acc.avatar_url ? (
                      <img
                        src={acc.avatar_url}
                        alt={acc.display_name}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-700/60 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-750 flex items-center justify-center text-zinc-300 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-white text-xs tracking-tight truncate">
                          {acc.display_name || 'Google Account'}
                        </p>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-zinc-400 truncate">{acc.email}</p>
                    </div>
                  </div>

                  {/* Quick Sync & Delete icons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSync(acc)}
                      disabled={syncingId === acc.id}
                      className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-750/50 rounded-xl transition disabled:opacity-50"
                      title="Sync kuota"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin text-cyan-400' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      disabled={deletingId === acc.id}
                      className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition disabled:opacity-50"
                      title="Putuskan akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Storage Meter Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-zinc-950/80 border border-zinc-800 rounded-full p-0.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isHigh ? 'bg-rose-500' : isMid ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(Math.max(usagePct, 2), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className={isHigh ? 'text-rose-400' : isMid ? 'text-amber-400' : 'text-emerald-400'}>
                      {usagePct.toFixed(1)}% Terpakai
                    </span>
                    <span className="text-zinc-400">
                      {formatBytes(used)} / {formatBytes(capacity)}
                    </span>
                  </div>
                </div>

                {/* Storage breakdown pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block uppercase font-sans">Total</span>
                    <span className="font-semibold text-zinc-200">{formatBytes(capacity)}</span>
                  </div>
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block uppercase font-sans">Used</span>
                    <span className="font-semibold text-zinc-300">{formatBytes(used)}</span>
                  </div>
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block uppercase font-sans">Free</span>
                    <span className="font-semibold text-emerald-400">{formatBytes(available)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Accounts Table (hidden on mobile < md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-zinc-950/90 text-zinc-400 font-semibold border-b border-zinc-800/80 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Account</th>
              <th className="py-3.5 px-4 font-semibold">Capacity</th>
              <th className="py-3.5 px-4 font-semibold">Used</th>
              <th className="py-3.5 px-4 font-semibold">Available</th>
              <th className="py-3.5 px-4 font-semibold">Usage Meter</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {accounts.map((acc) => {
              const capacity = acc.storage_limit || 0;
              const used = acc.storage_usage || 0;
              const available = Math.max(0, capacity - used);
              const usagePct =
                acc.usage_percent ??
                (capacity > 0 ? (used / capacity) * 100 : 0);

              const isHigh = usagePct > 85;
              const isMid = usagePct > 60;

              return (
                <tr key={acc.id} className="hover:bg-zinc-800/40 transition group">
                  {/* Account Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {acc.avatar_url ? (
                        <img
                          src={acc.avatar_url}
                          alt={acc.display_name}
                          className="w-9 h-9 rounded-xl object-cover border border-zinc-700/60 shadow-sm"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-white text-xs tracking-tight">{acc.display_name || 'Google Account'}</p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] font-sans text-zinc-400">{acc.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Total Limit */}
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-200">
                    <span className="px-2 py-0.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                      {formatBytes(capacity)}
                    </span>
                  </td>

                  {/* Used */}
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                    {formatBytes(used)}
                  </td>

                  {/* Free Storage */}
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-emerald-400">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-400">
                      {formatBytes(available)}
                    </span>
                  </td>

                  {/* Meter Bar */}
                  <td className="py-3.5 px-4 w-48">
                    <div className="space-y-1.5">
                      <div className="w-full h-2.5 bg-zinc-950/80 border border-zinc-800 rounded-full p-0.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isHigh
                              ? 'bg-rose-500'
                              : isMid
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(Math.max(usagePct, 2), 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className={isHigh ? 'text-rose-400' : isMid ? 'text-amber-400' : 'text-emerald-400'}>
                          {usagePct.toFixed(1)}% Used
                        </span>
                        <span className="text-zinc-500">
                          {formatBytes(used)} / {formatBytes(capacity)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleSync(acc)}
                        disabled={syncingId === acc.id}
                        className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-750/50 rounded-xl transition-all disabled:opacity-50"
                        title="Sync kuota dari Google Drive API"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin text-cyan-400' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(acc)}
                        disabled={deletingId === acc.id}
                        className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all disabled:opacity-50"
                        title="Putuskan akun drive ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
