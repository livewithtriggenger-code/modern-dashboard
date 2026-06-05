"use client";

import { useState } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BrainCircuit } from "lucide-react";

export default function LegacyMemoryPage() {
  const { memory, leads } = useLegacyStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMemory = memory.filter(mem => {
    const lead = leads.find(l => l.id === mem.leadId || l.conversationId === mem.leadId);
    const displayName = mem.leadName || lead?.fullName || "Unknown";
    
    return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           mem.memoryValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
           mem.memoryType.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Memory</h1>
        <p className="text-sm text-slate-500 mt-1">Information extracted by AI from conversations.</p>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Extracted Insights</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search memory..."
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
                  <TableHead className="font-semibold text-slate-600">Date Added</TableHead>
                  <TableHead className="font-semibold text-slate-600">Lead</TableHead>
                  <TableHead className="font-semibold text-slate-600">Type</TableHead>
                  <TableHead className="font-semibold text-slate-600 w-1/2">Content</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemory.map((mem) => {
                  const lead = leads.find(l => l.id === mem.leadId || l.conversationId === mem.leadId);
                  const displayName = mem.leadName || lead?.fullName || "Unknown";
                  const displayPhone = lead?.phone || "-";

                  return (
                    <TableRow key={mem.id || mem.row} className="hover:bg-slate-50">
                      <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                        {mem.lastUpdated}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{displayName}</span>
                          <span className="text-xs text-slate-500">{displayPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-700">
                          {mem.memoryType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <BrainCircuit className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-slate-700">{mem.memoryValue}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMemory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                      No memory data found.
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
