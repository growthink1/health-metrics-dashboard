/**
 * Catchall backend proxy.
 *
 * Browser → /api/<path> (same-origin, Basic-Auth gated by middleware.ts)
 *        → this handler running on the dashboard server
 *        → backend.railway.internal:8080/api/<path> over Railway's private network
 *
 * Lets us put a single HTTP Basic Auth gate on the dashboard origin while
 * keeping the backend public-routable only via its *.up.railway.app URL
 * (security through obscurity for the secondary surface).
 */

import { NextRequest, NextResponse } from "next/server";

const INTERNAL_BASE =
  process.env.API_BASE_URL_INTERNAL ?? "http://localhost:8000";

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const upstreamPath = "/api/" + path.join("/");
  const search = req.nextUrl.search ?? "";
  const upstreamUrl = `${INTERNAL_BASE}${upstreamPath}${search}`;

  const init: RequestInit = {
    method: req.method,
    headers: { Accept: "application/json" },
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    init.body = body;
    (init.headers as Record<string, string>)["Content-Type"] =
      req.headers.get("content-type") ?? "application/json";
  }

  let resp: Response;
  try {
    resp = await fetch(upstreamUrl, init);
  } catch (e) {
    return NextResponse.json(
      { error: "Backend unreachable", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }

  // Stream the upstream body + content-type back to the client.
  const upstreamBody = await resp.text();
  return new NextResponse(upstreamBody, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
