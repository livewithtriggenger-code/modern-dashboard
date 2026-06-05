import * as React from "react"
import { cn } from "@/lib/utils"

export type LegacyBadgeStatus = 'connected' | 'not_connected' | 'error' | 'testing' | 'active' | string

// Map of CRM lead statuses to semantic colors
const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  active:        { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400" },
  connected:     { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400" },
  won:           { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400" },
  converted:     { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400" },
  client:        { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400" },
  customer:      { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400" },
  qualified:     { bg: "bg-blue-500/10",    border: "border-blue-500/25",    text: "text-blue-400",    dot: "bg-blue-400" },
  interested:    { bg: "bg-blue-500/10",    border: "border-blue-500/25",    text: "text-blue-400",    dot: "bg-blue-400" },
  new:           { bg: "bg-purple-500/10",  border: "border-purple-500/25",  text: "text-purple-400",  dot: "bg-purple-400" },
  lead:          { bg: "bg-purple-500/10",  border: "border-purple-500/25",  text: "text-purple-400",  dot: "bg-purple-400" },
  prospect:      { bg: "bg-purple-500/10",  border: "border-purple-500/25",  text: "text-purple-400",  dot: "bg-purple-400" },
  cold:          { bg: "bg-slate-500/10",   border: "border-slate-500/25",   text: "text-slate-400",   dot: "bg-slate-500" },
  lost:          { bg: "bg-rose-500/10",    border: "border-rose-500/25",    text: "text-rose-400",    dot: "bg-rose-400" },
  closed:        { bg: "bg-rose-500/10",    border: "border-rose-500/25",    text: "text-rose-400",    dot: "bg-rose-400" },
  disqualified:  { bg: "bg-rose-500/10",    border: "border-rose-500/25",    text: "text-rose-400",    dot: "bg-rose-400" },
  error:         { bg: "bg-rose-500/10",    border: "border-rose-500/25",    text: "text-rose-400",    dot: "bg-rose-400" },
  not_connected: { bg: "bg-slate-800/50",   border: "border-slate-700/50",   text: "text-slate-400",   dot: "bg-slate-600" },
  nurturing:     { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-400",   dot: "bg-amber-400" },
  follow_up:     { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-400",   dot: "bg-amber-400" },
  pending:       { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-400",   dot: "bg-amber-400" },
};

function getConfig(status: string) {
  const key = (status || "").toLowerCase().trim().replace(/[- ]/g, "_");
  return STATUS_CONFIG[key] ?? { bg: "bg-slate-800/50", border: "border-slate-700/50", text: "text-slate-400", dot: "bg-slate-500" };
}

export function LegacyBadge({ status, labelOverride }: { status: LegacyBadgeStatus; labelOverride?: string }) {
  const cfg = getConfig(status);
  const label = labelOverride || status || "Unknown";
  const displayLabel = label === "not_connected" ? "Not Connected" 
    : label.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // Pulsing dot for active/connected
  const isLive = ["active", "connected"].includes((status || "").toLowerCase().trim());

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
      cfg.bg, cfg.border, cfg.text
    )}>
      {isLive ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", cfg.dot)} />
          <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", cfg.dot)} />
        </span>
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      )}
      {displayLabel}
    </div>
  );
}
