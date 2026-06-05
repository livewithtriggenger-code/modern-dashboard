"use client";

import { useEffect, useState } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LegacyDashboardPage() {
  const { leads, conversations, appointments, refreshData, lastSynced } = useLegacyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!lastSynced) {
      refreshData();
    }
  }, [lastSynced, refreshData]);

  if (!mounted) return null;

  const newLeads = leads.filter(l => l.status === "New" || l.status === "new").length;
  const convertedLeads = leads.filter(l => l.status === "Converted" || l.status === "converted").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your Google Sheets CRM data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-slate-500">{newLeads} new leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-slate-500">Across all platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-slate-500">Scheduled meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedLeads}</div>
            <p className="text-xs text-slate-500">
              {leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.slice(0, 5).map((lead, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{lead.fullName}</p>
                    <p className="text-xs text-slate-500">{lead.email}</p>
                  </div>
                  <div className="text-sm text-slate-500">{lead.status}</div>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="text-sm text-slate-500 py-4 text-center">No leads found in Sheets.</div>
              )}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/legacy/leads">View All Leads</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.slice(0, 5).map((apt, i) => {
                const lead = leads.find(l => l.id === apt.leadId || l.conversationId === apt.leadId);
                const displayName = apt.leadName || lead?.fullName || "Unknown";
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-slate-500">{apt.appointmentDate} {apt.appointmentTime}</p>
                    </div>
                    <div className="text-sm text-slate-500">{apt.status}</div>
                  </div>
                );
              })}
              {appointments.length === 0 && (
                <div className="text-sm text-slate-500 py-4 text-center">No appointments found in Sheets.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
