import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchDashboardToday,
  fetchDashboardGrid,
  postManualLog,
} from "@/lib/api";

const originalFetch = globalThis.fetch;

describe("api client", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://test";
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetchDashboardToday calls the right URL", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ metric_date: "2026-05-13" }), { status: 200 }),
    );
    globalThis.fetch = mockFetch as typeof fetch;
    await fetchDashboardToday("hugo", "2026-05-13");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/dashboard/today?user_id=hugo&as_of=2026-05-13"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("fetchDashboardGrid passes days param", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ n_days: 14, tiles: [] }), { status: 200 }),
    );
    globalThis.fetch = mockFetch as typeof fetch;
    await fetchDashboardGrid("hugo", 30);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("days=30"),
      expect.anything(),
    );
  });

  it("postManualLog sends JSON body", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          logged_date: "2026-05-14",
          fields_updated: ["weight_lbs"],
          completeness: { subjective: false, weight: true, nutrition: false },
          next_required_inputs: [],
        }),
        { status: 200 },
      ),
    );
    globalThis.fetch = mockFetch as typeof fetch;
    await postManualLog({ user_id: "hugo", date: "2026-05-14", weight_lbs: 218.4 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/manual-log"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("fetchDashboardToday throws on non-200", async () => {
    globalThis.fetch = (async () =>
      new Response("nope", { status: 500 })) as typeof fetch;
    await expect(fetchDashboardToday("hugo")).rejects.toThrow(/failed: 500/);
  });

  it("uses same-origin (empty base) when called from the browser (window defined)", async () => {
    // Vitest's jsdom environment provides window. The browser branch returns
    // an empty base so calls go same-origin and hit the dashboard's catchall
    // proxy at app/api/[...path]/route.ts (which forwards to backend internal
    // URL server-side). API_BASE_URL_INTERNAL should be IGNORED on the browser
    // path even when both env vars are set.
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://browser.example";
    process.env.API_BASE_URL_INTERNAL = "https://internal.example";

    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ metric_date: "2026-05-13" }), { status: 200 }),
    );
    globalThis.fetch = mockFetch as typeof fetch;

    // Re-import after env mutation, since API_BASE is module-scope
    vi.resetModules();
    const { fetchDashboardToday } = await import("@/lib/api");
    await fetchDashboardToday("hugo");

    const calledUrl = (mockFetch.mock.calls[0]?.[0] ?? "") as string;
    // Path should be /api/... with no scheme/host prefix.
    expect(calledUrl.startsWith("/api/dashboard/today")).toBe(true);
    expect(calledUrl).not.toContain("https://");
    expect(calledUrl).not.toContain("internal.example");
  });
});
