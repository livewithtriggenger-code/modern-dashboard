"use client";

import { useState, useMemo, useEffect } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AppointmentCardSkeleton } from "@/legacy/components/ui/LegacySkeletons";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  List,
  LayoutGrid,
  X,
  Check,
  AlertTriangle,
  Users,
  Search,
  Plus
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDisplayDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00");
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDisplayTime(raw: string): string {
  if (!raw) return "—";
  if (raw.includes("T")) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }
  if (/^\d{1,2}:\d{2}\s?(AM|PM)/i.test(raw.trim())) return raw.trim();
  const parts = raw.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1].padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }
  return raw;
}

function computeStatus(apt: {
  status: string;
  appointmentStart?: string;
  appointmentEnd?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}): string {
  const stored = (apt.status || "").toLowerCase().trim();

  // Hard overrides
  if (stored === "no-show" || stored === "no show") return "no-show";
  if (stored === "cancelled") return "cancelled";

  const now = Date.now();
  
  // Try to use appointmentStart/End if available
  if (apt.appointmentStart && apt.appointmentEnd) {
    const start = new Date(apt.appointmentStart).getTime();
    const end = new Date(apt.appointmentEnd).getTime();
    if (!isNaN(start) && !isNaN(end)) {
      if (now > end) return "completed";
      if (now >= start) return "confirmed";
      return "scheduled";
    }
  }

  // Fallback to appointmentDate + appointmentTime logic
  if (apt.appointmentDate) {
    const timeStr = apt.appointmentTime || "12:00:00";
    const dateTimeStr = `${apt.appointmentDate}T${timeStr.replace(/ (AM|PM)/i, '')}`;
    const start = new Date(dateTimeStr).getTime();
    if (!isNaN(start)) {
      if (now > start + 3600000) return "completed"; // assume 1 hour length
      if (now >= start) return "confirmed";
      return "scheduled";
    }
  }

  return stored || "scheduled";
}

// Custom Badge for Dark Theme
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "scheduled" || s === "confirmed") {
    return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">{s}</span>;
  }
  if (s === "completed") {
    return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>;
  }
  if (s === "cancelled") {
    return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wider uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">{s}</span>;
  }
  if (s === "no-show") {
    return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">No Show</span>;
  }
  return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wider uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
}

export default function AppointmentsPage() {
  const { appointments, leads, isLoading } = useLegacyStore();
  const [view, setView] = useState<"calendar" | "agenda">("calendar");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // V1 Mapping Logic
  const getLeadName = (leadId: string): string => {
    const lead = leads.find((l) => l.id === leadId || l.conversationId === leadId);
    return lead?.fullName || leadId || "Unknown Lead";
  };

  const getLeadSource = (leadId: string): string => {
    const lead = leads.find((l) => l.id === leadId || l.conversationId === leadId);
    return lead?.source || "";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const leadId = params.get("leadId");
      if (leadId) setSelectedLeadId(leadId);
    }
  }, []);

  const selectedLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return leads.find((l) => l.id === selectedLeadId || l.conversationId === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  const enriched = useMemo(() => {
    return appointments.map((apt) => ({
      ...apt,
      resolvedName: apt.leadName || getLeadName(apt.leadId),
      resolvedSource: getLeadSource(apt.leadId),
      effectiveStatus: computeStatus(apt as any),
    }));
  }, [appointments, leads]);

  const statusCounts = useMemo(() => ({
    all: enriched.length,
    scheduled: enriched.filter((a) => a.effectiveStatus === "scheduled" || a.effectiveStatus === "confirmed").length,
    completed: enriched.filter((a) => a.effectiveStatus === "completed").length,
    cancelled: enriched.filter((a) => a.effectiveStatus === "cancelled").length,
    "no-show": enriched.filter((a) => a.effectiveStatus === "no-show").length,
  }), [enriched]);

  const filtered = useMemo(() => {
    let result = [...enriched];

    if (selectedLeadId) {
      result = result.filter((a) => a.leadId === selectedLeadId);
    }

    if (statusFilter === "scheduled") {
      result = result.filter((a) => a.effectiveStatus === "scheduled" || a.effectiveStatus === "confirmed");
    } else if (statusFilter !== "all") {
      result = result.filter((a) => a.effectiveStatus === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.resolvedName.toLowerCase().includes(q) ||
          a.leadId.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q),
      );
    }

    return result.sort((a, b) => {
      const ta = new Date(`${a.appointmentDate} ${a.appointmentTime}`).getTime();
      const tb = new Date(`${b.appointmentDate} ${b.appointmentTime}`).getTime();
      return ta - tb;
    });
  }, [enriched, statusFilter, selectedLeadId, search]);

  const renderAction = (apt: typeof enriched[number], compact = false) => {
    const status = apt.effectiveStatus;
    const btnBase = cn(
      "inline-flex items-center justify-center gap-2 rounded-[10px] text-[13.5px] font-bold transition-all",
      compact ? "h-[38px] px-6 min-w-[130px]" : "h-10 w-full"
    );

    if (status === "scheduled" || status === "confirmed") {
      return (
        <a
          href={apt.meetingLink || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            btnBase,
            "bg-[#2563EB]/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white"
          )}
        >
          <Video className="h-4 w-4 shrink-0" />
          {compact ? "Join" : "Join Meeting"}
        </a>
      );
    }
    if (status === "completed") {
      return (
        <div className={cn(btnBase, "bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 cursor-default")}>
          <Check className="h-4 w-4 shrink-0 stroke-[2.5]" />
          Completed
        </div>
      );
    }
    if (status === "no-show") {
      return (
        <div className={cn(btnBase, "bg-rose-500/5 text-rose-500 border border-rose-500/10 cursor-default")}>
          <AlertTriangle className="h-4 w-4 shrink-0 stroke-[2.5]" />
          No Show
        </div>
      );
    }
    if (status === "cancelled") {
      return (
        <div className={cn(btnBase, "bg-slate-500/5 text-slate-500 border border-slate-500/10 cursor-default")}>
          <X className="h-4 w-4 shrink-0 stroke-[2.5]" />
          Cancelled
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { key: "all", label: "All", count: statusCounts.all },
    { key: "scheduled", label: "Upcoming", count: statusCounts.scheduled },
    { key: "completed", label: "Completed", count: statusCounts.completed },
    { key: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
    { key: "no-show", label: "No Show", count: statusCounts["no-show"] },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-white leading-none">Appointments</h1>
          <p className="text-sm text-slate-500 mt-2">Manage scheduled calls and meetings.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2 h-9 text-[13px] font-bold transition-all shadow-sm hover:shadow-blue-900/30 hover:shadow-md">
          <Plus className="h-4 w-4" />
          New Appointment
        </button>
      </div>

      {/* Skeleton state */}
      {isLoading && appointments.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <AppointmentCardSkeleton key={i} />)}
        </div>
      ) : null}

      {(!isLoading || appointments.length > 0) && (
        <>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0B0F19]/80 border border-slate-800 shadow-sm flex flex-col justify-between h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Total Appointments</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{statusCounts.all}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">All time</p>
          </div>
        </div>
        
        <div className="p-5 rounded-xl bg-[#0B0F19]/80 border border-slate-800 shadow-sm flex flex-col justify-between h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Upcoming</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{statusCounts.scheduled}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Scheduled & confirmed</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0B0F19]/80 border border-slate-800 shadow-sm flex flex-col justify-between h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Completed</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{statusCounts.completed}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Successfully held</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0B0F19]/80 border border-slate-800 shadow-sm flex flex-col justify-between h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Cancelled</span>
            <div className="h-8 w-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <X className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{statusCounts.cancelled}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Cancelled by lead</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-[#0B0F19]/60 border border-slate-800 rounded-xl p-2">
        {/* Status Tabs */}
        <div className="flex items-center overflow-x-auto w-full sm:w-auto custom-scrollbar">
          {tabs.map(({ key, label, count }) => {
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "group h-9 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap outline-none",
                  isActive
                    ? "bg-slate-800 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium"
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "flex items-center justify-center px-1.5 min-w-[20px] h-5 rounded-md text-[11px] font-bold transition-all duration-200",
                    isActive
                      ? "bg-[#2563EB] text-white"
                      : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-2 shrink-0 pr-1">
          <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 rounded-lg px-3 h-9 focus-within:border-slate-700 focus-within:ring-1 focus-within:ring-slate-700 transition-all">
            <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appointments…"
              className="text-sm bg-transparent outline-none text-white placeholder:text-slate-500 w-[180px]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 bg-[#0B0F19] border border-slate-800 rounded-lg p-1 h-9">
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center",
                view === "calendar" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("agenda")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center",
                view === "agenda" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {view === "calendar" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((apt) => {
            const name = apt.resolvedName;
            const source = apt.resolvedSource;
            const dispDate = formatDisplayDate(apt.appointmentDate || "");
            const dispTime = formatDisplayTime(apt.appointmentTime || "");
            const effStatus = apt.effectiveStatus;

            return (
              <div
                key={apt.id}
                className="group flex flex-col bg-[#0B0F19]/50 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all duration-300"
              >
                <div className="flex-1 p-5 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-5">
                    <Avatar className="h-11 w-11 shrink-0 border border-slate-800 rounded-full flex items-center justify-center bg-slate-900">
                      <span className="text-sm font-semibold text-white">{name.substring(0, 2).toUpperCase()}</span>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">{name}</h3>
                      {source && (
                        <span className="text-[12px] text-slate-500 capitalize">{source}</span>
                      )}
                      <div className="mt-1.5">
                        <StatusBadge status={effStatus} />
                      </div>
                    </div>
                  </div>

                  {/* Date/Time */}
                  <div className="flex flex-col gap-2.5 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <CalendarIcon className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>{dispDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>{dispTime}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-auto pt-4 border-t border-slate-800/50">
                    {renderAction(apt)}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center">
              <div className="h-16 w-16 bg-slate-800/20 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-base font-semibold text-white">No appointments found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      ) : (
        /* Agenda View */
        <div className="flex flex-col gap-3">
          {filtered.map((apt) => {
            const name = apt.resolvedName;
            const source = apt.resolvedSource;
            const dispDate = formatDisplayDate(apt.appointmentDate || "");
            const dispTime = formatDisplayTime(apt.appointmentTime || "");
            const effStatus = apt.effectiveStatus;

            return (
              <div
                key={apt.id}
                className="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[#0B0F19]/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 shrink-0 border border-slate-800 rounded-full flex items-center justify-center bg-slate-900">
                    <span className="text-sm font-semibold text-white">{name.substring(0, 2).toUpperCase()}</span>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-sm font-semibold text-white">{name}</h4>
                      <StatusBadge status={effStatus} />
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-[12px] text-slate-500 flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3" />
                        {dispDate}
                      </span>
                      <span className="text-[12px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {dispTime}
                      </span>
                      {source && (
                        <span className="text-[12px] text-slate-600 capitalize">· {source}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  {renderAction(apt, true)}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center border border-slate-800 rounded-xl bg-[#0B0F19]/30">
              <div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                <CalendarIcon className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-base font-semibold text-white">No appointments found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or sync your calendar.</p>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
