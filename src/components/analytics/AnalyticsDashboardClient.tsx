"use client";

import { useState } from "react";
import { useAnalyticsMetrics, useRealtimeAnalyticsRefresh } from "@/hooks/use-analytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function AnalyticsDashboardClient() {
  const [daysBack, setDaysBack] = useState(30);
  const { data, isLoading } = useAnalyticsMetrics(daysBack);
  useRealtimeAnalyticsRefresh(daysBack);

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading Analytics Engine...</div>;
  }

  const { kpis, funnel, sourcesData, appointmentData, aiPerformanceData, followUpData } = data;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-end">
        <Select value={daysBack.toString()} onValueChange={(val) => setDaysBack(Number(val))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingFollowUps}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Conversion Funnel */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Lead progression through the pipeline</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Distribution of inbound channels</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {sourcesData.length === 0 ? (
              <span className="text-sm text-muted-foreground">No data</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourcesData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {sourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Status breakdown of scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
             {appointmentData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* AI Performance */}
        <Card>
          <CardHeader>
            <CardTitle>AI Intervention</CardTitle>
            <CardDescription>Threads handled entirely by AI vs Copilot/Handoff</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
             {aiPerformanceData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={aiPerformanceData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                    {aiPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Follow-Ups */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-Ups</CardTitle>
            <CardDescription>Performance of the Automated Engine</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
             {followUpData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={followUpData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
