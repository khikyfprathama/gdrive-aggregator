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
    <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-4 sm:p-5 shadow-[5px_5px_0px_0px_#000000]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Overall Capacity Indicator */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-cyan-400 border-2 border-black flex items-center justify-center shrink-0 text-black shadow-[3px_3px_0px_0px_#000]">
            <HardDrive className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono">
                Storage Pool
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-400 text-black border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                {count} Drives Connected
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">{freeStr}</span>
              <span className="text-xs font-mono font-semibold text-zinc-400">free of {limitStr}</span>
            </div>
          </div>
        </div>

        {/* Middle: Neo-Brutalist Storage Meter */}
        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-xs text-zinc-300 mb-1.5 font-mono font-bold">
            <span className="text-cyan-400">Used: {usageStr} ({usagePct.toFixed(1)}%)</span>
            <span className="text-emerald-400">Free: {freeStr}</span>
          </div>
          <div className="w-full h-3.5 bg-zinc-950 border-2 border-zinc-700 rounded-sm p-0.5 overflow-hidden shadow-[2px_2px_0px_0px_#000]">
            <div
              className="h-full bg-cyan-400 transition-all duration-300 rounded-[1px]"
              style={{ width: `${Math.min(Math.max(usagePct, 0.5), 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Operational Status */}
        <div className="flex items-center gap-2.5 self-start lg:self-center border-t-2 lg:border-t-0 border-zinc-800 pt-3 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-2 border-zinc-700 text-xs font-mono font-semibold shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Server className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono text-[11px]">{serverUrl.replace(/^https?:\/\//, '')}</span>
            <span className={`w-2.5 h-2.5 rounded-full border border-black ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
          </button>

          <a
            href={`${serverUrl}/swagger/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-2 border-zinc-700 text-xs font-mono font-semibold shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <span>API Docs</span>
            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
          </a>
        </div>
      </div>
    </div>
  );
};
