import type { AppRole } from "@prisma/client";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

export class UnauthorizedError extends Error {
  status = 401 as const;
}

export class ForbiddenError extends Error {
  status = 403 as const;
}

/**
 * Server-side RBAC gate for route handlers and Server Actions. Never rely on
 * the UI hiding a button to enforce access - this must run in every mutating
 * route, including ones an AUDITOR could otherwise reach.
 */
export async function requireRole(allowedRoles: AppRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError("Not signed in");
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(`Role ${user.role} is not permitted to perform this action`);
  }
  return user;
}
