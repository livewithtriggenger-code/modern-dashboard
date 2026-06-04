"use client";

import { useFollowUpsQuery, useFollowUpMutations, useRealtimeFollowUps } from "@/hooks/use-follow-ups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function PendingFollowUpsWidget() {
  const { data: followUps, isLoading } = useFollowUpsQuery();
  const { update } = useFollowUpMutations();
  useRealtimeFollowUps();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pending = followUps?.filter((f: any) => f.status === "pending") || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  if (isLoading) return <Card className="col-span-2"><CardContent className="pt-6">Loading pending follow-ups...</CardContent></Card>;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          Pending Follow-Ups
          <Badge variant="secondary">{pending.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-xl">No pending follow-ups.</p>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pending.slice(0, 5).map((f: any) => (
            <div key={f.id} className="p-3 border rounded-lg bg-card text-sm space-y-3">
              <div className="font-medium flex justify-between items-center">
                <span>{f.leads?.full_name || "Unknown Lead"}</span>
                <Badge variant="outline" className="text-[10px]">AI Draft</Badge>
              </div>

              {editingId === f.id ? (
                <div className="flex gap-2">
                  <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm" />
                  <Button size="icon" className="h-8 w-8" onClick={() => {
                    update.mutate({ id: f.id, data: { suggested_message: editValue } });
                    setEditingId(null);
                  }}><Check className="w-3 h-3" /></Button>
                </div>
              ) : (
                <p className="text-muted-foreground">{f.suggested_message}</p>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                  setEditingId(f.id);
                  setEditValue(f.suggested_message);
                }}>
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => update.mutate({ id: f.id, data: { status: 'paused' } })}>
                  <X className="w-3 h-3 mr-1" /> Reject
                </Button>
                <Button size="sm" className="h-7 px-2" onClick={() => update.mutate({ id: f.id, data: { status: 'scheduled' } })}>
                  <Check className="w-3 h-3 mr-1" /> Approve
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
