"use client";

import { useState, useMemo } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MemoryCardSkeleton } from "@/legacy/components/ui/LegacySkeletons";
import {
  Search,
  Brain,
  X,
  ArrowRight,
  DollarSign,
  Target,
  Zap,
  Building2,
} from "lucide-react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

const TARGET_MEMORY_TYPES = ["business_type", "budget", "intent", "urgency"] as const;
type TargetMemoryType = typeof TARGET_MEMORY_TYPES[number];

interface LeadMemorySummary {
  leadId: string;
  leadName: string;
  leadScore: number;
  businessTypeFromLead: string;
  sourceFromLead: string;
  memories: Partial<Record<TargetMemoryType, string>>;
  lastUpdated: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLatestValue(rows: { memoryValue: string; lastUpdated: string }[]): string {
  if (!rows.length) return "";
  return rows
    .slice()
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0]
    .memoryValue;
}

/** Convert snake_case or raw strings into Title Case */
function humanize(value: string): string {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Score → gradient color class */
function scoreColor(score: number): string {
  if (score >= 8) return "from-emerald-500 to-teal-500 shadow-emerald-500/20";
  if (score >= 5) return "from-amber-400 to-orange-400 shadow-orange-500/20";
  return "from-rose-400 to-red-400 shadow-rose-500/20";
}

/** Urgency color config */
function urgencyConfig(value: string): { bg: string; text: string; dot: string; border: string } {
  const v = value.toLowerCase();
  if (v === "urgent" || v === "high")
    return { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-500", border: "border-rose-500/20" };
  if (v === "medium")
    return { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", border: "border-amber-500/20" };
  return { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-400", border: "border-slate-500/20" };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LegacyMemoryPage() {
  const { memory, leads, isLoading } = useLegacyStore();
  const [search, setSearch] = useState("");

  const leadsMap = useMemo(() => {
    const map: Record<string, typeof leads[0]> = {};
    leads.forEach(l => { 
      map[l.id] = l; 
      // Fallback mapping via conversationId
      if (l.conversationId) map[l.conversationId] = l;
    });
    return map;
  }, [leads]);

  const summaries: LeadMemorySummary[] = useMemo(() => {
    const byLead: Record<string, typeof memory> = {};
    memory.forEach(m => {
      if (!m.leadId) return;
      if (!byLead[m.leadId]) byLead[m.leadId] = [];
      byLead[m.leadId].push(m);
    });

    return Object.entries(byLead).map(([leadId, rows]) => {
      const lead = leadsMap[leadId];
      const resolvedMemories: Partial<Record<TargetMemoryType, string>> = {};
      
      TARGET_MEMORY_TYPES.forEach(type => {
        const matching = rows.filter(r => (r.memoryType || "").toLowerCase().trim() === type);
        if (matching.length > 0) resolvedMemories[type] = getLatestValue(matching);
      });

      const lastUpdated = rows
        .map(r => r.lastUpdated || "")
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || "";

      return {
        leadId,
        leadName: lead?.fullName || leadId,
        leadScore: lead?.leadScore ?? 0,
        businessTypeFromLead: lead?.businessType || "",
        sourceFromLead: lead?.source || "",
        memories: resolvedMemories,
        lastUpdated,
      };
    }).sort((a, b) => b.leadScore - a.leadScore);
  }, [memory, leadsMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return summaries;
    const q = search.toLowerCase();
    return summaries.filter(s =>
      s.leadName.toLowerCase().includes(q) ||
      s.leadId.toLowerCase().includes(q) ||
      (s.businessTypeFromLead || "").toLowerCase().includes(q) ||
      (s.memories.intent || "").toLowerCase().includes(q) ||
      (s.memories.business_type || "").toLowerCase().includes(q)
    );
  }, [summaries, search]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header & Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-white leading-none">AI Memory</h1>
          <p className="text-sm text-slate-500 mt-2">Extracted insights from lead conversations.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-[#0B0F19]/80 border border-slate-800 rounded-lg px-4 py-2 shadow-sm text-[13px] text-slate-400 h-9 whitespace-nowrap">
            <Brain className="h-4 w-4 text-blue-500" />
            <span><strong className="text-white font-semibold">{filtered.length}</strong> leads with AI memory</span>
          </div>
          <div className="flex items-center w-full sm:w-[280px] h-9 bg-[#0B0F19] border border-slate-800 rounded-lg shadow-sm focus-within:ring-1 focus-within:ring-blue-500/40 transition-all px-3 gap-2">
            <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search lead, business type, intent…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-full bg-transparent text-[13px] text-white placeholder:text-slate-500 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-300 cursor-pointer shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Skeleton loading state */}
      {isLoading && memory.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <MemoryCardSkeleton key={i} />)}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center border border-slate-800 rounded-xl bg-[#0B0F19]/30">
            <div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <Brain className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-base font-semibold text-white">No memory records found</p>
            <p className="text-sm text-slate-500 mt-1">
              {search ? "Try a different search term." : "AI memory records will appear once leads engage."}
            </p>
          </div>
        ) : (
          filtered.map(summary => {
            const { leadId, leadName, leadScore, businessTypeFromLead, memories: mems } = summary;
            const displayBizType = mems.business_type || businessTypeFromLead || "—";
            const budget   = mems.budget   || null;
            const intent   = mems.intent   || null;
            const urgency  = mems.urgency  || null;
            const urg      = urgency ? urgencyConfig(urgency) : null;
            const gradient = scoreColor(leadScore);

            return (
              <div
                key={leadId}
                className="group relative flex flex-col bg-[#0B0F19]/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all duration-300 overflow-hidden shadow-sm"
              >
                {/* Top accent strip */}
                <div className={cn("h-[3px] w-full bg-gradient-to-r", gradient)} />

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex items-start gap-4 px-5 pt-5 pb-4">
                  <Avatar className="h-12 w-12 border border-slate-800 rounded-full flex items-center justify-center bg-slate-900 shrink-0">
                    <span className="text-sm font-semibold text-white">{leadName.substring(0, 2).toUpperCase()}</span>
                  </Avatar>

                  <div className="flex-1 min-w-0 flex flex-col pt-1">
                    <h3 className="text-base font-semibold text-white tracking-tight leading-tight truncate group-hover:text-blue-400 transition-colors">
                      {leadName}
                    </h3>
                    <p className="text-[12px] text-slate-500 font-medium mt-1.5 truncate capitalize">
                      {displayBizType}
                    </p>
                  </div>

                  {/* Score badge */}
                  <div className={cn(
                    "flex flex-col items-center justify-center h-12 w-12 rounded-[10px] bg-gradient-to-br shrink-0 shadow-lg",
                    gradient
                  )}>
                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest leading-none mt-0.5">Score</span>
                    <span className="text-[18px] font-black text-white leading-none mt-1">{leadScore}</span>
                  </div>
                </div>

                {/* ── Divider ─────────────────────────────────────────────── */}
                <div className="mx-5 h-px bg-slate-800/60" />

                {/* ── 2-Column Memory Grid */}
                <div className="px-5 py-5 grid grid-cols-2 gap-x-4 gap-y-5 flex-1">

                  {/* Business Type */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Business Type
                    </p>
                    <p className="text-[13px] font-semibold text-slate-300 leading-snug truncate capitalize">{displayBizType}</p>
                  </div>

                  {/* Budget */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Budget
                    </p>
                    {budget ? (
                      <p className="text-[13px] font-bold text-emerald-400 leading-snug truncate">{budget}</p>
                    ) : (
                      <p className="text-[12px] text-slate-600 italic truncate">Not Available</p>
                    )}
                  </div>

                  {/* Intent */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                      <Target className="h-3 w-3" /> Intent
                    </p>
                    {intent ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-[6px] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold leading-none truncate max-w-full">
                          {humanize(intent)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[12px] text-slate-600 italic truncate">Not Available</p>
                    )}
                  </div>

                  {/* Urgency */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Urgency
                    </p>
                    {urgency && urg ? (
                      <div>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] border text-[11px] font-bold leading-none truncate max-w-full",
                          urg.bg, urg.text, urg.border
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", urg.dot)} />
                          {humanize(urgency)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[12px] text-slate-600 italic truncate">Not Available</p>
                    )}
                  </div>
                </div>

                {/* ── Footer ──────────────────────────────────────────────── */}
                <div className="mx-5 h-px bg-slate-800/60" />
                <div className="flex items-center justify-end px-5 py-4 mt-auto">
                  <Link
                    href={`/legacy/conversations?leadId=${leadId}`}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-blue-500 hover:text-blue-400 transition-colors group/link"
                  >
                    View Conversation
                    <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
      )} {/* end isLoading/skeleton check */}
    </div>
  );
}
