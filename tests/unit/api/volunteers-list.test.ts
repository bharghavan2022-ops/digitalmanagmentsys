import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  prisma: {
    volunteerProfile: { findMany: vi.fn(), count: vi.fn() },
  },
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/volunteers", () => {
  it("rejects a plain volunteer (COORDINATOR/AUDITOR only)", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "VOLUNTEER", isLead: false, email: "a@a.com" });
    const { GET } = await import("@/app/api/volunteers/route");

    const response = await GET(new NextRequest("http://localhost/api/volunteers"));
    expect(response.status).toBe(403);
  });

  it("applies pagination, search, and status filters for a coordinator", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "COORDINATOR", isLead: false, email: "c@a.com" });
    mocks.prisma.volunteerProfile.findMany.mockResolvedValue([]);
    mocks.prisma.volunteerProfile.count.mockResolvedValue(45);

    const { GET } = await import("@/app/api/volunteers/route");
    const response = await GET(
      new NextRequest("http://localhost/api/volunteers?page=2&pageSize=10&search=ece&status=ACTIVE"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ page: 2, pageSize: 10, total: 45, totalPages: 5 });

    const findManyArgs = mocks.prisma.volunteerProfile.findMany.mock.calls[0][0];
    expect(findManyArgs.skip).toBe(10);
    expect(findManyArgs.take).toBe(10);
    expect(findManyArgs.where.status).toBe("ACTIVE");
    expect(findManyArgs.where.OR).toBeDefined();
  });

  it("rejects an invalid status value with 400", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "AUDITOR", isLead: false, email: "au@a.com" });

    const { GET } = await import("@/app/api/volunteers/route");
    const response = await GET(new NextRequest("http://localhost/api/volunteers?status=NOT_A_STATUS"));

    expect(response.status).toBe(400);
  });

  it("caps pageSize at 100", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "COORDINATOR", isLead: false, email: "c@a.com" });

    const { GET } = await import("@/app/api/volunteers/route");
    const response = await GET(new NextRequest("http://localhost/api/volunteers?pageSize=500"));

    expect(response.status).toBe(400);
  });
});
