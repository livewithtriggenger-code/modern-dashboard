"use client";

import { useState } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Loader2, Search } from "lucide-react";
import { format } from "date-fns";

export default function LegacyConversationsPage() {
  const { leads, conversations, refreshData } = useLegacyStore();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const activeLeads = leads.filter(l => l.conversationId);
  const filteredLeads = activeLeads.filter(l => 
    l.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLead = activeLeads.find(l => l.conversationId === selectedLeadId);
  const thread = conversations.filter(c => c.conversationId === selectedLeadId).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const handleSend = async () => {
    if (!message.trim() || !selectedLeadId) return;

    try {
      setIsSending(true);
      const res = await fetch('/api/legacy/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedLeadId,
          message: message,
          sender: 'human'
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setMessage("");
      // Refresh to pull the new message from sheets
      await refreshData();
    } catch (error: any) {
      alert("Error sending message: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedLeadId || !selectedLead) return;

    try {
      setIsGenerating(true);
      
      // Get recent context
      const context = thread.slice(-5).map(m => `${m.sender}: ${m.message}`).join('\n');
      
      const res = await fetch('/api/legacy/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Draft a helpful and concise reply to continue this conversation.",
          conversationId: selectedLeadId,
          leadName: selectedLead.fullName,
          context: context
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate AI response');
      }

      // Refresh to pull the newly logged AI message from sheets
      await refreshData();
    } catch (error: any) {
      alert("Error generating AI response: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Conversations</h1>
        <p className="text-sm text-slate-500 mt-1">Manage Telegram chats powered by Google Sheets.</p>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        {/* Left sidebar: Leads List */}
        <Card className="col-span-1 flex flex-col min-h-0">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg">Active Chats</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search leads..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredLeads.map((lead) => (
                <button
                  key={lead.conversationId}
                  onClick={() => setSelectedLeadId(lead.conversationId)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedLeadId === lead.conversationId 
                      ? 'bg-violet-100 text-violet-900' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-medium text-sm">{lead.fullName}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">{lead.businessName}</div>
                </button>
              ))}
              {filteredLeads.length === 0 && (
                <div className="text-center text-slate-500 text-sm p-4">No active chats found.</div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right area: Chat Thread */}
        <Card className="col-span-2 flex flex-col min-h-0">
          {selectedLeadId ? (
            <>
              <CardHeader className="py-4 border-b shrink-0 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedLead?.fullName}</CardTitle>
                  <div className="text-xs text-slate-500">{selectedLead?.phone}</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                  Auto-Reply via AI
                </Button>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {thread.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col max-w-[80%] ${
                        msg.sender === 'human' ? 'ml-auto items-end' : 
                        msg.sender === 'ai' ? 'ml-auto items-end' : 'items-start'
                      }`}
                    >
                      <div className={`p-3 rounded-xl text-sm ${
                        msg.sender === 'human' ? 'bg-violet-600 text-white rounded-br-none' : 
                        msg.sender === 'ai' ? 'bg-indigo-500 text-white rounded-br-none' : 
                        'bg-slate-100 text-slate-900 rounded-bl-none'
                      }`}>
                        {msg.message}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        {msg.sender === 'ai' && <Bot className="w-3 h-3" />}
                        {msg.timestamp ? format(new Date(msg.timestamp), 'MMM d, h:mm a') : ''}
                      </div>
                    </div>
                  ))}
                  {thread.length === 0 && (
                    <div className="text-center text-slate-500 text-sm h-full flex flex-col items-center justify-center pt-20">
                      <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                      <p>No messages in this thread yet.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-slate-50 shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                >
                  <Input 
                    placeholder="Type a message..." 
                    className="flex-1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSending || isGenerating}
                  />
                  <Button type="submit" disabled={!message.trim() || isSending || isGenerating}>
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
