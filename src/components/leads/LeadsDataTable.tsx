/* eslint-disable */
"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface LeadsDataTableProps {
   
  data: any[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  qualified: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  converted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

 
export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "full_name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("full_name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant="outline" className={statusColors[status] || ""}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lead_score",
    header: "Score",
    cell: ({ row }) => {
      const score = (row.getValue("lead_score") as number) || 0;
      return (
        <div className="flex items-center gap-2">
          <div className="w-full bg-secondary rounded-full h-2 max-w-[60px]">
            <div
              className={`h-2 rounded-full ${
                score >= 8 ? "bg-green-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${(score / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium">{score.toFixed(1)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Added",
    cell: ({ row }) => format(new Date(row.getValue("created_at") as string), "MMM d, yyyy"),
  },
];

export function LeadsDataTable({ data, isLoading, onRowClick }: LeadsDataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading leads...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No leads found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
