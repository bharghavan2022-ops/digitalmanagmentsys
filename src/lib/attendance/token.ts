import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_SECONDS = 30;

function sign(payload: string): string {
  const secret = process.env.APP_SIGNING_SECRET;
  if (!secret) throw new Error("APP_SIGNING_SECRET is not set");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Issues a short-lived check-in token for an event. Admins re-fetch this
 * every ~30s (see the live monitor page) and project it as a rotating QR;
 * a stale scan is rejected by `verifyCheckInToken`.
 */
export function issueCheckInToken(eventId: string): { token: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${eventId}.${expiresAt}`;
  const signature = sign(payload);
  return { token: `${payload}.${signature}`, expiresAt };
}

export function verifyCheckInToken(token: string, eventId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [tokenEventId, expiresAtRaw, signature] = parts;
  if (tokenEventId !== eventId) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expectedSignature = sign(`${tokenEventId}.${expiresAtRaw}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  return a.length === b.length && timingSafeEqual(a, b);
}
