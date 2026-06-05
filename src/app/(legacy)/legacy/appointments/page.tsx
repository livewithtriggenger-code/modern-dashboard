"use client";

import { useState } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function LegacyAppointmentsPage() {
  const { appointments, leads } = useLegacyStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAppointments = appointments.filter(apt => {
    const lead = leads.find(l => l.id === apt.leadId || l.conversationId === apt.leadId);
    const displayEmail = lead?.email || "";
    const displayName = apt.leadName || lead?.fullName || "";
    
    return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           displayEmail.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(`${a.appointmentDate} ${a.appointmentTime}`).getTime() - new Date(`${b.appointmentDate} ${b.appointmentTime}`).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments</h1>
        <p className="text-sm text-slate-500 mt-1">Manage scheduled calls and meetings from your Sheets.</p>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search appointments..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600">Date & Time</TableHead>
                  <TableHead className="font-semibold text-slate-600">Lead</TableHead>
                  <TableHead className="font-semibold text-slate-600">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => {
                  let dateStr = apt.appointmentDate;
                  try {
                    // format date if parseable
                    const d = new Date(apt.appointmentDate);
                    if (!isNaN(d.getTime())) {
                      dateStr = format(d, 'MMM d, yyyy');
                    }
                  } catch(e) {}

                  const lead = leads.find(l => l.id === apt.leadId || l.conversationId === apt.leadId);
                  const displayEmail = lead?.email || "-";
                  const displayPhone = lead?.phone || "-";
                  const displayName = apt.leadName || lead?.fullName || "Unknown";

                  return (
                    <TableRow key={apt.id || apt.row} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{dateStr}</span>
                            <span className="text-xs text-slate-500">{apt.appointmentTime}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{displayName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-600">{displayEmail}</span>
                          <span className="text-xs text-slate-500">{displayPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={apt.status.toLowerCase() === 'scheduled' ? 'default' : 'secondary'} className={apt.status.toLowerCase() === 'scheduled' ? 'bg-blue-500' : ''}>
                          {apt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {apt.meetingLink ? (
                          <a href={apt.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-violet-600 hover:underline">
                            Join <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                      No appointments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
