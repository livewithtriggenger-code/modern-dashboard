import * as React from "react"
import { Loader2, AlertCircle } from "lucide-react"

export type LegacyBadgeStatus = 'connected' | 'not_connected' | 'error' | 'testing' | 'active' | string

export function LegacyBadge({ status, labelOverride }: { status: LegacyBadgeStatus, labelOverride?: string }) {
  if (status === 'testing') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-900/40 border border-blue-500/30 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.2)] backdrop-blur-md">
        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{labelOverride || 'Testing'}</span>
      </div>
    );
  }
  
  if (status === 'connected' || status === 'active') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/30 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.2)] backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
        </span>
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{labelOverride || status}</span>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950/40 border border-rose-500/30 shadow-[0_2px_8px_-2px_rgba(244,63,94,0.2)] backdrop-blur-md">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{labelOverride || 'Error'}</span>
      </div>
    );
  }

  // Handle generic CRM Lead statuses
  const displayStatus = labelOverride || status || 'Not Connected';
  
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/60 shadow-sm backdrop-blur-md">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{displayStatus === 'not_connected' ? 'Not Connected' : displayStatus}</span>
    </div>
  );
}
