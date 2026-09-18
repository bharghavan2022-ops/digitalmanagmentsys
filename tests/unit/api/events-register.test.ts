import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const prisma = {
    volunteerProfile: { findUnique: vi.fn() },
    event: { findUnique: vi.fn() },
    eventRegistration: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => unknown) => fn(prisma)),
  };
  return { prisma, getCurrentUser: vi.fn() };
});

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));

const VOLUNTEER = { id: "user-1", email: "v@test.com", role: "VOLUNTEER" as const, isLead: false };
const VOLUNTEER_PROFILE = { id: "vol-1", userId: "user-1" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/events/[id]/register", () => {
  it("rejects an unauthenticated request", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const { POST } = await import("@/app/api/events/[id]/register/route");

    const response = await POST(new Request("http://localhost"), { params: { id: "event-1" } });
    expect(response.status).toBe(401);
  });

  it("rejects a coordinator (only volunteers register)", async () => {
    mocks.getCurrentUser.mockResolvedValue({ ...VOLUNTEER, role: "COORDINATOR" });
    const { POST } = await import("@/app/api/events/[id]/register/route");

    const response = await POST(new Request("http://localhost"), { params: { id: "event-1" } });
    expect(response.status).toBe(403);
  });

  it("confirms a seat when capacity allows", async () => {
    mocks.getCurrentUser.mockResolvedValue(VOLUNTEER);
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(VOLUNTEER_PROFILE);
    mocks.prisma.event.findUnique.mockResolvedValue({ id: "event-1", maxCapacity: 5 });
    mocks.prisma.eventRegistration.count.mockResolvedValue(2);
    mocks.prisma.eventRegistration.create.mockResolvedValue({
      id: "reg-1",
      eventId: "event-1",
      volunteerId: "vol-1",
      waitlisted: false,
    });

    const { POST } = await import("@/app/api/events/[id]/register/route");
    const response = await POST(new Request("http://localhost"), { params: { id: "event-1" } });

    expect(response.status).toBe(201);
    expect(mocks.prisma.eventRegistration.create).toHaveBeenCalledWith({
      data: { eventId: "event-1", volunteerId: "vol-1", waitlisted: false },
    });
  });

  it("waitlists once capacity is reached", async () => {
    mocks.getCurrentUser.mockResolvedValue(VOLUNTEER);
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(VOLUNTEER_PROFILE);
    mocks.prisma.event.findUnique.mockResolvedValue({ id: "event-1", maxCapacity: 2 });
    mocks.prisma.eventRegistration.count.mockResolvedValue(2);
    mocks.prisma.eventRegistration.create.mockResolvedValue({
      id: "reg-2",
      eventId: "event-1",
      volunteerId: "vol-1",
      waitlisted: true,
    });

    const { POST } = await import("@/app/api/events/[id]/register/route");
    await POST(new Request("http://localhost"), { params: { id: "event-1" } });

    expect(mocks.prisma.eventRegistration.create).toHaveBeenCalledWith({
      data: { eventId: "event-1", volunteerId: "vol-1", waitlisted: true },
    });
  });
});

describe("DELETE /api/events/[id]/register", () => {
  it("returns 404 when the volunteer isn't registered", async () => {
    mocks.getCurrentUser.mockResolvedValue(VOLUNTEER);
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(VOLUNTEER_PROFILE);
    mocks.prisma.eventRegistration.findUnique.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/events/[id]/register/route");
    const response = await DELETE(new Request("http://localhost"), { params: { id: "event-1" } });

    expect(response.status).toBe(404);
  });

  it("promotes the earliest waitlisted registration when a confirmed seat is cancelled", async () => {
    mocks.getCurrentUser.mockResolvedValue(VOLUNTEER);
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(VOLUNTEER_PROFILE);
    mocks.prisma.eventRegistration.findUnique.mockResolvedValue({
      id: "reg-1",
      eventId: "event-1",
      volunteerId: "vol-1",
      waitlisted: false,
    });
    mocks.prisma.eventRegistration.findFirst.mockResolvedValue({ id: "reg-waitlisted" });

    const { DELETE } = await import("@/app/api/events/[id]/register/route");
    const response = await DELETE(new Request("http://localhost"), { params: { id: "event-1" } });

    expect(response.status).toBe(204);
    expect(mocks.prisma.eventRegistration.delete).toHaveBeenCalledWith({ where: { id: "reg-1" } });
    expect(mocks.prisma.eventRegistration.update).toHaveBeenCalledWith({
      where: { id: "reg-waitlisted" },
      data: { waitlisted: false },
    });
  });

  it("does not promote anyone when the cancelled registration was itself waitlisted", async () => {
    mocks.getCurrentUser.mockResolvedValue(VOLUNTEER);
    mocks.prisma.volunteerProfile.findUnique.mockResolvedValue(VOLUNTEER_PROFILE);
    mocks.prisma.eventRegistration.findUnique.mockResolvedValue({
      id: "reg-1",
      eventId: "event-1",
      volunteerId: "vol-1",
      waitlisted: true,
    });

    const { DELETE } = await import("@/app/api/events/[id]/register/route");
    const response = await DELETE(new Request("http://localhost"), { params: { id: "event-1" } });

    expect(response.status).toBe(204);
    expect(mocks.prisma.eventRegistration.findFirst).not.toHaveBeenCalled();
    expect(mocks.prisma.eventRegistration.update).not.toHaveBeenCalled();
  });
});
