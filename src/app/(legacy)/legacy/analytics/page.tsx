"use client";

import { useState, useMemo, useEffect } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList, AreaChart, Area
} from "recharts";
import {
  CalendarDays, TrendingUp, TrendingDown, Users, CheckCircle2, Calendar,
  MessageSquare, Minus, Filter, Activity, BarChart3, Target, DollarSign,
  PieChart as PieChartIcon, Zap, Layers, Focus
} from "lucide-react";

// ── Types & Constants ────────────────────────────────────────────────────────

type DateFilter = "7d" | "30d" | "90d" | "365d" | "all";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#14b8a6", "#0ea5e9"];
const THEME = {
  bg: "#0B0F19",
  panelBg: "rgba(11, 15, 25, 0.6)",
  border: "rgba(30, 41, 59, 0.8)",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  chartGrid: "rgba(51, 65, 85, 0.3)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0F19]/95 border border-slate-700/80 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-slate-300 text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-200 font-medium">{entry.name}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Main Page Component ──────────────────────────────────────────────────────

export default function LegacyAnalyticsPage() {
  const { leads, conversations, appointments, memory, refreshData, lastSynced } = useLegacyStore();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<DateFilter>("30d");
  const [activityToggle, setActivityToggle] = useState<"messages" | "leads">("messages");

  useEffect(() => {
    setMounted(true);
    if (!lastSynced) refreshData();
  }, [lastSynced, refreshData]);

  const now = new Date().getTime();

  // ── Global Filter Logic ────────────────────────────────────────────────────
  const getFilterTimestamps = (f: DateFilter) => {
    if (f === "all") return { currentStart: 0, prevStart: 0 };
    const days = f === "7d" ? 7 : f === "30d" ? 30 : f === "90d" ? 90 : 365;
    const ms = days * 24 * 60 * 60 * 1000;
    return { currentStart: now - ms, prevStart: now - (ms * 2) };
  };

  const { currentStart, prevStart } = getFilterTimestamps(filter);

  const isCurrent = (d?: string) => {
    if (!d) return false;
    if (filter === "all") return true;
    const t = new Date(d.includes("T") ? d : d + "T00:00:00").getTime();
    return t >= currentStart && t <= now;
  };

  const isPrevious = (d?: string) => {
    if (!d) return false;
    if (filter === "all") return false;
    const t = new Date(d.includes("T") ? d : d + "T00:00:00").getTime();
    return t >= prevStart && t < currentStart;
  };

  const calcTrend = (curr: number, prev: number) => {
    if (filter === "all") return { val: 0, dir: "none" as const, text: "Lifetime" };
    if (prev === 0 && curr > 0) return { val: 100, dir: "up" as const, text: "vs prev" };
    if (prev === 0 && curr === 0) return { val: 0, dir: "none" as const, text: "vs prev" };
    const pct = Math.round(((curr - prev) / prev) * 100);
    return {
      val: Math.abs(pct),
      dir: pct > 0 ? "up" as const : pct < 0 ? "down" as const : "none" as const,
      text: "vs prev"
    };
  };

  // ── Aggregation ────────────────────────────────────────────────────────────

  const currLeads = leads.filter(l => isCurrent(l.createdDate));
  const prevLeads = leads.filter(l => isPrevious(l.createdDate));

  const currQual = currLeads.filter(l => (l.leadScore || 0) >= 7);
  const prevQual = prevLeads.filter(l => (l.leadScore || 0) >= 7);

  const currAppts = appointments.filter(a => isCurrent(a.appointmentDate));
  const prevAppts = appointments.filter(a => isPrevious(a.appointmentDate));

  const currConfirmedAppts = currAppts.filter(a => ["confirmed", "scheduled"].includes(a.status.toLowerCase()));
  const prevConfirmedAppts = prevAppts.filter(a => ["confirmed", "scheduled"].includes(a.status.toLowerCase()));

  const currCompletedAppts = currAppts.filter(a => a.status.toLowerCase() === "completed");
  const currNoShowAppts = currAppts.filter(a => a.status.toLowerCase().replace("-", " ") === "no show");

  const closedStatuses = ["converted", "closed", "won", "client", "customer"];
  const currClosed = currLeads.filter(l => closedStatuses.includes((l.status || "").toLowerCase()));

  // Active Conversations (Last 48 hours, globally)
  const activeThreshold = now - (48 * 60 * 60 * 1000);
  const activeLeadIds = new Set(conversations.filter(c => new Date(c.timestamp).getTime() >= activeThreshold).map(c => c.leadId));

  const awaitingReplyCount = useMemo(() => {
    const lastMsg: Record<string, any> = {};
    conversations.forEach(c => {
      const t = new Date(c.timestamp).getTime();
      if (!lastMsg[c.leadId] || t > lastMsg[c.leadId].t) lastMsg[c.leadId] = { t, sender: c.sender.toLowerCase() };
    });
    return Object.values(lastMsg).filter(m => !m.sender.includes("bot") && !m.sender.includes("system") && m.sender !== "business").length;
  }, [conversations]);

  // ── 1. KPI Trends ──
  const trendLeads = calcTrend(currLeads.length, prevLeads.length);
  const trendAppts = calcTrend(currConfirmedAppts.length, prevConfirmedAppts.length);

  // ── 2. Lead Growth (Line) ──
  const leadGrowthData = useMemo(() => {
    const grouped: Record<string, number> = {};
    currLeads.forEach(l => {
      const d = new Date(l.createdDate || "");
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, count]) => ({ date, Leads: count }));
  }, [currLeads]);

  // ── 3. Lead Source Performance (Donut) ──
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    currLeads.forEach(l => {
      const s = l.source ? l.source.trim().replace(/^./, c => c.toUpperCase()) : "Unknown";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [currLeads]);

  // ── 4. Source Quality Analytics (Table) ──
  const sourceQuality = useMemo(() => {
    const map: Record<string, { total: number, qual: number, closed: number }> = {};
    currLeads.forEach(l => {
      const s = l.source ? l.source.trim().replace(/^./, c => c.toUpperCase()) : "Unknown";
      if (!map[s]) map[s] = { total: 0, qual: 0, closed: 0 };
      map[s].total++;
      if ((l.leadScore || 0) >= 7) map[s].qual++;
      if (closedStatuses.includes((l.status || "").toLowerCase())) map[s].closed++;
    });
    return Object.entries(map).map(([source, data]) => ({
      source,
      total: data.total,
      qual: data.qual,
      closed: data.closed,
      conversion: data.total > 0 ? Math.round((data.closed / data.total) * 100) : 0
    })).sort((a, b) => b.conversion - a.conversion);
  }, [currLeads]);

  // ── 5. Lead Quality (Horizontal Bar) ──
  const leadQualityData = useMemo(() => {
    const counts = { "1-3": 0, "4-6": 0, "7-8": 0, "9-10": 0 };
    currLeads.forEach(l => {
      const s = l.leadScore || 0;
      if (s <= 3) counts["1-3"]++;
      else if (s <= 6) counts["4-6"]++;
      else if (s <= 8) counts["7-8"]++;
      else counts["9-10"]++;
    });
    return [
      { name: "Score 9-10", value: counts["9-10"], fill: "#10b981" },
      { name: "Score 7-8", value: counts["7-8"], fill: "#3b82f6" },
      { name: "Score 4-6", value: counts["4-6"], fill: "#f59e0b" },
      { name: "Score 1-3", value: counts["1-3"], fill: "#f43f5e" }
    ];
  }, [currLeads]);

  // ── 6. Sales Funnel ──
  const funnelData = useMemo(() => {
    const s1 = currLeads.length;
    const s2 = currQual.length;
    const s3 = currConfirmedAppts.length;
    const s4 = currClosed.length;
    const rate = (top: number, bottom: number) => top === 0 ? "0%" : `${Math.round((bottom/top)*100)}%`;
    return [
      { name: "New Leads", value: s1, fill: "#3b82f6", drop: rate(s1, s2) },
      { name: "Qualified", value: s2, fill: "#8b5cf6", drop: rate(s2, s3) },
      { name: "Booked", value: s3, fill: "#ec4899", drop: rate(s3, s4) },
      { name: "Closed", value: s4, fill: "#10b981", drop: "—" },
    ];
  }, [currLeads, currQual, currConfirmedAppts, currClosed]);

  // ── 7. Conversion Analytics ──
  const convLeadToQual = currLeads.length ? Math.round((currQual.length / currLeads.length) * 100) : 0;
  const convQualToAppt = currQual.length ? Math.round((currConfirmedAppts.length / currQual.length) * 100) : 0;
  const convApptToCust = currConfirmedAppts.length ? Math.round((currClosed.length / currConfirmedAppts.length) * 100) : 0;
  const convOverall = currLeads.length ? Math.round((currClosed.length / currLeads.length) * 100) : 0;

  // ── 8. Appointment Performance ──
  const apptPerfData = useMemo(() => {
    const counts = { Confirmed: 0, Completed: 0, Cancelled: 0, "No Show": 0 };
    currAppts.forEach(a => {
      const s = a.status.toLowerCase();
      if (s === "confirmed" || s === "scheduled") counts.Confirmed++;
      else if (s === "completed") counts.Completed++;
      else if (s === "cancelled") counts.Cancelled++;
      else if (s.includes("no show") || s.includes("no-show")) counts["No Show"]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [currAppts]);

  const totalAppts = currAppts.length;
  const apptCompRate = totalAppts ? Math.round((currCompletedAppts.length / totalAppts) * 100) : 0;
  const apptNoShowRate = totalAppts ? Math.round((currNoShowAppts.length / totalAppts) * 100) : 0;

  // ── 9. Appointment Trend (Area) ──
  const apptTrendData = useMemo(() => {
    const grouped: Record<string, number> = {};
    currAppts.forEach(a => {
      const d = new Date(a.appointmentDate || "");
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, count]) => ({ date, Appointments: count }));
  }, [currAppts]);

  // ── 10. Conversation Analytics ──
  const activityData = useMemo(() => {
    const currConvs = conversations.filter(c => isCurrent(c.timestamp));
    const grouped: Record<string, { messages: number; leads: Set<string> }> = {};
    currConvs.forEach(c => {
      const d = new Date(c.timestamp);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!grouped[key]) grouped[key] = { messages: 0, leads: new Set() };
      grouped[key].messages++;
      grouped[key].leads.add(c.leadId);
    });
    return Object.entries(grouped).map(([date, data]) => ({ date, Messages: data.messages, Leads: data.leads.size }));
  }, [conversations, filter]);

  // ── AI Memory Extractions (Sections 12-15) ──
  const validLeadIds = new Set(currLeads.map(l => l.id));
  if (filter === "all") leads.forEach(l => validLeadIds.add(l.id));

  const intentData = useMemo(() => {
    const map: Record<string, number> = {};
    memory.forEach(m => {
      if (!validLeadIds.has(m.leadId)) return;
      if (m.memoryType.toLowerCase() === "intent") {
        const v = m.memoryValue.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        map[v] = (map[v] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [memory, validLeadIds]);

  const budgetData = useMemo(() => {
    const counts = { "< $500": 0, "$500 - $1K": 0, "$1K - $2.5K": 0, "$2.5K - $5K": 0, "$5K+": 0 };
    let total = 0, count = 0;
    memory.forEach(m => {
      if (!validLeadIds.has(m.leadId)) return;
      if (m.memoryType.toLowerCase() === "budget") {
        const num = parseInt(m.memoryValue.replace(/[^0-9]/g, ""));
        if (!isNaN(num) && num > 0) {
          total += num; count++;
          if (num < 500) counts["< $500"]++;
          else if (num <= 1000) counts["$500 - $1K"]++;
          else if (num <= 2500) counts["$1K - $2.5K"]++;
          else if (num <= 5000) counts["$2.5K - $5K"]++;
          else counts["$5K+"]++;
        }
      }
    });
    return {
      bars: Object.entries(counts).map(([name, value]) => ({ name, value })),
      avg: count > 0 ? Math.round(total / count) : 0,
      mostCommon: Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "N/A"
    };
  }, [memory, validLeadIds]);

  const bizTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    memory.forEach(m => {
      if (!validLeadIds.has(m.leadId)) return;
      if (m.memoryType.toLowerCase() === "business_type") {
        const v = m.memoryValue.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        map[v] = (map[v] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [memory, validLeadIds]);

  const urgencyData = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    memory.forEach(m => {
      if (!validLeadIds.has(m.leadId)) return;
      if (m.memoryType.toLowerCase() === "urgency") {
        const v = m.memoryValue.toLowerCase();
        if (v.includes("high") || v.includes("urgent")) counts.High++;
        else if (v.includes("medium")) counts.Medium++;
        else counts.Low++;
      }
    });
    return Object.entries(counts).filter(x => x[1] > 0).map(([name, value]) => ({ name, value }));
  }, [memory, validLeadIds]);

  if (!mounted) return null;

  // ── UI Components ──────────────────────────────────────────────────────────

  const Panel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300", className)}>
      {children}
    </div>
  );

  const SectionTitle = ({ icon: Icon, title, desc }: any) => (
    <div className="mb-6">
      <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-500" /> {title}
      </h2>
      <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-16 space-y-8 animate-in fade-in duration-500">
      
      {/* ── Header & Global Filters ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-[#0B0F19]/40 p-1 -mx-2 rounded-xl sticky top-0 z-50 backdrop-blur-md border-b border-slate-800/50 pb-4">
        <div className="px-2">
          <h1 className="text-[26px] font-black tracking-tight text-white leading-none">Business Intelligence</h1>
          <p className="text-sm font-medium text-slate-400 mt-2">Executive analytics powered by live CRM datasets.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 rounded-lg p-1.5 shadow-inner">
          <Filter className="h-4 w-4 text-slate-500 ml-2 mr-1" />
          {(["7d", "30d", "90d", "365d", "all"] as const).map((f) => {
            const labels = { "7d": "7 Days", "30d": "30 Days", "90d": "90 Days", "365d": "1 Year", "all": "Lifetime" };
            return (
              <button
                key={f} onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200 outline-none",
                  filter === f ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 1: Executive KPI Overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Panel className="p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Leads</span>
          <div className="text-3xl font-black text-white mt-1">{currLeads.length}</div>
          <div className="mt-3 text-xs font-semibold flex items-center gap-1 text-emerald-400">
            {trendLeads.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : trendLeads.dir === 'down' ? <TrendingDown className="h-3 w-3 text-rose-400" /> : <Minus className="h-3 w-3 text-slate-500"/>}
            <span className={trendLeads.dir === 'down' ? 'text-rose-400' : trendLeads.dir === 'none' ? 'text-slate-500' : ''}>{trendLeads.val}% vs prev</span>
          </div>
        </Panel>
        
        <Panel className="p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Qualified Leads</span>
          <div className="text-3xl font-black text-white mt-1">{currQual.length}</div>
          <div className="mt-3 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md inline-flex w-max">
            {currLeads.length ? Math.round((currQual.length/currLeads.length)*100) : 0}% Qual Rate
          </div>
        </Panel>

        <Panel className="p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Booked Appts</span>
          <div className="text-3xl font-black text-white mt-1">{currConfirmedAppts.length}</div>
          <div className="mt-3 text-xs font-semibold flex items-center gap-1 text-emerald-400">
            {trendAppts.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : trendAppts.dir === 'down' ? <TrendingDown className="h-3 w-3 text-rose-400" /> : <Minus className="h-3 w-3 text-slate-500"/>}
            <span className={trendAppts.dir === 'down' ? 'text-rose-400' : trendAppts.dir === 'none' ? 'text-slate-500' : ''}>{trendAppts.val}% vs prev</span>
          </div>
        </Panel>

        <Panel className="p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Appt Completion</span>
          <div className="text-3xl font-black text-white mt-1">{apptCompRate}%</div>
          <div className="mt-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-flex w-max">
            {currCompletedAppts.length} completed
          </div>
        </Panel>

        <Panel className="p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">No Show Rate</span>
          <div className="text-3xl font-black text-white mt-1">{apptNoShowRate}%</div>
          <div className="mt-3 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md inline-flex w-max">
            {currNoShowAppts.length} missed
          </div>
        </Panel>

        <Panel className="p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active Chats</span>
          <div className="text-3xl font-black text-white mt-1">{activeLeadIds.size}</div>
          <div className="mt-3 text-xs font-semibold flex items-center gap-1 text-slate-400">
            Current 48H Activity
          </div>
        </Panel>
      </div>

      {/* ── Section 7: Conversion Analytics (Top Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Lead → Qualified", v: convLeadToQual, c: "from-blue-600/20 to-blue-500/5", b: "border-blue-500/20", t: "text-blue-400" },
          { l: "Qualified → Appointment", v: convQualToAppt, c: "from-purple-600/20 to-purple-500/5", b: "border-purple-500/20", t: "text-purple-400" },
          { l: "Appointment → Customer", v: convApptToCust, c: "from-emerald-600/20 to-emerald-500/5", b: "border-emerald-500/20", t: "text-emerald-400" },
          { l: "Overall Conversion", v: convOverall, c: "from-amber-600/20 to-amber-500/5", b: "border-amber-500/20", t: "text-amber-400" },
        ].map((c, i) => (
          <div key={i} className={cn("rounded-2xl p-6 border flex flex-col items-center justify-center text-center bg-gradient-to-b", c.c, c.b)}>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{c.l}</span>
            <span className={cn("text-4xl font-black", c.t)}>{c.v}%</span>
          </div>
        ))}
      </div>

      {/* ── Grid Row: Funnel & Lead Growth ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 6: Sales Funnel */}
        <Panel className="p-6">
          <SectionTitle icon={Filter} title="Sales Funnel Analytics" desc="Drop-offs through the sales pipeline." />
          <div className="h-[300px] w-full">
            {currLeads.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500">No leads.</div> :
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" className="text-sm font-bold" />
                    <LabelList position="center" fill="#fff" stroke="none" dataKey="value" className="text-xl font-black" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            }
          </div>
          {currLeads.length > 0 && (
             <div className="pt-4 border-t border-slate-800 flex justify-between px-2">
              {funnelData.slice(0,-1).map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Drop</span>
                  <span className="text-sm font-bold text-rose-400">↓ {d.drop}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Section 2: Lead Growth */}
        <Panel className="p-6">
          <SectionTitle icon={TrendingUp} title="Lead Growth Analytics" desc="Lead acquisition volume over time." />
          <div className="h-[300px] w-full">
            {leadGrowthData.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500">No data.</div> :
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.chartGrid} vertical={false} />
                  <XAxis dataKey="date" stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            }
          </div>
        </Panel>

      </div>

      {/* ── Section 4: Source Quality Analytics ── */}
      <Panel className="p-6">
        <SectionTitle icon={Target} title="Source Quality Analytics" desc="Determine which channels generate the most profitable leads." />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                <th className="pb-3 pl-2">Lead Source</th>
                <th className="pb-3 text-center">Total Leads</th>
                <th className="pb-3 text-center">Qualified</th>
                <th className="pb-3 text-center">Closed</th>
                <th className="pb-3 text-right pr-2">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {sourceQuality.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No source data available.</td></tr>
              ) : sourceQuality.map((s, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 pl-2 font-bold text-white">{s.source}</td>
                  <td className="py-4 text-center text-slate-300">{s.total}</td>
                  <td className="py-4 text-center text-purple-400 font-medium">{s.qual}</td>
                  <td className="py-4 text-center text-emerald-400 font-medium">{s.closed}</td>
                  <td className="py-4 text-right pr-2">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-sm font-bold">
                      {s.conversion}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── Grid Row: Lead Quality & Source Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 5: Lead Quality Analytics */}
        <Panel className="p-6">
          <SectionTitle icon={Users} title="Lead Quality Analytics" desc="Distribution of lead scores for filtered period." />
          <div className="h-[280px] w-full">
            {currLeads.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500">No leads.</div> :
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadQualityData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.chartGrid} horizontal={false} />
                  <XAxis type="number" stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke={THEME.textMuted} fontSize={12} fontWeight={600} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
                    {leadQualityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </Panel>

        {/* Section 3: Lead Source Donut */}
        <Panel className="p-6">
          <SectionTitle icon={PieChartIcon} title="Lead Source Distribution" desc="Market share of acquisition channels." />
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 h-[280px]">
            {sourceData.length === 0 ? <div className="flex items-center justify-center h-full text-slate-500">No sources.</div> :
              <>
                <div className="h-[200px] w-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                        {sourceData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 flex-1 w-full max-h-[220px] overflow-y-auto custom-scrollbar">
                  {sourceData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0B0F19] border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[13px] font-semibold text-slate-300">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-white">{d.value}</span>
                        <span className="text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{Math.round((d.value/currLeads.length)*100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            }
          </div>
        </Panel>

      </div>

      {/* ── Grid Row: Appt Trend & Appt Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 9: Appointment Trend */}
        <Panel className="p-6">
          <SectionTitle icon={CalendarDays} title="Appointment Trends" desc="Meetings scheduled over time." />
          <div className="h-[280px] w-full">
            {apptTrendData.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500">No appointments.</div> :
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apptTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.chartGrid} vertical={false} />
                  <XAxis dataKey="date" stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Appointments" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAppts)" />
                </AreaChart>
              </ResponsiveContainer>
            }
          </div>
        </Panel>

        {/* Section 8: Appointment Performance */}
        <Panel className="p-6">
          <SectionTitle icon={BarChart3} title="Appointment Status" desc="Outcome of scheduled meetings." />
          <div className="h-[280px] w-full">
            {apptPerfData.length === 0 || Math.max(...apptPerfData.map(d=>d.value))===0 ? <div className="h-full flex items-center justify-center text-slate-500">No data.</div> :
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apptPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.chartGrid} vertical={false} />
                  <XAxis dataKey="name" stroke={THEME.textMuted} fontSize={12} fontWeight={600} axisLine={false} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {apptPerfData.map((e, i) => (
                      <Cell key={i} fill={e.name==="Completed"?"#10b981":e.name==="Confirmed"?"#3b82f6":e.name==="Cancelled"?"#94a3b8":"#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </Panel>

      </div>

      {/* ── Grid Row: Conversations & Responses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Section 10: Conversation Analytics */}
        <Panel className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" /> Conversation Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-1">Engagement volume measurement.</p>
            </div>
            <div className="flex bg-[#0B0F19] border border-slate-800 rounded-lg p-1">
              <button onClick={() => setActivityToggle("messages")} className={cn("px-3 py-1 rounded-md text-[11px] font-bold", activityToggle === "messages" ? "bg-slate-800 text-white" : "text-slate-500")}>Messages</button>
              <button onClick={() => setActivityToggle("leads")} className={cn("px-3 py-1 rounded-md text-[11px] font-bold", activityToggle === "leads" ? "bg-slate-800 text-white" : "text-slate-500")}>Unique Leads</button>
            </div>
          </div>
          <div className="h-[250px] w-full">
            {activityData.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500">No activity.</div> :
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.chartGrid} vertical={false} />
                  <XAxis dataKey="date" stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey={activityToggle === "messages" ? "Messages" : "Leads"} stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#f59e0b", stroke: "#0B0F19", strokeWidth: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            }
          </div>
        </Panel>

        {/* Section 11: Response Performance */}
        <Panel className="p-6 flex flex-col justify-center">
          <SectionTitle icon={Zap} title="Response Performance" desc="Identify communication bottlenecks." />
          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-[#0B0F19] border border-amber-500/20 p-5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest block mb-1">Active Now</span>
                <span className="text-xs font-semibold text-slate-400">Within 48 hours</span>
              </div>
              <div className="text-3xl font-black text-white">{activeLeadIds.size}</div>
            </div>
            
            <div className="bg-[#0B0F19] border border-rose-500/20 p-5 rounded-xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-l-xl" />
              <div>
                <span className="text-[10px] font-bold text-rose-500/80 uppercase tracking-widest block mb-1">Awaiting Reply</span>
                <span className="text-xs font-semibold text-slate-400">Business needs to answer</span>
              </div>
              <div className="text-3xl font-black text-rose-400">{awaitingReplyCount}</div>
            </div>
          </div>
        </Panel>

      </div>

      {/* ── Grid Row: AI Analytics (Budget & Intent) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 13: Budget Analytics */}
        <Panel className="p-6">
          <SectionTitle icon={DollarSign} title="Budget Analytics" desc="Prospect budget distribution." />
          <div className="flex gap-4 mb-6">
            <div className="bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Average</span>
              <span className="text-lg font-bold text-emerald-400">${budgetData.avg.toLocaleString()}</span>
            </div>
            <div className="bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Most Common</span>
              <span className="text-lg font-bold text-emerald-400">{budgetData.mostCommon}</span>
            </div>
          </div>
          <div className="h-[220px] w-full">
            {budgetData.bars.length === 0 || Math.max(...budgetData.bars.map(d=>d.value))===0 ? <div className="h-full flex items-center justify-center text-slate-500">No budget data.</div> :
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData.bars} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.chartGrid} vertical={false} />
                  <XAxis dataKey="name" stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </Panel>

        {/* Section 12: Business Intent Analytics */}
        <Panel className="p-6">
          <SectionTitle icon={Target} title="Business Intent Analytics" desc="Primary goals of incoming prospects." />
          <div className="flex-1 flex items-center justify-center gap-6 h-[300px]">
            {intentData.length === 0 ? <div className="flex items-center justify-center h-full text-slate-500">No intent data.</div> :
              <>
                <div className="h-[200px] w-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie data={intentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                        {intentData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 flex-1 w-full max-h-[260px] overflow-y-auto custom-scrollbar">
                  {intentData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0B0F19] border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[12px] font-semibold text-slate-300">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            }
          </div>
        </Panel>

      </div>

      {/* ── Grid Row: AI Analytics (Industry & Urgency) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 14: Business Type Analytics */}
        <Panel className="p-6">
          <SectionTitle icon={Layers} title="Industry Distribution" desc="Breakdown by business type." />
          <div className="flex-1 flex items-center justify-center gap-6 h-[250px]">
            {bizTypeData.length === 0 ? <div className="flex items-center justify-center h-full text-slate-500">No data.</div> :
              <>
                <div className="h-[180px] w-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie data={bizTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                        {bizTypeData.map((e, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 flex-1 w-full max-h-[220px] overflow-y-auto custom-scrollbar">
                  {bizTypeData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0B0F19] border border-slate-800">
                      <span className="text-[12px] font-semibold text-slate-300 truncate pr-2">{d.name}</span>
                      <span className="text-xs font-bold text-white shrink-0">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            }
          </div>
        </Panel>

        {/* Section 15: Urgency Analytics */}
        <Panel className="p-6">
          <SectionTitle icon={Focus} title="Urgency Analytics" desc="Prospect urgency levels." />
          <div className="flex-1 flex items-center justify-center gap-6 h-[250px]">
            {urgencyData.length === 0 ? <div className="flex items-center justify-center h-full text-slate-500">No data.</div> :
              <>
                <div className="h-[180px] w-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie data={urgencyData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                        {urgencyData.map((e, i) => (
                          <Cell key={i} fill={e.name === "High" ? "#f43f5e" : e.name === "Medium" ? "#f59e0b" : "#3b82f6"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3 flex-1 w-full">
                  {urgencyData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0F19] border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.name === "High" ? "#f43f5e" : d.name === "Medium" ? "#f59e0b" : "#3b82f6" }} />
                        <span className="text-sm font-semibold text-slate-300">{d.name}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            }
          </div>
        </Panel>

      </div>

    </div>
  );
}
