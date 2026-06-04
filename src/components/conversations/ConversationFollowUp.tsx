"use client";
import { useFollowUpsQuery, useFollowUpMutations, useRealtimeFollowUps } from "@/hooks/use-follow-ups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export function ConversationFollowUp({ leadId }: { leadId: string }) {
  const { data: followUps } = useFollowUpsQuery(leadId);
  const { update } = useFollowUpMutations();
  useRealtimeFollowUps(leadId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pending: any = followUps?.find((f: any) => f.status === "pending");

  if (!pending) return null;

  return (
    <div className="p-3 bg-muted/50 border-t flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">AI Suggestion</Badge> 
          Next Follow-Up
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => update.mutate({ id: pending.id, data: { status: 'paused' } })}>
             <X className="w-3 h-3 mr-1" /> Reject
          </Button>
          <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => update.mutate({ id: pending.id, data: { status: 'scheduled' } })}>
             <Check className="w-3 h-3 mr-1" /> Approve
          </Button>
        </div>
      </div>
      <p className="text-xs text-foreground bg-background p-2 rounded border">{pending.suggested_message}</p>
    </div>
  );
}
