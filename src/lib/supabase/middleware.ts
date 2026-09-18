import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Middleware runs on nearly every route (see the matcher below), so a
  // misconfigured or missing Supabase env var must not take the whole site
  // down - including the public landing/login pages. Fail open: skip the
  // session refresh and let the request through unmodified. Route handlers
  // and Server Components still enforce their own auth/RBAC checks, so a
  // real misconfiguration surfaces as "can't sign in" rather than a global
  // 500 on every page.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error({
      operation: "middleware.updateSession",
      error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    });
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refreshes the session cookie if it is close to expiry. Route handlers
    // and Server Components still enforce their own RBAC checks - this only
    // keeps the session alive.
    await supabase.auth.getUser();
  } catch (error) {
    console.error({ operation: "middleware.updateSession", error });
  }

  return response;
}
