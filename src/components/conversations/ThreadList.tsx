"use client";

import { useState } from "react";
import { useThreadsQuery } from "@/hooks/use-conversations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ThreadList({ selectedThreadId, onSelectThread }: { selectedThreadId?: string, onSelectThread: (t: any) => void }) {
  const [statusFilter, setStatusFilter] = useState("active");
  const { data: threads, isLoading } = useThreadsQuery(statusFilter);

  return (
    <>
      <div className="p-4 border-b flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Inbox</h2>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Status Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading threads...</div>
        ) : !threads || threads.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No conversations found.</div>
        ) : (
          <div className="flex flex-col">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {threads.map((thread: any) => {
              const leadName = thread.leads?.full_name || "Unknown Lead";
              const initials = leadName.substring(0, 2).toUpperCase();
              
              return (
                <button
                  key={thread.id}
                  onClick={() => onSelectThread(thread)}
                  className={`flex items-start gap-3 p-4 text-left border-b hover:bg-muted/50 transition-colors ${
                    selectedThreadId === thread.id ? "bg-muted" : ""
                  }`}
                >
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{leadName}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {thread.updated_at ? formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {thread.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        View conversation
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </>
  );
}
