"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeadsQuery } from "@/hooks/use-leads";
import { useAppointmentMutations } from "@/hooks/use-appointments";

export function ScheduleAppointmentModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: leads, isLoading: leadsLoading } = useLeadsQuery(1, 100);
  const { create } = useAppointmentMutations();
  
  const [formData, setFormData] = useState({
    lead_id: "",
    appointment_start: "",
    appointment_end: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      ...formData,
      appointment_start: new Date(formData.appointment_start).toISOString(),
      appointment_end: new Date(formData.appointment_end).toISOString(),
    }, {
      onSuccess: () => {
        setFormData({ lead_id: "", appointment_start: "", appointment_end: "" });
        onOpenChange(false);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Schedule Appointment</SheetTitle>
          <SheetDescription>
            Create a new meeting. A Google Meet link will be automatically generated.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Lead</Label>
              <Select 
                value={formData.lead_id} 
                onValueChange={(val) => setFormData({ ...formData, lead_id: val as string })}
                disabled={leadsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(leads as any)?.leads?.map((lead: any) => (
                    <SelectItem key={String(lead.id)} value={String(lead.id)}>
                      {lead.full_name} ({lead.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                required
                value={formData.appointment_start}
                onChange={(e) => setFormData({ ...formData, appointment_start: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                required
                value={formData.appointment_end}
                onChange={(e) => setFormData({ ...formData, appointment_end: e.target.value })}
              />
            </div>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !formData.lead_id || !formData.appointment_start || !formData.appointment_end}>
              {create.isPending ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
