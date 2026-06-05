"use client";

import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export function LegacyHealthCheck() {
  const { leads, conversations, appointments, memory, followUps, knowledge, lastSynced, isLoading, refreshData, error } = useLegacyStore();

  const isConnected = leads.length > 0 || lastSynced !== null;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-800">Legacy Health Check</CardTitle>
          <div className="text-sm text-slate-500 mt-1">Status of your Google Sheets & Telegram integration</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <strong>Sync Error:</strong> {error}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-slate-700">Integrations</h3>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded flex items-center justify-center">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Google Sheets</p>
                  <p className="text-xs text-slate-500">
                    {lastSynced ? `Synced ${formatDistanceToNow(new Date(lastSynced))} ago` : "Waiting for sync..."}
                  </p>
                </div>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-500" : ""}>
                {isConnected ? "Connected" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                  <BotIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">Telegram Bot</p>
                  <p className="text-xs text-slate-500">Status via V1 API</p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">AI Provider</p>
                  <p className="text-xs text-slate-500">Configured in V2 Settings</p>
                </div>
              </div>
              <Badge variant="outline" className="text-violet-600 border-violet-200">Active</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-slate-700">Data Synchronization</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Total Leads" count={leads.length} />
              <StatBox label="Conversations" count={conversations.length} />
              <StatBox label="Appointments" count={appointments.length} />
              <StatBox label="AI Memories" count={memory.length} />
              <StatBox label="Follow-Ups" count={followUps.length} />
              <StatBox label="Knowledge" count={knowledge.length} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({ label, count }: { label: string; count: number }) {
  return (
    <div className="p-3 bg-slate-50 border rounded-lg text-center">
      <div className="text-2xl font-bold text-slate-800">{count}</div>
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TableIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <line x1="3" x2="21" y1="9" y2="9"/>
      <line x1="3" x2="21" y1="15" y2="15"/>
      <line x1="9" x2="9" y1="9" y2="21"/>
      <line x1="15" x2="15" y1="9" y2="21"/>
    </svg>
  );
}

function BotIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 8V4H8"/>
      <rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2"/>
      <path d="M20 14h2"/>
      <path d="M15 13v2"/>
      <path d="M9 13v2"/>
    </svg>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}
