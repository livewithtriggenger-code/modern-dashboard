"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LegacyBadge } from "@/legacy/components/ui/LegacyBadge";
import { LegacyCard } from "@/legacy/components/ui/LegacyCard";
import { 
  Search, Bot, MessageSquare, Phone, Mail, Send, Brain, Zap, 
  Calendar, Sparkles, Activity, CheckCircle2, ChevronRight, 
  CheckCheck, Mic
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function LegacyConversationsPage() {
  const { leads, conversations, memories, refreshData, settings } = useLegacyStore();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  const [aiInsights, setAiInsights] = useState<{ signal: string, opportunity: string, actionTitle: string, actionDesc: string } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsCache, setInsightsCache] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [takeoverActive, setTakeoverActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Parse the current URL params exactly like V1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const leadId = params.get('leadId');
      if (leadId) setSelectedLeadId(leadId);
    }
  }, []);

  // Group conversations by Lead ID
  const grouped = useMemo(() => {
    const groups: Record<string, typeof conversations> = {};
    conversations.forEach(conv => {
      if (!groups[conv.leadId]) groups[conv.leadId] = [];
      groups[conv.leadId].push(conv);
    });
    // Sort each group's messages by time
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
    return groups;
  }, [conversations]);

  const leadIds = Object.keys(grouped).sort((a, b) => {
    const lastA = grouped[a][grouped[a].length - 1];
    const lastB = grouped[b][grouped[b].length - 1];
    return new Date(lastB.timestamp).getTime() - new Date(lastA.timestamp).getTime();
  });

  const leadsMap = useMemo(() => {
    const map: Record<string, typeof leads[0]> = {};
    leads.forEach(l => { map[l.id] = l; });
    return map;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leadIds.filter(id => {
      const lead = leadsMap[id];
      const name = lead?.fullName || '';
      return name.toLowerCase().includes(search.toLowerCase()) || 
             lead?.email?.toLowerCase().includes(search.toLowerCase()) ||
             lead?.businessType?.toLowerCase().includes(search.toLowerCase());
    });
  }, [leadIds, leadsMap, search]);

  const activeLeadId = selectedLeadId || filteredLeads[0] || '';
  const activeConversations = activeLeadId ? grouped[activeLeadId] || [] : [];
  const activeLead = leadsMap[activeLeadId];
  const activeName = activeLead?.fullName || '';

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversations]);

  // Lead Intelligence Engine - Identical logical behavior to V1 but using Legacy API
  useEffect(() => {
    if (!activeLeadId || !activeLead) return;
    
    if (insightsCache[activeLeadId]) {
      setAiInsights(insightsCache[activeLeadId]);
      return;
    }

    const fetchInsights = async () => {
      setIsGeneratingInsights(true);
      try {
        const leadConvs = (grouped[activeLeadId] || []).map(c => `${c.sender}: ${c.message}`).join('\n');
        const leadMems = memories.filter(m => m.leadId === activeLeadId).map(m => `${m.memoryType}: ${m.memoryValue}`).join('\n');
        
        const prompt = `Analyze this lead and return a JSON object with exactly 4 keys: "signal", "opportunity", "actionTitle", and "actionDesc".
Each value must be 1-2 concise sentences based on actual data. No hallucinations.
If insufficient data, fallback to "No significant signal detected yet.", "No clear opportunity identified yet.", "Continue Nurturing", and "Continue collecting engagement data."

Lead:
Name: ${activeLead.fullName}
Type: ${activeLead.businessType}
Status: ${activeLead.status}
Score: ${activeLead.leadScore}/10
Intent: ${activeLead.intent}
Urgency: ${activeLead.urgency}

Conversations:
${leadConvs || 'None'}

Memories:
${leadMems || 'None'}`;

        const res = await fetch('/api/legacy/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt, 
            leadName: activeLead.fullName,
            context: `Generating Lead Intelligence Insights for Dashboard Panel.`
          })
        });
        
        const data = await res.json();
        
        let parsed;
        try {
            const jsonStr = data.response.match(/\{[\s\S]*\}/)?.[0] || data.response;
            parsed = JSON.parse(jsonStr);
        } catch(e) {
            parsed = {};
        }
        
        const finalInsights = {
            signal: parsed.signal || "No significant signal detected yet.",
            opportunity: parsed.opportunity || "No clear opportunity identified yet.",
            actionTitle: parsed.actionTitle || "Continue Nurturing",
            actionDesc: parsed.actionDesc || "Continue collecting engagement data."
        };

        setInsightsCache(prev => ({ ...prev, [activeLeadId]: finalInsights }));
        setAiInsights(finalInsights);
      } catch (err) {
        console.error("AI Insight Error:", err);
        const fallback = {
          signal: "No significant signal detected yet.",
          opportunity: "No clear opportunity identified yet.",
          actionTitle: "Continue Nurturing",
          actionDesc: "Continue collecting engagement data."
        };
        setInsightsCache(prev => ({ ...prev, [activeLeadId]: fallback }));
        setAiInsights(fallback);
      } finally {
        setIsGeneratingInsights(false);
      }
    };
    
    // Fire generation
    fetchInsights();
  }, [activeLeadId, activeLead, grouped, memories]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeLeadId || !activeLead) return;
    
    const messageText = inputText.trim();
    setInputText('');

    try {
      setIsSending(true);
      const res = await fetch('/api/legacy/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeLeadId,
          message: messageText,
          sender: 'human' // V1 exact flow
        })
      });

      if (!res.ok) {
        throw new Error("Message could not be delivered.");
      }
      
      // Refresh to fetch the new message from the sheet
      await refreshData();
      
    } catch (err: any) {
      alert("Message could not be delivered.");
      console.error(err);
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Safe Timestamp parsing
  const safeTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '';
      return format(d, "h:mm a");
    } catch { 
      return ''; 
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'L';
  };

  // Render Intelligence Badge logic identically to V1 Leads
  const getQualificationLevel = (score: number) => {
    if (score >= 8) return { label: "High", desc: "Ready for sales." };
    if (score >= 5) return { label: "Medium", desc: "Requires nurturing." };
    return { label: "Low", desc: "Not qualified." };
  };

  return (
    <div className="flex h-[calc(100vh-56px)] w-full bg-slate-950 overflow-hidden">
      
      {/* LEFT COLUMN — Dark Dashboard Style */}
      <div className="w-[360px] shrink-0 flex flex-col bg-slate-950 border-r border-slate-800/60 z-10">

        {/* Search Bar */}
        <div className="p-4 bg-slate-950 shrink-0 border-b border-slate-800/60">
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl px-3 h-10 gap-2.5 transition-colors focus-within:border-indigo-500/50 focus-within:bg-slate-900 shadow-inner">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search leads, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-slate-200 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Lead List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                <MessageSquare className="h-5 w-5 text-slate-600" />
              </div>
              <p className="text-[14px] font-medium">No conversations found</p>
            </div>
          ) : (
            filteredLeads.map((leadId) => {
              const convs = grouped[leadId];
              const lead = leadsMap[leadId];
              const name = lead?.fullName || '';
              const lastMsg = convs[convs.length - 1];
              const isActive = activeLeadId === leadId;
              const msgTime = safeTime(lastMsg?.timestamp);
              const preview = lastMsg?.message || '';

              return (
                <button
                  key={leadId}
                  onClick={() => setSelectedLeadId(leadId)}
                  className={`w-full text-left flex items-center gap-3.5 px-4 py-3.5 border-b border-slate-800/40 transition-colors ${
                    isActive ? 'bg-slate-900' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <Avatar className="h-11 w-11 shrink-0 border border-slate-700/50 shadow-sm bg-indigo-600">
                    <AvatarFallback className="bg-indigo-600 text-white font-semibold text-sm">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[15px] font-medium truncate max-w-[160px] ${isActive ? 'text-indigo-400' : 'text-slate-200'}`}>
                        {name}
                      </span>
                      <span className={`text-[11px] shrink-0 ml-2 ${isActive ? 'text-indigo-500/80' : 'text-slate-500'}`}>
                        {msgTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {lastMsg?.sender?.toLowerCase() === 'human' || lastMsg?.sender?.toLowerCase() === 'owner' ? (
                         <CheckCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      ) : lastMsg?.sender?.toLowerCase() === 'ai' ? (
                         <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : null}
                      <p className={`text-[13px] truncate m-0 ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                        {preview}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MIDDLE COLUMN: Chat Feed Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative border-r border-slate-800/60 z-0">
        
        {/* Chat Header */}
        <div className="h-[64px] shrink-0 px-5 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 z-10 shadow-sm">
          <div className="flex items-center gap-3.5">
            <Avatar className="h-10 w-10 shrink-0 border border-slate-700/50 bg-indigo-600 shadow-sm">
               <AvatarFallback className="bg-indigo-600 text-white font-semibold">{getInitials(activeName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h2 className="text-[15px] font-semibold text-slate-100 leading-tight">{activeName || 'Select a lead'}</h2>
              <span className="text-[12px] font-medium text-slate-500 mt-0.5">
                Score <span className="text-emerald-400">{activeLead?.leadScore || '--'}</span>
              </span>
            </div>
          </div>
          {activeLead && (
             <div className="flex items-center gap-2">
                <LegacyBadge status={activeLead.status} />
             </div>
          )}
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 sm:p-6 bg-[#0f172a]">
          {!activeLeadId ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-lg shadow-black/20">
                 <MessageSquare className="h-7 w-7 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">No Conversation Selected</h3>
              <p className="text-sm text-slate-500 mt-2">Select a lead from the sidebar to view history.</p>
            </div>
          ) : activeConversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
                 <Bot className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">Automation Ready</h3>
              <p className="text-sm text-slate-500 mt-2">Ready to engage when the lead responds.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
              {/* Timeline Top Marker */}
              <div className="flex justify-center mb-2">
                <span className="bg-slate-900/80 border border-slate-800 text-slate-400 text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
                  Beginning of History
                </span>
              </div>

              {activeConversations.map((conv, idx) => {
                const msgTime = safeTime(conv.timestamp);
                const isOwner = conv.sender?.toLowerCase() === 'human' || conv.sender?.toLowerCase() === 'owner';
                const isAI = !isOwner && /ai|agent|nexusai|assistant|bot/i.test(conv.sender || '');
                const isOutgoing = isAI || isOwner;

                return (
                  <div key={conv.id || idx} className="flex flex-col w-full group">
                    {!isOutgoing ? (
                      // Incoming (Lead) Bubble
                      <div className="flex justify-start w-full pr-12 sm:pr-24">
                        <div className="relative bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 pt-3 pb-7 shadow-sm max-w-[85%] sm:max-w-[75%]">
                          <p className="text-[12.5px] font-bold text-indigo-400 mb-1 leading-none">{activeName}</p>
                          <p className="text-[14.5px] leading-[1.5] text-slate-200 whitespace-pre-wrap">{conv.message}</p>
                          <span className="absolute right-3 bottom-2 text-[10.5px] font-medium text-slate-500">{msgTime}</span>
                        </div>
                      </div>
                    ) : (
                      // Outgoing (Owner/AI) Bubble
                      <div className="flex justify-end w-full pl-12 sm:pl-24">
                        <div className={`relative border rounded-2xl rounded-tr-sm px-4 pt-3 pb-7 shadow-sm max-w-[85%] sm:max-w-[75%] ${
                          isOwner 
                            ? 'bg-indigo-600/20 border-indigo-500/30' 
                            : 'bg-emerald-900/20 border-emerald-500/30'
                        }`}>
                          <p className={`text-[12.5px] font-bold mb-1 flex items-center gap-1.5 leading-none ${
                            isOwner ? 'text-indigo-400' : 'text-emerald-400'
                          }`}>
                            {isOwner ? 'You' : 'NexusAI Automation'}
                            {isOwner ? <MessageSquare className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                          </p>
                          <p className={`text-[14.5px] leading-[1.5] whitespace-pre-wrap ${
                            isOwner ? 'text-indigo-100' : 'text-emerald-100'
                          }`}>
                            {conv.message}
                          </p>
                          <div className="absolute right-3 bottom-2 flex items-center gap-1.5">
                            <span className="text-[10.5px] font-medium text-slate-400 opacity-70">{msgTime}</span>
                            <CheckCheck className={`h-3.5 w-3.5 ${isOwner ? 'text-indigo-500' : 'text-emerald-500'}`} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} className="h-2" />
            </div>
          )}
        </div>

        {/* Composer Bar (EXACT V1 PARITY) */}
        {activeLeadId && (
          <div className="bg-slate-950 border-t border-slate-800/80 p-4 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] relative z-20">
            {/* Mode Toggle Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                {takeoverActive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[12px] font-bold text-emerald-500 tracking-wide">MANUAL MODE — You are replying</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <span className="text-[12px] font-bold text-indigo-400 tracking-wide">AI MODE — Automation handling conversation</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setTakeoverActive(!takeoverActive)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-colors border ${
                  takeoverActive 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-indigo-500/10 border-indigo-500/30'
                }`}
              >
                <div className={`w-8 h-4 rounded-full relative transition-colors ${
                  takeoverActive ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}>
                  <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all shadow-sm ${
                    takeoverActive ? 'left-[18px]' : 'left-[2px]'
                  }`} />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-widest ${
                  takeoverActive ? 'text-emerald-500' : 'text-indigo-400'
                }`}>
                  {takeoverActive ? 'Manual' : 'AI'}
                </span>
              </button>
            </div>

            {/* Input Row */}
            <div className="flex items-end gap-3">
              <div className={`flex-1 rounded-xl overflow-hidden transition-colors border ${
                takeoverActive 
                  ? 'bg-slate-900 border-emerald-500/40 shadow-[0_0_0_1px_rgba(16,185,129,0.1)] focus-within:border-emerald-500 focus-within:shadow-[0_0_0_1px_rgba(16,185,129,0.2)]' 
                  : 'bg-slate-900/50 border-slate-800'
              }`}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={takeoverActive ? "Type your message..." : "Input locked. Automation is analyzing and responding."}
                  disabled={!takeoverActive || isSending}
                  rows={1}
                  className={`w-full bg-transparent border-none text-[15px] leading-relaxed p-3.5 resize-none max-h-[140px] outline-none font-medium placeholder:font-normal ${
                    takeoverActive ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-600 placeholder:text-slate-600 cursor-not-allowed'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                  }}
                />
              </div>
              
              <button 
                onClick={takeoverActive ? handleSendMessage : undefined}
                disabled={(!takeoverActive) || (!inputText.trim() && takeoverActive) || isSending}
                className={`h-[52px] w-[52px] shrink-0 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                  takeoverActive && inputText.trim() && !isSending
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 hover:shadow-emerald-900/40 cursor-pointer'
                    : takeoverActive 
                      ? 'bg-emerald-900/40 text-emerald-500/50 cursor-not-allowed border border-emerald-800/30'
                      : 'bg-indigo-900/40 text-indigo-500/50 border border-indigo-800/30 cursor-not-allowed'
                }`}
              >
                {takeoverActive ? (
                  isSending ? <Activity className="h-5 w-5 animate-pulse" /> : <Send className="h-5 w-5 ml-1" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Lead Intelligence Center */}
      <div className="w-[420px] shrink-0 flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar z-10">
        {activeLeadId ? (
          <div className="p-6 space-y-6">
            
            {/* 1. Profile Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-[20px] p-7 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                 <Activity className="h-32 w-32 text-indigo-500" />
              </div>
              <div className="flex flex-col items-center text-center relative z-10">
                <Avatar className="h-24 w-24 shrink-0 border-2 border-indigo-500/30 bg-indigo-600 shadow-lg shadow-indigo-900/20 mb-5">
                   <AvatarFallback className="bg-indigo-600 text-white font-bold text-2xl">{getInitials(activeName)}</AvatarFallback>
                </Avatar>
                <h3 className="text-[22px] font-bold text-slate-100 tracking-tight">{activeName}</h3>
                <p className="text-[14px] text-slate-400 font-medium mt-1">{activeLead?.email || 'No email provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-inner">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Company</span>
                  <span className="text-[14px] font-bold text-slate-200 truncate w-full">{activeLead?.businessType || 'Independent'}</span>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-inner">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Source</span>
                  <span className="text-[14px] font-bold text-slate-200 capitalize truncate w-full">{activeLead?.source || 'Direct'}</span>
                </div>
              </div>
            </div>

            {/* 2. Quick Actions */}
            <div className="flex flex-col gap-3">
              <Link href={`/legacy/leads`} className="block w-full">
                <div className="flex items-center justify-between h-[56px] px-5 bg-indigo-600 hover:bg-indigo-500 rounded-[16px] transition-all group cursor-pointer shadow-lg shadow-indigo-900/20 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                     <MessageSquare className="h-5 w-5 text-indigo-100" />
                     <span className="text-[14.5px] font-semibold text-white tracking-wide">View Full Profile</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-indigo-300 group-hover:text-white transition-all group-hover:translate-x-1" />
                </div>
              </Link>
              
              <Link href={`/legacy/memory`} className="block w-full">
                <div className="flex items-center justify-between h-[56px] px-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-[16px] transition-all group cursor-pointer hover:-translate-y-0.5 shadow-sm">
                  <div className="flex items-center gap-3">
                     <Brain className="h-5 w-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                     <span className="text-[14.5px] font-medium text-slate-300 group-hover:text-slate-100 transition-colors">View AI Memory</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-all group-hover:translate-x-1" />
                </div>
              </Link>

              <Link href={`/legacy/appointments`} className="block w-full">
                <div className="flex items-center justify-between h-[56px] px-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-[16px] transition-all group cursor-pointer hover:-translate-y-0.5 shadow-sm">
                  <div className="flex items-center gap-3">
                     <Calendar className="h-5 w-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                     <span className="text-[14.5px] font-medium text-slate-300 group-hover:text-slate-100 transition-colors">Schedule Appointment</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-all group-hover:translate-x-1" />
                </div>
              </Link>
            </div>

            {/* 3. Lead Intelligence Core */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
              <div className="py-5 px-6 border-b border-slate-800/80 bg-slate-900">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Brain className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-[16px] font-bold text-slate-100 tracking-tight">Lead Intelligence</h3>
                </div>
                <p className="text-[13px] text-slate-500 font-medium">
                  AI-powered analysis of CRM activity.
                </p>
              </div>
              
              <div className="p-6 flex flex-col gap-6">
                <div className="flex gap-6 items-center">
                  {/* Circular Dial */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center p-2">
                    <div className="relative w-24 h-24 flex items-center justify-center mb-3 drop-shadow-xl">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800" strokeWidth="3.5"></circle>
                        <circle cx="18" cy="18" r="16" fill="none" className={
                          activeLead?.leadScore >= 8 ? "stroke-emerald-500" :
                          activeLead?.leadScore >= 5 ? "stroke-amber-500" : "stroke-rose-500"
                        } strokeWidth="3.5" strokeDasharray={`${((activeLead?.leadScore || 0) / 10) * 100}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-in-out' }}></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-[26px] font-black leading-none tracking-tight ${
                          activeLead?.leadScore >= 8 ? "text-emerald-400" :
                          activeLead?.leadScore >= 5 ? "text-amber-400" : "text-rose-400"
                        }`}>
                          {activeLead?.leadScore || 0}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Health</span>
                  </div>

                  {/* Badges */}
                  <div className="flex-grow flex flex-col gap-3 w-full">
                    
                    {/* Qualification */}
                    <div className="flex items-center gap-3.5 p-3.5 rounded-[16px] border border-slate-800 bg-slate-800/40 shadow-inner">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        activeLead?.leadScore >= 8 ? "bg-emerald-900/50" : activeLead?.leadScore >= 5 ? "bg-amber-900/50" : "bg-rose-900/50"
                      }`}>
                        <CheckCircle2 className={`h-4 w-4 ${
                          activeLead?.leadScore >= 8 ? "text-emerald-400" : activeLead?.leadScore >= 5 ? "text-amber-400" : "text-rose-400"
                        }`} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Qualification</span>
                        <p className="text-[13px] text-slate-300 font-medium leading-snug truncate">
                          {getQualificationLevel(activeLead?.leadScore || 0).desc}
                        </p>
                      </div>
                    </div>

                    {/* Intent */}
                    <div className="flex items-center gap-3.5 p-3.5 rounded-[16px] border border-slate-800 bg-slate-800/40 shadow-inner">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        activeLead?.intent?.toLowerCase() === "high" ? "bg-orange-900/50" : "bg-blue-900/50"
                      }`}>
                        <Activity className={`h-4 w-4 ${
                          activeLead?.intent?.toLowerCase() === "high" ? "text-orange-400" : "text-blue-400"
                        }`} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Intent Level</span>
                        <p className="text-[13px] text-slate-300 font-medium leading-snug truncate capitalize">
                          {activeLead?.intent || "Medium"}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* 4. AI Insights & Actions */}
            <div className="space-y-4">
              <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest px-2">
                Insights & Actions
              </h4>
              
              <div className="flex flex-col gap-4">
                {/* Key Signal */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-[20px] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-[20px]"></div>
                  <div className="flex items-center gap-2 mb-2 pl-2">
                    <span className="text-[14px] font-bold text-slate-200 tracking-wide">Key Signal</span>
                    {isGeneratingInsights && <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />}
                  </div>
                  <p className={`text-[13.5px] font-medium leading-relaxed pl-2 ${isGeneratingInsights ? "text-slate-600 animate-pulse" : "text-slate-400"}`}>
                    {aiInsights?.signal || "Analyzing lead data..."}
                  </p>
                </div>

                {/* Opportunity */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-[20px] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-[20px]"></div>
                  <div className="flex items-center gap-2 mb-2 pl-2">
                    <span className="text-[14px] font-bold text-slate-200 tracking-wide">Opportunity</span>
                    {isGeneratingInsights && <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />}
                  </div>
                  <p className={`text-[13.5px] font-medium leading-relaxed pl-2 ${isGeneratingInsights ? "text-slate-600 animate-pulse" : "text-slate-400"}`}>
                    {aiInsights?.opportunity || "Evaluating potential..."}
                  </p>
                </div>

                {/* Recommended Action */}
                <div className="p-6 bg-indigo-900/20 border border-indigo-500/20 rounded-[20px] shadow-sm relative overflow-hidden group">
                  <div className="absolute -top-6 -right-6 p-3 opacity-10">
                    <Zap className="h-32 w-32 text-indigo-400" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4" style={{ borderLeft: '3px solid #818cf8', paddingLeft: '12px' }}>
                      <span className="text-[14px] font-bold text-indigo-300 tracking-wide uppercase">Recommended Action</span>
                      {isGeneratingInsights && <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />}
                    </div>
                    
                    <div className="mb-6 pl-3">
                      <h5 className="text-[16px] font-bold text-slate-100 mb-2">
                        {aiInsights?.actionTitle || "Analyzing actions..."}
                      </h5>
                      <p className={`text-[13.5px] font-medium leading-relaxed ${isGeneratingInsights ? "text-indigo-400/40 animate-pulse" : "text-indigo-200/70"}`}>
                        {aiInsights?.actionDesc || "Processing optimal next steps..."}
                      </p>
                    </div>
                    
                    <button className="w-full h-12 text-[14px] font-bold bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl shadow-md shadow-indigo-900/20 transition-all hover:-translate-y-0.5">
                      Execute Action
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <Brain className="h-16 w-16 text-slate-800 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400">Intelligence Standby</h3>
            <p className="text-sm mt-2 max-w-[250px]">Select a conversation to generate real-time AI insights, health scores, and next best actions.</p>
          </div>
        )}
      </div>

    </div>
  );
}
