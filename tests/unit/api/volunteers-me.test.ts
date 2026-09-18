import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  prisma: {
    volunteerProfile: { findUnique: vi.fn(), update: vi.fn() },
  },
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/volunteers/me", () => {
  it("rejects an unauthenticated request", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const { GET } = await import("@/app/api/volunteers/me/route");

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns 404 when the caller has no volunteer profile yet", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "VOLUNTEER", isLead: false, email: "a@a.com" });
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(null);
    const { GET } = await import("@/app/api/volunteers/me/route");

    const response = await GET();
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/volunteers/me", () => {
  it("rejects a coordinator (only a volunteer has a profile to self-edit)", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "COORDINATOR", isLead: false, email: "c@a.com" });
    const { PATCH } = await import("@/app/api/volunteers/me/route");

    const response = await PATCH(
      new NextRequest("http://localhost", { method: "PATCH", body: JSON.stringify({ phone: "123" }) }),
    );
    expect(response.status).toBe(403);
  });

  it("ignores admin-only fields even if present in the request body", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", role: "VOLUNTEER", isLead: false, email: "v@a.com" });
    mocks.prisma.volunteerProfile.update.mockResolvedValue({ id: "vol-1" });
    const { PATCH } = await import("@/app/api/volunteers/me/route");

    await PATCH(
      new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ phone: "9999999999", status: "ACTIVE", isLead: true, nssId: "FORGED" }),
      }),
    );

    const updateArgs = mocks.prisma.volunteerProfile.update.mock.calls[0][0];
    expect(updateArgs.data).toEqual({ phone: "9999999999" });
    expect(updateArgs.data.status).toBeUndefined();
    expect(updateArgs.data.isLead).toBeUndefined();
    expect(updateArgs.data.nssId).toBeUndefined();
  });
});
