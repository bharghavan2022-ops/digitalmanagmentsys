"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

export type RosterRow = {
  id: string;
  nssId: string;
  fullName: string;
  email: string;
  department: string;
  yearOfStudy: number;
  status: string;
  isLead: boolean;
  totalHoursServed: number;
};

const columnHelper = createColumnHelper<RosterRow>();

function RowActions({ volunteer }: { volunteer: RosterRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, key: string) {
    setLoading(key);
    const response = await fetch(`/api/volunteers/${volunteer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(null);
    if (response.ok) router.refresh();
  }

  return (
    <div className="flex gap-2">
      {volunteer.status === "APPLIED" && (
        <Button
          size="sm"
          disabled={loading !== null}
          onClick={() => patch({ status: "ACTIVE" }, "approve")}
        >
          {loading === "approve" ? "Approving..." : "Approve"}
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={loading !== null}
        onClick={() => patch({ isLead: !volunteer.isLead }, "lead")}
      >
        {loading === "lead" ? "Saving..." : volunteer.isLead ? "Revoke lead" : "Make lead"}
      </Button>
    </div>
  );
}

export function VolunteerRosterTable({
  data,
  canManage,
}: {
  data: RosterRow[];
  canManage: boolean;
}) {
  const columns = useMemo(() => {
    const base = [
      columnHelper.accessor("nssId", { header: "NSS ID" }),
      columnHelper.accessor("fullName", { header: "Name" }),
      columnHelper.accessor("email", { header: "Email" }),
      columnHelper.accessor("department", { header: "Department" }),
      columnHelper.accessor("yearOfStudy", { header: "Year" }),
      columnHelper.accessor("status", { header: "Status" }),
      columnHelper.accessor("totalHoursServed", { header: "Hours" }),
      columnHelper.accessor("isLead", {
        header: "Lead",
        cell: (info) => (info.getValue() ? "Yes" : "No"),
      }),
    ];
    const actions = columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <RowActions volunteer={row.original} />,
    });
    return canManage ? [...base, actions] : base;
  }, [canManage]);

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
