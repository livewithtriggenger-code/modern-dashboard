// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";

import { useState } from "react";
import { useAppointmentsQuery, useAppointmentMutations, useRealtimeAppointments } from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, MoreVertical, Plus } from "lucide-react";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScheduleAppointmentModal } from "./ScheduleAppointmentModal";

export function AppointmentsPageClient() {
  const [statusFilter] = useState("all");
  const { data: appointments, isLoading } = useAppointmentsQuery(statusFilter);
  const { update, remove } = useAppointmentMutations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useRealtimeAppointments(); // Global realtime sync

  if (isLoading) return <div className="text-muted-foreground">Loading schedule...</div>;

  const handleStatusChange = (id: string, status: string) => {
    update.mutate({ id, data: { status } });
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-sm">Upcoming</Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm text-muted-foreground border-dashed">Past</Badge>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments?.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-xl border-dashed">
            No appointments found.
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          appointments?.map((apt: any) => {
            const startDate = new Date(apt.appointment_start);
            const endDate = new Date(apt.appointment_end);
            
            return (
              <div key={apt.id} className="p-5 border rounded-xl bg-card shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{apt.leads?.full_name || "Unknown Lead"}</h3>
                    <p className="text-xs text-muted-foreground">{apt.leads?.email || "No email"}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "confirmed")}>Mark Confirmed</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "completed")}>Mark Completed</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "no-show")}>Mark No-Show</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate(apt.id)}>Cancel Event</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {format(startDate, "EEEE, MMMM do, yyyy")}
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                  </div>
                  {apt.meeting_link && (
                    <div className="flex items-center gap-2 text-blue-500">
                      <Video className="w-4 h-4" />
                      <a href={apt.meeting_link} target="_blank" rel="noreferrer" className="hover:underline">
                        Join Meeting
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                  <Badge variant={
                    apt.status === "confirmed" ? "default" :
                    apt.status === "completed" ? "secondary" :
                    apt.status === "cancelled" || apt.status === "no-show" ? "destructive" : "outline"
                  } className="capitalize">
                    {apt.status}
                  </Badge>
                  {apt.google_event_id && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">Google Synced</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ScheduleAppointmentModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
