"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LegacyBadge } from "@/legacy/components/ui/LegacyBadge";
import { 
  Search, Bot, MessageSquare, Phone, Mail, Send, Brain, Zap, 
  Calendar, Sparkles, Activity, CheckCircle2, ChevronRight, 
  CheckCheck, Mic, Paperclip
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function LegacyConversationsPage() {
  const { leads, conversations, memories, refreshData, addConversation } = useLegacyStore();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  const [aiInsights, setAiInsights] = useState<{ signal: string, opportunity: string, actionTitle: string, actionDesc: string } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsCache, setInsightsCache] = useState<Record<string, any>>({});
  
  const [search, setSearch] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
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

  // Load cached insights when switching leads
  useEffect(() => {
    if (activeLeadId) {
      if (insightsCache[activeLeadId]) {
        setAiInsights(insightsCache[activeLeadId]);
      } else {
        setAiInsights(null); // Require explicit Execution
      }
    }
  }, [activeLeadId, insightsCache]);

  const handleExecuteAction = async () => {
    if (!activeLeadId || !activeLead) return;
    
    setIsGeneratingInsights(true);
    try {
      const leadConvs = (grouped[activeLeadId] || []).map(c => `${c.sender}: ${c.message}`).join('\n');
      const leadMems = memories.filter(m => m.leadId === activeLeadId).map(m => `${m.memoryType}: ${m.memoryValue}`).join('\n');
      
      const prompt = `Analyze this lead and return a JSON object with exactly 4 keys: "signal", "opportunity", "actionTitle", and "actionDesc".
Each value must be 1-2 concise sentences based on actual data.

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
      
      if (!res.ok) throw new Error("AI API failed");
      const data = await res.json();
      
      let parsed;
      try {
          const jsonStr = data.response.match(/\{[\s\S]*\}/)?.[0] || data.response;
          parsed = JSON.parse(jsonStr);
      } catch(e) {
          console.error("Failed to parse JSON", data.response);
          parsed = {};
      }
      
      const finalInsights = {
          signal: parsed.signal || "High intent engagement detected.",
          opportunity: parsed.opportunity || "Lead is ready for a booking conversion.",
          actionTitle: parsed.actionTitle || "Propose Booking",
          actionDesc: parsed.actionDesc || "Send the scheduling link to finalize the appointment."
      };

      setInsightsCache(prev => ({ ...prev, [activeLeadId]: finalInsights }));
      setAiInsights(finalInsights);
    } catch (err) {
      console.error("AI Insight Error:", err);
      // Fallback for demo if Grok fails
      const fallback = {
        signal: "Active communication established.",
        opportunity: "Ready for the next stage in the pipeline.",
        actionTitle: "Continue Nurturing",
        actionDesc: "Send a follow-up to maintain engagement."
      };
      setInsightsCache(prev => ({ ...prev, [activeLeadId]: fallback }));
      setAiInsights(fallback);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeLeadId || !activeLead) return;
    
    const messageText = inputText.trim();
    setInputText('');

    // Optimistic Update
    const tempMsg = {
      id: Date.now().toString(),
      leadId: activeLeadId,
      message: messageText,
      sender: 'owner',
      timestamp: new Date().toISOString()
    };
    
    addConversation(tempMsg);

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
      
      refreshData();
      
    } catch (err: any) {
      alert("Message could not be delivered.");
      console.error(err);
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

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

  const getQualificationLevel = (score: number) => {
    if (score >= 8) return { label: "High", desc: "Ready for sales." };
    if (score >= 5) return { label: "Medium", desc: "Requires nurturing." };
    return { label: "Low", desc: "Not qualified." };
  };

  return (
    <div style={{ position: 'fixed', top: '64px', left: '256px', right: 0, bottom: 0 }} className="flex bg-[#0B0F19] overflow-hidden z-[5]">
      
      {/* LEFT COLUMN — Chat List */}
      <div className="w-[360px] shrink-0 flex flex-col bg-[#0B0F19] border-r border-slate-800/60 z-10">
        <div className="p-4 shrink-0 border-b border-slate-800/60 bg-[#0B0F19]">
          <div className="flex items-center bg-[#131B2C] border border-slate-800 rounded-xl px-3 h-10 gap-2.5 transition-colors focus-within:border-indigo-500/50 shadow-inner">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search leads, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-slate-200 placeholder:text-slate-500 w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#131B2C] flex items-center justify-center border border-slate-800">
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
                    isActive ? 'bg-[#131B2C]' : 'hover:bg-slate-900/50'
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
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F19] relative border-r border-slate-800/60 overflow-hidden z-0">
        
        {/* Chat Header */}
        <div className="h-[64px] shrink-0 px-5 flex items-center justify-between bg-[#131B2C]/95 backdrop-blur-xl border-b border-slate-800/60 z-20 shadow-sm w-full">
          <div className="flex items-center gap-3.5">
            <Avatar className="h-10 w-10 shrink-0 border border-slate-700/50 bg-indigo-600 shadow-sm">
               <AvatarFallback className="bg-indigo-600 text-white font-semibold">{getInitials(activeName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h2 className="text-[15px] font-semibold text-slate-100 leading-tight">{activeName || 'Select a lead'}</h2>
              <span className="text-[12px] font-medium text-slate-500 mt-0.5">
                Score <span className="text-amber-500 font-bold">{activeLead?.leadScore || '--'}</span>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative p-4 sm:p-6 w-full bg-[#0B0F19] flex flex-col">
          {/* Abstract Premium Chat Background */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0B0F19]/80 via-transparent to-[#0B0F19]/90 pointer-events-none"></div>

          <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full px-2 sm:px-[5%] pb-8">
            {!activeLeadId ? (
              <div className="m-auto flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-lg shadow-black/20">
                   <MessageSquare className="h-7 w-7 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-300">No Conversation Selected</h3>
                <p className="text-sm text-slate-500 mt-2">Select a lead from the sidebar to view history.</p>
              </div>
            ) : activeConversations.length === 0 ? (
              <div className="m-auto flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
                   <Bot className="h-7 w-7 text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-300">Automation Ready</h3>
                <p className="text-sm text-slate-500 mt-2">Ready to engage when the lead responds.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6 mt-4">
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
                    <div key={conv.id || idx} className="flex flex-col w-full group mb-2 overflow-hidden">
                      {!isOutgoing ? (
                        <div className="flex justify-start w-full pr-12 sm:pr-24 my-1">
                          <div className="relative bg-[#1e293b] border border-slate-700/60 rounded-xl rounded-tl-sm px-3.5 pt-2.5 pb-[26px] shadow-sm max-w-[85%] break-words">
                            <svg style={{ position: 'absolute', top: '-1px', left: '-8px' }} width="9" height="14" viewBox="0 0 9 14">
                              <path d="M9 0 L0 0 L0 14 Q4 7 9 0 Z" fill="#1e293b" />
                            </svg>
                            <p className="text-[13px] font-semibold text-indigo-400 mb-[5px] leading-none">{activeName}</p>
                            <p className="text-[14.5px] leading-[1.4] text-slate-200 break-words whitespace-pre-wrap max-w-full overflow-hidden m-0">{conv.message}</p>
                            <span className="absolute right-3 bottom-1.5 text-[10.5px] font-medium text-slate-400/80 leading-none">{msgTime}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end w-full pl-12 sm:pl-24 my-1">
                          <div className={`relative border rounded-xl rounded-tr-sm px-3.5 pt-2.5 pb-[26px] shadow-sm max-w-[85%] break-words ${
                            isOwner 
                              ? 'bg-[#312e81] border-indigo-700/50' 
                              : 'bg-[#064e3b] border-emerald-700/50'
                          }`}>
                            <svg style={{ position: 'absolute', top: '-1px', right: '-8px' }} width="9" height="14" viewBox="0 0 9 14">
                              <path d="M0 0 L9 0 L9 14 Q5 7 0 0 Z" fill={isOwner ? '#312e81' : '#064e3b'} />
                            </svg>
                            <p className={`text-[13px] font-semibold mb-[5px] flex items-center gap-1.5 leading-none ${
                              isOwner ? 'text-indigo-300' : 'text-emerald-300'
                            }`}>
                              {isOwner ? 'Workspace Owner' : 'NexusAI Automation'}
                              {isOwner ? <MessageSquare className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                            </p>
                            <p className={`text-[14.5px] leading-[1.4] break-words whitespace-pre-wrap max-w-full overflow-hidden m-0 ${
                              isOwner ? 'text-indigo-50' : 'text-emerald-50'
                            }`}>
                              {conv.message}
                            </p>
                            <div className="absolute right-3 bottom-1.5 flex items-center gap-1.5">
                              <span className="text-[10.5px] font-medium text-white/50 leading-none">{msgTime}</span>
                              <CheckCheck className={`h-[14px] w-[14px] ${isOwner ? 'text-indigo-300' : 'text-emerald-300'}`} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            <div ref={chatEndRef} className="h-2 shrink-0" />
          </div>
        </div>

        {/* WhatsApp-Style Composer Bar */}
        {activeLeadId && (
          <div className="bg-[#0B0F19] px-4 pb-4 pt-2 shrink-0 relative z-20 w-full overflow-visible">
            <div className="max-w-4xl mx-auto w-full flex flex-col">
              
              {/* Integrated Native Toggle */}
              <div className="flex items-center justify-between mb-2.5 px-2">
                <div className="flex items-center gap-2 transition-all">
                  {isManualMode ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[12px] font-bold text-emerald-500 tracking-wide">Manual Mode — You are replying</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      <span className="text-[12px] font-bold text-indigo-400 tracking-wide">AI Mode — Automation handling conversation</span>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setIsManualMode(!isManualMode)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-colors border ${
                    isManualMode 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-indigo-500/10 border-indigo-500/30'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    isManualMode ? 'text-emerald-500' : 'text-indigo-400'
                  }`}>
                    {isManualMode ? 'Manual' : 'AI'}
                  </span>
                  <div className={`w-7 h-4 rounded-full relative transition-colors ${
                    isManualMode ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}>
                    <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all shadow-sm ${
                      isManualMode ? 'left-[14px]' : 'left-[2px]'
                    }`} />
                  </div>
                </button>
              </div>

              {/* Pill-Shaped Input Area */}
              <div className={`flex items-end gap-2 p-2 rounded-3xl transition-all shadow-sm ${
                isManualMode 
                  ? 'bg-[#1e293b] border border-slate-700/60 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50' 
                  : 'bg-[#131B2C] border border-slate-800 opacity-80 cursor-not-allowed'
              }`}>
                {/* Optional Attachment Button */}
                <button 
                  disabled={!isManualMode}
                  className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                    isManualMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600'
                  }`}
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isManualMode ? "Type your message..." : "Input locked. Automation is analyzing and responding."}
                  disabled={!isManualMode || isSending}
                  rows={1}
                  className={`flex-1 bg-transparent border-none text-[15px] p-2.5 resize-none max-h-[120px] outline-none leading-relaxed ${
                    isManualMode ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-600 placeholder:text-slate-600 cursor-not-allowed'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                  }}
                />

                <button 
                  onClick={isManualMode ? handleSendMessage : undefined}
                  disabled={(!isManualMode) || (!inputText.trim() && isManualMode) || isSending}
                  className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
                    isManualMode && inputText.trim() && !isSending
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                      : isManualMode 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-900/30 text-indigo-500/30 cursor-not-allowed'
                  }`}
                >
                  {isManualMode ? (
                    isSending ? <Activity className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4 ml-0.5" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </button>
                {isManualMode && !inputText.trim() && (
                  <button className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors ml-1 hidden sm:flex">
                    <Mic className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Lead Intelligence Center */}
      <div className="w-[420px] shrink-0 flex flex-col bg-[#0B0F19] overflow-y-auto overflow-x-hidden custom-scrollbar z-10 border-l border-slate-800/60">
        {activeLeadId ? (
          <div className="p-6 space-y-6">
            
            {/* 1. Profile Card with 4 metrics like V1 */}
            <div className="bg-[#131B2C] border border-slate-800/80 rounded-[20px] p-7 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                 <Activity className="h-32 w-32 text-indigo-500" />
              </div>
              <div className="flex flex-col items-center text-center relative z-10">
                <Avatar className="h-24 w-24 shrink-0 border-2 border-indigo-500/30 bg-indigo-600 shadow-lg shadow-indigo-900/20 mb-5 text-[28px] font-bold">
                   <AvatarFallback className="bg-indigo-600 text-white font-bold">{getInitials(activeName)}</AvatarFallback>
                </Avatar>
                <h3 className="text-[22px] font-bold text-slate-100 tracking-tight">{activeName}</h3>
                <p className="text-[14px] text-slate-400 font-medium mt-1">{activeLead?.email || 'No email provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-inner transition-colors hover:bg-indigo-900/30">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Company</span>
                  <span className="text-[14px] font-bold text-indigo-100 truncate w-full">{activeLead?.businessType || 'Independent'}</span>
                </div>
                <div className="bg-violet-900/20 border border-violet-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-inner transition-colors hover:bg-violet-900/30">
                  <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">Source</span>
                  <span className="text-[14px] font-bold text-violet-100 capitalize truncate w-full">{activeLead?.source || 'Direct'}</span>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-inner transition-colors hover:bg-emerald-900/30">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Status</span>
                  <div className="flex"><LegacyBadge status={activeLead?.status || 'new'} /></div>
                </div>
                <div className="bg-amber-900/20 border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-inner transition-colors hover:bg-amber-900/30">
                  <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Score</span>
                  <span className="text-[18px] font-black text-amber-500 tracking-tight leading-none">{activeLead?.leadScore || '--'}</span>
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
                <div className="flex items-center justify-between h-[56px] px-5 bg-[#131B2C] hover:bg-slate-800 border border-slate-800/80 rounded-[16px] transition-all group cursor-pointer hover:-translate-y-0.5 shadow-sm">
                  <div className="flex items-center gap-3">
                     <Brain className="h-5 w-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                     <span className="text-[14.5px] font-medium text-slate-300 group-hover:text-slate-100 transition-colors">View AI Memory</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-all group-hover:translate-x-1" />
                </div>
              </Link>

              <Link href={`/legacy/appointments`} className="block w-full">
                <div className="flex items-center justify-between h-[56px] px-5 bg-[#131B2C] hover:bg-slate-800 border border-slate-800/80 rounded-[16px] transition-all group cursor-pointer hover:-translate-y-0.5 shadow-sm">
                  <div className="flex items-center gap-3">
                     <Calendar className="h-5 w-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                     <span className="text-[14.5px] font-medium text-slate-300 group-hover:text-slate-100 transition-colors">Schedule Appointment</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-all group-hover:translate-x-1" />
                </div>
              </Link>
            </div>

            {/* 3. Lead Intelligence Core - FIXED CLIPPING BUG */}
            <div className="bg-[#131B2C] border border-slate-800/80 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
              <div className="py-5 px-6 border-b border-slate-800/80 bg-[#131B2C]">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Brain className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-[16px] font-bold text-slate-100 tracking-tight">Lead Intelligence</h3>
                </div>
                <p className="text-[13px] text-slate-500 font-medium">
                  AI-powered analysis of CRM activity.
                </p>
              </div>
              
              <div className="p-5 flex flex-col gap-6">
                {/* Horizontal split matched to fit neatly within 420px */}
                <div className="flex flex-row gap-5 items-center justify-between">
                  {/* Circular Dial - Maintained Prominence */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center pl-1">
                    <div className="relative w-20 h-20 flex items-center justify-center mb-2 drop-shadow-xl">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800" strokeWidth="3.5"></circle>
                        <circle cx="18" cy="18" r="16" fill="none" className={
                          activeLead?.leadScore >= 8 ? "stroke-emerald-500" :
                          activeLead?.leadScore >= 5 ? "stroke-amber-500" : "stroke-rose-500"
                        } strokeWidth="3.5" strokeDasharray={`${((activeLead?.leadScore || 0) / 10) * 100}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-in-out' }}></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-[24px] font-black leading-none tracking-tight ${
                          activeLead?.leadScore >= 8 ? "text-emerald-400" :
                          activeLead?.leadScore >= 5 ? "text-amber-400" : "text-rose-400"
                        }`}>
                          {activeLead?.leadScore || 0}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health</span>
                  </div>

                  {/* Badges - Completely contained without overflow */}
                  <div className="flex-1 flex flex-col gap-3 min-w-0 pr-1">
                    
                    {/* Qualification */}
                    <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-slate-800 bg-[#0B0F19]/50 shadow-inner w-full min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          activeLead?.leadScore >= 8 ? "bg-emerald-900/50" : activeLead?.leadScore >= 5 ? "bg-amber-900/50" : "bg-rose-900/50"
                        }`}>
                          <CheckCircle2 className={`h-3.5 w-3.5 ${
                            activeLead?.leadScore >= 8 ? "text-emerald-400" : activeLead?.leadScore >= 5 ? "text-amber-400" : "text-rose-400"
                          }`} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">Qualification</span>
                          <p className="text-[12px] text-slate-300 font-medium truncate">
                            {getQualificationLevel(activeLead?.leadScore || 0).desc}
                          </p>
                        </div>
                      </div>
                      <div className="mt-0.5 ml-9">
                        <span className={`text-[13px] font-bold truncate block ${
                          activeLead?.leadScore >= 8 ? "text-emerald-400" : activeLead?.leadScore >= 5 ? "text-amber-400" : "text-rose-400"
                        }`}>
                          {getQualificationLevel(activeLead?.leadScore || 0).label}
                        </span>
                      </div>
                    </div>

                    {/* Intent */}
                    <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-slate-800 bg-[#0B0F19]/50 shadow-inner w-full min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          activeLead?.intent?.toLowerCase() === "high" ? "bg-orange-900/50" : "bg-blue-900/50"
                        }`}>
                          <Activity className={`h-3.5 w-3.5 ${
                            activeLead?.intent?.toLowerCase() === "high" ? "text-orange-400" : "text-blue-400"
                          }`} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">Intent Level</span>
                          <p className="text-[12px] text-slate-300 font-medium truncate capitalize">
                            {activeLead?.intent?.toLowerCase() === "high" ? "Active." : "Passive consumption."}
                          </p>
                        </div>
                      </div>
                      <div className="mt-0.5 ml-9">
                        <span className={`text-[13px] font-bold capitalize truncate block ${
                          activeLead?.intent?.toLowerCase() === "high" ? "text-orange-400" : "text-blue-400"
                        }`}>
                          {activeLead?.intent || "Medium"}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* 4. AI Insights & Actions Styled Exactly Like V1 */}
            <div className="space-y-4 pb-12">
              <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest px-1">
                Insights & Actions
              </h4>
              
              <div className="flex flex-col gap-4">
                {/* Key Signal Card */}
                <div className="p-5 bg-gradient-to-br from-indigo-900/30 to-[#131B2C] border border-indigo-500/20 rounded-[20px] shadow-sm transition-all hover:shadow-md hover:border-indigo-500/40">
                  <div className="flex items-center gap-2 mb-2" style={{ borderLeft: '3px solid #6366f1', paddingLeft: '10px' }}>
                    <span className="text-[14px] font-bold text-slate-100 tracking-tight">Key Signal</span>
                    {isGeneratingInsights && <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />}
                  </div>
                  <p className={`text-[13.5px] font-medium leading-relaxed ${isGeneratingInsights ? "text-slate-500 animate-pulse" : "text-slate-300"}`}>
                    {aiInsights?.signal || "No significant signal detected yet."}
                  </p>
                </div>

                {/* Opportunity Card */}
                <div className="p-5 bg-gradient-to-br from-emerald-900/30 to-[#131B2C] border border-emerald-500/20 rounded-[20px] shadow-sm transition-all hover:shadow-md hover:border-emerald-500/40">
                  <div className="flex items-center gap-2 mb-2" style={{ borderLeft: '3px solid #10b981', paddingLeft: '10px' }}>
                    <span className="text-[14px] font-bold text-slate-100 tracking-tight">Opportunity</span>
                    {isGeneratingInsights && <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />}
                  </div>
                  <p className={`text-[13.5px] font-medium leading-relaxed ${isGeneratingInsights ? "text-slate-500 animate-pulse" : "text-slate-300"}`}>
                    {aiInsights?.opportunity || "No clear opportunity identified yet."}
                  </p>
                </div>

                {/* Recommended Action Card */}
                <div className="p-6 bg-gradient-to-br from-blue-900/30 to-[#131B2C] border border-blue-500/20 rounded-[20px] shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-blue-500/40">
                  <div className="absolute -top-4 -right-4 p-3 opacity-[0.05]">
                    <Zap className="h-28 w-28 text-blue-400" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-5" style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '10px' }}>
                      <span className="text-[14px] font-bold text-blue-400 tracking-tight">Recommended Action</span>
                      {isGeneratingInsights && <Activity className="h-3.5 w-3.5 text-blue-400 animate-pulse" />}
                    </div>
                    
                    <div className="mb-6">
                      <h5 className="text-[15px] font-bold text-slate-100 mb-1.5">
                        {aiInsights?.actionTitle || "Continue Nurturing"}
                      </h5>
                      <p className={`text-[13px] font-medium leading-relaxed ${isGeneratingInsights ? "text-slate-500 animate-pulse" : "text-slate-400"}`}>
                        {aiInsights?.actionDesc || "Continue collecting engagement data."}
                      </p>
                    </div>
                    
                    {/* FIXED: WIRED TO EXECUTE ANALYSIS */}
                    <button 
                      onClick={handleExecuteAction}
                      disabled={isGeneratingInsights}
                      className={`w-full h-11 text-[13.5px] font-bold text-white rounded-[12px] shadow-sm transition-all flex items-center justify-center gap-2 ${
                        isGeneratingInsights 
                          ? 'bg-blue-600/50 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {isGeneratingInsights ? (
                        <>
                          <Activity className="h-4 w-4 animate-pulse" />
                          Processing...
                        </>
                      ) : (
                        "Execute Action"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 w-full">
            <Brain className="h-16 w-16 text-slate-800 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400">Intelligence Standby</h3>
            <p className="text-sm mt-2 max-w-[250px]">Select a conversation to generate real-time AI insights, health scores, and next best actions.</p>
          </div>
        )}
      </div>

    </div>
  );
}
