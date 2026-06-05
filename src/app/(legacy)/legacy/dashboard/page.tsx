"use client";

import { useState, useMemo, useEffect } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Minus,
  Filter
} from "lucide-react";

// ── Types & Constants ────────────────────────────────────────────────────────

type DateFilter = "7d" | "30d" | "365d" | "all";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

const THEME = {
  bg: "#0B0F19",
  panelBg: "rgba(11, 15, 25, 0.6)",
  border: "rgba(30, 41, 59, 0.8)",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  chartGrid: "rgba(51, 65, 85, 0.3)",
};

// ── Custom Tooltips ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0F19]/95 border border-slate-700/80 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-slate-300 text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-200 font-medium">{entry.name}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Main Dashboard Component ─────────────────────────────────────────────────

export default function LegacyDashboardPage() {
  const { leads, conversations, appointments, refreshData, lastSynced } = useLegacyStore();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<DateFilter>("30d");
  const [activityToggle, setActivityToggle] = useState<"messages" | "leads">("messages");

  useEffect(() => {
    setMounted(true);
    if (!lastSynced) refreshData();
  }, [lastSynced, refreshData]);

  // ── Time Definitions ───────────────────────────────────────────────────────
  const now = new Date().getTime();
  
  const getFilterTimestamps = (f: DateFilter) => {
    let days = 30;
    if (f === "7d") days = 7;
    if (f === "365d") days = 365;
    
    if (f === "all") {
      return { currentStart: 0, prevStart: 0 };
    }
    const ms = days * 24 * 60 * 60 * 1000;
    return {
      currentStart: now - ms,
      prevStart: now - (ms * 2)
    };
  };

  const { currentStart, prevStart } = getFilterTimestamps(filter);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isCurrent = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    if (filter === "all") return true;
    const t = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00").getTime();
    return t >= currentStart && t <= now;
  };

  const isPrevious = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    if (filter === "all") return false;
    const t = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00").getTime();
    return t >= prevStart && t < currentStart;
  };

  const calcTrend = (curr: number, prev: number) => {
    if (filter === "all") return { val: 0, dir: "none" as const, text: "Lifetime" };
    if (prev === 0 && curr > 0) return { val: 100, dir: "up" as const, text: "vs previous" };
    if (prev === 0 && curr === 0) return { val: 0, dir: "none" as const, text: "vs previous" };
    const pct = Math.round(((curr - prev) / prev) * 100);
    return {
      val: Math.abs(pct),
      dir: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("none" as const),
      text: "vs previous"
    };
  };

  // ── Data Processing (Current Period) ───────────────────────────────────────

  // 1. Leads
  const currLeads = leads.filter((l) => isCurrent(l.createdDate));
  const prevLeads = leads.filter((l) => isPrevious(l.createdDate));
  
  const currQual = currLeads.filter(l => (l.leadScore || 0) >= 7);
  const prevQual = prevLeads.filter(l => (l.leadScore || 0) >= 7);

  // 2. Appointments
  const currAppts = appointments.filter((a) => isCurrent(a.appointmentDate));
  const prevAppts = appointments.filter((a) => isPrevious(a.appointmentDate));

  const currConfirmed = currAppts.filter(a => ["confirmed", "scheduled"].includes(a.status.toLowerCase()));
  const prevConfirmed = prevAppts.filter(a => ["confirmed", "scheduled"].includes(a.status.toLowerCase()));
  
  const currCompletedAppts = currAppts.filter(a => a.status.toLowerCase() === "completed");

  // 3. Conversations (Active + Awaiting)
  // Active means any message within 48h regardless of global filter
  const activeThreshold = now - (48 * 60 * 60 * 1000);
  const recentConvs = conversations.filter(c => new Date(c.timestamp).getTime() >= activeThreshold);
  const activeLeadIds = new Set(recentConvs.map(c => c.leadId));
  
  // Awaiting reply: Look at the last message per lead globally. If sender !== 'business/bot', it's awaiting.
  const awaitingReplyCount = useMemo(() => {
    const lastMsgByLead: Record<string, any> = {};
    conversations.forEach(c => {
      const t = new Date(c.timestamp).getTime();
      if (!lastMsgByLead[c.leadId] || t > lastMsgByLead[c.leadId].t) {
        lastMsgByLead[c.leadId] = { t, sender: c.sender.toLowerCase() };
      }
    });
    let count = 0;
    Object.values(lastMsgByLead).forEach((m) => {
      if (!m.sender.includes("bot") && !m.sender.includes("system") && m.sender !== "business") {
        count++;
      }
    });
    return count;
  }, [conversations]);

  // ── Widgets Data ───────────────────────────────────────────────────────────

  // KPI Trends
  const trendLeads = calcTrend(currLeads.length, prevLeads.length);
  const trendQual = calcTrend(currQual.length, prevQual.length);
  const trendAppts = calcTrend(currConfirmed.length, prevConfirmed.length);

  // Funnel Data
  const funnelData = useMemo(() => {
    const closedStatuses = ["converted", "closed", "won", "client", "customer"];
    const closed = currLeads.filter(l => closedStatuses.includes((l.status || "").toLowerCase())).length;
    
    const s1 = currLeads.length;
    const s2 = currQual.length;
    const s3 = currConfirmed.length;
    const s4 = closed;

    const rate = (top: number, bottom: number) => top === 0 ? "0%" : `${Math.round((bottom/top)*100)}%`;

    return [
      { name: "New Leads", value: s1, fill: "#3b82f6", drop: rate(s1, s2) },
      { name: "Qualified", value: s2, fill: "#8b5cf6", drop: rate(s2, s3) },
      { name: "Booked", value: s3, fill: "#ec4899", drop: rate(s3, s4) },
      { name: "Closed", value: s4, fill: "#10b981", drop: "—" },
    ];
  }, [currLeads, currQual, currConfirmed]);

  // Lead Sources Donut
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    currLeads.forEach(l => {
      const s = l.source ? l.source.trim().replace(/^./, c => c.toUpperCase()) : "Unknown";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currLeads]);

  // Appt Performance Bar
  const apptPerfData = useMemo(() => {
    const counts = { Confirmed: 0, Completed: 0, Cancelled: 0, "No Show": 0 };
    currAppts.forEach(a => {
      const s = a.status.toLowerCase();
      if (s === "confirmed" || s === "scheduled") counts.Confirmed++;
      else if (s === "completed") counts.Completed++;
      else if (s === "cancelled") counts.Cancelled++;
      else if (s === "no-show" || s === "no show") counts["No Show"]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [currAppts]);

  const apptCompletionRate = currConfirmed.length + currCompletedAppts.length === 0 
    ? 0 
    : Math.round((currCompletedAppts.length / (currConfirmed.length + currCompletedAppts.length)) * 100);

  // Conversation Activity Line
  const activityData = useMemo(() => {
    const currConvs = conversations.filter(c => isCurrent(c.timestamp));
    const grouped: Record<string, { messages: number; leads: Set<string> }> = {};
    
    // Create baseline
    const days = filter === "7d" ? 7 : filter === "30d" ? 30 : filter === "365d" ? 365 : 30; // default 30 for lifetime
    for(let i=days-1; i>=0; i--) {
      const d = new Date(now - (i * 24 * 60 * 60 * 1000));
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grouped[key] = { messages: 0, leads: new Set() };
    }

    currConvs.forEach(c => {
      const d = new Date(c.timestamp);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (grouped[key]) {
        grouped[key].messages++;
        grouped[key].leads.add(c.leadId);
      }
    });

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      Messages: data.messages,
      Leads: data.leads.size
    }));
  }, [conversations, filter]);



  if (!mounted) return null;

  // ── Subcomponents ──────────────────────────────────────────────────────────

  const TrendBadge = ({ t }: { t: { val: number, dir: "up"|"down"|"none", text: string } }) => {
    if (t.dir === "none") return <span className="text-slate-500 text-xs font-medium flex items-center gap-1"><Minus className="h-3 w-3" /> {t.text}</span>;
    const isUp = t.dir === "up";
    return (
      <span className={cn("text-xs font-semibold flex items-center gap-1", isUp ? "text-emerald-400" : "text-rose-400")}>
        {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {t.val}% <span className="text-slate-500 font-medium ml-0.5">{t.text}</span>
      </span>
    );
  };

  const Panel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300", className)}>
      {children}
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-16 space-y-6 animate-in fade-in duration-500">
      
      {/* ── 1. Header & Global Filters ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-[#0B0F19]/40 p-1 -mx-2 rounded-xl">
        <div className="px-2">
          <h1 className="text-[26px] font-black tracking-tight text-white leading-none">Executive Dashboard</h1>
          <p className="text-sm font-medium text-slate-400 mt-2">Live business performance and AI insights.</p>
        </div>

        <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 rounded-lg p-1.5 shadow-inner">
          <Filter className="h-4 w-4 text-slate-500 ml-2 mr-1" />
          {(["7d", "30d", "365d", "all"] as const).map((f) => {
            const labels = { "7d": "7D", "30d": "30D", "365d": "1Y", "all": "All Time" };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200 outline-none",
                  filter === f
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Leads */}
        <Panel className="p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-16 w-16 text-blue-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold tracking-wider text-slate-400 uppercase">Total Leads</h3>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[36px] font-black text-white leading-none tracking-tight">{currLeads.length}</div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <TrendBadge t={trendLeads} />
          </div>
        </Panel>

        {/* Qualified Leads */}
        <Panel className="p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="h-16 w-16 text-purple-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold tracking-wider text-slate-400 uppercase">Qualified Leads</h3>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <div className="flex-1 flex items-end gap-3">
            <div className="text-[36px] font-black text-white leading-none tracking-tight">{currQual.length}</div>
            <div className="mb-1 text-sm font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              {currLeads.length ? Math.round((currQual.length/currLeads.length)*100) : 0}% Rate
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <TrendBadge t={trendQual} />
          </div>
        </Panel>

        {/* Appointments Booked */}
        <Panel className="p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="h-16 w-16 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold tracking-wider text-slate-400 uppercase">Appointments</h3>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Calendar className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[36px] font-black text-white leading-none tracking-tight">{currConfirmed.length}</div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <TrendBadge t={trendAppts} />
          </div>
        </Panel>

        {/* Active Conversations */}
        <Panel className="p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="h-16 w-16 text-amber-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold tracking-wider text-slate-400 uppercase">Active Chats</h3>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <MessageSquare className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="flex-1 flex items-end gap-3">
            <div className="text-[36px] font-black text-white leading-none tracking-tight">{activeLeadIds.size}</div>
            <div className="mb-1 text-[11px] font-bold text-amber-500/80 uppercase tracking-wider">
              Last 48h
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Awaiting Reply</span>
            <span className="text-sm font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              {awaitingReplyCount} Leads
            </span>
          </div>
        </Panel>
      </div>

      {/* ── 3. Charts Row 1 (Funnel & Sources) ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Lead Funnel */}
        <Panel className="p-6 min-h-[400px]">
          <div className="mb-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-500" /> Pipeline Funnel
            </h2>
            <p className="text-[13px] text-slate-400 mt-1">Lead progression through lifecycle stages.</p>
          </div>
          <div className="flex-1 h-full w-full relative">
            {currLeads.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-500">No leads in pipeline.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <FunnelChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" className="text-sm font-bold" />
                    <LabelList position="center" fill="#fff" stroke="none" dataKey="value" className="text-xl font-black" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            )}
          </div>
          {currLeads.length > 0 && (
             <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between px-2">
              {funnelData.slice(0,-1).map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Drop</span>
                  <span className="text-sm font-bold text-rose-400">↓ {d.drop}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Lead Sources */}
        <Panel className="p-6 min-h-[400px]">
          <div className="mb-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-500" /> Acquisition Sources
            </h2>
            <p className="text-[13px] text-slate-400 mt-1">Where your filtered leads are coming from.</p>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
            {sourceData.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-sm font-medium text-slate-500">No source data.</div>
            ) : (
              <>
                <div className="h-[240px] w-[240px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-col gap-3 flex-1 w-full overflow-y-auto max-h-[240px] pr-2 custom-scrollbar">
                  {sourceData.map((d, i) => {
                    const pct = Math.round((d.value / currLeads.length) * 100);
                    return (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0B0F19] border border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm font-semibold text-slate-300">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white">{d.value}</span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded w-10 text-center">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Panel>

      </div>

      {/* ── 4. Charts Row 2 (Activity & Appointments) ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Conversation Activity */}
        <Panel className="p-6 min-h-[400px] flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" /> Conversation Activity
              </h2>
              <p className="text-[13px] text-slate-400 mt-1">Engagement volume over selected period.</p>
            </div>
            <div className="flex items-center bg-[#0B0F19] border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActivityToggle("messages")}
                className={cn("px-3 py-1 rounded-md text-[12px] font-bold transition-all", activityToggle === "messages" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}
              >
                Messages
              </button>
              <button
                onClick={() => setActivityToggle("leads")}
                className={cn("px-3 py-1 rounded-md text-[12px] font-bold transition-all", activityToggle === "leads" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}
              >
                Unique Leads
              </button>
            </div>
          </div>
          <div className="flex-1 h-full w-full">
            {activityData.length === 0 || Math.max(...activityData.map(d=>d.Messages)) === 0 ? (
               <div className="h-full flex items-center justify-center text-sm font-medium text-slate-500">No message activity.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.chartGrid} vertical={false} />
                  <XAxis dataKey="date" stroke={THEME.textMuted} fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey={activityToggle === "messages" ? "Messages" : "Leads"} 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6, fill: "#f59e0b", stroke: "#0B0F19", strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        {/* Appointment Performance */}
        <Panel className="p-6 min-h-[400px] flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-500" /> Appointment Performance
              </h2>
              <p className="text-[13px] text-slate-400 mt-1">Status of scheduled meetings.</p>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Completion Rate</span>
              <span className="text-xl font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{apptCompletionRate}%</span>
            </div>
          </div>
          <div className="flex-1 h-full w-full">
            {apptPerfData.length === 0 || Math.max(...apptPerfData.map(d=>d.value)) === 0 ? (
              <div className="h-full flex items-center justify-center text-sm font-medium text-slate-500">No appointments scheduled.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={apptPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.chartGrid} vertical={false} />
                  <XAxis dataKey="name" stroke={THEME.textMuted} fontSize={12} fontWeight={600} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {apptPerfData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === "Completed" ? "#10b981" : 
                        entry.name === "Confirmed" ? "#3b82f6" : 
                        entry.name === "Cancelled" ? "#94a3b8" : "#f43f5e"
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

      </div>



    </div>
  );
}
