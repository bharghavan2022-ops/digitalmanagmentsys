import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import ExcelJS from "exceljs";

const mocks = vi.hoisted(() => ({
  prisma: { volunteerProfile: { findMany: vi.fn() } },
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));

const fixtureVolunteers = [
  {
    nssId: "NSS-2026-CSE-0001",
    fullName: "Aditya Kumar",
    department: "CSE",
    yearOfStudy: 2,
    status: "ACTIVE",
    attendances: [{ event: { awardedHours: 4 } }, { event: { awardedHours: 6 } }],
  },
  {
    nssId: "NSS-2026-ECE-0001",
    fullName: "Sneha Reddy",
    department: "ECE",
    yearOfStudy: 3,
    status: "ACTIVE",
    attendances: [{ event: { awardedHours: 5 } }],
  },
  {
    nssId: "PENDING-abc12345",
    fullName: "Vikram Singh",
    department: "CSE",
    yearOfStudy: 1,
    status: "APPLIED",
    attendances: [],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.volunteerProfile.findMany.mockResolvedValue(fixtureVolunteers);
});

describe("GET /api/reports/export", () => {
  it("rejects a plain volunteer", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "VOLUNTEER", isLead: false, email: "a@a.com" });
    const { GET } = await import("@/app/api/reports/export/route");

    const response = await GET(new NextRequest("http://localhost/api/reports/export"));
    expect(response.status).toBe(403);
  });

  it("allows an auditor (read-only export)", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "AUDITOR", isLead: false, email: "au@a.com" });
    const { GET } = await import("@/app/api/reports/export/route");

    const response = await GET(new NextRequest("http://localhost/api/reports/export"));
    expect(response.status).toBe(200);
  });

  it("CSV row count matches the fixture, with hours derived from verified attendance", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "COORDINATOR", isLead: false, email: "c@a.com" });
    const { GET } = await import("@/app/api/reports/export/route");

    const response = await GET(new NextRequest("http://localhost/api/reports/export"));
    const csv = await response.text();
    const lines = csv.trim().split("\n");

    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(lines).toHaveLength(fixtureVolunteers.length + 1); // header + one row per volunteer
    expect(lines[1]).toBe("NSS-2026-CSE-0001,Aditya Kumar,CSE,2,ACTIVE,10");
    expect(lines[3]).toBe("PENDING-abc12345,Vikram Singh,CSE,1,APPLIED,0");
  });

  it("XLSX row count matches the fixture", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "COORDINATOR", isLead: false, email: "c@a.com" });
    const { GET } = await import("@/app/api/reports/export/route");

    const response = await GET(new NextRequest("http://localhost/api/reports/export?format=xlsx"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const buffer = Buffer.from(await response.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    // exceljs's bundled types predate the newer generic Buffer<TArrayBuffer>
    // signature - same cast-free-zone friction as elsewhere in this repo's
    // binary responses (see the Buffer.from wrapping in the route itself).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet("Volunteers")!;

    // +1 for the header row.
    expect(sheet.rowCount).toBe(fixtureVolunteers.length + 1);
    expect(sheet.getRow(2).getCell(6).value).toBe(10);
  });
});
