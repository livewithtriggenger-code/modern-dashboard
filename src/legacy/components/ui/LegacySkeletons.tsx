"use client";

import { cn } from "@/lib/utils";

// Base shimmer element
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn(
      "animate-pulse rounded-lg bg-slate-800/60",
      className
    )} style={style} />
  );
}

// Full KPI card skeleton
export function KPICardSkeleton() {
  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
      <Skeleton className="h-9 w-16 mt-1" />
      <Skeleton className="h-3 w-32 mt-2" />
    </div>
  );
}

// Chart panel skeleton
export function ChartPanelSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="mt-2" style={{ height }}>
        <div className="h-full w-full flex items-end gap-2 pb-4 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-sm"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="h-[72px] border-b border-slate-800/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          {i === 0 ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ) : (
            <Skeleton className="h-3 w-20" />
          )}
        </td>
      ))}
    </tr>
  );
}

// Lead table skeleton (full)
export function LeadsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-[#0B0F19]/60 border border-slate-800/80 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64 rounded-xl" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800/30 border-b border-slate-800">
            {["Lead", "Company", "Score", "Status", "Date"].map(h => (
              <th key={h} className="px-6 py-3">
                <Skeleton className="h-2.5 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={5} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Memory card skeleton
export function MemoryCardSkeleton() {
  return (
    <div className="bg-[#0B0F19]/50 border border-slate-800/80 rounded-xl overflow-hidden">
      <div className="h-[3px] bg-slate-800 animate-pulse" />
      <div className="flex items-center gap-4 px-5 pt-5 pb-4">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
      </div>
      <div className="mx-5 h-px bg-slate-800/60" />
      <div className="px-5 py-5 grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Appointment card skeleton
export function AppointmentCardSkeleton() {
  return (
    <div className="bg-[#0B0F19]/60 border border-slate-800/80 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

// Chat list skeleton
export function ChatListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-slate-800/40">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Analytics KPI row skeleton
export function AnalyticsKPISkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-4`}>
      {Array.from({ length: cols }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}
