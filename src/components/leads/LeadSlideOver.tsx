"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeadMutation, useLeadQuery, useIntelligenceQuery, useRealtimeIntelligence } from "@/hooks/use-leads";
import { Badge } from "@/components/ui/badge";
import { LeadFollowUpTimeline } from "@/components/leads/LeadFollowUpTimeline";

export function LeadSlideOver({ leadId, open, onOpenChange }: { leadId: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const isNew = leadId === "new";
  const { create, update, remove } = useLeadMutation();
  const { data: leadData, isLoading } = useLeadQuery(leadId);
  const { data: intelligence } = useIntelligenceQuery(leadId);
  useRealtimeIntelligence(leadId);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>({
    full_name: "",
    email: "",
    phone: "",
    status: "new",
    intent: "low",
    urgency: "low",
    lead_score: 0,
  });

  useEffect(() => {
    if (leadData && !isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(leadData);
    } else if (isNew) {
       
      setFormData({ full_name: "", email: "", phone: "", status: "new", intent: "low", urgency: "low", lead_score: 0 });
    }
  }, [leadData, isNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      create.mutate(formData, { onSuccess: () => onOpenChange(false) });
    } else {
      update.mutate({ id: leadId!, data: formData }, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this lead?")) {
      remove.mutate(leadId!, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isNew ? "Create New Lead" : "Edit Lead"}</SheetTitle>
          <SheetDescription>
            {isNew ? "Add a new lead to your pipeline." : "Update lead details and intelligence."}
          </SheetDescription>
        </SheetHeader>

        {isLoading && !isNew ? (
          <div className="py-6 text-center text-muted-foreground">Loading lead data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  required
                  value={formData.full_name || ""}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lead Score (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.lead_score || 0}
                    onChange={(e) => setFormData({ ...formData, lead_score: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Intent</Label>
                  <Select value={formData.intent} onValueChange={(val) => setFormData({ ...formData, intent: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={formData.urgency} onValueChange={(val) => setFormData({ ...formData, urgency: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {intelligence && !isNew && (() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const intel = intelligence as any;
                return (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-sm">Lead Intelligence (AI Generated)</h3>
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <div><span className="font-medium text-foreground">Priority:</span> <Badge variant="outline" className="ml-1 text-[10px] uppercase">{intel.priority}</Badge></div>
                      <div><span className="font-medium text-foreground">Health Score:</span> {Math.round(intel.health_score || 0)}</div>
                      <div><span className="font-medium text-foreground">Qualification:</span> {intel.qualification}</div>
                      <div><span className="font-medium text-foreground">Opportunity:</span> {intel.opportunity}</div>
                      <div><span className="font-medium text-foreground">Next Action:</span> {intel.recommended_action}</div>
                    </div>
                  </div>
                );
              })()}
              
              {!isNew && <LeadFollowUpTimeline leadId={leadId!} />}
            </div>

            <SheetFooter className="flex-row justify-between sm:justify-between pt-4">
              {!isNew && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending || update.isPending}>
                  Save Changes
                </Button>
              </div>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
