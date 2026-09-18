import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  prisma: {
    user: { upsert: vi.fn() },
    volunteerProfile: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentUser", () => {
  it("returns null when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const { getCurrentUser } = await import("@/lib/auth/session");

    expect(await getCurrentUser()).toBeNull();
    expect(mocks.prisma.user.upsert).not.toHaveBeenCalled();
  });

  it("provisions the volunteer profile from signup metadata the first time a session exists", async () => {
    // Simulates a volunteer who registered while Supabase required email
    // confirmation: signUp() returned no session, so the profile couldn't
    // be created via an authenticated API call at that time. The fields
    // they submitted travel as auth user_metadata instead, and this is the
    // first request made with an actual session (e.g. right after they
    // confirm their email and log in).
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "auth-1",
          email: "v@example.com",
          user_metadata: {
            fullName: "Volunteer One",
            phone: "9876543210",
            department: "ECE",
            yearOfStudy: 3,
          },
        },
      },
    });
    mocks.prisma.user.upsert.mockResolvedValue({
      id: "auth-1",
      email: "v@example.com",
      role: "VOLUNTEER",
      isLead: false,
      lastSeenAnnouncementsAt: null,
    });
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(null);

    const { getCurrentUser } = await import("@/lib/auth/session");
    const user = await getCurrentUser();

    expect(user?.id).toBe("auth-1");
    expect(mocks.prisma.volunteerProfile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "auth-1",
        fullName: "Volunteer One",
        phone: "9876543210",
        department: "ECE",
        yearOfStudy: 3,
        status: "APPLIED",
      }),
    });
  });

  it("does not create a second profile once one already exists", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "auth-1", email: "v@example.com", user_metadata: {} } },
    });
    mocks.prisma.user.upsert.mockResolvedValue({
      id: "auth-1",
      email: "v@example.com",
      role: "VOLUNTEER",
      isLead: false,
      lastSeenAnnouncementsAt: null,
    });
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue({ id: "vol-1" });

    const { getCurrentUser } = await import("@/lib/auth/session");
    await getCurrentUser();

    expect(mocks.prisma.volunteerProfile.create).not.toHaveBeenCalled();
  });

  it("leaves the profile unset when metadata is missing or malformed, rather than creating a broken row", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "auth-1", email: "v@example.com", user_metadata: {} } },
    });
    mocks.prisma.user.upsert.mockResolvedValue({
      id: "auth-1",
      email: "v@example.com",
      role: "VOLUNTEER",
      isLead: false,
      lastSeenAnnouncementsAt: null,
    });
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(null);

    const { getCurrentUser } = await import("@/lib/auth/session");
    await getCurrentUser();

    expect(mocks.prisma.volunteerProfile.create).not.toHaveBeenCalled();
  });

  it("never auto-creates a volunteer profile for a non-volunteer role", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "auth-2",
          email: "coord@example.com",
          user_metadata: { fullName: "Coord", phone: "123", department: "X", yearOfStudy: 2 },
        },
      },
    });
    mocks.prisma.user.upsert.mockResolvedValue({
      id: "auth-2",
      email: "coord@example.com",
      role: "COORDINATOR",
      isLead: false,
      lastSeenAnnouncementsAt: null,
    });

    const { getCurrentUser } = await import("@/lib/auth/session");
    await getCurrentUser();

    expect(mocks.prisma.volunteerProfile.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.volunteerProfile.create).not.toHaveBeenCalled();
  });
});
