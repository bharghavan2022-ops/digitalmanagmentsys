import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: mocks.send } })),
}));

describe("sendAnnouncementEmail", () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.RESEND_FROM_EMAIL;

  beforeEach(() => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey;
    process.env.RESEND_FROM_EMAIL = originalFrom;
    vi.resetModules();
    mocks.send.mockClear();
  });

  it("is a no-op when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY;
    vi.resetModules();
    const { sendAnnouncementEmail } = await import("@/lib/notifications/email");

    await expect(
      sendAnnouncementEmail({ recipients: ["a@example.com"], title: "t", body: "b" }),
    ).resolves.toBeUndefined();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("is a no-op with no recipients even if a key is set", async () => {
    process.env.RESEND_API_KEY = "test-key";
    vi.resetModules();
    const { sendAnnouncementEmail } = await import("@/lib/notifications/email");

    await expect(
      sendAnnouncementEmail({ recipients: [], title: "t", body: "b" }),
    ).resolves.toBeUndefined();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("defaults to onboarding@resend.dev - the only address Resend allows without a verified domain", async () => {
    process.env.RESEND_API_KEY = "test-key";
    delete process.env.RESEND_FROM_EMAIL;
    vi.resetModules();
    const { sendAnnouncementEmail } = await import("@/lib/notifications/email");

    await sendAnnouncementEmail({ recipients: ["a@example.com"], title: "t", body: "b" });

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "NSS Connect <onboarding@resend.dev>" }),
    );
  });

  it("uses RESEND_FROM_EMAIL when set, e.g. after verifying a custom domain", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "NSS Connect <noreply@example.org>";
    vi.resetModules();
    const { sendAnnouncementEmail } = await import("@/lib/notifications/email");

    await sendAnnouncementEmail({ recipients: ["a@example.com"], title: "t", body: "b" });

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "NSS Connect <noreply@example.org>" }),
    );
  });

  it("sends one message per recipient rather than one call listing everyone", async () => {
    process.env.RESEND_API_KEY = "test-key";
    vi.resetModules();
    const { sendAnnouncementEmail } = await import("@/lib/notifications/email");

    await sendAnnouncementEmail({
      recipients: ["a@example.com", "b@example.com"],
      title: "t",
      body: "b",
    });

    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com" }));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "b@example.com" }));
  });
});
