"use client";

import { useState } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BrainCircuit } from "lucide-react";

export default function LegacyMemoryPage() {
  const { memory } = useLegacyStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMemory = memory.filter(mem => 
    mem.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mem.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mem.memoryType.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

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
                  <TableHead className="font-semibold text-slate-600 text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemory.map((mem) => (
                  <TableRow key={mem.row} className="hover:bg-slate-50">
                    <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                      {mem.dateAdded}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{mem.leadName}</span>
                        <span className="text-xs text-slate-500">{mem.leadPhone}</span>
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
                        <span className="text-sm text-slate-700">{mem.content}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center w-12 h-6 rounded bg-green-50 text-xs font-medium text-green-700 border border-green-100">
                        {mem.confidenceScore}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMemory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
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
