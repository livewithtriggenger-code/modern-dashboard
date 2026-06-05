"use client";

import { useLegacyStore } from "@/legacy/store/legacy-store";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LegacyHeader() {
  const { lastSynced, isLoading, refreshData } = useLegacyStore();

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <div>
        <h2 className="text-sm font-medium text-slate-500">Google Sheets Sync</h2>
        <div className="text-xs text-slate-400">
          {lastSynced ? (
            <span>Last synced: {formatDistanceToNow(new Date(lastSynced))} ago</span>
          ) : (
            <span>Not synced yet</span>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => refreshData()}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {isLoading ? "Syncing..." : "Sync Now"}
      </Button>
    </header>
  );
}
