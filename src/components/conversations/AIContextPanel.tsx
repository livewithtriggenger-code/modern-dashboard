"use client";

import { useAIMemoriesQuery } from "@/hooks/use-conversations";
import { useRealtimeMemories } from "@/hooks/use-memory";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, User, Calendar, MapPin, Tag, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MemoryIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'preference': return <Tag className="w-4 h-4" />;
    case 'behavior': return <Activity className="w-4 h-4" />;
    case 'context': return <MapPin className="w-4 h-4" />;
    case 'intent': return <Brain className="w-4 h-4" />;
    case 'timeline': return <Calendar className="w-4 h-4" />;
    default: return <User className="w-4 h-4" />;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AIContextPanel({ lead }: { lead: any }) {
  const { data: memories, isLoading } = useAIMemoriesQuery(lead.id);
  useRealtimeMemories(lead.id);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-500" /> AI Memory
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Extracted context for {lead.full_name}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center">Loading memories...</div>
        ) : !memories || memories.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center">No AI memories extracted yet.</div>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {memories.map((memory: any) => (
              <div key={memory.id} className="p-3 border rounded-lg bg-card shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="flex items-center gap-1 capitalize text-xs">
                    <MemoryIcon type={memory.memory_type} />
                    {memory.memory_type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(memory.confidence_score)}% Confidence
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  {memory.memory_value}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
