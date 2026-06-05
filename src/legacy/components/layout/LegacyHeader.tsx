"use client";

import { useLegacyStore } from "@/legacy/store/legacy-store";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Loader2 } from "lucide-react";
import { LegacyButton } from "@/legacy/components/ui/LegacyButton";

export function LegacyHeader() {
  const { lastSynced, isLoading, refreshData } = useLegacyStore();

  return (
    <header className="h-16 border-b border-slate-800/60 bg-[#0B0F19]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
      <div>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Google Sheets Sync</h2>
        <div className="text-[13px] text-slate-300 font-medium mt-0.5">
          {lastSynced ? (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              Synced {formatDistanceToNow(new Date(lastSynced))} ago
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Not synced yet
            </span>
          )}
        </div>
      </div>

      <LegacyButton
        variant="secondary"
        onClick={() => refreshData()}
        disabled={isLoading}
        className="h-8 px-4 text-xs font-semibold rounded-lg"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        {isLoading ? "Syncing..." : "Sync Database"}
      </LegacyButton>
    </header>
  );
}
