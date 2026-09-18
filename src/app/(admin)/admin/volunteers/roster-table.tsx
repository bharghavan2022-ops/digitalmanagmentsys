"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

export type RosterRow = {
  id: string;
  nssId: string;
  fullName: string;
  email: string;
  department: string;
  yearOfStudy: number;
  status: string;
  totalHoursServed: number;
};

const columnHelper = createColumnHelper<RosterRow>();

export function VolunteerRosterTable({ data }: { data: RosterRow[] }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("nssId", { header: "NSS ID" }),
      columnHelper.accessor("fullName", { header: "Name" }),
      columnHelper.accessor("email", { header: "Email" }),
      columnHelper.accessor("department", { header: "Department" }),
      columnHelper.accessor("yearOfStudy", { header: "Year" }),
      columnHelper.accessor("status", { header: "Status" }),
      columnHelper.accessor("totalHoursServed", { header: "Hours" }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-2 text-left font-medium">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="p-4 text-center text-muted-foreground">
                No volunteers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
