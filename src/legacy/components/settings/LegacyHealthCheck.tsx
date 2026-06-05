"use client";

import { useLegacyStore } from "@/legacy/store/legacy-store";
import { LegacyCard } from "@/legacy/components/ui/LegacyCard";
import { LegacyBadge } from "@/legacy/components/ui/LegacyBadge";
import { LegacyButton } from "@/legacy/components/ui/LegacyButton";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function LegacyHealthCheck() {
  const { leads, conversations, appointments, memory, followUps, knowledge, lastSynced, isLoading, refreshData, error } = useLegacyStore();

  const isConnected = leads.length > 0 || lastSynced !== null;

  return (
    <LegacyCard className="mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/50 mb-6">
        <div>
          <h3 className="text-[18px] font-black text-white tracking-tight">Legacy Health Check</h3>
          <p className="text-[13px] text-slate-400 mt-1">Status of your Google Sheets & Telegram integration</p>
        </div>
        <LegacyButton variant="secondary" onClick={() => refreshData()} disabled={isLoading} className="h-9 px-4 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh Status'}
        </LegacyButton>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="bg-rose-950/40 text-rose-400 p-4 rounded-xl text-[13px] border border-rose-900/50 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Sync Error:</strong> {error}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Integrations</h4>
            
            <div className="flex items-center justify-between p-3.5 border border-slate-700/60 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-emerald-950/50 text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-900/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-slate-200">Google Sheets</p>
                  <p className="text-[12px] text-slate-500 font-medium">
                    {lastSynced ? `Synced ${formatDistanceToNow(new Date(lastSynced))} ago` : "Waiting for sync..."}
                  </p>
                </div>
              </div>
              <LegacyBadge status={isConnected ? "connected" : "pending" as any} labelOverride={isConnected ? "Connected" : "Pending"} />
            </div>

            <div className="flex items-center justify-between p-3.5 border border-slate-700/60 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-blue-950/50 text-blue-400 rounded-lg flex items-center justify-center border border-blue-900/50 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                  <BotIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-slate-200">Telegram Bot</p>
                  <p className="text-[12px] text-slate-500 font-medium">Status via V1 API</p>
                </div>
              </div>
              <LegacyBadge status="active" />
            </div>
            
            <div className="flex items-center justify-between p-3.5 border border-slate-700/60 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-violet-950/50 text-violet-400 rounded-lg flex items-center justify-center border border-violet-900/50 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-slate-200">AI Provider</p>
                  <p className="text-[12px] text-slate-500 font-medium">Configured in V2 Settings</p>
                </div>
              </div>
              <LegacyBadge status="active" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Data Synchronization</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Total Leads" count={leads.length} />
              <StatBox label="Conversations" count={conversations.length} />
              <StatBox label="Appointments" count={appointments.length} />
              <StatBox label="AI Memories" count={memory.length} />
              <StatBox label="Follow-Ups" count={followUps.length} />
              <StatBox label="Knowledge" count={knowledge.length} />
            </div>
          </div>
        </div>
      </div>
    </LegacyCard>
  );
}

function StatBox({ label, count }: { label: string; count: number }) {
  return (
    <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-center shadow-sm hover:bg-slate-800/60 hover:border-slate-600/50 transition-colors">
      <div className="text-2xl font-black text-white">{count}</div>
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function TableIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <line x1="3" x2="21" y1="9" y2="9"/>
      <line x1="3" x2="21" y1="15" y2="15"/>
      <line x1="9" x2="9" y1="9" y2="21"/>
      <line x1="15" x2="15" y1="9" y2="21"/>
    </svg>
  );
}

function BotIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 8V4H8"/>
      <rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2"/>
      <path d="M20 14h2"/>
      <path d="M15 13v2"/>
      <path d="M9 13v2"/>
    </svg>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}
