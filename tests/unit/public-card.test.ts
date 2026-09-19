import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: { volunteerProfile: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPublicVolunteerCard", () => {
  it("only ever selects the safe fields, never email or phone", async () => {
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue({
      fullName: "Aditya Kumar",
      nssId: "NSS-2026-CSE-0001",
      department: "CSE",
      status: "ACTIVE",
    });
    const { getPublicVolunteerCard } = await import("@/lib/volunteers/public-card");

    const card = await getPublicVolunteerCard("vol-1");

    expect(mocks.prisma.volunteerProfile.findUnique).toHaveBeenCalledWith({
      where: { id: "vol-1" },
      select: { fullName: true, nssId: true, department: true, status: true },
    });
    expect(card).toEqual({
      fullName: "Aditya Kumar",
      nssId: "NSS-2026-CSE-0001",
      department: "CSE",
      status: "ACTIVE",
    });
    expect(card).not.toHaveProperty("email");
    expect(card).not.toHaveProperty("phone");
  });

  it("returns null for an unknown id instead of throwing", async () => {
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(null);
    const { getPublicVolunteerCard } = await import("@/lib/volunteers/public-card");

    await expect(getPublicVolunteerCard("nope")).resolves.toBeNull();
  });
});
