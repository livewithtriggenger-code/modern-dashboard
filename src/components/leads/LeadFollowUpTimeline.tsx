"use client";

import { useFollowUpsQuery, useFollowUpMutations, useRealtimeFollowUps } from "@/hooks/use-follow-ups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw } from "lucide-react";

export function LeadFollowUpTimeline({ leadId }: { leadId: string }) {
  const { data: followUps, isLoading } = useFollowUpsQuery(leadId);
  const { update, generate } = useFollowUpMutations();
  useRealtimeFollowUps(leadId);

  if (isLoading) return <div className="text-xs text-muted-foreground">Loading follow-ups...</div>;

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">Follow-Up Timeline</h3>
        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => generate.mutate(leadId)} disabled={generate.isPending}>
          <RefreshCw className="w-3 h-3 mr-1" /> Generate
        </Button>
      </div>

      <div className="space-y-3">
        {followUps?.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded">No follow-ups.</p>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          followUps?.map((f: any) => (
            <div key={f.id} className="p-2 border rounded bg-card text-xs space-y-2">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="capitalize text-[9px]">{f.status}</Badge>
                <span className="text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-muted-foreground">{f.suggested_message}</p>
              
              {f.status === "pending" && (
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px]" onClick={() => update.mutate({ id: f.id, data: { status: 'paused' } })}>
                    <X className="w-2 h-2 mr-1" /> Reject
                  </Button>
                  <Button size="sm" className="h-5 px-2 text-[10px]" onClick={() => update.mutate({ id: f.id, data: { status: 'scheduled' } })}>
                    <Check className="w-2 h-2 mr-1" /> Approve
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
