import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendAnnouncementEmail", () => {
  const originalKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey;
    vi.resetModules();
  });

  it("is a no-op when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY;
    vi.resetModules();
    const { sendAnnouncementEmail } = await import("@/lib/notifications/email");

    await expect(
      sendAnnouncementEmail({ recipients: ["a@example.com"], title: "t", body: "b" }),
    ).resolves.toBeUndefined();
  });

  it("is a no-op with no recipients even if a key is set", async () => {
    process.env.RESEND_API_KEY = "test-key";
    vi.resetModules();
    const { sendAnnouncementEmail } = await import("@/lib/notifications/email");

    await expect(
      sendAnnouncementEmail({ recipients: [], title: "t", body: "b" }),
    ).resolves.toBeUndefined();
  });
});
