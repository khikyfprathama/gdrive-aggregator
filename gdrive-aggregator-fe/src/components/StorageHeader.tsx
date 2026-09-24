import React from 'react';
import type { StorageOverview } from '../types';
import { Server, HardDrive, ArrowUpRight } from 'lucide-react';

interface StorageHeaderProps {
  overview: StorageOverview | null;
  serverUrl: string;
  isOnline: boolean;
  onOpenSettings: () => void;
}

export const StorageHeader: React.FC<StorageHeaderProps> = ({
  overview,
  serverUrl,
  isOnline,
  onOpenSettings,
}) => {
  const limitStr = overview?.total_limit_human || '0 B';
  const usageStr = overview?.total_usage_human || '0 B';
  const freeStr = overview?.total_free_human || '0 B';
  const usagePct = overview?.usage_percentage || 0;
  const count = overview?.account_count || 0;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-sm transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Overall Capacity Indicator */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 shadow-inner">
            <HardDrive className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Storage Pool
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {count} Drives Connected
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {freeStr}
              </span>
              <span className="text-xs font-medium text-zinc-400">
                tersedia dari {limitStr} total
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Modern Storage Meter */}
        <div className="w-full lg:max-w-md">
          <div className="flex justify-between text-xs text-zinc-300 mb-2 font-medium">
            <span className="text-cyan-400">Terpakai: {usageStr} ({usagePct.toFixed(1)}%)</span>
            <span className="text-emerald-400">Sisa: {freeStr}</span>
          </div>
          <div className="w-full h-3 bg-zinc-800/80 rounded-full p-0.5 overflow-hidden border border-zinc-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(Math.max(usagePct, 0.5), 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Operational Status */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center border-t lg:border-t-0 border-zinc-800/80 pt-3 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750/70 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Configure Server URL"
          >
            <Server className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-mono text-[11px] truncate max-w-[140px] sm:max-w-[180px]">
              {serverUrl.replace(/^https?:\/\//, '')}
            </span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
              }`}
            />
          </button>

          <a
            href={`${serverUrl}/swagger/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750/70 text-xs font-medium transition-all shadow-sm shrink-0"
          >
            <span>Swagger API</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
