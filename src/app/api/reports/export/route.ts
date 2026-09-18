import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";

function toCsvValue(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// NAAC/NIRF-style roster export: volunteer identity plus hours derived live
// from VERIFIED_ATTENDED attendance, never from the cached totalHoursServed
// column, so the export can't drift from the audit trail.
export async function GET() {
  try {
    await requireRole(["COORDINATOR", "AUDITOR"]);

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
