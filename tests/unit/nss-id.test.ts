import { describe, expect, it } from "vitest";
import { deptCodeFor, formatNssId } from "@/lib/volunteers/nss-id";

describe("formatNssId", () => {
  it("zero-pads the sequence to 4 digits", () => {
    expect(formatNssId(2026, "ECE", 1)).toBe("NSS-2026-ECE-0001");
    expect(formatNssId(2026, "ECE", 42)).toBe("NSS-2026-ECE-0042");
  });

  it("does not truncate a sequence longer than 4 digits", () => {
    expect(formatNssId(2026, "ECE", 12345)).toBe("NSS-2026-ECE-12345");
  });
});

describe("deptCodeFor", () => {
  it("uppercases and truncates to 4 characters", () => {
    expect(deptCodeFor("ece")).toBe("ECE");
    expect(deptCodeFor("Mechanical")).toBe("MECH");
  });

  it("falls back to GEN for blank input", () => {
    expect(deptCodeFor("   ")).toBe("GEN");
  });
});
