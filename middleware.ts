/**
 * HTTP Basic Auth gate for every dashboard route (pages + /api/* proxy).
 *
 * Single-user. Browser prompts for credentials on first request, then sends
 * the Authorization header automatically on every subsequent same-origin
 * request — so the catchall proxy at app/api/[...path]/route.ts also sees
 * the Authorization header and trusts the request before forwarding to the
 * backend internal URL.
 *
 * Env: DASHBOARD_PASSWORD (required in prod). DASHBOARD_USERNAME defaults to "hugo".
 *
 * If DASHBOARD_PASSWORD is unset, the middleware is a no-op (dev mode at
 * localhost; doesn't break Railway's health probe if the env var ever
 * disappears in prod).
 */

import { NextRequest, NextResponse } from "next/server";

const REALM = "health-metrics";

export function middleware(req: NextRequest) {
  const expectedUser = process.env.DASHBOARD_USERNAME ?? "hugo";
  const expectedPass = process.env.DASHBOARD_PASSWORD;

  // No password configured → don't gate. Useful for local dev.
  if (!expectedPass) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice("Basic ".length));
    const idx = decoded.indexOf(":");
    const user = idx >= 0 ? decoded.slice(0, idx) : "";
    const pass = idx >= 0 ? decoded.slice(idx + 1) : "";
    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

export const config = {
  // Run on every path EXCEPT Next.js's static asset routes — the browser
  // can't carry the Authorization header on those reliably and we don't
  // need to gate static JS/CSS (they reveal nothing without the page).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
