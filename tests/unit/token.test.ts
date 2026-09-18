import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueCheckInToken, verifyCheckInToken } from "@/lib/attendance/token";

beforeEach(() => {
  process.env.APP_SIGNING_SECRET = "test-secret";
});

describe("issueCheckInToken / verifyCheckInToken", () => {
  it("accepts a freshly issued token for its own event", () => {
    const { token } = issueCheckInToken("event-1");
    expect(verifyCheckInToken(token, "event-1")).toBe(true);
  });

  it("rejects a token presented for a different event", () => {
    const { token } = issueCheckInToken("event-1");
    expect(verifyCheckInToken(token, "event-2")).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const { token } = issueCheckInToken("event-1");
    const tampered = token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a");
    expect(verifyCheckInToken(tampered, "event-1")).toBe(false);
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    const { token } = issueCheckInToken("event-1");
    vi.advanceTimersByTime(31_000);
    expect(verifyCheckInToken(token, "event-1")).toBe(false);
    vi.useRealTimers();
  });
});
