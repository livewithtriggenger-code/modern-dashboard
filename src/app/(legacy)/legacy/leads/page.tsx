"use client";

import { useState, useMemo } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { LegacyCard } from "@/legacy/components/ui/LegacyCard";
import { LegacyBadge } from "@/legacy/components/ui/LegacyBadge";
import { LegacySlideOver } from "@/legacy/components/ui/LegacySlideOver";
import { LeadsTableSkeleton } from "@/legacy/components/ui/LegacySkeletons";
import { Search, ChevronRight, MessageSquare, Brain, Calendar, CheckCircle2, Activity, AlertCircle, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Format date helper
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
  } catch (e) {
    return dateStr;
  }
}

// Initials helper
const getInitials = (name: string) => {
  if (!name) return "NA";
  return name.trim().split(" ").filter(Boolean).map((n) => n[0].toUpperCase()).slice(0, 2).join("");
};

export default function LegacyLeadsPage() {
  const { leads, memory, isLoading } = useLegacyStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Deterministic avatar gradient per name
  const AVATAR_GRADIENTS = [
    "from-blue-600 to-indigo-600",
    "from-purple-600 to-violet-600",
    "from-emerald-600 to-teal-600",
    "from-rose-600 to-pink-600",
    "from-amber-600 to-orange-600",
    "from-cyan-600 to-sky-600",
  ];
  const getAvatarGradient = (name: string) => {
    const idx = (name || "A").charCodeAt(0) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[idx];
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => 
      lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.businessType || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // V1 Logic Parity implementations
  const getQualificationLevel = (score: number) => {
    if (score >= 8) return "High";
    if (score >= 5) return "Medium";
    return "Low";
  };

  const getDerivedIntent = (lead: any): string => {
    return lead.intent || "Not Available";
  };

  const getDerivedPriority = (score: number): string => {
    if (score >= 8) return "High";
    if (score >= 5) return "Medium";
    return "Low";
  };

  const renderScoreBar = (score: number) => {
    let barColor = "bg-rose-500";
    if (score >= 8) barColor = "bg-emerald-500";
    else if (score >= 5) barColor = "bg-amber-500";

    return (
      <div className="flex items-center gap-3 w-full max-w-[120px] select-none">
        <div className="h-1.5 w-[64px] bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barColor)}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
        <span
          className={cn(
            "font-mono text-[13px] font-bold tabular-nums shrink-0",
            score >= 8 ? "text-emerald-400" : score >= 5 ? "text-amber-400" : "text-rose-400",
          )}
        >
          {score}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-black tracking-tight text-white leading-none">Leads Pipeline</h1>
        <p className="text-sm text-slate-500 mt-2">Manage, qualify, and track your active sales pipeline.</p>
      </div>

      {isLoading && leads.length === 0 ? (
        <LeadsTableSkeleton rows={8} />
      ) : (
        <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-white">All Leads</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">{filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} found</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-10 pr-4 bg-slate-800/50 border border-slate-700/50 rounded-lg text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>


        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 h-[44px]">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lead</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company & Source</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeadId === lead.id;
                return (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={cn(
                      "h-[68px] cursor-pointer transition-all duration-150 hover:bg-slate-800/30",
                      isSelected && "bg-slate-800/50 border-l-2 border-l-blue-500"
                    )}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-[12px] font-bold text-white shrink-0", getAvatarGradient(lead.fullName))}>
                          {getInitials(lead.fullName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-slate-100 leading-tight">{lead.fullName}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">{lead.email || `ID: ${lead.id}`}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-300 leading-tight">{lead.businessType || "—"}</span>
                        <span className="text-[11px] text-slate-500 capitalize mt-0.5">{lead.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {renderScoreBar(lead.leadScore)}
                    </td>
                    <td className="px-6 py-3">
                      <LegacyBadge status={lead.status as any} />
                    </td>
                    <td className="px-6 py-3 text-[13px] text-slate-400">{formatDate(lead.createdDate)}</td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700">
                        <Users className="h-7 w-7 text-slate-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-slate-300">{searchTerm ? "No leads match your search" : "No leads yet"}</p>
                        <p className="text-sm text-slate-500 mt-1">{searchTerm ? "Try a different search term." : "Leads will appear here once synced."}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )} {/* end isLoading check */}

      {/* LEAD DETAIL DRAWER - V1 Parity */}
      <LegacySlideOver
        isOpen={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        width="max-w-[460px]"
        showHeader={false}
      >
        {selectedLead && (
          <div className="flex flex-col h-full bg-[#0B0F19] text-white">
            {/* Custom Dark Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-700/50 bg-[#131B2B]">
              <span className="text-[14px] font-bold tracking-tight text-white">Lead Details</span>
              <button
                onClick={() => setSelectedLeadId(null)}
                className="h-8 w-8 rounded-full border border-slate-700 hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              
              {/* SECTION 1: PROFILE HEADER */}
              <div className="bg-[#131B2B] rounded-[20px] p-6 border border-slate-700/50 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[28px] font-black text-white shadow-lg mb-4">
                  {getInitials(selectedLead.fullName)}
                </div>
                <h3 className="text-[18px] font-black tracking-tight text-white">{selectedLead.fullName || "Not Available"}</h3>
                <p className="text-[12px] text-slate-400 mb-4 font-medium uppercase tracking-wider">Lead ID: {selectedLead.id}</p>
                <div className="flex items-center gap-2">
                  <LegacyBadge status={selectedLead.status as any} />
                  <span className="bg-slate-800 text-slate-300 border border-slate-700/50 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                    Score {selectedLead.leadScore}
                  </span>
                </div>
              </div>

              {/* SECTION 2: QUICK ACTIONS */}
              <div className="flex flex-col gap-3">
                <Link href={`/legacy/conversations?leadId=${selectedLead.id}`} className="block">
                  <div className="flex items-center h-[52px] px-4 bg-[#131B2B] border border-slate-700/50 rounded-[14px] hover:bg-slate-800/60 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                    <div className="w-8 h-8 rounded-[10px] bg-blue-500/10 flex items-center justify-center mr-3">
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-200">View Conversations</span>
                    <ChevronRight className="absolute right-4 h-4 w-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

                <Link href={`/legacy/memory?leadId=${selectedLead.id}`} className="block">
                  <div className="flex items-center h-[52px] px-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-[14px] hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all group relative overflow-hidden">
                    <div className="w-8 h-8 rounded-[10px] bg-white/10 flex items-center justify-center mr-3">
                      <Brain className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-[13px] font-bold text-white">View AI Memory</span>
                    <ChevronRight className="absolute right-4 h-4 w-4 text-indigo-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

                <Link href={`/legacy/appointments?leadId=${selectedLead.id}`} className="block">
                  <div className="flex items-center h-[52px] px-4 bg-[#131B2B] border border-slate-700/50 rounded-[14px] hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all group relative overflow-hidden">
                    <div className="w-8 h-8 rounded-[10px] bg-emerald-500/10 flex items-center justify-center mr-3">
                      <Calendar className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-200">Schedule Appointment</span>
                    <ChevronRight className="absolute right-4 h-4 w-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>

              {/* SECTION 3: LEAD SNAPSHOT */}
              <div className="bg-[#131B2B] border border-slate-700/50 rounded-[20px] p-6">
                <h4 className="text-[13px] font-black text-white tracking-tight uppercase mb-4 pl-1">Lead Snapshot</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-[12px] p-3 h-[72px] flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company</span>
                    <span className="text-[13px] font-bold text-slate-200 mt-1 truncate w-full">{selectedLead.businessType || "—"}</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-[12px] p-3 h-[72px] flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source</span>
                    <span className="text-[13px] font-bold text-slate-200 mt-1 capitalize">{selectedLead.source || "—"}</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-[12px] p-3 h-[72px] flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</span>
                    <div className="mt-1"><LegacyBadge status={selectedLead.status as any} /></div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-[12px] p-3 h-[72px] flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
                    <span className={cn("text-[18px] font-black mt-0.5", selectedLead.leadScore >= 8 ? "text-emerald-400" : selectedLead.leadScore >= 5 ? "text-amber-400" : "text-rose-400")}>
                      {selectedLead.leadScore}
                    </span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-[12px] p-3 h-[72px] flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created Date</span>
                    <span className="text-[12px] font-bold text-slate-300 mt-1">{formatDate(selectedLead.createdDate)}</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-[12px] p-3 h-[72px] flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Activity</span>
                    <span className="text-[12px] font-bold text-slate-300 mt-1">{formatDate(selectedLead.lastContactTime || selectedLead.createdDate)}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: LEAD INTELLIGENCE */}
              <div className="bg-[#131B2B] border border-slate-700/50 rounded-[20px] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-700/50 bg-indigo-950/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-[15px] font-black text-white tracking-tight">Lead Intelligence</h3>
                  </div>
                  <p className="text-[12px] text-slate-400 font-medium">AI-powered analysis of CRM activity & engagement.</p>
                </div>

                <div className="p-6">
                  {/* Integrated Health Score Dial */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-[100px] h-[100px] flex-shrink-0 mx-auto">
                      <svg className="w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="16" fill="none" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(selectedLead.leadScore / 10) * 100}, 100`}
                          className={cn(
                            "transition-all duration-1000",
                            selectedLead.leadScore >= 8 ? "stroke-emerald-500" : selectedLead.leadScore >= 5 ? "stroke-amber-500" : "stroke-rose-500"
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn("text-[32px] font-black leading-none", selectedLead.leadScore >= 8 ? "text-emerald-400" : selectedLead.leadScore >= 5 ? "text-amber-400" : "text-rose-400")}>
                          {selectedLead.leadScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Qualification */}
                    <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                      <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0", selectedLead.leadScore >= 8 ? "bg-emerald-500/10" : selectedLead.leadScore >= 5 ? "bg-amber-500/10" : "bg-rose-500/10")}>
                        <CheckCircle2 className={cn("h-5 w-5", selectedLead.leadScore >= 8 ? "text-emerald-400" : selectedLead.leadScore >= 5 ? "text-amber-400" : "text-rose-400")} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Qualification</div>
                        <div className="text-[13px] font-bold text-slate-200">{getQualificationLevel(selectedLead.leadScore)} Confidence</div>
                      </div>
                      <div className={cn("text-[13px] font-black", selectedLead.leadScore >= 8 ? "text-emerald-400" : selectedLead.leadScore >= 5 ? "text-amber-400" : "text-rose-400")}>
                        {getQualificationLevel(selectedLead.leadScore)}
                      </div>
                    </div>

                    {/* Intent Level */}
                    <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                      <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0", getDerivedIntent(selectedLead) === "high" || getDerivedIntent(selectedLead) === "urgent" ? "bg-orange-500/10" : getDerivedIntent(selectedLead) === "medium" ? "bg-blue-500/10" : "bg-slate-500/10")}>
                        <Activity className={cn("h-5 w-5", getDerivedIntent(selectedLead) === "high" || getDerivedIntent(selectedLead) === "urgent" ? "text-orange-400" : getDerivedIntent(selectedLead) === "medium" ? "text-blue-400" : "text-slate-400")} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Intent Level</div>
                        <div className="text-[13px] font-bold text-slate-200 capitalize">{getDerivedIntent(selectedLead).replace(/_/g, " ")}</div>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                      <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0", getDerivedPriority(selectedLead.leadScore) === "High" ? "bg-rose-500/10" : getDerivedPriority(selectedLead.leadScore) === "Medium" ? "bg-amber-500/10" : "bg-blue-500/10")}>
                        <AlertCircle className={cn("h-5 w-5", getDerivedPriority(selectedLead.leadScore) === "High" ? "text-rose-400" : getDerivedPriority(selectedLead.leadScore) === "Medium" ? "text-amber-400" : "text-blue-400")} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Priority</div>
                        <div className="text-[13px] font-bold text-slate-200">
                          {getDerivedPriority(selectedLead.leadScore) === "High" ? "Immediate action required." : "Standard follow-up timeframe."}
                        </div>
                      </div>
                      <div className={cn("text-[13px] font-black", getDerivedPriority(selectedLead.leadScore) === "High" ? "text-rose-400" : getDerivedPriority(selectedLead.leadScore) === "Medium" ? "text-amber-400" : "text-blue-400")}>
                        {getDerivedPriority(selectedLead.leadScore)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </LegacySlideOver>
    </div>
  );
}

