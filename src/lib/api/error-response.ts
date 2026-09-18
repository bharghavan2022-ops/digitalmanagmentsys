import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";

/**
 * Maps a caught error to an HTTP response for a route handler. Keeps the
 * mapping in one place so every route reports auth/validation failures the
 * same way instead of re-implementing the switch.
 */
export function toErrorResponse(error: unknown, operation: string): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", issues: error.flatten() },
      { status: 400 },
    );
  }
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error({ error, operation });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
