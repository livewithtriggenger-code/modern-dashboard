"use client";

import { useState } from "react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function LegacyLeadsPage() {
  const { leads } = useLegacyStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeads = leads.filter(lead => 
    lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your leads from Google Sheets.</p>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Leads</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search leads..."
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
                  <TableHead className="font-semibold text-slate-600">Name</TableHead>
                  <TableHead className="font-semibold text-slate-600">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-600">Business</TableHead>
                  <TableHead className="font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600">Score</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-right">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.row} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">{lead.fullName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600">{lead.email}</span>
                        <span className="text-xs text-slate-500">{lead.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700">{lead.businessName}</span>
                        <span className="text-xs text-slate-500">{lead.businessType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.status.toLowerCase() === 'new' ? 'default' : 'secondary'} className={lead.status.toLowerCase() === 'new' ? 'bg-violet-500' : ''}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                        {lead.leadScore || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm">{lead.date}</TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      No leads found.
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
