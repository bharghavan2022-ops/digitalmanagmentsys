import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { buildXlsxBuffer } from "@/lib/reports/xlsx";

function toCsvValue(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// NAAC/NIRF-style roster export: volunteer identity plus hours derived live
// from VERIFIED_ATTENDED attendance, never from the cached totalHoursServed
// column, so the export can't drift from the audit trail.
export async function GET(request: NextRequest) {
  try {
    await requireRole(["COORDINATOR", "AUDITOR"]);

    const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

    const volunteers = await prisma.volunteerProfile.findMany({
      include: {
        attendances: {
          where: { state: "VERIFIED_ATTENDED" },
          include: { event: { select: { awardedHours: true } } },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const header = ["NSS ID", "Full Name", "Department", "Year", "Status", "Verified Hours"];
    const rows = volunteers.map((v) => {
      const hours = v.attendances.reduce((sum, a) => sum + Number(a.event.awardedHours), 0);
      return [v.nssId, v.fullName, v.department, v.yearOfStudy, v.status, hours];
    });

    if (format === "xlsx") {
      const buffer = await buildXlsxBuffer("Volunteers", header, rows);
      return new NextResponse(Buffer.from(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="nss-volunteer-report.xlsx"',
        },
      });
    }

    const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="nss-volunteer-report.csv"',
      },
    });
  } catch (error) {
    return toErrorResponse(error, "reports.export");
  }
}
