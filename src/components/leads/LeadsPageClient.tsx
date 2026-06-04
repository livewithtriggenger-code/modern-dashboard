"use client";

import { useState } from "react";
import { LeadsDataTable } from "./LeadsDataTable";
import { LeadSlideOver } from "./LeadSlideOver";
import { useLeadsQuery } from "@/hooks/use-leads";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function LeadsPageClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data, isLoading } = useLeadsQuery(page, 20, search, statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "all"); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => setSelectedLeadId("new")}>
            <Plus className="mr-2 h-4 w-4" /> New Lead
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <LeadsDataTable
          data={data?.leads ?? []}
          isLoading={isLoading}
          onRowClick={(id) => setSelectedLeadId(id)}
        />
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
        >
          Previous
        </Button>
        <div className="text-sm font-medium">Page {page}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!data || data.leads.length < 20 || isLoading}
        >
          Next
        </Button>
      </div>

      {selectedLeadId && (
        <LeadSlideOver
          leadId={selectedLeadId}
          open={!!selectedLeadId}
          onOpenChange={(open) => !open && setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
