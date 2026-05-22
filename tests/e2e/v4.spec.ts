import { test, expect } from "@playwright/test";

test.describe("v4 — goals page", () => {
  test("nav has Goals link", async ({ page }) => {
    await page.goto("/");
    const goalsLink = page.getByRole("link", { name: /Goals/i });
    await expect(goalsLink).toBeVisible();
  });

  test("/goals renders either empty (setup) state or active layout", async ({ page }) => {
    await page.goto("/goals");
    // /goals is `force-dynamic` and uses a streaming Suspense skeleton, so we
    // must wait for the streamed payload to land. Use a union locator and
    // assert visibility via Playwright's auto-waiting matcher rather than the
    // synchronous .isVisible() check.
    const empty = page.getByRole("heading", { name: /set your first goal/i });
    const active = page.getByText(/Today's recommendation/i);
    await expect(empty.or(active).first()).toBeVisible({ timeout: 10_000 });
  });

  test("empty state shows embedded chat with focused input and hides the right drawer", async ({ page }) => {
    await page.goto("/goals");
    const heading = page.getByRole("heading", { name: /set your first goal/i });
    const active = page.getByText(/Today's recommendation/i);
    // Wait for the streamed payload to land. We tolerate either branch so we
    // can decide whether to skip in environments where an active goal already
    // exists.
    await expect(heading.or(active).first()).toBeVisible({ timeout: 10_000 });
    const exists = await heading.isVisible().catch(() => false);
    if (!exists) test.skip(true, "active goal already exists in this environment");

    // Embedded chat input is present and focused
    const input = page.getByPlaceholder(/lose 15 lbs/i);
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // Right-side drawer is NOT in the DOM.
    // Look for either the expanded drawer aside (which contains the "Claude"
    // header) or the collapsed drawer aside (vertical "ASK CLAUDE" text).
    // After T3+T4 land, mounting GoalSetupPanel sets drawer.hidden=true and
    // <ChatDrawer /> returns null, so neither should be present.
    // The SSR'd HTML may briefly include the drawer aside before hydration
    // fires the useEffect that flips drawer.hidden, so we give the matcher
    // time to retry until React un-mounts the aside.
    const expandedDrawer = page.locator("aside").filter({ hasText: /^Claude$/ });
    const collapsedDrawer = page.locator("aside").filter({ hasText: /ASK CLAUDE/i });
    await expect(expandedDrawer).toHaveCount(0, { timeout: 5_000 });
    await expect(collapsedDrawer).toHaveCount(0, { timeout: 5_000 });
  });
});
