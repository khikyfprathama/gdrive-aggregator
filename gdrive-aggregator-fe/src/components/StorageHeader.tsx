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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Overall Capacity Indicator */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Storage Pool
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {count} Drives Connected
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold tracking-tight text-white">{freeStr}</span>
              <span className="text-xs text-zinc-400">free of {limitStr}</span>
            </div>
          </div>
        </div>

        {/* Middle: Minimal Storage Meter */}
        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
            <span>Used: {usageStr} ({usagePct.toFixed(1)}%)</span>
            <span>Free: {freeStr}</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(Math.max(usagePct, 0.5), 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Operational Status */}
        <div className="flex items-center gap-3 self-start lg:self-center border-t lg:border-t-0 border-zinc-800 pt-3 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50 text-xs transition"
          >
            <Server className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono text-[11px]">{serverUrl.replace(/^https?:\/\//, '')}</span>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          </button>

          <a
            href={`${serverUrl}/swagger/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <span>API Docs</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
