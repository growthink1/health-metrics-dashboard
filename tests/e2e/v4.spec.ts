// tests/e2e/v4.spec.ts
import { test, expect } from "@playwright/test";

test.describe("v4 — goals page", () => {
  test("nav has Goals link", async ({ page }) => {
    await page.goto("/");
    const goalsLink = page.getByRole("link", { name: /Goals/i });
    await expect(goalsLink).toBeVisible();
  });

  test("/goals renders either empty state OR active layout", async ({ page }) => {
    await page.goto("/goals");
    const empty = page.getByText(/No active goal yet/i);
    const active = page.getByText(/Today's recommendation/i);
    const emptyVisible = await empty.isVisible().catch(() => false);
    const activeVisible = await active.isVisible().catch(() => false);
    expect(emptyVisible || activeVisible).toBe(true);
  });

  test("empty state CTA opens chat drawer pre-filled", async ({ page }) => {
    await page.goto("/goals");
    const empty = page.getByText(/No active goal yet/i);
    const exists = await empty.isVisible().catch(() => false);
    if (!exists) test.skip(true, "active goal already exists in this environment");
    await page.getByRole("button", { name: /Help me set my first goal/i }).click();
    const input = page.getByPlaceholder(/Ask Claude/i);
    await expect(input).toHaveValue(/Help me set my first goal/);
  });
});
