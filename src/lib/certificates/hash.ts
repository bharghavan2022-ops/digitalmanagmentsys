import { createHash } from "crypto";

/**
 * Deterministic verification hash for a certificate. Recomputable from the
 * stored certificateNo/volunteerId, so the public verify route never needs
 * to trust the value it's handed - it recomputes and compares.
 */
export function computeVerificationHash(certificateNo: string, volunteerId: string): string {
  const secret = process.env.APP_SIGNING_SECRET;
  if (!secret) throw new Error("APP_SIGNING_SECRET is not set");
  return createHash("sha256").update(`${certificateNo}:${volunteerId}:${secret}`).digest("hex");
}
