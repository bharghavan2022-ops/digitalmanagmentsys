import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  prisma: {
    event: { findMany: vi.fn() },
    certificate: { findMany: vi.fn() },
    volunteerProfile: { findUnique: vi.fn(), findMany: vi.fn() },
  },
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.event.findMany.mockResolvedValue([]);
});

describe("GET /api/search", () => {
  it("rejects an unauthenticated request", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const { GET } = await import("@/app/api/search/route");

    const response = await GET(new NextRequest("http://localhost/api/search?q=clean"));
    expect(response.status).toBe(401);
  });

  it("rejects a query shorter than the minimum length", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "VOLUNTEER", isLead: false, email: "v@a.com" });
    const { GET } = await import("@/app/api/search/route");

    const response = await GET(new NextRequest("http://localhost/api/search?q="));
    expect(response.status).toBe(400);
  });

  it("scopes a volunteer's event search to UPCOMING/ACTIVE and searches their own certificates, never the roster", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "VOLUNTEER", isLead: false, email: "v@a.com" });
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue({ id: "vol-1" });
    mocks.prisma.certificate.findMany.mockResolvedValue([]);
    const { GET } = await import("@/app/api/search/route");

    await GET(new NextRequest("http://localhost/api/search?q=clean"));

    const eventArgs = mocks.prisma.event.findMany.mock.calls[0][0];
    expect(eventArgs.where.status).toEqual({ in: ["UPCOMING", "ACTIVE"] });
    expect(mocks.prisma.certificate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ volunteerId: "vol-1" }) }),
    );
    expect(mocks.prisma.volunteerProfile.findMany).not.toHaveBeenCalled();
  });

  it("lets a coordinator search the volunteer roster instead of certificates", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u2", role: "COORDINATOR", isLead: false, email: "c@a.com" });
    mocks.prisma.volunteerProfile.findMany.mockResolvedValue([]);
    const { GET } = await import("@/app/api/search/route");

    await GET(new NextRequest("http://localhost/api/search?q=sharma"));

    const eventArgs = mocks.prisma.event.findMany.mock.calls[0][0];
    expect(eventArgs.where.status).toBeUndefined();
    expect(mocks.prisma.volunteerProfile.findMany).toHaveBeenCalled();
    expect(mocks.prisma.certificate.findMany).not.toHaveBeenCalled();
  });
});
