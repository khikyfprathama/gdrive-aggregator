import React from 'react';
import type { StorageOverview } from '../types';
import { Database, ShieldCheck, Zap, HardDrive } from 'lucide-react';

interface StorageHeroProps {
  overview: StorageOverview | null;
  loading: boolean;
}

export const StorageHero: React.FC<StorageHeroProps> = ({ overview, loading }) => {
  if (loading && !overview) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 animate-pulse">
        <div className="h-6 bg-slate-800 rounded-lg w-1/4 mb-4"></div>
        <div className="h-12 bg-slate-800 rounded-lg w-1/2 mb-6"></div>
        <div className="h-4 bg-slate-800 rounded-full w-full"></div>
      </div>
    );
  }

  const limitStr = overview?.total_limit_human || '0 B';
  const usageStr = overview?.total_usage_human || '0 B';
  const freeStr = overview?.total_free_human || '0 B';
  const usagePct = overview?.usage_percentage || 0;
  const count = overview?.account_count || 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
      {/* Subtle glow background */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Multi-Account Storage Pool Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Penyimpanan Teragregasi
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Menggabungkan seluruh kuota Google Drive Anda ke dalam satu wadah penyimpanan terpadu.
          </p>
        </div>

        {/* Badges / Metrics */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <Database className="w-4 h-4 text-blue-400" />
            <span><strong>{count}</strong> Akun Terhubung</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smart Auto-Routing</span>
          </div>
        </div>
      </div>

      {/* Main Storage Bar & Numbers */}
      <div className="relative z-10 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Kapasitas Pool</span>
            <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span>{limitStr}</span>
            </div>
            <p className="text-xs text-slate-500">Kombinasi {count} akun Google</p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Sisa Ruang Bebas</span>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {freeStr}
            </div>
            <p className="text-xs text-slate-500">Tersedia untuk upload file baru</p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sudah Terpakai</span>
            <div className="text-3xl font-black text-slate-300 tracking-tight">
              {usageStr}
            </div>
            <p className="text-xs text-slate-500">{usagePct.toFixed(2)}% dari total pool</p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              Tingkat Penggunaan Pool
            </span>
            <span className="font-semibold text-slate-200">{usagePct.toFixed(2)}%</span>
          </div>

          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-700 shadow-lg shadow-blue-500/30"
              style={{ width: `${Math.min(Math.max(usagePct, 1), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
