// @vitest-environment node
//
// Next's NextResponse.next() checks that request.headers is a real Headers
// instance; jsdom's polyfill (this project's default test environment,
// needed for the component tests) fails that check. Middleware code has no
// DOM dependency anyway, so the node environment is the correct one here.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

describe("updateSession", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it("fails open (passes the request through) when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { updateSession } = await import("@/lib/supabase/middleware");

    const response = await updateSession(new NextRequest("http://localhost/dashboard"));

    expect(response.status).toBe(200);
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "middleware.updateSession" }),
    );
  });

  it("fails open when the Supabase URL is malformed rather than throwing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-valid-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "some-key";
    const { updateSession } = await import("@/lib/supabase/middleware");

    const response = await updateSession(new NextRequest("http://localhost/dashboard"));

    expect(response.status).toBe(200);
    expect(console.error).toHaveBeenCalled();
  });
});
