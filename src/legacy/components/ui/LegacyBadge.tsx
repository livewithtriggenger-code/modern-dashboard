import * as React from "react"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export type LegacyBadgeStatus = 'connected' | 'not_connected' | 'error' | 'testing' | 'active'

export function LegacyBadge({ status, labelOverride }: { status: LegacyBadgeStatus, labelOverride?: string }) {
  if (status === 'testing') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.15)] backdrop-blur-md">
        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{labelOverride || 'Testing'}</span>
      </div>
    );
  }
  
  if (status === 'connected' || status === 'active') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.15)] backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">{labelOverride || status}</span>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50/80 border border-rose-200/60 shadow-[0_2px_8px_-2px_rgba(244,63,94,0.15)] backdrop-blur-md">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">{labelOverride || 'Error'}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60 shadow-sm backdrop-blur-md">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{labelOverride || 'Not Connected'}</span>
    </div>
  );
}
