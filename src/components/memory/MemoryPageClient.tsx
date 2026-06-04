"use client";

import { useMemoriesQuery, useMemoryMutations, useRealtimeMemories } from "@/hooks/use-memory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Edit2, Check } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function MemoryPageClient() {
  const { data: memories, isLoading } = useMemoriesQuery();
  const { update, remove } = useMemoryMutations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  useRealtimeMemories(); // Ensure real-time updates for the global list

  if (isLoading) return <div>Loading...</div>;

  return (
    <ScrollArea className="flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {memories?.map((memory: any) => (
          <div key={memory.id} className="p-4 border rounded-xl bg-card shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="capitalize text-xs">
                {memory.memory_type}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(memory.confidence_score)}% Conf
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Lead: <span className="font-medium text-foreground">{memory.leads?.full_name || "Unknown"}</span>
            </div>

            {editingId === memory.id ? (
              <div className="flex gap-2">
                <Input 
                  value={editValue} 
                  onChange={(e) => setEditValue(e.target.value)} 
                  className="h-8 text-sm"
                />
                <Button 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => {
                    update.mutate({ memoryId: memory.id, value: editValue });
                    setEditingId(null);
                  }}
                  disabled={update.isPending}
                >
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <p className="text-sm font-medium leading-relaxed">
                {memory.memory_value}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => {
                  setEditingId(memory.id);
                  setEditValue(memory.memory_value);
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-destructive"
                onClick={() => remove.mutate(memory.id)}
                disabled={remove.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
