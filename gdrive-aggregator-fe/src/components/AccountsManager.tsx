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
    <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl overflow-hidden shadow-[5px_5px_0px_0px_#000000] space-y-0">
      {/* Header Toolbar Neo-Brutalist */}
      <div className="p-4 sm:p-5 border-b-2 border-zinc-700 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-400 text-black rounded border border-black shadow-[2px_2px_0px_0px_#000]">
              <HardDrive className="w-4 h-4 stroke-[2.5]" />
            </span>
            <h3 className="text-sm font-black tracking-wide uppercase text-white">
              Connected Google Drives ({accounts.length})
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Akun Google yang digabungkan ke dalam satu Storage Pool terpusat.
          </p>
        </div>

        <button
          onClick={handleAddAccount}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Connect Drive</span>
        </button>
      </div>

      {/* Mobile Cards View (< md) */}
      <div className="md:hidden divide-y-2 divide-zinc-800">
        {accounts.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <p className="text-sm font-bold">Belum ada akun Google Drive terhubung.</p>
            <button
              onClick={handleAddAccount}
              className="mt-3 px-4 py-2 bg-cyan-400 text-black font-black uppercase text-xs rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000]"
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
              <div key={acc.id} className="p-4 space-y-3 bg-zinc-900/60">
                {/* Account info row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {acc.avatar_url ? (
                      <img
                        src={acc.avatar_url}
                        alt={acc.display_name}
                        className="w-10 h-10 rounded-lg object-cover border-2 border-zinc-600 shadow-[2px_2px_0px_0px_#000] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-300 shadow-[2px_2px_0px_0px_#000] shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-white text-xs tracking-tight truncate">
                          {acc.display_name || 'Google Account'}
                        </p>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400 truncate">{acc.email}</p>
                    </div>
                  </div>

                  {/* Quick Sync & Delete icons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSync(acc)}
                      disabled={syncingId === acc.id}
                      className="p-2 text-zinc-300 hover:text-white bg-zinc-800 border-2 border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition disabled:opacity-50"
                      title="Sync kuota"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin text-cyan-400' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      disabled={deletingId === acc.id}
                      className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 border-2 border-rose-500/40 rounded-lg shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition disabled:opacity-50"
                      title="Putuskan akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Storage Meter Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-zinc-950 border-2 border-zinc-700 rounded-sm p-0.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-[1px] ${
                        isHigh ? 'bg-rose-500' : isMid ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(Math.max(usagePct, 2), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold">
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
                  <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase">Total</span>
                    <span className="font-bold text-zinc-200">{formatBytes(capacity)}</span>
                  </div>
                  <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase">Used</span>
                    <span className="font-bold text-zinc-300">{formatBytes(used)}</span>
                  </div>
                  <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase">Free</span>
                    <span className="font-bold text-emerald-400">{formatBytes(available)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Accounts Table (hidden on mobile < md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950 text-zinc-400 font-mono font-bold border-b-2 border-zinc-700 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4">Capacity</th>
              <th className="py-3 px-4">Used</th>
              <th className="py-3 px-4">Available</th>
              <th className="py-3 px-4">Usage Meter</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-zinc-800 text-zinc-300">
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
                <tr key={acc.id} className="hover:bg-zinc-800/60 transition group">
                  {/* Account Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {acc.avatar_url ? (
                        <img
                          src={acc.avatar_url}
                          alt={acc.display_name}
                          className="w-9 h-9 rounded-lg object-cover border-2 border-zinc-600 shadow-[2px_2px_0px_0px_#000]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-300 shadow-[2px_2px_0px_0px_#000]">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-white text-xs tracking-tight">{acc.display_name || 'Google Account'}</p>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400">{acc.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Total Limit */}
                  <td className="py-3.5 px-4 font-mono text-xs text-white font-bold">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">
                      {formatBytes(capacity)}
                    </span>
                  </td>

                  {/* Used */}
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-300 font-semibold">
                    {formatBytes(used)}
                  </td>

                  {/* Free Storage */}
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-400">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400">
                      {formatBytes(available)}
                    </span>
                  </td>

                  {/* Meter Bar Neo-Brutalist */}
                  <td className="py-3.5 px-4 w-48">
                    <div className="space-y-1.5">
                      <div className="w-full h-3 bg-zinc-950 border-2 border-zinc-700 rounded-sm p-0.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-[1px] ${
                            isHigh
                              ? 'bg-rose-500'
                              : isMid
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(Math.max(usagePct, 2), 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold">
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
                        className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border-2 border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                        title="Sync kuota dari Google Drive API"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin text-cyan-400' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(acc)}
                        disabled={deletingId === acc.id}
                        className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/40 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
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
