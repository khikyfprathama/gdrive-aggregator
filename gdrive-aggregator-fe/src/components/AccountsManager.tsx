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

  const handleSync = async (account: Account) => {
    try {
      setSyncingId(account.id);
      await apiService.syncAccount(account.id);
      onShowToast(`Synced storage quota for ${account.email}`, 'success');
      onAccountUpdated();
    } catch (err: any) {
      onShowToast(`Failed to sync ${account.email}: ${err.message}`, 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (account: Account) => {
    if (!window.confirm(`Disconnect drive account ${account.email}?`)) {
      return;
    }

    try {
      setDeletingId(account.id);
      await apiService.deleteAccount(account.id);
      onShowToast(`Disconnected ${account.email}`, 'success');
      onAccountUpdated();
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddAccount = async () => {
    try {
      const authUrl = await apiService.getGoogleAuthURL();
      window.open(authUrl, '_blank');
    } catch (err: any) {
      onShowToast(`Could not generate OAuth link: ${err.message}`, 'error');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Header Toolbar */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            Connected Google Drives ({accounts.length})
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Individual Google accounts contributing to your unified storage pool.
          </p>
        </div>

        <button
          onClick={handleAddAccount}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Drive</span>
        </button>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 text-zinc-400 font-semibold border-b border-zinc-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-4 font-medium">Account</th>
              <th className="py-2.5 px-4 font-medium">Capacity</th>
              <th className="py-2.5 px-4 font-medium">Used</th>
              <th className="py-2.5 px-4 font-medium">Available</th>
              <th className="py-2.5 px-4 font-medium">Allocation</th>
              <th className="py-2.5 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {accounts.map((acc) => {
              const usagePct =
                acc.usage_percent ??
                (acc.storage_limit > 0 ? (acc.storage_usage / acc.storage_limit) * 100 : 0);

              return (
                <tr key={acc.id} className="hover:bg-zinc-800/40 transition">
                  {/* Account Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {acc.avatar_url ? (
                        <img
                          src={acc.avatar_url}
                          alt={acc.display_name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white text-xs">{acc.display_name || 'Google Account'}</p>
                        <p className="text-[11px] font-mono text-zinc-400">{acc.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Total Limit */}
                  <td className="py-3 px-4 font-mono text-[11px] text-white font-medium">
                    {acc.storage_limit_str || '0 B'}
                  </td>

                  {/* Used */}
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                    {acc.storage_usage_str || '0 B'}
                  </td>

                  {/* Free Storage */}
                  <td className="py-3 px-4 font-mono text-[11px] text-emerald-400 font-medium">
                    {acc.free_storage_str || '0 B'}
                  </td>

                  {/* Meter Bar */}
                  <td className="py-3 px-4 w-40">
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            usagePct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(Math.max(usagePct, 1), 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {usagePct.toFixed(1)}% allocated
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleSync(acc)}
                        disabled={syncingId === acc.id}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                        title="Sync storage from Google API"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin text-blue-400' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(acc)}
                        disabled={deletingId === acc.id}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                        title="Disconnect drive"
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
