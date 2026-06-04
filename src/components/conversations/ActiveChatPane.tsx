"use client";

import { useState, useRef, useEffect } from "react";
import { useMessagesQuery, useConversationMutations, useRealtimeMessages } from "@/hooks/use-conversations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, HandHeart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConversationFollowUp } from "@/components/conversations/ConversationFollowUp";
import { useRealtime } from "@/components/providers/RealtimeProvider";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ActiveChatPane({ thread }: { thread: any }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading } = useMessagesQuery(thread.id);
  const { send, updateStatus } = useConversationMutations();
  useRealtimeMessages(thread.id);
  
  const { typingUsers, setTyping } = useRealtime();
  const typers = typingUsers[thread.id] || [];
  const isSomeoneTyping = typers.length > 0;
  let typingMessage = "Someone is typing...";
  if (typers.includes("ai")) typingMessage = "AI is typing...";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    send.mutate({ threadId: thread.id, content: input.trim() }, {
      onSuccess: () => setInput("")
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setTyping(thread.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(thread.id, false), 1500);
  };

  const leadName = thread.leads?.full_name || "Unknown Lead";
  const initials = leadName.substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{leadName}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {thread.ai_mode === 'handoff' ? 'Human Mode' : 'AI Active'}
              </Badge>
              {thread.ai_mode === 'handoff' && <HandHeart className="w-3 h-3 text-orange-500" />}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={thread.status} 
            onValueChange={(val) => updateStatus.mutate({ threadId: thread.id, status: val })}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 flex flex-col">
          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm my-4">Loading messages...</div>
          ) : messages?.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm my-4">No messages yet.</div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages?.map((msg: any) => {
              const isOperator = msg.sender_type === "human_operator" || msg.sender_type === "ai_agent";
              return (
                <div 
                  key={msg.id} 
                  className={`flex max-w-[80%] ${isOperator ? 'self-end' : 'self-start'} flex-col gap-1`}
                >
                  <div 
                    className={`p-3 rounded-2xl ${
                      isOperator 
                        ? 'bg-violet-600 text-white rounded-tr-sm' 
                        : 'bg-muted rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message_body}</p>
                  </div>
                  <span className={`text-[10px] text-muted-foreground ${isOperator ? 'text-right' : 'text-left'}`}>
                    {msg.sender_type === "ai_agent" ? 'AI Assistant' : msg.sender_type === "human_operator" ? 'You' : leadName}
                  </span>
                </div>
              );
            })
          )}
          {isSomeoneTyping && (
            <div className="flex max-w-[80%] self-start flex-col gap-1">
              <div className="p-3 rounded-2xl bg-muted rounded-tl-sm animate-pulse">
                <p className="text-sm text-muted-foreground italic">{typingMessage}</p>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <ConversationFollowUp leadId={thread.lead_id} />

      {/* Input */}
      <div className="p-4 bg-background border-t">
        <div className="flex gap-2">
          <Textarea 
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send)"
            className="min-h-[60px] resize-none"
            disabled={send.isPending || thread.status === 'closed'}
          />
          <Button 
            className="h-auto" 
            onClick={handleSend}
            disabled={!input.trim() || send.isPending || thread.status === 'closed'}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
