import { beforeEach, describe, expect, it } from "vitest";
import { computeVerificationHash } from "@/lib/certificates/hash";

beforeEach(() => {
  process.env.APP_SIGNING_SECRET = "test-secret";
});

describe("computeVerificationHash", () => {
  it("is deterministic for the same inputs", () => {
    const a = computeVerificationHash("CERT-2026-ABCD1234", "volunteer-1");
    const b = computeVerificationHash("CERT-2026-ABCD1234", "volunteer-1");
    expect(a).toBe(b);
  });

  it("differs when the certificate number changes", () => {
    const a = computeVerificationHash("CERT-2026-ABCD1234", "volunteer-1");
    const b = computeVerificationHash("CERT-2026-WXYZ9999", "volunteer-1");
    expect(a).not.toBe(b);
  });

  it("differs when the volunteer changes", () => {
    const a = computeVerificationHash("CERT-2026-ABCD1234", "volunteer-1");
    const b = computeVerificationHash("CERT-2026-ABCD1234", "volunteer-2");
    expect(a).not.toBe(b);
  });
});
